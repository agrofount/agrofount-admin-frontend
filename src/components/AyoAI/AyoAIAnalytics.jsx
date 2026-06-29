import { useEffect, useMemo, useState } from "react";
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
  faRobot,
  faMicrochip,
  faDollarSign,
  faServer,
  faCoins,
  faRotateRight,
  faMagnifyingGlass,
  faUser,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { apiClient } from "../../lib/apiClient";

/* ─── Formatters ─────────────────────────────────────────────── */
const formatNumber = (value) => {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-NG").format(Number(value) || 0);
};

const formatCurrency = (value) => {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    notation: Number(value) >= 1000000 ? "compact" : "standard",
    maximumFractionDigits: Number(value) >= 1000000 ? 1 : 2,
  }).format(Number(value) || 0);
};

const formatUSD = (value, precision = 2) => {
  if (value === null || value === undefined) return "—";
  const n = Number(value);
  if (n < 0.01 && n > 0) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(precision)}`;
};

const formatTokens = (value) => {
  if (value === null || value === undefined) return "—";
  const n = Number(value);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return `${n}`;
};

const formatChange = (value) => {
  if (value === null || value === undefined) return "No prior data";
  return `${Number(value).toFixed(1)}% vs last period`;
};

const formatDateLabel = (date, granularity = "day") => {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: granularity === "week" ? undefined : "2-digit",
  }).format(new Date(date));
};

const formatDateRange = (from, to) => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
  return `${formatter.format(new Date(from))} - ${formatter.format(new Date(to))}`;
};

const getDefaultRange = () => {
  const to = new Date();
  const from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
};

/* ─── Empty states ───────────────────────────────────────────── */
const emptySummary = {
  totalChats: { value: 0, change: null },
  activeFarmers: { value: 0, change: null },
  revenueInfluenced: { value: 0, change: null },
  ordersFromAyo: { value: 0, change: null },
  satisfactionRate: { value: null, change: null },
  vetEscalations: { value: 0, change: null },
};

const emptyResources = {
  totalTokens: null,
  inputTokens: null,
  outputTokens: null,
  totalCostUSD: null,
  avgCostPerChatUSD: null,
  monthlyBudgetUSD: null,
  budgetUsedPercent: null,
  provider: null,
  model: null,
  dailyUsage: [],
  change: { totalCostUSD: null, totalTokens: null },
};

const colors = ["#16a34a", "#3b82f6", "#8b5cf6", "#f59e0b", "#9ca3af"];
const dotClasses = ["bg-green-600", "bg-blue-500", "bg-violet-500", "bg-amber-400", "bg-gray-400"];
const birdColors = ["bg-green-600", "bg-blue-500", "bg-violet-500", "bg-amber-400", "bg-gray-500"];

/* ─── Chart configs ──────────────────────────────────────────── */
const getChatOptions = (categories) => ({
  chart: { id: "ayo-chats", toolbar: { show: false } },
  xaxis: {
    categories,
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
});

const getDonutOptions = (labels) => ({
  chart: { type: "donut", toolbar: { show: false } },
  labels,
  colors,
  legend: { show: false },
  dataLabels: { enabled: false },
  plotOptions: { pie: { donut: { size: "70%" } } },
  tooltip: { y: { formatter: (v) => `${v}%` } },
  stroke: { width: 2 },
});

const getRadialOptions = () => ({
  chart: { type: "radialBar", toolbar: { show: false } },
  plotOptions: {
    radialBar: {
      hollow: { size: "62%", background: "transparent" },
      track: { background: "#f3f4f6", strokeWidth: "100%", margin: 0 },
      dataLabels: {
        name: { show: true, fontSize: "10px", fontWeight: "500", color: "#6b7280", offsetY: 18 },
        value: { show: true, fontSize: "28px", fontWeight: "700", color: "#111827", offsetY: -10, formatter: (v) => `${v}%` },
      },
    },
  },
  labels: ["Satisfaction Rate"],
  colors: ["#16a34a"],
});

const getTokensBarOptions = (categories) => ({
  chart: { type: "bar", toolbar: { show: false } },
  xaxis: {
    categories,
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: { style: { fontSize: "10px", colors: "#9ca3af" } },
  },
  yaxis: {
    labels: {
      style: { fontSize: "10px", colors: "#9ca3af" },
      formatter: (v) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K` : `${v}`),
    },
  },
  colors: ["#8b5cf6"],
  dataLabels: { enabled: false },
  grid: { borderColor: "#f3f4f6", strokeDashArray: 4 },
  plotOptions: { bar: { borderRadius: 4, columnWidth: "55%" } },
  tooltip: { y: { formatter: (v) => `${formatTokens(v)} tokens` } },
});

