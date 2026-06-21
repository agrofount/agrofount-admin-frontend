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
  faCircleInfo,
  faWandMagicSparkles,
  faArrowPointer,
  faBagShopping,
  faBiohazard,
  faSkull,
  faStethoscope,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";

/* ─── Chart configs ──────────────────────────────────────────── */
const CHAT_SERIES = [{ name: "AI Chats", data: [820, 960, 1080, 1020, 1350, 1550, 1480] }];

const CHAT_OPTIONS = {
  chart: { id: "ayo-chats", toolbar: { show: false } },
  xaxis: {
    categories: ["May 12", "May 13", "May 14", "May 15", "May 16", "May 17", "May 18"],
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: { style: { fontSize: "11px", colors: "#9ca3af" } },
  },
  yaxis: {
    min: 0,
    max: 2000,
    tickAmount: 4,
    labels: {
      style: { fontSize: "11px", colors: "#9ca3af" },
      formatter: (v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v === 0 ? "0" : `${v}`),
    },
  },
  stroke: { curve: "smooth", width: 2.5 },
  markers: { size: 5, colors: ["#16a34a"], strokeColors: "#fff", strokeWidth: 2, hover: { size: 7 } },
  fill: {
    type: "gradient",
    gradient: { shadeIntensity: 1, opacityFrom: 0.25, opacityTo: 0.02, stops: [0, 100] },
  },
  colors: ["#16a34a"],
  dataLabels: { enabled: false },
  grid: { borderColor: "#f3f4f6", strokeDashArray: 5, padding: { left: 0, right: 0 } },
  tooltip: { y: { formatter: (v) => `${v.toLocaleString()} chats` } },
};

const DONUT_SERIES = [48, 22, 15, 10, 5];
const DONUT_OPTIONS = {
  chart: { type: "donut", toolbar: { show: false } },
  labels: ["Feeds", "Vaccines", "Medications", "Equipment", "Others"],
  colors: ["#16a34a", "#3b82f6", "#8b5cf6", "#f59e0b", "#9ca3af"],
  legend: { show: false },
  dataLabels: { enabled: false },
  plotOptions: { pie: { donut: { size: "70%" } } },
  tooltip: { y: { formatter: (v) => `${v}%` } },
  stroke: { width: 2 },
};

const RADIAL_SERIES = [89];
const RADIAL_OPTIONS = {
  chart: { type: "radialBar", toolbar: { show: false } },
  plotOptions: {
    radialBar: {
      hollow: { size: "62%", background: "transparent" },
      track: { background: "#f3f4f6", strokeWidth: "100%", margin: 0 },
      dataLabels: {
        name: {
          show: true,
          fontSize: "10px",
          fontWeight: "500",
          color: "#6b7280",
          offsetY: 18,
        },
        value: {
          show: true,
          fontSize: "28px",
          fontWeight: "700",
          color: "#111827",
          offsetY: -10,
          formatter: (v) => `${v}%`,
        },
      },
    },
  },
  labels: ["Satisfaction Rate"],
  colors: ["#16a34a"],
};

/* ─── Static data ────────────────────────────────────────────── */
const STAT_CARDS = [
  { icon: faComments, bg: "bg-green-100", color: "text-green-600", label: "Total AI Chats", value: "12,458", change: "12.5%" },
  { icon: faUsers, bg: "bg-green-100", color: "text-green-600", label: "Active Farmers", value: "3,241", change: "9.4%" },
  { icon: faSackDollar, bg: "bg-green-100", color: "text-green-600", label: "AI Revenue Influenced", value: "₦18.4M", change: "14.6%" },
  { icon: faCartShopping, bg: "bg-blue-100", color: "text-blue-500", label: "Orders from Ayo", value: "842", change: "8.7%" },
  { icon: faThumbsUp, bg: "bg-indigo-100", color: "text-indigo-500", label: "Satisfaction Rate", value: "89%", change: "2.6%" },
  { icon: faTriangleExclamation, bg: "bg-red-100", color: "text-red-500", label: "Vet Escalations", value: "34", change: "13.3%" },
];

