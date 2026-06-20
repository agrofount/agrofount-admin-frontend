import { useState } from "react";
import Chart from "react-apexcharts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faComments,
  faUsers,
  faSackDollar,
  faCartShopping,
  faThumbsUp,
  faThumbsDown,
  faTriangleExclamation,
  faArrowTrendUp,
  faCalendarDays,
  faDownload,
  faChevronDown,
  faArrowRight,
  faClock,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";

/* ─── Static analytics data ─────────────────────────────────── */
const CHAT_SERIES = [
  {
    name: "AI Chats",
    data: [820, 950, 1080, 1020, 1350, 1520, 1480, 1640],
  },
];

const CHAT_OPTIONS = {
  chart: { id: "ayo-chats", toolbar: { show: false }, sparkline: { enabled: false } },
  xaxis: {
    categories: ["May 12", "May 13", "May 14", "May 15", "May 16", "May 17", "May 18"],
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: { style: { fontSize: "11px", colors: "#9ca3af" } },
  },
  yaxis: {
    labels: {
      style: { fontSize: "11px", colors: "#9ca3af" },
      formatter: (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v),
    },
  },
  stroke: { curve: "smooth", width: 2 },
  markers: { size: 4, colors: ["#16a34a"], strokeColors: "#fff", strokeWidth: 2 },
  fill: {
    type: "gradient",
    gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.02, stops: [0, 100] },
  },
  colors: ["#16a34a"],
  dataLabels: { enabled: false },
  grid: { borderColor: "#f3f4f6", strokeDashArray: 4 },
  tooltip: { y: { formatter: (v) => `${v.toLocaleString()} chats` } },
};

const DONUT_SERIES = [48, 22, 15, 10, 5];
const DONUT_OPTIONS = {
  chart: { type: "donut", toolbar: { show: false } },
  labels: ["Feeds", "Vaccines", "Medications", "Equipment", "Others"],
  colors: ["#16a34a", "#3b82f6", "#8b5cf6", "#f59e0b", "#9ca3af"],
  legend: { show: false },
  dataLabels: { enabled: false },
  plotOptions: { pie: { donut: { size: "68%" } } },
  tooltip: { y: { formatter: (v) => `${v}%` } },
};

const RADIAL_SERIES = [89];
const RADIAL_OPTIONS = {
  chart: { type: "radialBar", toolbar: { show: false } },
  plotOptions: {
    radialBar: {
      hollow: { size: "60%" },
      dataLabels: {
        name: { show: true, fontSize: "11px", color: "#6b7280", offsetY: 20 },
        value: {
          show: true,
          fontSize: "26px",
          fontWeight: "700",
          color: "#111827",
          offsetY: -12,
          formatter: (v) => `${v}%`,
        },
      },
      track: { background: "#f3f4f6" },
    },
  },
  labels: ["Satisfaction\nRate"],
  colors: ["#16a34a"],
};

const STAT_CARDS = [
  { icon: faComments, bg: "bg-green-100", color: "text-green-600", label: "Total AI Chats", value: "12,458", change: "12.5%" },
  { icon: faUsers, bg: "bg-green-100", color: "text-green-600", label: "Active Farmers", value: "3,241", change: "9.4%" },
  { icon: faSackDollar, bg: "bg-green-100", color: "text-green-600", label: "AI Revenue Influenced", value: "₦18.4M", change: "14.6%" },
  { icon: faCartShopping, bg: "bg-blue-100", color: "text-blue-500", label: "Orders from Ayo", value: "842", change: "8.7%" },
  { icon: faThumbsUp, bg: "bg-indigo-100", color: "text-indigo-500", label: "Satisfaction Rate", value: "89%", change: "2.6%" },
  { icon: faTriangleExclamation, bg: "bg-red-100", color: "text-red-500", label: "Vet Escalations", value: "34", change: "13.3%" },
];

