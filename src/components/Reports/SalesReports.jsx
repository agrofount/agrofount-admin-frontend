import {
  faArrowRight,
  faArrowTrendDown,
  faArrowTrendUp,
  faBox,
  faCalendarDays,
  faCartShopping,
  faChevronDown,
  faCube,
  faDownload,
  faMoneyBillWave,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { apiClient } from "../../lib/apiClient";
import { PageSkeletonLoader } from "../common/LoadingStates";

const currency = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});
const integer = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 });

const metricConfig = [
  { key: "totalSales", label: "Total Sales", icon: faMoneyBillWave, color: "#009b4d", bg: "#e5f8ec", currency: true },
  { key: "totalOrders", label: "Total Orders", icon: faCartShopping, color: "#2878ed", bg: "#e8f1ff" },
  { key: "averageOrderValue", label: "Average Order Value", icon: faBox, color: "#8b2be2", bg: "#f2e8ff", currency: true },
  { key: "unitsSold", label: "Units Sold", icon: faCube, color: "#f59e0b", bg: "#fff2da" },
];

const categoryColors = ["#006b3c", "#45c978", "#f7bc45", "#ff5c35", "#b9bec5", "#7c3aed"];
const statusColors = { Delivered: "#008f45", Processing: "#2878ed", Pending: "#f7bc45", Cancelled: "#ef3340" };
const statusClasses = {
  Delivered: "bg-[#dff7e8] text-[#08783d]",
  Processing: "bg-[#dcecff] text-[#1769c2]",
  Pending: "bg-[#fff0d5] text-[#d96c00]",
  Cancelled: "bg-[#ffe3e6] text-[#c52233]",
};

const Panel = ({ children, className = "" }) => (
  <section className={`min-w-0 rounded-xl border border-[#e4e7ec] bg-white shadow-[0_8px_24px_rgba(16,24,40,0.035)] ${className}`}>
    {children}
  </section>
);