const FUNNEL_STEPS = [
  {
    icon: faComments,
    label: "Chats",
    value: "12,458",
    pct: null,
    iconBg: "bg-green-700",
    cardBg: "bg-green-50",
    border: "border-green-100",
  },
  {
    icon: faWandMagicSparkles,
    label: "Recommendations",
    value: "8,210",
    pct: "65.9%",
    iconBg: "bg-blue-500",
    cardBg: "bg-blue-50",
    border: "border-blue-100",
  },
  {
    icon: faArrowPointer,
    label: "Product Clicks",
    value: "4,860",
    pct: "59.2%",
    iconBg: "bg-purple-500",
    cardBg: "bg-purple-50",
    border: "border-purple-100",
  },
  {
    icon: faCartShopping,
    label: "Add to Cart",
    value: "2,184",
    pct: "44.9%",
    iconBg: "bg-amber-500",
    cardBg: "bg-amber-50",
    border: "border-amber-100",
  },
  {
    icon: faBagShopping,
    label: "Orders",
    value: "842",
    pct: "38.5%",
    iconBg: "bg-orange-500",
    cardBg: "bg-orange-50",
    border: "border-orange-100",
  },
];

const TOP_QUESTIONS = [
  { q: "What feed should I use for 3 weeks broilers?", count: 1324 },
  { q: "What vaccines are due this week?", count: 987 },
  { q: "How much feed do my birds need?", count: 876 },
  { q: "Why are my birds not eating?", count: 654 },
  { q: "How can I prevent Newcastle disease?", count: 532 },
];

const CATEGORY_LEGEND = [
  { label: "Feeds", pct: "48%", dot: "bg-green-600" },
  { label: "Vaccines", pct: "22%", dot: "bg-blue-500" },
  { label: "Medications", pct: "15%", dot: "bg-violet-500" },
  { label: "Equipment", pct: "10%", dot: "bg-amber-400" },
  { label: "Others", pct: "5%", dot: "bg-gray-400" },
];

const TOP_PRODUCTS = [
  { name: "Broiler Starter Feed (20%)", recs: 1248, orders: 352, dot: "bg-green-500" },
  { name: "Newcastle Vaccine (Lasota)", recs: 947, orders: 214, dot: "bg-blue-500" },
  { name: "Grower Mash (18%)", recs: 621, orders: 118, dot: "bg-amber-500" },
  { name: "Poultry Drinker (10L)", recs: 512, orders: 96, dot: "bg-cyan-500" },
  { name: "Coccivet (Coccidiosis Treatment)", recs: 421, orders: 82, dot: "bg-red-400" },
];

const HEALTH_ALERTS = [
  { label: "Newcastle Disease Reports", count: 21, icon: faTriangleExclamation, iconColor: "text-red-500", bg: "bg-red-100" },
  { label: "Coccidiosis Reports", count: 14, icon: faBiohazard, iconColor: "text-orange-500", bg: "bg-orange-100" },
  { label: "High Mortality Reports", count: 9, icon: faSkull, iconColor: "text-red-400", bg: "bg-red-50" },
  { label: "Vet Escalations", count: 34, icon: faStethoscope, iconColor: "text-red-600", bg: "bg-red-100" },
];

const BIRD_TYPES = [
  { label: "Broiler", pct: 62, color: "bg-green-600", emoji: "🐔" },
  { label: "Layer", pct: 21, color: "bg-blue-500", emoji: "🐓" },
  { label: "Turkey", pct: 9, color: "bg-violet-500", emoji: "🦃" },
  { label: "Others", pct: 8, color: "bg-amber-400", emoji: "🐦" },
];

const MAP_LEGEND = [
  { label: "High", color: "bg-red-500" },
  { label: "Medium", color: "bg-orange-300" },
  { label: "Low", color: "bg-red-100" },
  { label: "None", color: "bg-gray-200" },
];