const FUNNEL_STEPS = [
  { icon: faComments, label: "Chats", value: "12,458", pct: null, color: "text-green-600", bg: "bg-green-50" },
  { icon: faArrowTrendUp, label: "Recommendations", value: "8,210", pct: "65.9%", color: "text-blue-500", bg: "bg-blue-50" },
  { icon: faCartShopping, label: "Product Clicks", value: "4,860", pct: "59.2%", color: "text-purple-500", bg: "bg-purple-50" },
  { icon: faCartShopping, label: "Add to Cart", value: "2,184", pct: "44.9%", color: "text-amber-500", bg: "bg-amber-50" },
  { icon: faCartShopping, label: "Orders", value: "842", pct: "38.5%", color: "text-orange-500", bg: "bg-orange-50" },
];

const TOP_QUESTIONS = [
  { q: "What feed should I use for 3 weeks broilers?", count: 1324 },
  { q: "What vaccines are due this week?", count: 987 },
  { q: "How much feed do my birds need?", count: 876 },
  { q: "Why are my birds not eating?", count: 654 },
  { q: "How can I prevent Newcastle disease?", count: 532 },
];

const CATEGORY_LEGEND = [
  { label: "Feeds", pct: "48%", color: "bg-green-600" },
  { label: "Vaccines", pct: "22%", color: "bg-blue-500" },
  { label: "Medications", pct: "15%", color: "bg-violet-500" },
  { label: "Equipment", pct: "10%", color: "bg-amber-400" },
  { label: "Others", pct: "5%", color: "bg-gray-400" },
];

const TOP_PRODUCTS = [
  { name: "Broiler Starter Feed (20%)", recs: 1248, orders: 352, color: "bg-green-500" },
  { name: "Newcastle Vaccine (Lasota)", recs: 947, orders: 214, color: "bg-blue-500" },
  { name: "Grower Mash (18%)", recs: 621, orders: 118, color: "bg-amber-500" },
  { name: "Poultry Drinker (10L)", recs: 512, orders: 96, color: "bg-cyan-500" },
  { name: "Coccivet (Coccidiosis Treatment)", recs: 421, orders: 82, color: "bg-red-400" },
];

const HEALTH_ALERTS = [
  { label: "Newcastle Disease Reports", count: 21, color: "text-red-500", bg: "bg-red-100" },
  { label: "Coccidiosis Reports", count: 14, color: "text-orange-500", bg: "bg-orange-100" },
  { label: "High Mortality Reports", count: 9, color: "text-red-400", bg: "bg-red-50" },
  { label: "Vet Escalations", count: 34, color: "text-red-600", bg: "bg-red-100" },
];

const BIRD_TYPES = [
  { label: "Broiler", pct: 62, color: "bg-green-600", bar: "w-[62%]" },
  { label: "Layer", pct: 21, color: "bg-blue-500", bar: "w-[21%]" },
  { label: "Turkey", pct: 9, color: "bg-violet-500", bar: "w-[9%]" },
  { label: "Others", pct: 8, color: "bg-amber-400", bar: "w-[8%]" },
];