/* ─── Nigeria map ────────────────────────────────────────────── */
const NigeriaMap = () => {
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
      <g clipPath="url(#ng-outline)">
        <rect x="0"   y="0"   width="88"  height="52" fill="#e5e7eb" opacity="0.8" />
        <rect x="88"  y="0"   width="80"  height="52" fill="#f3f4f6" opacity="0.8" />
        <rect x="168" y="0"   width="100" height="52" fill="#e5e7eb" opacity="0.8" />
        <rect x="0"   y="52"  width="72"  height="52" fill="#f3f4f6" opacity="0.8" />
        <rect x="72"  y="52"  width="86"  height="52" fill="#e5e7eb" opacity="0.8" />
        <rect x="158" y="52"  width="110" height="52" fill="#f3f4f6" opacity="0.8" />
        <rect x="0"   y="104" width="64"  height="48" fill="#e5e7eb" opacity="0.8" />
        <rect x="64"  y="104" width="84"  height="48" fill="#f3f4f6" opacity="0.8" />
        <rect x="148" y="104" width="115" height="48" fill="#e5e7eb" opacity="0.8" />
        <rect x="18"  y="152" width="70"  height="40" fill="#f3f4f6" opacity="0.8" />
        <rect x="88"  y="152" width="80"  height="40" fill="#e5e7eb" opacity="0.8" />
        <rect x="168" y="152" width="90"  height="40" fill="#f3f4f6" opacity="0.8" />
        <rect x="40"  y="192" width="70"  height="30" fill="#e5e7eb" opacity="0.8" />
        <rect x="110" y="192" width="70"  height="30" fill="#f3f4f6" opacity="0.8" />
        <rect x="180" y="192" width="70"  height="30" fill="#e5e7eb" opacity="0.8" />
      </g>
      <g clipPath="url(#ng-outline)" stroke="white" strokeWidth="0.7" fill="none" opacity="0.45">
        <line x1="0" y1="52"  x2="260" y2="52"  />
        <line x1="0" y1="104" x2="260" y2="104" />
        <line x1="0" y1="152" x2="260" y2="152" />
        <line x1="0" y1="192" x2="260" y2="192" />
        <line x1="88"  y1="0" x2="88"  y2="215" />
        <line x1="158" y1="0" x2="158" y2="215" />
        <line x1="228" y1="0" x2="228" y2="215" />
      </g>
      <path d={outline} stroke="#9ca3af" strokeWidth="2" fill="none" opacity="0.35" />
    </svg>
  );
};

