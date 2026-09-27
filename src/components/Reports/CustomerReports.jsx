import {
  faArrowRight,
  faArrowTrendDown,
  faArrowTrendUp,
  faCalendarDays,
  faChevronDown,
  faCoins,
  faDownload,
  faRotate,
  faUserPlus,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { apiClient } from "../../lib/apiClient";
import { PageSkeletonLoader } from "../common/LoadingStates";

const currency = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });
const integer = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 });
const palette = ["#00733f", "#45c978", "#f7bc45", "#ef3340", "#2878ed", "#ec67a1", "#b9bec5"];

const metrics = [
  { key: "totalCustomers", label: "Total Customers", icon: faUsers, color: "#009b4d", bg: "#e5f8ec" },
  { key: "newCustomers", label: "New Customers", icon: faUserPlus, color: "#1683ef", bg: "#e8f3ff" },
  { key: "repeatCustomers", label: "Repeat Customers", icon: faRotate, color: "#a02de1", bg: "#f4e8ff" },
  { key: "averageSpend", label: "Average Customer Spend", icon: faCoins, color: "#f58220", bg: "#fff0df", currency: true },
];

const Panel = ({ children, className = "" }) => (
  <section className={`min-w-0 rounded-xl border border-[#e4e7ec] bg-white shadow-[0_8px_24px_rgba(16,24,40,0.035)] ${className}`}>{children}</section>
);

const PanelTitle = ({ title, subtitle, action = "", actionTo = "/reports/create" }) => (
  <div className="flex items-start justify-between gap-3 px-5 pt-4">
    <div><h2 className="text-base font-bold">{title}</h2>{subtitle && <p className="mt-0.5 text-xs text-[#667085]">{subtitle}</p>}</div>
    {action && <Link to={actionTo} className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-[#0665b7]">{action}<FontAwesomeIcon icon={faArrowRight} className="text-[10px]" /></Link>}
  </div>
);

const MetricCard = ({ config, metric }) => {
  const change = Number(metric?.change || 0);
  const positive = change >= 0;
  return (
    <Panel className="p-4">
      <div className="flex items-start gap-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ background: config.bg, color: config.color }}><FontAwesomeIcon icon={config.icon} className="text-xl" /></div>
        <div className="min-w-0 flex-1"><p className="text-sm font-medium">{config.label}</p><p className="mt-1 truncate text-xl font-extrabold xl:text-2xl">{config.currency ? currency.format(metric?.value || 0) : integer.format(metric?.value || 0)}</p></div>
      </div>
      <div className="mt-2 grid grid-cols-[1fr_112px] items-end gap-2">
        <div><p className={`text-base font-bold ${positive ? "text-[#009b4d]" : "text-[#d92d20]"}`}><FontAwesomeIcon icon={positive ? faArrowTrendUp : faArrowTrendDown} className="mr-1" />{Math.abs(change).toFixed(1)}%</p><p className="text-[11px] text-[#667085]">vs previous period</p></div>
        <Chart type="line" height={50} series={[{ data: metric?.sparkline?.length ? metric.sparkline : [0] }]} options={{ chart: { sparkline: { enabled: true }, animations: { enabled: false } }, colors: [config.color], stroke: { curve: "straight", width: 2 }, tooltip: { enabled: false } }} />
      </div>
    </Panel>
  );
};

const Select = ({ value, onChange, icon, children, ariaLabel }) => (
  <label className="relative">
    {icon && <FontAwesomeIcon icon={icon} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#344054]" />}
    <select aria-label={ariaLabel} value={value} onChange={onChange} className={`h-10 min-w-[120px] appearance-none rounded-lg border border-[#d0d5dd] bg-white pr-9 text-xs font-semibold outline-none focus:border-[#008f45] ${icon ? "pl-9" : "pl-4"}`}>{children}</select>
    <FontAwesomeIcon icon={faChevronDown} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px]" />
  </label>
);

const aggregateTrend = (trend, interval) => {
  if (interval === "daily") return trend;
  const groups = new Map();
  trend.forEach((point, index) => {
    const key = interval === "weekly" ? `Week ${Math.floor(index / 7) + 1}` : point.date.slice(0, 7);
    const group = groups.get(key) ?? { date: key, newCustomers: 0, totalCustomers: 0 };
    group.newCustomers += Number(point.newCustomers || 0);
    group.totalCustomers = Number(point.totalCustomers || 0);
    groups.set(key, group);
  });
  return [...groups.values()];
};

const Donut = ({ items, total, centerLabel = "Total Customers", colors = palette }) => (
  <div className="relative mx-auto h-[160px] w-[160px]">
    <Chart type="donut" height={160} series={items.length ? items.map((item) => item.count) : [1]} options={{ chart: { animations: { enabled: false } }, colors: items.length ? colors : ["#eef0f3"], labels: items.map((item) => item.name), legend: { show: false }, dataLabels: { enabled: false }, stroke: { width: 0 }, plotOptions: { pie: { donut: { size: "63%" } } }, tooltip: { enabled: items.length > 0 } }} />
    <div className="pointer-events-none absolute inset-0 grid place-content-center text-center"><strong className="text-lg">{integer.format(total || 0)}</strong><span className="text-[10px] text-[#667085]">{centerLabel}</span></div>
  </div>
);

const BreakdownLegend = ({ items, colors = palette, detail = true }) => (
  <div className="space-y-2.5">
    {items.map((item, index) => <div key={item.name} className="flex items-start justify-between gap-2 text-[11px]"><span className="min-w-0"><i className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: colors[index % colors.length] }} />{item.name}</span><span className="shrink-0 font-bold">{item.percentage}%{detail && <em className="ml-2 font-normal not-italic text-[#667085]">{integer.format(item.count)}</em>}</span></div>)}
  </div>
);