/* ─── Nigeria map (simplified SVG) ──────────────────────────── */
const NigeriaMap = () => (
  <svg viewBox="0 0 240 220" className="w-full h-full opacity-90">
    {/* Rough state patches arranged geographically — north to south */}
    {/* Northwest */}
    <rect x="20" y="10" width="38" height="30" rx="3" fill="#fca5a5" opacity="0.7" />
    <rect x="60" y="10" width="36" height="28" rx="3" fill="#fee2e2" opacity="0.6" />
    <rect x="98" y="10" width="36" height="28" rx="3" fill="#fecaca" opacity="0.7" />
    {/* Northeast */}
    <rect x="136" y="10" width="40" height="30" rx="3" fill="#fee2e2" opacity="0.5" />
    <rect x="178" y="10" width="38" height="30" rx="3" fill="#fca5a5" opacity="0.7" />
    {/* North central */}
    <rect x="20" y="44" width="38" height="30" rx="3" fill="#fde68a" opacity="0.7" />
    <rect x="60" y="44" width="36" height="30" rx="3" fill="#fca5a5" opacity="0.8" />
    <rect x="98" y="44" width="36" height="30" rx="3" fill="#f87171" opacity="0.75" />
    <rect x="136" y="44" width="40" height="30" rx="3" fill="#fde68a" opacity="0.65" />
    <rect x="178" y="44" width="38" height="30" rx="3" fill="#fecaca" opacity="0.6" />
    {/* Middle belt */}
    <rect x="30" y="78" width="34" height="28" rx="3" fill="#fde68a" opacity="0.6" />
    <rect x="66" y="78" width="38" height="28" rx="3" fill="#f87171" opacity="0.8" />
    <rect x="106" y="78" width="38" height="28" rx="3" fill="#fca5a5" opacity="0.7" />
    <rect x="146" y="78" width="38" height="28" rx="3" fill="#fde68a" opacity="0.65" />
    <rect x="186" y="78" width="30" height="28" rx="3" fill="#fee2e2" opacity="0.5" />
    {/* Southwest */}
    <rect x="30" y="110" width="34" height="26" rx="3" fill="#fde68a" opacity="0.55" />
    <rect x="66" y="110" width="38" height="26" rx="3" fill="#fca5a5" opacity="0.65" />
    <rect x="106" y="110" width="38" height="26" rx="3" fill="#f87171" opacity="0.8" />
    {/* Southeast */}
    <rect x="146" y="110" width="38" height="26" rx="3" fill="#fca5a5" opacity="0.7" />
    <rect x="186" y="110" width="30" height="26" rx="3" fill="#fee2e2" opacity="0.5" />
    {/* South */}
    <rect x="50" y="140" width="34" height="24" rx="3" fill="#fed7aa" opacity="0.55" />
    <rect x="86" y="140" width="38" height="24" rx="3" fill="#fca5a5" opacity="0.65" />
    <rect x="126" y="140" width="38" height="24" rx="3" fill="#f87171" opacity="0.75" />
    <rect x="166" y="140" width="34" height="24" rx="3" fill="#fecaca" opacity="0.6" />
    {/* Deep south / delta */}
    <rect x="66" y="168" width="38" height="22" rx="3" fill="#fed7aa" opacity="0.5" />
    <rect x="106" y="168" width="40" height="22" rx="3" fill="#fca5a5" opacity="0.65" />
    <rect x="148" y="168" width="34" height="22" rx="3" fill="#fecaca" opacity="0.55" />
  </svg>
);