/* ─── Toggle switch ──────────────────────────────────────────── */
const ToggleSwitch = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={onChange}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${
      checked ? "bg-green-600" : "bg-gray-300"
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
        checked ? "translate-x-6" : "translate-x-1"
      }`}
    />
  </button>
);

/* ─── Page component ─────────────────────────────────────────── */
const AyoAIAnalytics = () => {
  const [chartInterval, setChartInterval] = useState("Daily");
  const [dateRange] = useState(getDefaultRange);
  const [loading, setLoading] = useState(true);
  const [ayoActive, setAyoActive] = useState(null);
  const [togglingAyo, setTogglingAyo] = useState(false);
  const [pendingDeactivate, setPendingDeactivate] = useState(false);
  const [resources, setResources] = useState(emptyResources);
  const [tokenUsage, setTokenUsage] = useState({ data: [], meta: {} });
  const [tokenUsageLoading, setTokenUsageLoading] = useState(true);
  const [tokenSearchInput, setTokenSearchInput] = useState("");
  const [tokenSearch, setTokenSearch] = useState("");
  const [tokenStatus, setTokenStatus] = useState("all");
  const [tokenPage, setTokenPage] = useState(1);
  const [resettingUserId, setResettingUserId] = useState(null);
  const [confirmResetUser, setConfirmResetUser] = useState(null);
  const [tokenRefreshKey, setTokenRefreshKey] = useState(0);
  const [analytics, setAnalytics] = useState({
    summary: emptySummary,
    chatsOverTime: [],
    funnel: {},
    topQuestions: [],
    topCategories: [],
    topProducts: [],
    healthAlerts: { alerts: [], vetEscalations: 0 },
    satisfaction: { positive: 0, negative: 0, satisfactionRate: null, avgResponseTimeMs: null },
    birdTypeBreakdown: [],
  });

  const queryParams = useMemo(
    () => ({ from: dateRange.from, to: dateRange.to }),
    [dateRange.from, dateRange.to]
  );

  /* Load AI settings (active status + provider) once */
  useEffect(() => {
    apiClient
      .get("/admin/ai-settings")
      .then((res) => {
        setAyoActive(res.data?.isActive ?? false);
        setResources((prev) => ({
          ...prev,
          provider: res.data?.provider ?? null,
          model: res.data?.model ?? null,
          monthlyBudgetUSD: res.data?.monthlyBudgetUSD ?? null,
        }));
      })
      .catch(() => {
        setAyoActive(false);
      });
  }, []);

  /* Load analytics + resource consumption when date range or interval changes */
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const granularity = chartInterval === "Weekly" ? "week" : "day";
        const [
          summary,
          chatsOverTime,
          funnel,
          topQuestions,
          topCategories,
          topProducts,
          healthAlerts,
          satisfaction,
          birdTypeBreakdown,
          resourceConsumption,
        ] = await Promise.allSettled([
          apiClient.get("/admin/ai-analytics/summary", { params: queryParams }),
          apiClient.get("/admin/ai-analytics/chats-over-time", { params: { ...queryParams, granularity } }),
          apiClient.get("/admin/ai-analytics/funnel", { params: queryParams }),
          apiClient.get("/admin/ai-analytics/top-questions", { params: { ...queryParams, limit: 5 } }),
          apiClient.get("/admin/ai-analytics/top-categories", { params: queryParams }),
          apiClient.get("/admin/ai-analytics/top-products", { params: { ...queryParams, limit: 5 } }),
          apiClient.get("/admin/ai-analytics/health-alerts", { params: queryParams }),
          apiClient.get("/admin/ai-analytics/satisfaction"),
          apiClient.get("/admin/ai-analytics/bird-type-breakdown", { params: queryParams }),
          apiClient.get("/admin/ai-analytics/resource-consumption", { params: queryParams }),
        ]);

        if (!isMounted) return;

        const get = (result, fallback) =>
          result.status === "fulfilled" ? result.value.data ?? fallback : fallback;

        setAnalytics({
          summary: get(summary, emptySummary),
          chatsOverTime: get(chatsOverTime, []),
          funnel: get(funnel, {}),
          topQuestions: get(topQuestions, []),
          topCategories: get(topCategories, []),
          topProducts: get(topProducts, []),
          healthAlerts: get(healthAlerts, { alerts: [], vetEscalations: 0 }),
          satisfaction: get(satisfaction, { positive: 0, negative: 0, satisfactionRate: null, avgResponseTimeMs: null }),
          birdTypeBreakdown: get(birdTypeBreakdown, []),
        });

        const rc = get(resourceConsumption, emptyResources);
        setResources((prev) => ({ ...prev, ...rc }));
      } catch (error) {
        if (!isMounted) return;
        toast.error(error.message || "Unable to load Ayo AI analytics.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [chartInterval, queryParams]);

  /* Debounce token search input */
  useEffect(() => {
    const timer = setTimeout(() => {
      setTokenSearch(tokenSearchInput);
      setTokenPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [tokenSearchInput]);

  /* Load per-user token usage */
  useEffect(() => {
    let isMounted = true;
    const loadTokenUsage = async () => {
      setTokenUsageLoading(true);
      try {
        const params = { page: tokenPage, limit: 20 };
        if (tokenSearch) params.search = tokenSearch;
        if (tokenStatus !== "all") params.status = tokenStatus;
        const res = await apiClient.get("/admin/ai-analytics/user-token-usage", { params });
        if (isMounted) setTokenUsage(res.data ?? { data: [], meta: {} });
      } catch {
        if (isMounted) setTokenUsage({ data: [], meta: {} });
      } finally {
        if (isMounted) setTokenUsageLoading(false);
      }
    };
    loadTokenUsage();
    return () => { isMounted = false; };
  }, [tokenPage, tokenSearch, tokenStatus, tokenRefreshKey]);

  /* Reset a user's token quota */
  const handleResetQuota = async (userId, name) => {
    setResettingUserId(userId);
    try {
      const res = await apiClient.post(`/admin/ai-analytics/user-token-usage/${userId}/reset`);
      toast.success(`Quota reset for ${name}. New limit: ${formatTokens(res.data?.newLimit)} tokens.`);
      setTokenRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err.message || "Failed to reset quota. Please try again.");
    } finally {
      setResettingUserId(null);
      setConfirmResetUser(null);
    }
  };

  /* Toggle Ayo AI active state */
  const handleToggleAyo = () => {
    if (togglingAyo || ayoActive === null) return;
    if (ayoActive) {
      setPendingDeactivate(true);
    } else {
      commitAyoToggle(true);
    }
  };

  const commitAyoToggle = async (next) => {
    setPendingDeactivate(false);
    setAyoActive(next);
    setTogglingAyo(true);
    try {
      await apiClient.patch("/admin/ai-settings", { isActive: next });
      toast.success(
        next
          ? "Ayo AI is now live and visible on the marketplace."
          : "Ayo AI has been hidden from the marketplace."
      );
    } catch (err) {
      setAyoActive(!next);
      toast.error(err.message || "Failed to update Ayo AI status.");
    } finally {
      setTogglingAyo(false);
    }
  };

  const summary = analytics.summary || emptySummary;
  const satisfaction = analytics.satisfaction || {};

  const statCards = [
    { icon: faComments, bg: "bg-green-100", color: "text-green-600", label: "Total AI Chats", value: formatNumber(summary.totalChats?.value), change: formatChange(summary.totalChats?.change) },
    { icon: faUsers, bg: "bg-green-100", color: "text-green-600", label: "Active Farmers", value: formatNumber(summary.activeFarmers?.value), change: formatChange(summary.activeFarmers?.change) },
    { icon: faSackDollar, bg: "bg-green-100", color: "text-green-600", label: "AI Revenue Influenced", value: formatCurrency(summary.revenueInfluenced?.value), change: formatChange(summary.revenueInfluenced?.change) },
    { icon: faCartShopping, bg: "bg-blue-100", color: "text-blue-500", label: "Orders from Ayo", value: formatNumber(summary.ordersFromAyo?.value), change: formatChange(summary.ordersFromAyo?.change) },
    { icon: faThumbsUp, bg: "bg-indigo-100", color: "text-indigo-500", label: "Satisfaction Rate", value: summary.satisfactionRate?.value == null ? "—" : `${summary.satisfactionRate.value}%`, change: formatChange(summary.satisfactionRate?.change) },
    { icon: faTriangleExclamation, bg: "bg-red-100", color: "text-red-500", label: "Vet Escalations", value: formatNumber(summary.vetEscalations?.value), change: formatChange(summary.vetEscalations?.change) },
  ];

  const funnelSteps = [
    { icon: faComments, label: "Chats", value: formatNumber(analytics.funnel?.chats), pct: null, iconBg: "bg-green-700", cardBg: "bg-green-50", border: "border-green-100" },
    { icon: faWandMagicSparkles, label: "Recommendations", value: formatNumber(analytics.funnel?.recommendations), pct: analytics.funnel?.recommendationsRate == null ? "—" : `${analytics.funnel.recommendationsRate}%`, iconBg: "bg-blue-500", cardBg: "bg-blue-50", border: "border-blue-100" },
    { icon: faArrowPointer, label: "Product Clicks", value: formatNumber(analytics.funnel?.productClicks), pct: analytics.funnel?.productClicksRate == null ? "—" : `${analytics.funnel.productClicksRate}%`, iconBg: "bg-purple-500", cardBg: "bg-purple-50", border: "border-purple-100" },
    { icon: faCartShopping, label: "Add to Cart", value: formatNumber(analytics.funnel?.addToCart), pct: analytics.funnel?.addToCartRate == null ? "—" : `${analytics.funnel.addToCartRate}%`, iconBg: "bg-amber-500", cardBg: "bg-amber-50", border: "border-amber-100" },
    { icon: faBagShopping, label: "Orders", value: formatNumber(analytics.funnel?.orders), pct: analytics.funnel?.ordersRate == null ? "—" : `${analytics.funnel.ordersRate}%`, iconBg: "bg-orange-500", cardBg: "bg-orange-50", border: "border-orange-100" },
  ];

  const chartGranularity = chartInterval === "Weekly" ? "week" : "day";
  const chatCategories = analytics.chatsOverTime.map((item) => formatDateLabel(item.date, chartGranularity));
  const chatSeries = [{ name: "AI Chats", data: analytics.chatsOverTime.map((item) => Number(item.count) || 0) }];
  const chatOptions = getChatOptions(chatCategories);

  const categoryLegend = analytics.topCategories.map((item, index) => ({
    label: item.category || "Uncategorized",
    pct: `${Number(item.percentage || 0)}%`,
    dot: dotClasses[index % dotClasses.length],
  }));
  const donutSeries = analytics.topCategories.map((item) => Number(item.percentage) || 0);
  const donutOptions = getDonutOptions(analytics.topCategories.map((item) => item.category || "Uncategorized"));

  const topProducts = analytics.topProducts.map((product, index) => ({
    name: product.name || "Unnamed product",
    recs: Number(product.recommendations) || 0,
    orders: Number(product.orders) || 0,
    dot: dotClasses[index % dotClasses.length],
  }));

  const alertIcons = [faTriangleExclamation, faBiohazard, faSkull, faStethoscope, faTriangleExclamation];
  const healthAlerts = [
    ...(analytics.healthAlerts?.alerts || []).map((alert, index) => ({
      label: alert.label,
      count: Number(alert.count) || 0,
      icon: alertIcons[index % alertIcons.length],
      iconColor: index === 1 ? "text-orange-500" : "text-red-500",
      bg: index === 1 ? "bg-orange-100" : "bg-red-100",
    })),
    {
      label: "Vet Escalations",
      count: Number(analytics.healthAlerts?.vetEscalations) || 0,
      icon: faStethoscope,
      iconColor: "text-red-600",
      bg: "bg-red-100",
    },
  ];

  const birdTypes = analytics.birdTypeBreakdown.map((bird, index) => ({
    label: bird.birdType || "Unknown",
    pct: Number(bird.percentage) || 0,
    color: birdColors[index % birdColors.length],
  }));

  /* Resource consumption data */
  const resourceMetrics = [
    {
      icon: faMicrochip,
      iconBg: "bg-violet-100",
      iconColor: "text-violet-600",
      label: "Total Tokens",
      value: formatTokens(resources.totalTokens),
      sub: resources.change?.totalTokens != null ? formatChange(resources.change.totalTokens) : null,
    },
    {
      icon: faArrowRight,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      label: "Input Tokens",
      value: formatTokens(resources.inputTokens),
      sub: "Prompt tokens sent",
    },
    {
      icon: faRobot,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      label: "Output Tokens",
      value: formatTokens(resources.outputTokens),
      sub: "Completion tokens received",
    },
    {
      icon: faDollarSign,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      label: "Total Cost (USD)",
      value: formatUSD(resources.totalCostUSD),
      sub: resources.change?.totalCostUSD != null ? formatChange(resources.change.totalCostUSD) : null,
    },
    {
      icon: faCoins,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-500",
      label: "Avg Cost / Chat",
      value: formatUSD(resources.avgCostPerChatUSD, 4),
      sub: "Per conversation",
    },
  ];

  const tokenBarCategories = (resources.dailyUsage || []).map((d) =>
    formatDateLabel(d.date, "day")
  );
  const tokenBarSeries = [
    { name: "Tokens", data: (resources.dailyUsage || []).map((d) => Number(d.tokens) || 0) },
  ];
  const tokenBarOptions = getTokensBarOptions(tokenBarCategories);
  const budgetPct = Math.min(100, Math.round(resources.budgetUsedPercent || 0));

  const handleExport = () => {
    const payload = {
      period: queryParams,
      summary,
      chatsOverTime: analytics.chatsOverTime,
      funnel: analytics.funnel,
      topQuestions: analytics.topQuestions,
      topCategories: analytics.topCategories,
      topProducts: analytics.topProducts,
      healthAlerts: analytics.healthAlerts,
      satisfaction: analytics.satisfaction,
      birdTypeBreakdown: analytics.birdTypeBreakdown,
      resourceConsumption: resources,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `ayo-ai-analytics-${dateRange.from}-to-${dateRange.to}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

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
            <span>{formatDateRange(dateRange.from, dateRange.to)}</span>
            <FontAwesomeIcon icon={faChevronDown} className="text-gray-400 text-xs" />
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-2 border border-green-600 text-green-700 bg-white text-sm px-4 py-2 rounded-lg hover:bg-green-50"
          >
            <FontAwesomeIcon icon={faDownload} className="text-sm" />
            <span className="font-medium">Export Report</span>
            <FontAwesomeIcon icon={faChevronDown} className="text-green-600 text-xs" />
          </button>
        </div>
      </div>

      {/* ── Ayo AI Status Control ───────────────────────────────── */}
      <div className={`rounded-xl shadow-[0_0_10px_#EDEDED] p-4 ${ayoActive === false ? "bg-gray-50 border border-gray-200" : "bg-white"}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${ayoActive ? "bg-green-100" : "bg-gray-200"}`}>
              <FontAwesomeIcon
                icon={faRobot}
                className={`text-xl ${ayoActive ? "text-green-600" : "text-gray-400"}`}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-800">Ayo AI Assistant</p>
                {ayoActive === null ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">Loading...</span>
                ) : ayoActive ? (
                  <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-600 font-semibold border border-green-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Live on marketplace
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-500 font-semibold border border-red-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    Hidden from marketplace
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {ayoActive
                  ? "Ayo is visible and responding to farmer queries on the marketplace."
                  : "Ayo AI is not visible on the marketplace. Farmers cannot see or access it."}
              </p>
            </div>
          </div>

          {pendingDeactivate ? (
            <div className="flex flex-wrap items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 shrink-0">
              <FontAwesomeIcon icon={faTriangleExclamation} className="text-red-500 text-sm shrink-0" />
              <p className="text-xs text-red-700 font-medium leading-snug max-w-[260px]">
                Ayo AI will be immediately hidden from all marketplace users.
              </p>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setPendingDeactivate(false)}
                  className="text-xs text-gray-600 font-medium px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => commitAyoToggle(false)}
                  className="text-xs text-white font-semibold px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600"
                >
                  Deactivate
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 shrink-0">
              {resources.provider && (
                <div className="hidden sm:flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                  <FontAwesomeIcon icon={faServer} className="text-gray-400 text-xs" />
                  <span className="text-xs font-medium text-gray-600">{resources.provider}</span>
                  {resources.model && <span className="text-xs text-gray-400">· {resources.model}</span>}
                </div>
              )}
              <span className="text-xs text-gray-500 font-medium">
                {togglingAyo ? "Updating..." : ayoActive ? "Turn off" : "Turn on"}
              </span>
              <ToggleSwitch
                checked={ayoActive ?? false}
                onChange={handleToggleAyo}
                disabled={togglingAyo || ayoActive === null}
              />
            </div>
          )}
        </div>

        {ayoActive === false && !pendingDeactivate && (
          <div className="mt-4 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <FontAwesomeIcon icon={faTriangleExclamation} className="text-amber-500 text-sm mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800 leading-relaxed">
              <span className="font-semibold">Ayo AI is currently hidden from the marketplace.</span> Farmers will not see the AI assistant widget or be able to start a conversation until you turn it back on.
            </p>
          </div>
        )}
      </div>

      {/* ── Stats Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {statCards.map((card, i) => (
          <div key={i} className="bg-white rounded-xl shadow-[0_0_10px_#EDEDED] p-4">
            <div className={`${card.bg} w-11 h-11 rounded-xl flex items-center justify-center mb-3`}>
              <FontAwesomeIcon icon={card.icon} className={`${card.color} text-lg`} />
            </div>
            <p className="text-gray-400 text-xs leading-tight">{card.label}</p>
            <p className="text-gray-900 text-xl font-bold mt-0.5 mb-1">{card.value}</p>
            <div className="flex items-center gap-1 text-green-600 text-[11px] font-medium">
              <FontAwesomeIcon icon={faArrowTrendUp} className="text-[9px]" />
              <span>{card.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts Row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 bg-white rounded-xl shadow-[0_0_10px_#EDEDED] p-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-gray-800 text-sm">AI Chats Over Time</h2>
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              {["Daily", "Weekly"].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setChartInterval(opt)}
                  className={`text-xs px-3 py-1.5 transition-colors ${chartInterval === opt ? "bg-gray-100 text-gray-800 font-semibold" : "text-gray-400 hover:bg-gray-50"}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <div className="h-[230px] animate-pulse rounded-lg bg-gray-100" />
          ) : chatSeries[0].data.length ? (
            <Chart options={chatOptions} series={chatSeries} type="area" height={230} />
          ) : (
            <div className="grid h-[230px] place-items-center rounded-lg border border-dashed border-gray-200 text-sm text-gray-400">
              No AI chat activity for this period.
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-[0_0_10px_#EDEDED] p-5">
          <h2 className="font-semibold text-gray-800 text-sm mb-4">Conversation Funnel (From Ayo)</h2>
          <div className="flex items-stretch gap-1.5 overflow-x-auto pb-1">
            {funnelSteps.map((step, i) => (
              <div key={i} className="flex items-center gap-1.5 shrink-0">
                <div className={`${step.cardBg} border ${step.border} rounded-xl px-2 py-3 flex flex-col items-center text-center w-[72px]`}>
                  <div className={`${step.iconBg} w-9 h-9 rounded-lg flex items-center justify-center mb-2`}>
                    <FontAwesomeIcon icon={step.icon} className="text-white text-sm" />
                  </div>
                  <p className="text-[9.5px] text-gray-500 leading-tight mb-1">{step.label}</p>
                  <p className="text-sm font-bold text-gray-800 leading-tight">{step.value}</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">{step.pct ?? "—"}</p>
                </div>
                {i < funnelSteps.length - 1 && (
                  <FontAwesomeIcon icon={faArrowRight} className="text-gray-300 text-xs shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Middle Row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl shadow-[0_0_10px_#EDEDED] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 text-sm">Top Questions Asked</h2>
            <Link to="#" className="text-green-600 text-xs font-medium hover:underline">View all</Link>
          </div>
          <div className="space-y-3.5">
            {analytics.topQuestions.length ? analytics.topQuestions.map((item, i) => (
              <div key={item.question || i} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-semibold">{item.rank || i + 1}</span>
                <p className="text-gray-700 text-sm flex-1 leading-snug">{item.question}</p>
                <span className="text-gray-800 text-sm font-bold shrink-0">{formatNumber(item.count)}</span>
              </div>
            )) : <p className="text-sm text-gray-400">No questions have been asked in this period.</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-[0_0_10px_#EDEDED] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 text-sm">Top Recommended Categories</h2>
            <Link to="#" className="text-green-600 text-xs font-medium hover:underline">View all</Link>
          </div>
          <div className="flex items-center gap-5">
            <div className="shrink-0">
              {donutSeries.length ? (
                <Chart options={donutOptions} series={donutSeries} type="donut" height={150} width={150} />
              ) : (
                <div className="grid h-[150px] w-[150px] place-items-center rounded-full border border-dashed border-gray-200 text-center text-xs text-gray-400">No data</div>
              )}
            </div>
            <div className="space-y-2.5 flex-1">
              {categoryLegend.length ? categoryLegend.map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${item.dot}`} />
                    <span className="text-gray-600 text-xs">{item.label}</span>
                  </div>
                  <span className="text-gray-800 text-xs font-bold">{item.pct}</span>
                </div>
              )) : <p className="text-sm text-gray-400">No categories yet.</p>}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-[0_0_10px_#EDEDED] p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800 text-sm">Top Products Recommended</h2>
            <Link to="#" className="text-green-600 text-xs font-medium hover:underline">View all</Link>
          </div>
          <div className="grid grid-cols-[1fr_auto_auto] gap-2 mb-2 pb-1 border-b border-gray-100">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Product</p>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide text-right">Recs</p>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide text-right">Orders</p>
          </div>
          <div className="space-y-3">
            {topProducts.length ? topProducts.map((p) => (
              <div key={p.name} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-sm shrink-0 ${p.dot}`} />
                  <p className="text-xs text-gray-700 leading-tight truncate">{p.name}</p>
                </div>
                <p className="text-xs font-bold text-gray-800 text-right">{p.recs.toLocaleString()}</p>
                <p className="text-xs font-bold text-gray-800 text-right">{p.orders}</p>
              </div>
            )) : <p className="text-sm text-gray-400">No product recommendations yet.</p>}
          </div>
        </div>
      </div>

      {/* ── Bottom Row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-[0_0_10px_#EDEDED] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 text-sm">Health &amp; Disease Alerts</h2>
            <Link to="#" className="text-green-600 text-xs font-medium hover:underline">View all</Link>
          </div>
          <div className="flex gap-4">
            <div className="flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                {healthAlerts.map((alert) => (
                  <div key={alert.label} className="flex items-center gap-3">
                    <div className={`${alert.bg} w-8 h-8 rounded-full flex items-center justify-center shrink-0`}>
                      <FontAwesomeIcon icon={alert.icon} className={`${alert.iconColor} text-xs`} />
                    </div>
                    <p className="text-gray-700 text-xs flex-1 leading-snug">{alert.label}</p>
                    <span className="text-gray-800 font-bold text-sm">{alert.count}</span>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-xs text-gray-400">State-level alert distribution is not exposed by the backend yet.</p>
            </div>
            <div className="w-36 shrink-0 flex flex-col">
              <div className="flex-1"><NigeriaMap /></div>
              <p className="text-[9px] text-gray-400 text-center mt-1">Reports by State</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 bg-white rounded-xl shadow-[0_0_10px_#EDEDED] p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-gray-800 text-sm">User Satisfaction</h2>
            <Link to="#" className="text-green-600 text-xs font-medium hover:underline">View all</Link>
          </div>
          <div className="flex justify-center -my-2">
            <Chart options={getRadialOptions()} series={[satisfaction.satisfactionRate ?? 0]} type="radialBar" height={190} width={190} />
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                <FontAwesomeIcon icon={faThumbsUp} className="text-green-600 text-xs" />
              </div>
              <div>
                <p className="text-gray-800 font-bold text-sm">{formatNumber(satisfaction.positive)}</p>
                <p className="text-gray-400 text-xs">Positive ({satisfaction.satisfactionRate == null ? "—" : `${satisfaction.satisfactionRate}%`})</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-red-100 w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                <FontAwesomeIcon icon={faThumbsDown} className="text-red-500 text-xs" />
              </div>
              <div>
                <p className="text-gray-800 font-bold text-sm">{formatNumber(satisfaction.negative)}</p>
                <p className="text-gray-400 text-xs">Negative ({satisfaction.satisfactionRate == null ? "—" : `${100 - Number(satisfaction.satisfactionRate)}%`})</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                <FontAwesomeIcon icon={faClock} className="text-gray-500 text-xs" />
              </div>
              <div>
                <p className="text-gray-800 font-bold text-sm">
                  {satisfaction.avgResponseTimeMs == null ? "—" : `${(Number(satisfaction.avgResponseTimeMs) / 1000).toFixed(1)}s`}
                </p>
                <p className="text-gray-400 text-xs">Avg Response Time</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-[0_0_10px_#EDEDED] p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-800 text-sm">Interaction by Bird Type</h2>
            <Link to="#" className="text-green-600 text-xs font-medium hover:underline">View all</Link>
          </div>
          <div className="space-y-5">
            {birdTypes.length ? birdTypes.map((bird) => (
              <div key={bird.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-700 font-medium">{bird.label}</span>
                  <span className="text-sm font-bold text-gray-800">{bird.pct}%</span>
                </div>
                <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${bird.color}`} style={{ width: `${bird.pct}%` }} />
                </div>
              </div>
            )) : <p className="text-sm text-gray-400">No bird type breakdown available for this period.</p>}
          </div>
        </div>
      </div>

      {/* ── Resource Consumption ─────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-[0_0_10px_#EDEDED] p-5">
        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="font-semibold text-gray-800 text-sm">AI Resource Consumption</h2>
            <p className="text-xs text-gray-400 mt-0.5">Token usage and API costs from your AI provider for the selected period.</p>
          </div>
          {(resources.provider || resources.model) && (
            <div className="flex items-center gap-2 bg-violet-50 border border-violet-100 rounded-lg px-3 py-2 shrink-0">
              <FontAwesomeIcon icon={faServer} className="text-violet-500 text-xs" />
              <div className="text-xs">
                <span className="font-semibold text-violet-700">{resources.provider || "AI Provider"}</span>
                {resources.model && <span className="text-violet-400 ml-1">· {resources.model}</span>}
              </div>
            </div>
          )}
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
          {resourceMetrics.map((metric) => (
            <div key={metric.label} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className={`${metric.iconBg} w-9 h-9 rounded-lg flex items-center justify-center mb-3`}>
                <FontAwesomeIcon icon={metric.icon} className={`${metric.iconColor} text-sm`} />
              </div>
              <p className="text-gray-400 text-[11px] leading-tight">{metric.label}</p>
              <p className="text-gray-900 text-lg font-bold mt-0.5">{metric.value}</p>
              {metric.sub && (
                <p className="text-gray-400 text-[10px] mt-0.5 leading-tight">{metric.sub}</p>
              )}
            </div>
          ))}
        </div>

        {/* Budget + Daily Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Monthly budget */}
          <div className="lg:col-span-2 bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-xs font-semibold text-gray-600 mb-3">Monthly Budget Usage</p>
            {resources.monthlyBudgetUSD != null ? (
              <>
                <div className="flex items-end justify-between mb-2">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{formatUSD(resources.totalCostUSD)}</p>
                    <p className="text-xs text-gray-400">of {formatUSD(resources.monthlyBudgetUSD)} monthly budget</p>
                  </div>
                  <span className={`text-sm font-bold ${budgetPct >= 90 ? "text-red-500" : budgetPct >= 70 ? "text-amber-500" : "text-green-600"}`}>
                    {budgetPct}%
                  </span>
                </div>
                <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${budgetPct >= 90 ? "bg-red-500" : budgetPct >= 70 ? "bg-amber-500" : "bg-green-500"}`}
                    style={{ width: `${budgetPct}%` }}
                  />
                </div>
                <p className={`text-[10px] mt-2 font-medium ${budgetPct >= 90 ? "text-red-500" : "text-gray-400"}`}>
                  {budgetPct >= 90
                    ? "Budget nearly exhausted — consider upgrading your plan."
                    : `${formatUSD((resources.monthlyBudgetUSD || 0) - (resources.totalCostUSD || 0))} remaining`}
                </p>

                {/* Token breakdown */}
                <div className="mt-4 pt-3 border-t border-gray-200 space-y-2">
                  {[
                    { label: "Input tokens", value: formatTokens(resources.inputTokens), dot: "bg-blue-400" },
                    { label: "Output tokens", value: formatTokens(resources.outputTokens), dot: "bg-violet-500" },
                    { label: "Requests", value: resources.totalRequests != null ? formatNumber(resources.totalRequests) : "—", dot: "bg-green-500" },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${row.dot}`} />
                        <span className="text-xs text-gray-500">{row.label}</span>
                      </div>
                      <span className="text-xs font-semibold text-gray-700">{row.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FontAwesomeIcon icon={faDollarSign} className="text-gray-300 text-2xl mb-2" />
                <p className="text-xs text-gray-400">Budget data unavailable</p>
              </div>
            )}
          </div>

          {/* Daily token usage chart */}
          <div className="lg:col-span-3">
            <p className="text-xs font-semibold text-gray-600 mb-3">Daily Token Usage</p>
            {loading ? (
              <div className="h-[200px] animate-pulse rounded-lg bg-gray-100" />
            ) : tokenBarSeries[0].data.length ? (
              <Chart options={tokenBarOptions} series={tokenBarSeries} type="bar" height={200} />
            ) : (
              <div className="grid h-[200px] place-items-center rounded-lg border border-dashed border-gray-200 text-sm text-gray-400">
                No token usage data for this period.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── User Token Usage ────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-[0_0_10px_#EDEDED] p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="font-semibold text-gray-800 text-sm">User Token Usage</h2>
            <p className="text-xs text-gray-400 mt-0.5">Per-user Ayo AI trial quota. Reset to extend access for individual farmers.</p>
          </div>
        </div>

        {/* Search + status filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <input
              type="text"
              placeholder="Search by name, email or phone..."
              value={tokenSearchInput}
              onChange={(e) => setTokenSearchInput(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
          <select
            value={tokenStatus}
            onChange={(e) => { setTokenStatus(e.target.value); setTokenPage(1); }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-500 bg-white"
          >
            <option value="all">All users</option>
            <option value="active">Active (quota remaining)</option>
            <option value="exhausted">Quota exhausted</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4">Farmer</th>
                <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4">Usage</th>
                <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4">Status</th>
                <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4">Last Active</th>
                <th className="text-right text-xs font-medium text-gray-400 pb-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {tokenUsageLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-3 pr-4"><div className="h-4 w-32 bg-gray-100 animate-pulse rounded" /></td>
                    <td className="py-3 pr-4"><div className="h-4 w-48 bg-gray-100 animate-pulse rounded" /></td>
                    <td className="py-3 pr-4"><div className="h-4 w-20 bg-gray-100 animate-pulse rounded" /></td>
                    <td className="py-3 pr-4"><div className="h-4 w-24 bg-gray-100 animate-pulse rounded" /></td>
                    <td className="py-3 text-right"><div className="h-4 w-20 bg-gray-100 animate-pulse rounded ml-auto" /></td>
                  </tr>
                ))
              ) : tokenUsage.data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-sm text-gray-400">No token usage records found.</td>
                </tr>
              ) : (
                tokenUsage.data.map((user) => (
                  <tr key={user.userId} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                          <FontAwesomeIcon icon={faUser} className="text-green-600 text-xs" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-sm leading-tight">{user.name}</p>
                          <p className="text-xs text-gray-400">{user.email || user.phone || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="min-w-[180px]">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600">{formatTokens(user.tokensUsed)} used</span>
                          <span className="text-gray-400">
                            {formatTokens(user.tokenLimit)} limit
                            {user.bonusTokens > 0 && (
                              <span className="ml-1 text-green-600">+{formatTokens(user.bonusTokens)} bonus</span>
                            )}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${user.usagePercent >= 100 ? "bg-red-500" : user.usagePercent >= 80 ? "bg-amber-400" : "bg-green-500"}`}
                            style={{ width: `${Math.min(100, user.usagePercent)}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">{user.usagePercent}% · {formatTokens(user.tokensRemaining)} remaining</p>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium ${user.trialExhausted ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.trialExhausted ? "bg-red-500" : "bg-green-500"}`} />
                        {user.trialExhausted ? "Exhausted" : "Active"}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-xs text-gray-400">
                      {user.lastActive
                        ? new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" }).format(new Date(user.lastActive))
                        : "—"}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => setConfirmResetUser({ userId: user.userId, name: user.name })}
                        disabled={!!resettingUserId}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <FontAwesomeIcon icon={faRotateRight} className={resettingUserId === user.userId ? "animate-spin" : ""} />
                        Reset Quota
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {(tokenUsage.meta?.totalPages ?? 0) > 1 && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              {tokenUsage.meta.totalItems} users · Page {tokenUsage.meta.currentPage} of {tokenUsage.meta.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setTokenPage((p) => Math.max(1, p - 1))}
                disabled={tokenPage <= 1}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setTokenPage((p) => Math.min(tokenUsage.meta.totalPages, p + 1))}
                disabled={tokenPage >= (tokenUsage.meta?.totalPages ?? 1)}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Reset quota confirmation modal ───────────────────────── */}
      {confirmResetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <FontAwesomeIcon icon={faRotateRight} className="text-green-600" />
              </div>
              <button onClick={() => setConfirmResetUser(null)} className="text-gray-400 hover:text-gray-600">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">Reset Token Quota</h3>
            <p className="text-sm text-gray-500 mb-5">
              This will add another full quota to{" "}
              <span className="font-medium text-gray-700">{confirmResetUser.name}</span>
              's account so they can continue chatting with Ayo. Are you sure?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmResetUser(null)}
                className="flex-1 py-2.5 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleResetQuota(confirmResetUser.userId, confirmResetUser.name)}
                disabled={!!resettingUserId}
                className="flex-1 py-2.5 text-sm font-medium bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {resettingUserId ? (
                  <><FontAwesomeIcon icon={faRotateRight} className="animate-spin" /> Resetting...</>
                ) : (
                  "Yes, Reset"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ──────────────────────────────────────────────── */}
      <div className="flex items-start gap-2 pt-1">
        <FontAwesomeIcon icon={faCircleInfo} className="text-gray-400 text-xs shrink-0 mt-0.5" />
        <p className="text-gray-400 text-xs">
          AI metrics are updated hourly. Revenue and order attribution is based on user interaction
          with Ayo before purchase. Token costs are approximate and may differ slightly from your
          provider invoice.
        </p>
      </div>
    </div>
  );
};

export default AyoAIAnalytics;
