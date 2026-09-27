import {
  faBriefcase,
  faCalendarDays,
  faDownload,
  faLocationDot,
  faPlus,
  faSuitcase,
  faUsers,
  faWallet,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import { useContext, useEffect, useMemo, useState } from "react";
import qs from "qs";
import { assets } from "../assets/assets";
import { ShopContext } from "../context/ShopContext";
import { apiClient } from "../lib/apiClient";
import { buildDashboardInsights, calculateDashboardMetrics } from "../lib/dashboardMetrics";
import { fetchCareerApplications, fetchCareerStats, normalizeApplication } from "./Careers/careerData";

const generatePeriods = () => {
  const periods = [{ id: "all-time", name: "All time" }];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    periods.push({
      id: i + 1,
      name: `${startDate.toLocaleString("default", { month: "short" })} ${startDate.getDate()}, ${startDate.getFullYear()} - ${endDate.toLocaleString("default", { month: "short" })} ${endDate.getDate()}, ${endDate.getFullYear()}`,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString(),
    });
  }
  return periods;
};

const periods = generatePeriods();

const formatCurrency = (value = 0, currency = "NGN", compact = false) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: compact ? 1 : 2,
    notation: compact ? "compact" : "standard",
  }).format(Number(value) || 0);

const Sparkline = ({ color = "#159947", data = [0] }) => {
  const width = 240;
  const height = 54;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((value, index) => {
      const x = data.length === 1 ? width / 2 : (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 14) - 7;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-3 h-12 w-full" aria-hidden="true">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((value, index) => {
        const x = data.length === 1 ? width / 2 : (index / (data.length - 1)) * width;
        const y = height - ((value - min) / range) * (height - 14) - 7;
        return <circle key={index} cx={x} cy={y} r="3" fill={color} className="opacity-95" />;
      })}
    </svg>
  );
};

const StatCard = ({ title, value, trend, icon, color, colorHex, bg, dark, data }) => {
  const positive = trend >= 0;
  return (
  <div
    className={`rounded-lg border p-4 shadow-[0_8px_24px_rgba(16,24,40,0.05)] ${
      dark ? "border-transparent bg-gradient-to-br from-[#009444] to-[#006536] text-white" : "border-[#e5e7eb] bg-white text-[#101828]"
    }`}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className={`text-xs font-medium ${dark ? "text-white" : "text-[#475467]"}`}>{title}</p>
        <p className="mt-1.5 text-2xl font-bold tracking-normal">{value}</p>
        <p className={`mt-2 text-xs font-medium ${dark ? "text-white" : positive ? "text-[#009444]" : "text-[#d92d20]"}`}>
          {positive ? "↑" : "↓"} {Math.abs(trend).toFixed(1)}% <span className={dark ? "text-white/85" : "text-[#667085]"}>vs previous week</span>
        </p>
      </div>
      <div className={`grid h-10 w-10 place-items-center rounded-xl ${dark ? "bg-white/20" : bg}`}>
        <FontAwesomeIcon icon={icon} className={dark ? "text-white" : color} />
      </div>
    </div>
    <Sparkline color={dark ? "#ffffff" : colorHex} data={data} />
  </div>
  );
};