/* ─── Nigeria map with clipped outline ──────────────────────── */
const NigeriaMap = () => {
  /* Simplified Nigeria polygon (scaled to 250×220 viewBox) */
  const outline =
    "M 42,8 L 88,4 L 140,4 L 192,6 L 228,14 L 246,32 L 249,58 L 246,88 " +
    "L 238,118 L 220,146 L 198,168 L 170,190 L 145,204 L 118,208 " +
    "L 92,203 L 68,192 L 48,176 L 32,156 L 20,132 L 14,106 " +
    "L 14,78 L 18,54 L 28,34 Z";

  return (
    <svg viewBox="0 0 260 215" className="w-full h-full" aria-label="Nigeria disease map">
      <defs>
        <clipPath id="ng-outline">
          <path d={outline} />
        </clipPath>
      </defs>

      {/* Fill zones clipped to Nigeria shape */}
      <g clipPath="url(#ng-outline)">
        {/* Row 1 – far north */}
        <rect x="0"   y="0"  width="88"  height="52" fill="#f87171" opacity="0.55" />
        <rect x="88"  y="0"  width="80"  height="52" fill="#fca5a5" opacity="0.5"  />
        <rect x="168" y="0"  width="100" height="52" fill="#fecaca" opacity="0.55" />
        {/* Row 2 – north central */}
        <rect x="0"   y="52" width="72"  height="52" fill="#fde68a" opacity="0.55" />
        <rect x="72"  y="52" width="86"  height="52" fill="#f87171" opacity="0.7"  />
        <rect x="158" y="52" width="110" height="52" fill="#fca5a5" opacity="0.5"  />
        {/* Row 3 – middle belt */}
        <rect x="0"   y="104" width="64"  height="48" fill="#fde68a" opacity="0.5"  />
        <rect x="64"  y="104" width="84"  height="48" fill="#f87171" opacity="0.65" />
        <rect x="148" y="104" width="115" height="48" fill="#fca5a5" opacity="0.55" />
        {/* Row 4 – southwest / southeast */}
        <rect x="18"  y="152" width="70"  height="40" fill="#fde68a" opacity="0.45" />
        <rect x="88"  y="152" width="80"  height="40" fill="#fca5a5" opacity="0.55" />
        <rect x="168" y="152" width="90"  height="40" fill="#f87171" opacity="0.6"  />
        {/* Row 5 – coastal / delta */}
        <rect x="40"  y="192" width="70"  height="30" fill="#fca5a5" opacity="0.55" />
        <rect x="110" y="192" width="70"  height="30" fill="#f87171" opacity="0.7"  />
        <rect x="180" y="192" width="70"  height="30" fill="#fde68a" opacity="0.45" />
      </g>

      {/* Internal state grid lines */}
      <g clipPath="url(#ng-outline)" stroke="white" strokeWidth="0.7" fill="none" opacity="0.45">
        <line x1="0" y1="52"  x2="260" y2="52"  />
        <line x1="0" y1="104" x2="260" y2="104" />
        <line x1="0" y1="152" x2="260" y2="152" />
        <line x1="0" y1="192" x2="260" y2="192" />
        <line x1="88"  y1="0" x2="88"  y2="215" />
        <line x1="158" y1="0" x2="158" y2="215" />
        <line x1="228" y1="0" x2="228" y2="215" />
      </g>

      {/* Country border */}
      <path
        d={outline}
        stroke="#dc2626"
        strokeWidth="2"
        fill="none"
        opacity="0.35"
      />
    </svg>
  );
};

