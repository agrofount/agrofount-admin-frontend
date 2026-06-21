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

const generatePeriods = () => {
  const periods = [];
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
  periods.push({
    id: 0,
    name: "May 12, 2025 - May 18, 2025",
    startDate: "2025-05-12",
    endDate: "2025-05-18T23:59:59.999Z",
  });
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

const Sparkline = ({ color = "#159947", data = [12, 18, 15, 22, 19, 26, 24] }) => {
  const width = 240;
  const height = 54;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 14) - 7;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-3 h-12 w-full" aria-hidden="true">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((value, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - ((value - min) / range) * (height - 14) - 7;
        return <circle key={index} cx={x} cy={y} r="3" fill={color} className="opacity-95" />;
      })}
    </svg>
  );
};

const StatCard = ({ title, value, trend, icon, color, colorHex, bg, dark, data }) => (
  <div
    className={`rounded-lg border p-4 shadow-[0_8px_24px_rgba(16,24,40,0.05)] ${
      dark ? "border-transparent bg-gradient-to-br from-[#009444] to-[#006536] text-white" : "border-[#e5e7eb] bg-white text-[#101828]"
    }`}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className={`text-xs font-medium ${dark ? "text-white" : "text-[#475467]"}`}>{title}</p>
        <p className="mt-1.5 text-2xl font-bold tracking-normal">{value}</p>
        <p className={`mt-2 text-xs font-medium ${dark ? "text-white" : "text-[#009444]"}`}>
          ↑ {trend} <span className={dark ? "text-white/85" : "text-[#667085]"}>vs last week</span>
        </p>
      </div>
      <div className={`grid h-10 w-10 place-items-center rounded-xl ${dark ? "bg-white/20" : bg}`}>
        <FontAwesomeIcon icon={icon} className={dark ? "text-white" : color} />
      </div>
    </div>
    <Sparkline color={dark ? "#ffffff" : colorHex} data={data} />
  </div>
);