/* ─── Main Component ─────────────────────────────────────────── */
const AyoAIAnalytics = () => {
  const [chartInterval, setChartInterval] = useState("Daily");

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[25px] font-bold text-gray-900 leading-tight tracking-[0.5px]">
              Ayo AI Assistant Analytics
            </h1>
            <FontAwesomeIcon icon={faInfoCircle} className="text-gray-400 text-sm mt-1" />
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Track usage, performance and impact of Ayo AI assistant on your marketplace.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button className="flex items-center gap-2 border border-gray-300 bg-white text-gray-700 text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            <FontAwesomeIcon icon={faCalendarDays} className="text-gray-500" />
            <span>May 12, 2025 - May 18, 2025</span>
            <FontAwesomeIcon icon={faChevronDown} className="text-gray-400 text-xs" />
          </button>
          <button className="flex items-center gap-2 border border-green-600 text-green-700 bg-white text-sm px-4 py-2 rounded-lg hover:bg-green-50 transition-colors">
            <FontAwesomeIcon icon={faDownload} />
            <span className="font-medium">Export Report</span>
            <FontAwesomeIcon icon={faChevronDown} className="text-green-600 text-xs" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {STAT_CARDS.map((card, i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow-[0px_0px_10px_0px_#EDEDED] p-4 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <div className={`${card.bg} w-10 h-10 rounded-lg flex items-center justify-center`}>
                <FontAwesomeIcon icon={card.icon} className={`${card.color} text-base`} />
              </div>
            </div>
            <div>
              <p className="text-gray-500 text-xs leading-tight">{card.label}</p>
              <p className="text-gray-900 text-xl font-bold mt-0.5">{card.value}</p>
            </div>
            <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
              <FontAwesomeIcon icon={faArrowTrendUp} className="text-[10px]" />
              <span>{card.change} vs last week</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* AI Chats Over Time */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-[0px_0px_10px_0px_#EDEDED] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 text-sm">AI Chats Over Time</h2>
            <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
              {["Daily", "Weekly"].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setChartInterval(opt)}
                  className={`text-xs px-3 py-1.5 transition-colors ${
                    chartInterval === opt
                      ? "bg-gray-100 text-gray-800 font-medium"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <Chart
            options={CHAT_OPTIONS}
            series={CHAT_SERIES}
            type="area"
            height={220}
          />
        </div>

        {/* Conversation Funnel */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-[0px_0px_10px_0px_#EDEDED] p-5">
          <h2 className="font-semibold text-gray-800 text-sm mb-4">
            Conversation Funnel (From Ayo)
          </h2>
          <div className="flex flex-col gap-2">
            {FUNNEL_STEPS.map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`${step.bg} rounded-lg p-3 flex flex-col items-center min-w-[80px] flex-1`}>
                  <FontAwesomeIcon icon={step.icon} className={`${step.color} text-lg mb-1`} />
                  <p className="text-[10px] text-gray-500 leading-tight text-center">{step.label}</p>
                  <p className="text-sm font-bold text-gray-800">{step.value}</p>
                  {step.pct && (
                    <p className="text-[10px] text-gray-400 mt-0.5">{step.pct}</p>
                  )}
                </div>
                {i < FUNNEL_STEPS.length - 1 && (
                  <FontAwesomeIcon icon={faArrowRight} className="text-gray-300 text-sm shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Top Questions Asked */}
        <div className="bg-white rounded-xl shadow-[0px_0px_10px_0px_#EDEDED] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 text-sm">Top Questions Asked</h2>
            <Link to="#" className="text-green-600 text-xs font-medium hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {TOP_QUESTIONS.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-xs flex items-center justify-center shrink-0 mt-0.5 font-medium">
                  {i + 1}
                </span>
                <p className="text-gray-700 text-sm flex-1 leading-snug">{item.q}</p>
                <span className="text-gray-800 text-sm font-semibold shrink-0">
                  {item.count.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Recommended Categories */}
        <div className="bg-white rounded-xl shadow-[0px_0px_10px_0px_#EDEDED] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 text-sm">Top Recommended Categories</h2>
            <Link to="#" className="text-green-600 text-xs font-medium hover:underline">
              View all
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-36 h-36 shrink-0">
              <Chart
                options={DONUT_OPTIONS}
                series={DONUT_SERIES}
                type="donut"
                height={144}
              />
            </div>
            <div className="space-y-2 flex-1">
              {CATEGORY_LEGEND.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.color} shrink-0`} />
                    <span className="text-gray-600 text-xs">{item.label}</span>
                  </div>
                  <span className="text-gray-800 text-xs font-semibold">{item.pct}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Products Recommended */}
        <div className="bg-white rounded-xl shadow-[0px_0px_10px_0px_#EDEDED] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 text-sm">Top Products Recommended</h2>
            <Link to="#" className="text-green-600 text-xs font-medium hover:underline">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Product</p>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide text-right">Recs</p>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide text-right">Orders</p>
          </div>
          <div className="space-y-3">
            {TOP_PRODUCTS.map((p, i) => (
              <div key={i} className="grid grid-cols-3 gap-2 items-center">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-8 rounded-sm shrink-0 ${p.color}`} />
                  <p className="text-xs text-gray-700 leading-tight">{p.name}</p>
                </div>
                <p className="text-xs font-semibold text-gray-800 text-right">{p.recs.toLocaleString()}</p>
                <p className="text-xs font-semibold text-gray-800 text-right">{p.orders}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Health & Disease Alerts */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-[0px_0px_10px_0px_#EDEDED] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 text-sm">Health &amp; Disease Alerts</h2>
            <Link to="#" className="text-green-600 text-xs font-medium hover:underline">
              View all
            </Link>
          </div>
          <div className="flex gap-4">
            <div className="space-y-3 flex-1">
              {HEALTH_ALERTS.map((alert, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`${alert.bg} w-8 h-8 rounded-full flex items-center justify-center shrink-0`}>
                    <FontAwesomeIcon icon={faTriangleExclamation} className={`${alert.color} text-xs`} />
                  </div>
                  <p className="text-gray-700 text-xs flex-1 leading-tight">{alert.label}</p>
                  <span className="text-gray-800 font-semibold text-sm">{alert.count}</span>
                </div>
              ))}
              <div className="mt-4 flex flex-col gap-1.5">
                {[
                  { label: "High", color: "bg-red-500" },
                  { label: "Medium", color: "bg-orange-400" },
                  { label: "Low", color: "bg-yellow-200" },
                  { label: "None", color: "bg-gray-200" },
                ].map((leg) => (
                  <div key={leg.label} className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-sm ${leg.color}`} />
                    <span className="text-xs text-gray-500">{leg.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-32 h-48 shrink-0">
              <NigeriaMap />
              <p className="text-[9px] text-gray-400 text-center mt-1">Reports by State</p>
            </div>
          </div>
        </div>

        {/* User Satisfaction */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-[0px_0px_10px_0px_#EDEDED] p-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-gray-800 text-sm">User Satisfaction</h2>
            <Link to="#" className="text-green-600 text-xs font-medium hover:underline">
              View all
            </Link>
          </div>
          <div className="flex justify-center">
            <Chart
              options={RADIAL_OPTIONS}
              series={RADIAL_SERIES}
              type="radialBar"
              height={180}
              width={180}
            />
          </div>
          <div className="space-y-3 mt-2">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 w-8 h-8 rounded-full flex items-center justify-center">
                <FontAwesomeIcon icon={faThumbsUp} className="text-green-600 text-xs" />
              </div>
              <div>
                <p className="text-gray-800 font-bold text-sm">4,782</p>
                <p className="text-gray-400 text-xs">Positive (89%)</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-red-100 w-8 h-8 rounded-full flex items-center justify-center">
                <FontAwesomeIcon icon={faThumbsDown} className="text-red-500 text-xs" />
              </div>
              <div>
                <p className="text-gray-800 font-bold text-sm">589</p>
                <p className="text-gray-400 text-xs">Negative (11%)</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center">
                <FontAwesomeIcon icon={faClock} className="text-gray-500 text-xs" />
              </div>
              <div>
                <p className="text-gray-800 font-bold text-sm">2.1s</p>
                <p className="text-gray-400 text-xs">Avg Response Time</p>
              </div>
            </div>
          </div>
        </div>

        {/* Interaction by Bird Type */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-[0px_0px_10px_0px_#EDEDED] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 text-sm">Interaction by Bird Type</h2>
            <Link to="#" className="text-green-600 text-xs font-medium hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-5">
            {BIRD_TYPES.map((bird, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🐔</span>
                    <span className="text-sm text-gray-700 font-medium">{bird.label}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-800">{bird.pct}%</span>
                </div>
                <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${bird.color}`}
                    style={{ width: `${bird.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer disclaimer */}
      <div className="flex items-center gap-2 pt-2">
        <FontAwesomeIcon icon={faInfoCircle} className="text-gray-400 text-xs shrink-0" />
        <p className="text-gray-400 text-xs">
          AI metrics are updated hourly. All revenue and order attribution is based on user
          interaction with Ayo before purchase.
        </p>
      </div>
    </div>
  );
};

export default AyoAIAnalytics;