/* ─── Page component ─────────────────────────────────────────── */
const AyoAIAnalytics = () => {
  const [chartInterval, setChartInterval] = useState("Daily");

  return (
    <div className="space-y-5 pb-8">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[25px] font-bold text-gray-900 leading-tight tracking-[0.5px]">
              Ayo AI Assistant Analytics
            </h1>
            <FontAwesomeIcon icon={faCircleInfo} className="text-gray-400 text-sm mt-1" />
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Track usage, performance and impact of Ayo AI assistant on your marketplace.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button className="flex items-center gap-2 border border-gray-300 bg-white text-gray-700 text-sm px-4 py-2 rounded-lg hover:bg-gray-50">
            <FontAwesomeIcon icon={faCalendarDays} className="text-gray-400 text-xs" />
            <span>May 12, 2025 - May 18, 2025</span>
            <FontAwesomeIcon icon={faChevronDown} className="text-gray-400 text-xs" />
          </button>
          <button className="flex items-center gap-2 border border-green-600 text-green-700 bg-white text-sm px-4 py-2 rounded-lg hover:bg-green-50">
            <FontAwesomeIcon icon={faDownload} className="text-sm" />
            <span className="font-medium">Export Report</span>
            <FontAwesomeIcon icon={faChevronDown} className="text-green-600 text-xs" />
          </button>
        </div>
      </div>

      {/* ── Stats Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {STAT_CARDS.map((card, i) => (
          <div key={i} className="bg-white rounded-xl shadow-[0_0_10px_#EDEDED] p-4">
            <div className={`${card.bg} w-11 h-11 rounded-xl flex items-center justify-center mb-3`}>
              <FontAwesomeIcon icon={card.icon} className={`${card.color} text-lg`} />
            </div>
            <p className="text-gray-400 text-xs leading-tight">{card.label}</p>
            <p className="text-gray-900 text-xl font-bold mt-0.5 mb-1">{card.value}</p>
            <div className="flex items-center gap-1 text-green-600 text-[11px] font-medium">
              <FontAwesomeIcon icon={faArrowTrendUp} className="text-[9px]" />
              <span>{card.change} vs last week</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts Row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* AI Chats Over Time */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-[0_0_10px_#EDEDED] p-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-gray-800 text-sm">AI Chats Over Time</h2>
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              {["Daily", "Weekly"].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setChartInterval(opt)}
                  className={`text-xs px-3 py-1.5 transition-colors ${
                    chartInterval === opt
                      ? "bg-gray-100 text-gray-800 font-semibold"
                      : "text-gray-400 hover:bg-gray-50"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <Chart options={CHAT_OPTIONS} series={CHAT_SERIES} type="area" height={230} />
        </div>

        {/* Conversation Funnel — horizontal */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-[0_0_10px_#EDEDED] p-5">
          <h2 className="font-semibold text-gray-800 text-sm mb-4">
            Conversation Funnel (From Ayo)
          </h2>
          <div className="flex items-stretch gap-1.5 overflow-x-auto pb-1">
            {FUNNEL_STEPS.map((step, i) => (
              <div key={i} className="flex items-center gap-1.5 shrink-0">
                {/* Step card */}
                <div
                  className={`${step.cardBg} border ${step.border} rounded-xl px-2 py-3 flex flex-col items-center text-center w-[72px]`}
                >
                  <div className={`${step.iconBg} w-9 h-9 rounded-lg flex items-center justify-center mb-2`}>
                    <FontAwesomeIcon icon={step.icon} className="text-white text-sm" />
                  </div>
                  <p className="text-[9.5px] text-gray-500 leading-tight mb-1">{step.label}</p>
                  <p className="text-sm font-bold text-gray-800 leading-tight">{step.value}</p>
                  {step.pct ? (
                    <p className="text-[9px] text-gray-400 mt-0.5">{step.pct}</p>
                  ) : (
                    <p className="text-[9px] text-transparent mt-0.5">—</p>
                  )}
                </div>
                {/* Arrow */}
                {i < FUNNEL_STEPS.length - 1 && (
                  <FontAwesomeIcon icon={faArrowRight} className="text-gray-300 text-xs shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Middle Row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Top Questions Asked */}
        <div className="bg-white rounded-xl shadow-[0_0_10px_#EDEDED] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 text-sm">Top Questions Asked</h2>
            <Link to="#" className="text-green-600 text-xs font-medium hover:underline">View all</Link>
          </div>
          <div className="space-y-3.5">
            {TOP_QUESTIONS.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-semibold">
                  {i + 1}
                </span>
                <p className="text-gray-700 text-sm flex-1 leading-snug">{item.q}</p>
                <span className="text-gray-800 text-sm font-bold shrink-0">{item.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Recommended Categories */}
        <div className="bg-white rounded-xl shadow-[0_0_10px_#EDEDED] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 text-sm">Top Recommended Categories</h2>
            <Link to="#" className="text-green-600 text-xs font-medium hover:underline">View all</Link>
          </div>
          <div className="flex items-center gap-5">
            <div className="shrink-0">
              <Chart options={DONUT_OPTIONS} series={DONUT_SERIES} type="donut" height={150} width={150} />
            </div>
            <div className="space-y-2.5 flex-1">
              {CATEGORY_LEGEND.map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${item.dot}`} />
                    <span className="text-gray-600 text-xs">{item.label}</span>
                  </div>
                  <span className="text-gray-800 text-xs font-bold">{item.pct}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Products Recommended */}
        <div className="bg-white rounded-xl shadow-[0_0_10px_#EDEDED] p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800 text-sm">Top Products Recommended</h2>
            <Link to="#" className="text-green-600 text-xs font-medium hover:underline">View all</Link>
          </div>
          {/* Header row */}
          <div className="grid grid-cols-[1fr_auto_auto] gap-2 mb-2 pb-1 border-b border-gray-100">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Product</p>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide text-right">Recs</p>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide text-right">Orders</p>
          </div>
          <div className="space-y-3">
            {TOP_PRODUCTS.map((p) => (
              <div key={p.name} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-sm shrink-0 ${p.dot}`} />
                  <p className="text-xs text-gray-700 leading-tight truncate">{p.name}</p>
                </div>
                <p className="text-xs font-bold text-gray-800 text-right">{p.recs.toLocaleString()}</p>
                <p className="text-xs font-bold text-gray-800 text-right">{p.orders}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom Row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Health & Disease Alerts */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-[0_0_10px_#EDEDED] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 text-sm">Health &amp; Disease Alerts</h2>
            <Link to="#" className="text-green-600 text-xs font-medium hover:underline">View all</Link>
          </div>
          <div className="flex gap-4">
            {/* Left: alerts + legend */}
            <div className="flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                {HEALTH_ALERTS.map((alert) => (
                  <div key={alert.label} className="flex items-center gap-3">
                    <div className={`${alert.bg} w-8 h-8 rounded-full flex items-center justify-center shrink-0`}>
                      <FontAwesomeIcon icon={alert.icon} className={`${alert.iconColor} text-xs`} />
                    </div>
                    <p className="text-gray-700 text-xs flex-1 leading-snug">{alert.label}</p>
                    <span className="text-gray-800 font-bold text-sm">{alert.count}</span>
                  </div>
                ))}
              </div>
              {/* Legend */}
              <div className="mt-5 space-y-1.5">
                {MAP_LEGEND.map((leg) => (
                  <div key={leg.label} className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-sm ${leg.color}`} />
                    <span className="text-xs text-gray-500">{leg.label}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Right: Nigeria map */}
            <div className="w-36 shrink-0 flex flex-col">
              <div className="flex-1">
                <NigeriaMap />
              </div>
              <p className="text-[9px] text-gray-400 text-center mt-1">Reports by State</p>
            </div>
          </div>
        </div>

        {/* User Satisfaction */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-[0_0_10px_#EDEDED] p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-gray-800 text-sm">User Satisfaction</h2>
            <Link to="#" className="text-green-600 text-xs font-medium hover:underline">View all</Link>
          </div>
          <div className="flex justify-center -my-2">
            <Chart options={RADIAL_OPTIONS} series={RADIAL_SERIES} type="radialBar" height={190} width={190} />
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                <FontAwesomeIcon icon={faThumbsUp} className="text-green-600 text-xs" />
              </div>
              <div>
                <p className="text-gray-800 font-bold text-sm">4,782</p>
                <p className="text-gray-400 text-xs">Positive (89%)</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-red-100 w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                <FontAwesomeIcon icon={faThumbsDown} className="text-red-500 text-xs" />
              </div>
              <div>
                <p className="text-gray-800 font-bold text-sm">589</p>
                <p className="text-gray-400 text-xs">Negative (11%)</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center shrink-0">
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
        <div className="lg:col-span-2 bg-white rounded-xl shadow-[0_0_10px_#EDEDED] p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-800 text-sm">Interaction by Bird Type</h2>
            <Link to="#" className="text-green-600 text-xs font-medium hover:underline">View all</Link>
          </div>
          <div className="space-y-5">
            {BIRD_TYPES.map((bird) => (
              <div key={bird.label}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">{bird.emoji}</span>
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

      {/* ── Footer ──────────────────────────────────────────────── */}
      <div className="flex items-start gap-2 pt-1">
        <FontAwesomeIcon icon={faCircleInfo} className="text-gray-400 text-xs shrink-0 mt-0.5" />
        <p className="text-gray-400 text-xs">
          AI metrics are updated hourly. All revenue and order attribution is based on user
          interaction with Ayo before purchase.
        </p>
      </div>
    </div>
  );
};

export default AyoAIAnalytics;