const Panel = ({ title, action = "View all", children, className = "" }) => (
  <section className={`rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.04)] ${className}`}>
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-base font-semibold text-[#101828]">{title}</h2>
      {action && <button className="text-xs font-semibold text-[#008f45]">{action}</button>}
    </div>
    {children}
  </section>
);

const productImages = [assets.broiler_starter_mash_1, assets.soya, assets.image_placeholder];

export const Dashboard = () => {
  const { currency, user, token, navigate } = useContext(ShopContext);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedDate, setSelectedDate] = useState(periods[periods.length - 1]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await apiClient.get("/order/admin/all", {
          params: {
            "filter.createdAt": [`$gte:${selectedDate.startDate}`, `$lte:${selectedDate.endDate}`],
          },
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
    const fetchUsers = async () => {
      try {
        const response = await apiClient.get("/user", { params: { limit: 25 } });
        setUsers(response.data?.data || response.data || []);
      } catch {
        setUsers([]);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!token) navigate("/login");
  }, [token, navigate]);

  const metrics = useMemo(() => {
    const totalSales = orders.reduce((sum, order) => sum + Number(order.totalPrice || order.total || 0), 0);
    const income = orders
      .filter((order) => order.paymentStatus === "completed" || order.status === "confirmed")
      .reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);
    return {
      totalSales,
      totalOrders: orders.length,
      totalCustomers: Array.isArray(users) ? users.length : 0,
      income,
    };
  }, [orders, users]);

  const displayName = user?.username || "akinbamidayo";
  const recentOrders = orders.slice(0, 5);
  const products = [
    { name: "Day-old Chicks", amount: "₦3,434,000", percent: "62%", image: productImages[0] },
    { name: "Poultry Medications", amount: "₦1,499,000", percent: "27%", image: productImages[1] },
    { name: "Equipment", amount: "₦780,000", percent: "11%", image: productImages[2] },
  ];

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
        <StatCard title="Total Sales" value={formatCurrency(metrics.totalSales || 92000, currency, true)} trend="1.56%" icon={faSuitcase} color="text-[#009444]" colorHex="#009444" bg="bg-[#e8f8ee]" dark data={[14, 22, 31, 28, 35, 30, 38, 34, 43, 39, 48, 55, 49, 44]} />
        <StatCard title="Total Orders" value={metrics.totalOrders || 128} trend="8.45%" icon={faSuitcase} color="text-[#1587d9]" colorHex="#1587d9" bg="bg-[#eaf5ff]" data={[20, 28, 39, 33, 30, 42, 38, 34, 32, 26, 39, 45, 37, 48, 50]} />
        <StatCard title="Total Customers" value={metrics.totalCustomers || 25} trend="3.21%" icon={faUsers} color="text-[#7f3fd9]" colorHex="#7f3fd9" bg="bg-[#f1e9ff]" data={[12, 17, 23, 19, 17, 25, 21, 18, 18, 13, 20, 25, 21, 28, 28]} />
        <StatCard title="Total Income" value={formatCurrency(metrics.income || 92000, currency, true)} trend="1.56%" icon={faWallet} color="text-[#f79009]" colorHex="#f79009" bg="bg-[#fff2df]" data={[10, 15, 24, 19, 17, 27, 23, 18, 16, 12, 21, 26, 21, 31, 32]} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Panel title="Top Product Categories (Sales)" className="xl:col-span-4">
          <div className="grid grid-cols-3 gap-3">
            {products.map((product) => (
              <div key={product.name}>
                <img src={product.image} alt={product.name} className="h-28 w-full rounded-lg object-cover" />
                <p className="mt-2 text-xs font-semibold">{product.name}</p>
                <p className="mt-1.5 text-base font-bold">{product.amount}</p>
                <p className="text-xs font-medium text-[#667085]">{product.percent} of sales</p>
                <div className="mt-2 h-1.5 rounded-full bg-gray-200">
                  <div className="h-1.5 rounded-full bg-[#009444]" style={{ width: product.percent }} />
                </div>
              </div>
            ))}
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
                {(recentOrders.length ? recentOrders : Array.from({ length: 5 })).map((order, index) => {
                  const item = order?.items?.[0];
                  return (
                    <tr key={order?.id || index} className="border-b border-gray-100">
                      <td className="px-3 py-2.5 font-semibold">
                        <div className="flex items-center gap-2.5">
                          <img src={item?.product?.images?.[0] || assets.image_placeholder} alt="" className="h-7 w-7 rounded object-cover" />
                          {item?.product?.name || `Mashed Fish Product${index + 4}`}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-[#475467]">{order?.code || `ORD-1765878800244-WDGLZR`}</td>
                      <td className="px-3 py-2.5">{item?.quantity || (index === 0 ? 6 : 1)}</td>
                      <td className="px-3 py-2.5">{formatCurrency(order?.totalPrice || 54500, currency)}</td>
                      <td className="px-3 py-2.5">
                        <span className={`rounded-md px-3 py-1 text-xs font-medium ${index === 0 ? "bg-[#dcfce7] text-[#159947]" : "bg-[#fff1d6] text-[#f79009]"}`}>
                          {index === 0 ? "Confirmed" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
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
                ["Active Jobs", "8"],
                ["Applications", "42"],
                ["Open Positions", "23"],
                ["New This Week", "7"],
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
            {["Kosoko6", "Akeju", "Johnson Farm"].map((name, index) => (
              <div key={name} className="flex items-center justify-between border-b border-gray-100 pb-2.5 last:border-0">
                <div className="flex items-center gap-2.5">
                  <img src={assets.profile_picture} alt="" className="h-8 w-8 rounded-full" />
                  <div>
                    <p className="text-sm font-semibold">{name}</p>
                    <p className="text-xs text-[#667085]">{index + 1} Purchases</p>
                  </div>
                </div>
                <p className="text-xs font-medium">{formatCurrency([1399000, 327000, 210000][index], currency)}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Top States By Sales" className="xl:col-span-3">
          <p className="mb-4 text-lg font-bold">{formatCurrency(1726000, currency)} <span className="text-xs font-normal text-[#009444]">↑ 1.56%</span></p>
          {["Oluyole", "Abia", "Adamawa"].map((state, index) => (
            <div key={state} className="mb-4 grid grid-cols-[1fr_auto_auto] items-center gap-3 text-xs">
              <p className="font-semibold"><FontAwesomeIcon icon={faLocationDot} className="mr-2 text-[#ef3340]" />{state}</p>
              <div className="h-1.5 w-20 rounded-full bg-gray-100">
                <div className="h-1.5 rounded-full bg-[#009444]" style={{ width: `${[82, 44, 20][index]}%` }} />
              </div>
              <p className="font-medium">{formatCurrency([1222000, 327000, 177000][index], currency)}</p>
            </div>
          ))}
        </Panel>

        <Panel title="Top Products" className="xl:col-span-3">
          <div className="space-y-3">
            {["Elubo", "Mashed Fish Product8", "Mashed Fish Product7", "Product C", "Product H"].map((product, index) => (
              <div key={product} className="grid grid-cols-[1fr_auto_auto] items-center gap-2.5 text-xs">
                <div className="flex items-center gap-2.5 font-semibold">
                  <img src={index % 2 ? assets.broiler_starter_mash_1 : assets.image_placeholder} alt="" className="h-7 w-7 rounded object-cover" />
                  {product}
                </div>
                <p className="text-[#667085]">{[6, 6, 6, 4, 2][index]} Sold</p>
                <p className="font-medium">{formatCurrency([420000, 327000, 318000, 213000, 48000][index], currency)}</p>
              </div>
            ))}
          </div>
        </Panel>

        <div className="space-y-4 xl:col-span-3">
          <Panel title="Recent Applications">
            {["Tola Adeyemi", "Emeka Okafor", "Joy Sunday"].map((name, index) => (
              <div key={name} className="mb-3 flex items-center justify-between last:mb-0">
                <div className="flex items-center gap-2.5">
                  <img src={assets.profile_picture} alt="" className="h-8 w-8 rounded-full" />
                  <div>
                    <p className="text-xs font-semibold">{name}</p>
                    <p className="text-xs text-[#667085]">{["Farm Manager", "Sales Representative", "Poultry Technician"][index]}</p>
                  </div>
                </div>
                <p className="text-xs text-[#667085]">{["2h ago", "4h ago", "1d ago"][index]}</p>
              </div>
            ))}
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