const PanelTitle = ({ title, subtitle, action, actionTo }) => (
  <div className="flex items-start justify-between gap-4 px-5 pt-4">
    <div>
      <h2 className="text-base font-bold text-[#101828]">{title}</h2>
      {subtitle && <p className="mt-0.5 text-xs text-[#667085]">{subtitle}</p>}
    </div>
    {action && actionTo && (
      <Link to={actionTo} className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-[#0665b7]">
        {action} <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
      </Link>
    )}
  </div>
);

const formatMetric = (value, isCurrency) => (isCurrency ? currency.format(value || 0) : integer.format(value || 0));

const MetricCard = ({ config, metric }) => {
  const change = Number(metric?.change || 0);
  const positive = change >= 0;
  const sparkline = metric?.sparkline?.length ? metric.sparkline : [0];
  return (
    <Panel className="p-4">
      <div className="flex min-w-0 items-start gap-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ background: config.bg, color: config.color }}>
          <FontAwesomeIcon icon={config.icon} className="text-xl" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[#101828]">{config.label}</p>
          <p className="mt-1 truncate text-xl font-extrabold tracking-tight text-[#101828] xl:text-2xl">
            {formatMetric(metric?.value, config.currency)}
          </p>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-[1fr_112px] items-end gap-2">
        <div>
          <p className={`text-base font-bold ${positive ? "text-[#009b4d]" : "text-[#d92d20]"}`}>
            <FontAwesomeIcon icon={positive ? faArrowTrendUp : faArrowTrendDown} className="mr-1" />
            {Math.abs(change).toFixed(1)}%
          </p>
          <p className="text-[11px] text-[#667085]">vs previous period</p>
        </div>
        <Chart
          type="line"
          height={50}
          series={[{ data: sparkline }]}
          options={{
            chart: { sparkline: { enabled: true }, animations: { enabled: false } },
            colors: [config.color],
            stroke: { curve: "smooth", width: 2 },
            tooltip: { enabled: false },
          }}
        />
      </div>
    </Panel>
  );
};

const aggregateTrend = (trend, interval) => {
  if (interval === "daily") return trend;
  const groups = new Map();
  trend.forEach((point, index) => {
    const key = interval === "weekly" ? `Week ${Math.floor(index / 7) + 1}` : point.date.slice(0, 7);
    const group = groups.get(key) ?? { date: key, revenue: 0, orders: 0, unitsSold: 0 };
    group.revenue += Number(point.revenue || 0);
    group.orders += Number(point.orders || 0);
    group.unitsSold += Number(point.unitsSold || 0);
    groups.set(key, group);
  });
  return [...groups.values()];
};

const SalesReports = () => {
  const [days, setDays] = useState(30);
  const [interval, setInterval] = useState("daily");
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get("/reports/sales-dashboard", { params: { days } });
      setDashboard(data);
    } catch (error) {
      toast.error(error.message || "Unable to load sales reports");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const displayedTrend = useMemo(() => aggregateTrend(dashboard?.trend ?? [], interval), [dashboard?.trend, interval]);

  const exportReport = async () => {
    try {
      setExporting(true);
      const { start, end } = dashboard.period;
      const { data: report } = await apiClient.post("/reports/generate", {
        type: "sales",
        name: `Sales Report - Last ${days} Days`,
        format: "xlsx",
        startDate: start,
        endDate: end,
        filters: {},
      });
      const response = await apiClient.get(`/reports/${report.id}/download`, { responseType: "blob" });
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `sales-report-${days}-days.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error.message || "Unable to export sales report");
    } finally {
      setExporting(false);
    }
  };

  if (loading && !dashboard) return <PageSkeletonLoader />;

  const categories = dashboard?.categories ?? [];
  const statuses = dashboard?.orderStatus ?? [];
  const totalCategoryRevenue = categories.reduce((sum, item) => sum + Number(item.revenue || 0), 0);

  const overviewOptions = {
    chart: { toolbar: { show: false }, animations: { enabled: false }, fontFamily: "inherit" },
    colors: ["#08783d", "#55cf82"],
    stroke: { curve: "smooth", width: [3, 2], dashArray: [0, 3] },
    fill: { type: ["gradient", "solid"], gradient: { opacityFrom: 0.28, opacityTo: 0.02 } },
    dataLabels: { enabled: false },
    xaxis: {
      categories: displayedTrend.map((point) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(point.date)) return point.date;
        return new Date(`${point.date}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
      }),
      labels: { style: { colors: "#667085", fontSize: "10px" }, rotate: 0, hideOverlappingLabels: true },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: [
      { labels: { formatter: (value) => `₦${value >= 1_000_000 ? `${(value / 1_000_000).toFixed(1)}M` : `${Math.round(value / 1000)}K`}`, style: { colors: "#667085", fontSize: "10px" } } },
      { opposite: true, labels: { formatter: (value) => Math.round(value), style: { colors: "#667085", fontSize: "10px" } } },
    ],
    grid: { borderColor: "#eef0f3", strokeDashArray: 0 },
    legend: { show: false },
    tooltip: { shared: true },
  };

  return (
    <div className="w-full min-w-0 space-y-3 text-[#101828]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Sales Reports</h1>
          <p className="mt-1 text-sm text-[#667085]">Track revenue, orders, products and sales performance across all channels.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative">
            <FontAwesomeIcon icon={faCalendarDays} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#344054]" />
            <select value={days} onChange={(event) => setDays(Number(event.target.value))} className="h-10 appearance-none rounded-lg border border-[#d0d5dd] bg-white pl-9 pr-9 text-xs font-semibold outline-none focus:border-[#008f45]">
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
            </select>
            <FontAwesomeIcon icon={faChevronDown} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px]" />
          </label>
          <label className="relative">
            <select className="h-10 appearance-none rounded-lg border border-[#d0d5dd] bg-white px-4 pr-9 text-xs font-semibold outline-none focus:border-[#008f45]">
              <option>Compare: Previous Period</option>
            </select>
            <FontAwesomeIcon icon={faChevronDown} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px]" />
          </label>
          <button type="button" disabled={exporting || !dashboard} onClick={exportReport} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#009b4d] px-5 text-xs font-bold text-white shadow-sm hover:bg-[#08783d] disabled:opacity-60">
            <FontAwesomeIcon icon={faDownload} /> {exporting ? "Exporting…" : "Export Report"}
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metricConfig.map((config) => <MetricCard key={config.key} config={config} metric={dashboard?.metrics?.[config.key]} />)}
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,2.05fr)_minmax(320px,1fr)]">
        <Panel>
          <div className="flex flex-col gap-3 px-5 pt-4 sm:flex-row sm:items-start sm:justify-between">
            <div><h2 className="text-base font-bold">Sales Overview</h2><p className="mt-0.5 text-xs text-[#667085]">Revenue and orders trend over time</p></div>
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-[#08783d]" />Revenue (₦)</span>
              <span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-[#55cf82]" />Orders</span>
              <div className="flex rounded-lg border border-[#e4e7ec] p-0.5">
                {["daily", "weekly", "monthly"].map((value) => (
                  <button key={value} type="button" onClick={() => setInterval(value)} className={`rounded-md px-3 py-1.5 capitalize ${interval === value ? "bg-[#08783d] font-semibold text-white" : "text-[#344054]"}`}>{value}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="px-2 pb-1 pt-1 sm:px-4">
            <Chart type="line" height={270} options={overviewOptions} series={[
              { name: "Revenue (₦)", type: "area", data: displayedTrend.map((point) => point.revenue) },
              { name: "Orders", type: "line", data: displayedTrend.map((point) => point.orders) },
            ]} />
          </div>
        </Panel>

        <Panel>
          <PanelTitle title="Sales by Category" action="View Details" actionTo="/reports/create" />
          <div className="grid items-center gap-2 px-4 pb-4 pt-3 sm:grid-cols-[160px_1fr]">
            <div className="relative mx-auto h-[170px] w-[170px]">
              <Chart type="donut" height={170} series={categories.length ? categories.map((item) => item.revenue) : [1]} options={{
                chart: { animations: { enabled: false } }, colors: categories.length ? categoryColors : ["#eef0f3"], labels: categories.map((item) => item.name),
                legend: { show: false }, dataLabels: { enabled: false }, stroke: { width: 0 }, plotOptions: { pie: { donut: { size: "63%" } } }, tooltip: { enabled: categories.length > 0, y: { formatter: (value) => currency.format(value) } },
              }} />
              <div className="pointer-events-none absolute inset-0 grid place-content-center text-center"><strong className="text-lg">{currency.format(totalCategoryRevenue)}</strong><span className="text-[11px] text-[#667085]">Total Sales</span></div>
            </div>
            <div className="space-y-3">
              {categories.slice(0, 6).map((item, index) => (
                <div key={item.name} className="flex items-center justify-between gap-3 text-xs"><span className="min-w-0 truncate"><i className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: categoryColors[index % categoryColors.length] }} />{item.name}</span><strong>{item.percentage}%</strong></div>
              ))}
              {!categories.length && <p className="text-center text-xs text-[#667085]">No completed sales in this period.</p>}
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,2.05fr)_minmax(320px,1fr)]">
        <Panel className="overflow-hidden">
          <PanelTitle title="Top Selling Products" action="View All" actionTo="/reports/create" />
          <div className="overflow-x-auto px-3 pb-3 pt-2">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="bg-[#f7f8fa] text-[#344054]"><tr>{["#", "Product", "Category", "Units Sold", "Orders", "Revenue", "% of Sales"].map((heading) => <th key={heading} className="px-3 py-2 font-semibold">{heading}</th>)}</tr></thead>
              <tbody className="divide-y divide-[#eef0f3]">
                {(dashboard?.topProducts ?? []).map((product, index) => <tr key={product.name}><td className="px-3 py-2">{index + 1}</td><td className="px-3 py-2 font-medium">{product.name}</td><td className="px-3 py-2 text-[#475467]">{product.category}</td><td className="px-3 py-2">{integer.format(product.unitsSold)}</td><td className="px-3 py-2">{integer.format(product.orders)}</td><td className="px-3 py-2 font-medium">{currency.format(product.revenue)}</td><td className="px-3 py-2">{product.percentage}%</td></tr>)}
                {!dashboard?.topProducts?.length && <tr><td colSpan="7" className="px-3 py-10 text-center text-[#667085]">No completed product sales in this period.</td></tr>}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel>
          <PanelTitle title="Order Status" />
          <div className="grid items-center gap-2 px-4 pb-4 pt-3 sm:grid-cols-[160px_1fr]">
            <div className="relative mx-auto h-[170px] w-[170px]">
              <Chart type="donut" height={170} series={statuses.length ? statuses.map((item) => item.count) : [1]} options={{ chart: { animations: { enabled: false } }, colors: statuses.length ? statuses.map((item) => statusColors[item.status]) : ["#eef0f3"], labels: statuses.map((item) => item.status), legend: { show: false }, dataLabels: { enabled: false }, stroke: { width: 0 }, plotOptions: { pie: { donut: { size: "63%" } } }, tooltip: { enabled: statuses.length > 0 } }} />
              <div className="pointer-events-none absolute inset-0 grid place-content-center text-center"><strong className="text-xl">{integer.format(dashboard?.metrics?.totalOrders?.value || 0)}</strong><span className="text-[11px] text-[#667085]">Orders</span></div>
            </div>
            <div className="space-y-3">
              {statuses.map((item) => <div key={item.status} className="flex items-center justify-between text-xs"><span><i className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: statusColors[item.status] }} />{item.status}</span><strong>{item.percentage}%</strong></div>)}
              {!statuses.length && <p className="text-center text-xs text-[#667085]">No orders in this period.</p>}
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.7fr)]">
        <Panel className="pb-4">
          <PanelTitle title="Sales by Location" action="View All" actionTo="/reports/create" />
          <div className="mt-4 space-y-3 px-5">
            {(dashboard?.locations ?? []).map((location, index) => (
              <div key={location.state} className="grid grid-cols-[70px_1fr_auto_auto] items-center gap-3 text-xs"><span className="font-medium">{location.state}</span><div className="h-4 overflow-hidden rounded-full bg-[#edf0f3]"><div className="h-full rounded-full bg-gradient-to-r from-[#08783d] to-[#55cf82]" style={{ width: `${Math.max(location.percentage, 3)}%`, opacity: 1 - index * 0.08 }} /></div><span className="font-medium">{currency.format(location.revenue)}</span><span className="w-10 text-right text-[#667085]">{location.percentage}%</span></div>
            ))}
            {!dashboard?.locations?.length && <p className="py-8 text-center text-xs text-[#667085]">No location sales in this period.</p>}
          </div>
        </Panel>

        <Panel className="overflow-hidden">
          <PanelTitle title="Recent Sales" action="View All" actionTo="/orders" />
          <div className="overflow-x-auto px-3 pb-3 pt-2">
            <table className="w-full min-w-[720px] text-left text-[11px]">
              <thead className="bg-[#f7f8fa] text-[#344054]"><tr>{["Date", "Order ID", "Customer", "Items", "Amount", "Status"].map((heading) => <th key={heading} className="px-3 py-2 font-semibold">{heading}</th>)}</tr></thead>
              <tbody className="divide-y divide-[#eef0f3]">
                {(dashboard?.recentSales ?? []).map((sale) => <tr key={sale.orderId}><td className="whitespace-nowrap px-3 py-2">{new Date(sale.date).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}</td><td className="whitespace-nowrap px-3 py-2 font-medium">#{sale.orderId}</td><td className="px-3 py-2">{sale.customer}</td><td className="max-w-[180px] truncate px-3 py-2 text-[#475467]">{sale.items}</td><td className="px-3 py-2 font-semibold">{currency.format(sale.amount)}</td><td className="px-3 py-2"><span className={`rounded-full px-3 py-1 font-medium ${statusClasses[sale.status] ?? statusClasses.Processing}`}>{sale.status}</span></td></tr>)}
                {!dashboard?.recentSales?.length && <tr><td colSpan="6" className="px-3 py-10 text-center text-[#667085]">No recent sales in this period.</td></tr>}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
};

export default SalesReports;