const Panel = ({ title, action = "View all", children, className = "" }) => (
  <section className={`rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.04)] ${className}`}>
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-base font-semibold text-[#101828]">{title}</h2>
      {action && <button className="text-xs font-semibold text-[#008f45]">{action}</button>}
    </div>
    {children}
  </section>
);

const EmptyState = ({ children }) => <p className="py-8 text-center text-xs text-[#667085]">{children}</p>;

const timeAgo = (value) => {
  const elapsed = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(elapsed) || elapsed < 0) return "Just now";
  const minutes = Math.floor(elapsed / 60000);
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

export const Dashboard = () => {
  const { currency, user, token, navigate } = useContext(ShopContext);
  const [orders, setOrders] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [careerStats, setCareerStats] = useState({});
  const [recentApplications, setRecentApplications] = useState([]);
  const [selectedDate, setSelectedDate] = useState(periods[periods.length - 1]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const dateParams =
          selectedDate.startDate && selectedDate.endDate
            ? {
                "filter.createdAt": [`$gte:${selectedDate.startDate}`, `$lte:${selectedDate.endDate}`],
              }
            : {};

        const response = await apiClient.get("/order/admin/all", {
          params: { ...dateParams, limit: -1 },
          paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "repeat" }),
        });

        setOrders(response.data?.data || []);
      } catch {
        setOrders([]);
      }
    };
    fetchOrders();
  }, [selectedDate]);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const response = await apiClient.get("/product-location", { params: { page: 1, limit: 500 } });
        setCatalog(response.data?.data || []);
      } catch {
        setCatalog([]);
      }
    };
    fetchCatalog();
  }, []);

  useEffect(() => {
    const fetchCareers = async () => {
      try {
        const [stats, applications] = await Promise.all([
          fetchCareerStats(),
          fetchCareerApplications({ page: 1, limit: 3, sortBy: "submittedAt:DESC" }),
        ]);
        setCareerStats(stats);
        setRecentApplications((applications.data || []).map(normalizeApplication));
      } catch {
        setCareerStats({});
        setRecentApplications([]);
      }
    };
    fetchCareers();
  }, []);

  useEffect(() => {
    if (!token) navigate("/login");
  }, [token, navigate]);

  const metrics = useMemo(() => calculateDashboardMetrics(orders), [orders]);
  const insights = useMemo(() => buildDashboardInsights(orders, catalog), [catalog, orders]);

  const displayName = user?.username || user?.firstname || "Admin";
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-5 text-[#101828]">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Welcome back, {displayName}! 👋</h1>
          <p className="mt-1 text-xs font-medium text-[#667085]">Here&apos;s what&apos;s happening with your business today.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Listbox value={selectedDate} onChange={setSelectedDate}>
            <div className="relative">
              <ListboxButton className="flex h-10 min-w-64 items-center justify-between gap-3 rounded-md border border-[#d0d5dd] bg-white px-3 text-xs font-medium text-[#344054] shadow-sm">
                <span className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faCalendarDays} />
                  {selectedDate.name}
                </span>
                <ChevronDownIcon className="h-4 w-4" />
              </ListboxButton>
              <ListboxOptions className="absolute right-0 z-10 mt-2 max-h-64 w-full overflow-auto rounded-md border border-gray-200 bg-white p-1 shadow-lg">
                {periods.map((period) => (
                  <ListboxOption key={period.id} value={period} className="cursor-pointer rounded px-3 py-2 text-xs hover:bg-gray-50">
                    {period.name}
                  </ListboxOption>
                ))}
              </ListboxOptions>
            </div>
          </Listbox>
          <button className="flex h-10 items-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-4 text-xs font-semibold text-[#008f45] shadow-sm">
            <FontAwesomeIcon icon={faDownload} />
            Export
            <ChevronDownIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Sales" value={formatCurrency(metrics.totalSales, currency, true)} trend={insights.changes.sales} icon={faSuitcase} color="text-[#009444]" colorHex="#009444" bg="bg-[#e8f8ee]" dark data={insights.sparkline.sales} />
        <StatCard title="Total Orders" value={metrics.totalOrders} trend={insights.changes.orders} icon={faSuitcase} color="text-[#1587d9]" colorHex="#1587d9" bg="bg-[#eaf5ff]" data={insights.sparkline.orders} />
        <StatCard title="Total Customers" value={metrics.totalCustomers} trend={insights.changes.customers} icon={faUsers} color="text-[#7f3fd9]" colorHex="#7f3fd9" bg="bg-[#f1e9ff]" data={insights.sparkline.customers} />
        <StatCard title="Total Income" value={formatCurrency(metrics.income, currency, true)} trend={insights.changes.income} icon={faWallet} color="text-[#f79009]" colorHex="#f79009" bg="bg-[#fff2df]" data={insights.sparkline.income} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Panel title="Top Product Categories (Sales)" className="xl:col-span-4">
          <div className="grid grid-cols-3 gap-3">
            {insights.categories.map((product) => (
              <div key={product.name}>
                <img src={product.image || assets.image_placeholder} alt={product.name} className="h-28 w-full rounded-lg object-cover" />
                <p className="mt-2 text-xs font-semibold">{product.name}</p>
                <p className="mt-1.5 text-base font-bold">{formatCurrency(product.revenue, currency)}</p>
                <p className="text-xs font-medium text-[#667085]">{product.percentage}% of sales</p>
                <div className="mt-2 h-1.5 rounded-full bg-gray-200">
                  <div className="h-1.5 rounded-full bg-[#009444]" style={{ width: `${product.percentage}%` }} />
                </div>
              </div>
            ))}
            {!insights.categories.length && <div className="col-span-3"><EmptyState>No paid product sales in this period.</EmptyState></div>}
          </div>
        </Panel>

        <Panel title="Recent Orders" className="xl:col-span-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8fafc] text-[11px] uppercase text-[#667085]">
                <tr>
                  <th className="px-3 py-2.5">Product</th>
                  <th className="px-3 py-2.5">Order Code</th>
                  <th className="px-3 py-2.5">Quantity</th>
                  <th className="px-3 py-2.5">Price</th>
                  <th className="px-3 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => {
                  const item = order?.items?.[0];
                  const status = String(order?.status || "unknown").toLowerCase();
                  const confirmed = ["confirmed", "shipped", "delivered"].includes(status);
                  return (
                    <tr key={order.id} className="border-b border-gray-100">
                      <td className="px-3 py-2.5 font-semibold">
                        <div className="flex items-center gap-2.5">
                          <img src={item?.product?.images?.[0] || assets.image_placeholder} alt="" className="h-7 w-7 rounded object-cover" />
                          {item?.productName || item?.product?.name || item?.name || "Product"}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-[#475467]">{order.code}</td>
                      <td className="px-3 py-2.5">{item?.quantity || 0}</td>
                      <td className="px-3 py-2.5">{formatCurrency(order.totalPrice, currency)}</td>
                      <td className="px-3 py-2.5">
                        <span className={`rounded-md px-3 py-1 text-xs font-medium ${confirmed ? "bg-[#dcfce7] text-[#159947]" : status === "cancelled" ? "bg-[#ffe4e6] text-[#ef3340]" : "bg-[#fff1d6] text-[#f79009]"}`}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {!recentOrders.length && <tr><td colSpan="5"><EmptyState>No orders in this period.</EmptyState></td></tr>}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="space-y-4 xl:col-span-2">
          <Panel title="Career Overview" action={null}>
            <div className="mb-4 flex justify-end">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-[#e8f8ee] text-[#009444]">
                <FontAwesomeIcon icon={faBriefcase} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                ["Active Jobs", careerStats.publishedJobs || 0],
                ["Applications", careerStats.totalApplications || 0],
                ["Open Positions", careerStats.publishedJobs || 0],
                ["New Applications", careerStats.newApplications || 0],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs font-medium text-[#667085]">{label}</p>
                  <p className="mt-1 text-base font-bold">{value}</p>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => navigate("/careers/create")}
              className="mt-4 flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#009444] text-xs font-semibold text-white"
            >
              <FontAwesomeIcon icon={faPlus} /> Create New Job
            </button>
            <button
              type="button"
              onClick={() => navigate("/careers/jobs")}
              className="mt-2 h-9 w-full rounded-md border border-[#d0d5dd] text-xs font-semibold text-[#008f45]"
            >
              View All Jobs
            </button>
          </Panel>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Panel title="Top Customers" className="xl:col-span-3">
          <div className="space-y-3">
            {insights.customers.map((customer) => (
              <div key={customer.id} className="flex items-center justify-between border-b border-gray-100 pb-2.5 last:border-0">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-[#e8f3ff] text-xs font-bold text-[#1677d2]">{customer.name.charAt(0).toUpperCase()}</span>
                  <div>
                    <p className="text-sm font-semibold">{customer.name}</p>
                    <p className="text-xs text-[#667085]">{customer.purchases} {customer.purchases === 1 ? "Purchase" : "Purchases"}</p>
                  </div>
                </div>
                <p className="text-xs font-medium">{formatCurrency(customer.totalSpent, currency)}</p>
              </div>
            ))}
            {!insights.customers.length && <EmptyState>No paid customers in this period.</EmptyState>}
          </div>
        </Panel>

        <Panel title="Top States By Sales" className="xl:col-span-3">
          <p className="mb-4 text-lg font-bold">{formatCurrency(insights.totalStateSales, currency)}</p>
          {insights.states.map((state) => (
            <div key={state.name} className="mb-4 grid grid-cols-[1fr_auto_auto] items-center gap-3 text-xs">
              <p className="font-semibold"><FontAwesomeIcon icon={faLocationDot} className="mr-2 text-[#ef3340]" />{state.name}</p>
              <div className="h-1.5 w-20 rounded-full bg-gray-100">
                <div className="h-1.5 rounded-full bg-[#009444]" style={{ width: `${state.percentage}%` }} />
              </div>
              <p className="font-medium">{formatCurrency(state.amount, currency)}</p>
            </div>
          ))}
          {!insights.states.length && <EmptyState>No paid sales by state in this period.</EmptyState>}
        </Panel>

        <Panel title="Top Products" className="xl:col-span-3">
          <div className="space-y-3">
            {insights.products.map((product) => (
              <div key={product.name} className="grid grid-cols-[1fr_auto_auto] items-center gap-2.5 text-xs">
                <div className="flex items-center gap-2.5 font-semibold">
                  <img src={product.image || assets.image_placeholder} alt="" className="h-7 w-7 rounded object-cover" />
                  {product.name}
                </div>
                <p className="text-[#667085]">{product.units} Sold</p>
                <p className="font-medium">{formatCurrency(product.revenue, currency)}</p>
              </div>
            ))}
            {!insights.products.length && <EmptyState>No paid product sales in this period.</EmptyState>}
          </div>
        </Panel>

        <div className="space-y-4 xl:col-span-3">
          <Panel title="Recent Applications">
            {recentApplications.map((application) => (
              <div key={application.id} className="mb-3 flex items-center justify-between last:mb-0">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-[#e8f8ee] text-xs font-bold text-[#008f45]">{application.name.charAt(0).toUpperCase()}</span>
                  <div>
                    <p className="text-xs font-semibold">{application.name}</p>
                    <p className="text-xs text-[#667085]">{application.role}</p>
                  </div>
                </div>
                <p className="text-xs text-[#667085]">{timeAgo(application.submittedAt)}</p>
              </div>
            ))}
            {!recentApplications.length && <EmptyState>No career applications yet.</EmptyState>}
          </Panel>
          <div className="flex items-center justify-between rounded-lg border border-[#b9e7ca] bg-[#eaf8ef] p-4 text-[#006536]">
            <div>
              <p className="text-sm font-semibold">Need Help?</p>
              <p className="text-xs font-medium">Visit Help Center</p>
            </div>
            <span className="text-xl">›</span>
          </div>
        </div>
      </div>
    </div>
  );
};