const CustomerReports = () => {
  const [days, setDays] = useState(30);
  const [state, setState] = useState("all");
  const [status, setStatus] = useState("all");
  const [activityFilter, setActivityFilter] = useState("all");
  const [interval, setInterval] = useState("daily");
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get("/reports/customer-dashboard", { params: { days, state, status, activity: activityFilter } });
      setDashboard(data);
    } catch (error) {
      toast.error(error.message || "Unable to load customer reports");
    } finally {
      setLoading(false);
    }
  }, [activityFilter, days, state, status]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);
  const trend = useMemo(() => aggregateTrend(dashboard?.trend ?? [], interval), [dashboard?.trend, interval]);
  const total = dashboard?.metrics?.totalCustomers?.value || 0;

  const exportReport = async () => {
    try {
      setExporting(true);
      const { data: report } = await apiClient.post("/reports/generate", { type: "customer", name: `Customer Report - Last ${days} Days`, format: "xlsx", startDate: dashboard.period.start, endDate: dashboard.period.end, filters: { state, status, activity: activityFilter } });
      const response = await apiClient.get(`/reports/${report.id}/download`, { responseType: "blob" });
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      anchor.href = url; anchor.download = `customer-report-${days}-days.xlsx`;
      document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
    } catch (error) { toast.error(error.message || "Unable to export customer report"); } finally { setExporting(false); }
  };

  if (loading && !dashboard) return <PageSkeletonLoader />;

  const chartLabels = trend.map((point) => /^\d{4}-\d{2}-\d{2}$/.test(point.date) ? new Date(`${point.date}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : point.date);
  const baseChart = { chart: { toolbar: { show: false }, animations: { enabled: false }, fontFamily: "inherit" }, dataLabels: { enabled: false }, xaxis: { categories: chartLabels, labels: { style: { colors: "#667085", fontSize: "10px" }, rotate: 0, hideOverlappingLabels: true }, axisBorder: { show: false }, axisTicks: { show: false } }, grid: { borderColor: "#eef0f3" }, legend: { show: false }, tooltip: { shared: true, intersect: false } };
  const statusLabel = { active: "Active", "at-risk": "At Risk", inactive: "Inactive" };
  const statusClass = { active: "bg-[#dff7e8] text-[#08783d]", "at-risk": "bg-[#fff0d5] text-[#c66b00]", inactive: "bg-[#ffe3e6] text-[#c52233]" };

  return (
    <div className="w-full min-w-0 space-y-3 text-[#101828]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div><h1 className="text-2xl font-extrabold tracking-tight">Customer Reports</h1><p className="mt-1 text-sm text-[#667085]">Track customer growth, demographics and purchase activity across all channels.</p></div>
        <div className="flex flex-wrap gap-2 xl:flex-nowrap">
          <Select value={days} onChange={(event) => setDays(Number(event.target.value))} icon={faCalendarDays} ariaLabel="Date range"><option value={7}>Last 7 Days</option><option value={30}>Last 30 Days</option><option value={90}>Last 90 Days</option></Select>
          <Select value={state} onChange={(event) => setState(event.target.value)} ariaLabel="State"><option value="all">All States</option>{(dashboard?.filterOptions?.states ?? []).map((item) => <option key={item} value={item}>{item}</option>)}</Select>
          <Select value={status} onChange={(event) => setStatus(event.target.value)} ariaLabel="Customer status"><option value="all">All Customer Status</option><option value="active">Active</option><option value="at-risk">At Risk</option><option value="inactive">Inactive</option></Select>
          <Select value={activityFilter} onChange={(event) => setActivityFilter(event.target.value)} ariaLabel="Purchase activity"><option value="all">All Purchase Activity</option><option value="ordered">Has Ordered</option><option value="never-ordered">Never Ordered</option><option value="repeat">Repeat Customers</option></Select>
          <button type="button" disabled={exporting || !dashboard} onClick={exportReport} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#009b4d] px-5 text-xs font-bold text-white hover:bg-[#08783d] disabled:opacity-60"><FontAwesomeIcon icon={faDownload} />{exporting ? "Exporting…" : "Export Report"}</button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((config) => <MetricCard key={config.key} config={config} metric={dashboard?.metrics?.[config.key]} />)}</div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,2.15fr)_minmax(250px,.82fr)_minmax(250px,.82fr)]">
        <Panel>
          <div className="flex flex-col gap-3 px-5 pt-4 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-base font-bold">Customer Growth</h2><p className="mt-0.5 text-xs text-[#667085]">New vs total customers over time</p></div><div className="flex flex-wrap items-center gap-4 text-xs"><span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-[#00733f]" />New Customers</span><span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-[#55cf82]" />Total Customers</span><div className="flex rounded-lg border border-[#e4e7ec] p-0.5">{["daily", "weekly", "monthly"].map((value) => <button key={value} type="button" onClick={() => setInterval(value)} className={`rounded-md px-3 py-1.5 capitalize ${interval === value ? "bg-[#08783d] font-semibold text-white" : "text-[#344054]"}`}>{value}</button>)}</div></div></div>
          <div className="px-2 pb-1"><Chart type="line" height={205} options={{ ...baseChart, colors: ["#55cf82", "#00733f"], stroke: { width: [0, 3], curve: "smooth" }, yaxis: [{ labels: { style: { colors: "#667085", fontSize: "10px" } } }, { opposite: true, labels: { style: { colors: "#667085", fontSize: "10px" } } }] }} series={[{ name: "New Customers", type: "column", data: trend.map((point) => point.newCustomers) }, { name: "Total Customers", type: "line", data: trend.map((point) => point.totalCustomers) }]} /></div>
        </Panel>
        <Panel><PanelTitle title="Customer Segments" action="View Details" /><div className="px-3 pb-4"><Donut items={dashboard?.segments ?? []} total={total} /><BreakdownLegend items={dashboard?.segments ?? []} /></div></Panel>
        <Panel><PanelTitle title="Gender Breakdown" action="View Details" /><div className="px-3 pb-4"><Donut items={dashboard?.gender ?? []} total={total} colors={["#1683ef", "#ec67a1", "#b9bec5"]} /><BreakdownLegend items={dashboard?.gender ?? []} colors={["#1683ef", "#ec67a1", "#b9bec5"]} /></div></Panel>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,1fr)]">
        <Panel className="overflow-hidden"><PanelTitle title="Top Customers" action="View All" actionTo="/users" /><div className="max-h-[280px] overflow-auto px-3 pb-3 pt-2"><table className="w-full min-w-[720px] text-left text-xs"><thead className="sticky top-0 z-10 bg-[#f7f8fa]"><tr>{["#", "Customer", "Location", "Orders", "Total Spent", "Last Order", "Status"].map((heading) => <th key={heading} className="px-3 py-1.5 font-semibold">{heading}</th>)}</tr></thead><tbody className="divide-y divide-[#eef0f3]">{(dashboard?.topCustomers ?? []).map((customer, index) => <tr key={customer.id}><td className="px-3 py-1.5">{index + 1}</td><td className="px-3 py-1.5"><span className="mr-2 inline-grid h-6 w-6 place-items-center rounded-full bg-[#dcecff] text-[9px] font-bold text-[#1769c2]">{customer.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span><strong>{customer.name}</strong></td><td className="px-3 py-1.5">{customer.location}</td><td className="px-3 py-1.5">{integer.format(customer.orders)}</td><td className="px-3 py-1.5 font-semibold">{currency.format(customer.totalSpent)}</td><td className="whitespace-nowrap px-3 py-1.5">{customer.lastOrder ? new Date(customer.lastOrder).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}</td><td className="px-3 py-1.5"><span className={`rounded-full px-3 py-1 font-medium ${statusClass[customer.status]}`}>{statusLabel[customer.status]}</span></td></tr>)}{!dashboard?.topCustomers?.length && <tr><td colSpan="7" className="px-3 py-10 text-center text-[#667085]">No customers match these filters.</td></tr>}</tbody></table></div></Panel>
        <Panel className="pb-4"><PanelTitle title="Customers by Location (Top 5 States)" action="View All" /><div className="mt-4 space-y-3 px-5">{(dashboard?.locations ?? []).map((item, index) => <div key={item.state} className="grid grid-cols-[65px_1fr_45px_45px] items-center gap-3 text-xs"><span className="font-medium">{item.state}</span><div className="h-5 overflow-hidden rounded-md bg-[#edf0f3]"><div className="h-full rounded-md bg-gradient-to-r from-[#08783d] to-[#55cf82]" style={{ width: `${Math.max(item.percentage, 3)}%`, opacity: 1 - index * 0.08 }} /></div><strong className="text-right">{integer.format(item.count)}</strong><span className="text-right text-[#667085]">{item.percentage}%</span></div>)}{!dashboard?.locations?.length && <p className="py-8 text-center text-xs text-[#667085]">No customer locations available.</p>}</div></Panel>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(280px,.95fr)_minmax(0,1.2fr)_minmax(300px,.95fr)]">
        <Panel><PanelTitle title="Customer Activity" action="View Details" /><div className="grid items-center gap-2 px-4 pb-4 sm:grid-cols-[145px_1fr]"><Donut items={dashboard?.activity ?? []} total={total} colors={["#00733f", "#f7bc45", "#ef3340"]} /><BreakdownLegend items={dashboard?.activity ?? []} colors={["#00733f", "#f7bc45", "#ef3340"]} /></div></Panel>
        <Panel><div className="flex items-start justify-between px-5 pt-4"><div><h2 className="text-base font-bold">Customer Acquisition</h2><p className="mt-0.5 text-xs text-[#667085]">New customer registrations over time</p></div><div className="flex rounded-lg border border-[#e4e7ec] p-0.5">{["daily", "weekly", "monthly"].map((value) => <button key={value} type="button" onClick={() => setInterval(value)} className={`rounded-md px-3 py-1.5 text-xs capitalize ${interval === value ? "bg-[#08783d] font-semibold text-white" : "text-[#344054]"}`}>{value}</button>)}</div></div><div className="px-2"><Chart type="bar" height={165} options={{ ...baseChart, colors: ["#55cf82"], plotOptions: { bar: { columnWidth: "55%", borderRadius: 1 } }, yaxis: { labels: { style: { colors: "#667085", fontSize: "10px" } } } }} series={[{ name: "New Customers", data: trend.map((point) => point.newCustomers) }]} /></div></Panel>
        <Panel className="pb-4"><PanelTitle title="Customer Types by Order Count" action="View Details" /><div className="mt-5 space-y-4 px-5">{(dashboard?.orderTypes ?? []).map((item, index) => <div key={item.name} className="grid grid-cols-[80px_1fr_35px_42px] items-center gap-2 text-xs"><span>{item.name}</span><div className="h-5 overflow-hidden rounded-md bg-[#edf0f3]"><div className="h-full rounded-md bg-gradient-to-r from-[#08783d] to-[#55cf82]" style={{ width: `${Math.max(item.percentage, 3)}%`, opacity: 1 - index * 0.1 }} /></div><strong className="text-right">{item.percentage}%</strong><span className="text-right text-[#667085]">{integer.format(item.count)}</span></div>)}</div></Panel>
      </div>
    </div>
  );
};

export default CustomerReports;
