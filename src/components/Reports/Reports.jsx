import {
  faArrowRight,
  faBox,
  faBriefcase,
  faCalendarDays,
  faChartColumn,
  faCheck,
  faClock,
  faDownload,
  faEllipsis,
  faFileExcel,
  faFilePdf,
  faFilter,
  faPlus,
  faRobot,
  faStar,
  faTags,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { assets } from "../../assets/assets";
import { apiClient } from "../../lib/apiClient";

const reportCategories = [
  {
    title: "Sales Reports",
    description: "Revenue, orders, products and sales trends",
    icon: faChartColumn,
    tone: "green",
    to: "/sales-reports",
  },
  {
    title: "Customer Reports",
    description: "Acquisition, retention and customer activity",
    icon: faUsers,
    tone: "purple",
    to: "/customer-reports",
  },
  {
    title: "Inventory Reports",
    description: "Stock levels, movements and low-stock products",
    icon: faBox,
    tone: "orange",
    to: "/inventory-reports",
  },
  {
    title: "Career Reports",
    description: "Applications and hiring performance",
    icon: faBriefcase,
    tone: "blue",
    to: "/career-reports",
  },
  {
    title: "Ayo AI Analytics",
    description: "Conversations, usage, topics and engagement",
    icon: faRobot,
    tone: "pink",
    to: "/ayo-ai",
  },
];

const popularReports = [
  ["Sales by Product", "Total sales, quantity and revenue by product", faChartColumn, "green"],
  ["Sales by Supplier", "Performance by supplier", faBriefcase, "blue"],
  ["Revenue by Category", "Sales breakdown by product category", faTags, "pink"],
  ["Customer Acquisition", "New vs returning customers", faUsers, "purple"],
  ["Inventory Movement", "Stock in, stock out and current levels", faArrowRight, "mint"],
];

const toneClasses = {
  green: "bg-[#e8f8ee] text-[#008f45]",
  mint: "bg-[#edfdf3] text-[#0f8f5a]",
  purple: "bg-[#f1e9ff] text-[#7f3fd9]",
  orange: "bg-[#fff2df] text-[#f79009]",
  blue: "bg-[#eaf5ff] text-[#1f7ae0]",
  pink: "bg-[#ffe8ef] text-[#e11d48]",
};

const Panel = ({ children, className = "" }) => (
  <section className={`min-w-0 rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.04)] ${className}`}>
    {children}
  </section>
);

const SectionHeader = ({ icon, iconClass = "text-[#008f45]", title, subtitle, action, actionTo }) => (
  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div className="flex min-w-0 items-start gap-3">
      {icon && (
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-[#d0f0dc] bg-[#f0fdf4]">
          <FontAwesomeIcon icon={icon} className={iconClass} />
        </div>
      )}
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-[#101828]">{title}</h2>
        <p className="mt-1 text-xs font-medium text-[#667085]">{subtitle}</p>
      </div>
    </div>
    {action && actionTo && (
      <Link to={actionTo} className="inline-flex items-center gap-2 text-xs font-semibold text-[#008f45]">
        {action}
        <FontAwesomeIcon icon={faArrowRight} />
      </Link>
    )}
    {action && !actionTo && (
      <button type="button" className="inline-flex items-center gap-2 text-xs font-semibold text-[#008f45]">
        {action}
        <FontAwesomeIcon icon={faArrowRight} />
      </button>
    )}
  </div>
);

const SelectField = ({ label, children, value, onChange }) => (
  <label className="block">
    <span className="mb-2 block text-xs font-semibold text-[#101828]">{label}</span>
    <select value={value} onChange={onChange} className="h-10 w-full rounded-md border border-[#d0d5dd] bg-white px-3 text-xs font-medium text-[#101828] outline-none focus:border-[#008f45]">
      {children}
    </select>
  </label>
);

const FormatBadge = ({ format, tone }) => (
  <span className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-bold ${toneClasses[tone]}`}>
    <FontAwesomeIcon icon={format === "PDF" ? faFilePdf : faFileExcel} />
    {format}
  </span>
);

const reportTypeValue = {
  "Sales Report": "sales",
  "Customer Report": "customer",
  "Inventory Report": "inventory",
  "Career Report": "career",
};

const formatValue = { "Excel (.xlsx)": "xlsx", CSV: "csv", PDF: "pdf" };
const reportTone = { sales: "green", customer: "purple", inventory: "orange", career: "blue" };
const reportIcon = { sales: faChartColumn, customer: faUsers, inventory: faBox, career: faBriefcase };

const getDatePeriod = (range) => {
  const end = new Date();
  const start = new Date(end);
  if (range === "Today") start.setHours(0, 0, 0, 0);
  if (range === "Last 7 days") start.setDate(start.getDate() - 6);
  if (range === "Last 30 days") start.setDate(start.getDate() - 29);
  if (range === "This month") start.setDate(1);
  if (range === "Last month") {
    start.setMonth(start.getMonth() - 1, 1);
    end.setDate(0);
  }
  if (range === "All time") start.setFullYear(2000, 0, 1);
  return { startDate: start.toISOString(), endDate: end.toISOString() };
};

const formatPeriod = (start, end) => {
  const options = { day: "numeric", month: "short", year: "numeric" };
  return `${new Date(start).toLocaleDateString("en-GB", options)} – ${new Date(end).toLocaleDateString("en-GB", options)}`;
};

const scheduleDescription = (schedule) => {
  const time = String(schedule.time || "08:00").slice(0, 5);
  if (schedule.frequency === "daily") return `Daily, ${time}`;
  if (schedule.frequency === "weekly") {
    const day = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][schedule.dayOfWeek];
    return `Every ${day}, ${time}`;
  }
  return `Day ${schedule.dayOfMonth} of every month, ${time}`;
};

const Reports = () => {
  const navigate = useNavigate();
  const [reportType, setReportType] = useState("Sales Report");
  const [dateRange, setDateRange] = useState("Last 30 days");
  const [format, setFormat] = useState("Excel (.xlsx)");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [segment, setSegment] = useState("All data");
  const [recentReports, setRecentReports] = useState([]);
  const [scheduledReports, setScheduledReports] = useState([]);
  const [generating, setGenerating] = useState(false);

  const loadOverview = useCallback(async () => {
    try {
      const { data } = await apiClient.get("/reports/overview");
      setRecentReports(data.recentReports ?? []);
      setScheduledReports(data.schedules ?? []);
    } catch (error) {
      toast.error(error.message || "Unable to load reports");
    }
  }, []);

  useEffect(() => { loadOverview(); }, [loadOverview]);

  const openReportBuilder = (overrides = {}) => {
    navigate("/reports/create", {
      state: { reportType, dateRange, format, segment, ...overrides },
    });
  };

  const generateReport = async () => {
    try {
      setGenerating(true);
      const type = reportTypeValue[reportType];
      const { data } = await apiClient.post("/reports/generate", {
        type,
        name: `${reportType.replace(/ Report$/, "")} Performance Report`,
        format: formatValue[format],
        ...getDatePeriod(dateRange),
        filters: segment === "All data" ? {} : { segment },
      });
      await loadOverview();
      navigate("/reports/preview", { state: { report: data } });
    } catch (error) {
      toast.error(error.message || "Unable to generate report");
    } finally {
      setGenerating(false);
    }
  };

  const downloadRecentReport = async (report) => {
    try {
      const response = await apiClient.get(`/reports/${report.id}/download`, { responseType: "blob" });
      const url = URL.createObjectURL(response.data);
      const disposition = response.headers["content-disposition"] || "";
      const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] || `${report.name}.${report.format}`;
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error.message || "Unable to download report");
    }
  };

  const toggleSchedule = async (schedule) => {
    try {
      const { data } = await apiClient.patch(`/reports/schedules/${schedule.id}`, { active: !schedule.active });
      setScheduledReports((current) => current.map((item) => item.id === data.id ? data : item));
      toast.success(`${schedule.name} ${data.active ? "enabled" : "paused"}`);
    } catch (error) {
      toast.error(error.message || "Unable to update schedule");
    }
  };

  const viewReport = async (report) => {
    try {
      const { data } = await apiClient.get(`/reports/${report.id}`);
      navigate("/reports/preview", { state: { report: data } });
    } catch (error) {
      toast.error(error.message || "Unable to open report");
    }
  };

  return (
    <div className="w-full min-w-0 space-y-4 overflow-hidden text-[#101828]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-normal">Reports</h1>
          <p className="mt-1 text-sm font-medium text-[#667085]">Create, export and schedule detailed business reports.</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link to="/reports/create" className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#008f45] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#007a3b]">
            <FontAwesomeIcon icon={faPlus} />
            Create Report
          </Link>
          <Link to="/reports/scheduled" className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-5 text-sm font-semibold text-[#101828] shadow-sm">
            <FontAwesomeIcon icon={faCalendarDays} />
            Scheduled Reports
          </Link>
        </div>
      </div>

      <section className="relative overflow-hidden rounded-lg border border-[#cfeedd] bg-[#f0fbf5] px-4 py-5 shadow-[0_8px_24px_rgba(16,24,40,0.04)] sm:px-6 sm:py-6">
        <div className="relative z-10 grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_300px_300px] 2xl:grid-cols-[minmax(0,1fr)_360px_330px] xl:items-center">
          <div className="min-w-0">
            <h2 className="max-w-md text-2xl font-bold leading-tight tracking-normal text-[#0f172a] sm:text-3xl">
              Turn your data into better decisions
            </h2>
            <p className="mt-3 max-w-lg text-sm font-medium leading-6 text-[#475467]">
              Generate detailed reports, track performance and get the insights you need to grow Agrofount.
            </p>
          </div>

          <div className="hidden items-center justify-center xl:flex">
            <div className="relative h-36 w-52 2xl:h-40 2xl:w-56">
              <div className="absolute left-0 top-8 h-24 w-32 rounded-lg bg-[#d8f5e5]" />
              <div className="absolute right-0 top-0 rounded-lg bg-white p-5 shadow-xl">
                <div className="mb-4 h-1.5 w-8 rounded-full bg-[#d8f5e5]" />
                <div className="flex items-end gap-2">
                  {[18, 34, 50, 70].map((height) => (
                    <span key={height} className="w-4 rounded-t bg-[#15b76c]" style={{ height }} />
                  ))}
                </div>
                <div className="mt-5 h-1.5 w-28 rounded-full bg-[#bfead1]" />
                <div className="mt-3 h-1.5 w-20 rounded-full bg-[#d8f5e5]" />
              </div>
            </div>
          </div>

          <div className="grid min-w-0 gap-3 text-sm font-medium text-[#344054] sm:grid-cols-2 xl:grid-cols-1">
            {["Custom date ranges", "Filter and segment data", "Export in CSV, Excel or PDF", "Schedule automatic reports"].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[#008f45] text-white">
                  <FontAwesomeIcon icon={faCheck} className="text-xs" />
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>
        <img src={assets.profile_picture} alt="" className="absolute bottom-0 right-7 hidden h-32 w-32 rounded-full object-cover opacity-20 xl:block" />
      </section>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,0.72fr)_minmax(0,1fr)]">
        <Panel>
          <SectionHeader icon={faFileExcel} title="Quick Report Builder" subtitle="Select a report type, choose your filters and generate your report." />
          <div className="grid gap-3 lg:grid-cols-3">
            <SelectField label="Report Type" value={reportType} onChange={(event) => setReportType(event.target.value)}>
              <option value="Sales Report">Sales Report</option>
              <option value="Customer Report">Customer Report</option>
              <option value="Inventory Report">Inventory Report</option>
              <option value="Career Report">Career Report</option>
            </SelectField>
            <label className="block min-w-0">
              <span className="mb-2 block text-xs font-semibold text-[#101828]">Date Range</span>
              <span className="flex h-10 w-full min-w-0 items-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-3 text-left text-xs font-medium text-[#101828] focus-within:border-[#008f45]">
                <FontAwesomeIcon icon={faCalendarDays} />
                <select value={dateRange} onChange={(event) => setDateRange(event.target.value)} className="min-w-0 flex-1 bg-transparent outline-none">
                  <option>Today</option>
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>This month</option>
                  <option>Last month</option>
                  <option>All time</option>
                </select>
              </span>
            </label>
            <SelectField label="Format" value={format} onChange={(event) => setFormat(event.target.value)}>
              <option value="Excel (.xlsx)">Excel (.xlsx)</option>
              <option value="CSV">CSV</option>
              <option value="PDF">PDF</option>
            </SelectField>
          </div>
          {advancedOpen && (
            <div className="mt-4 rounded-md border border-[#e5e7eb] bg-[#f8fafc] p-3">
              <SelectField label="Data segment" value={segment} onChange={(event) => setSegment(event.target.value)}>
                <option>All data</option>
                <option>Completed orders</option>
                <option>Pending orders</option>
                <option>New customers</option>
                <option>Returning customers</option>
              </SelectField>
            </div>
          )}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" onClick={() => setAdvancedOpen((open) => !open)} aria-expanded={advancedOpen} className="inline-flex h-10 items-center gap-2 text-sm font-semibold text-[#008f45]">
              <FontAwesomeIcon icon={faFilter} />
              {advancedOpen ? "Hide Advanced Filters" : "Advanced Filters"}
            </button>
            <button type="button" onClick={generateReport} disabled={generating} className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#008f45] px-8 text-sm font-semibold text-white shadow-sm hover:bg-[#007a3b] disabled:opacity-60">
              <FontAwesomeIcon icon={faChartColumn} />
              {generating ? "Generating…" : "Generate Report"}
            </button>
          </div>
        </Panel>

        <Panel>
          <SectionHeader title="Explore Reports" subtitle="Browse report categories to view detailed insights." />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {reportCategories.map((category) => (
              <Link key={category.title} to={category.to} className={`flex min-h-40 min-w-0 flex-col rounded-lg border border-[#e5e7eb] p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${category.tone === "orange" ? "bg-[#fffaf3]" : category.tone === "blue" ? "bg-[#f5faff]" : category.tone === "pink" ? "bg-[#fff5f8]" : category.tone === "purple" ? "bg-[#fbf8ff]" : "bg-[#f4fcf7]"}`}>
                <span className={`grid h-12 w-12 place-items-center rounded-full text-lg ${toneClasses[category.tone]}`}>
                  <FontAwesomeIcon icon={category.icon} />
                </span>
                <span className="mt-4 text-sm font-bold leading-5">{category.title}</span>
                <span className="mt-1 text-xs font-medium leading-5 text-[#667085]">{category.description}</span>
                <span className={`mt-auto self-end text-sm ${toneClasses[category.tone].split(" ").at(-1)}`}>
                  <FontAwesomeIcon icon={faArrowRight} />
                </span>
              </Link>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[0.95fr_1.25fr_0.95fr]">
        <Panel>
          <SectionHeader icon={faStar} iconClass="text-[#f79009]" title="Popular Reports" subtitle="Quick access to commonly used reports." action="View All" actionTo="/reports/create" />
          <div className="divide-y divide-[#eef2f6] rounded-md border border-[#e5e7eb]">
            {popularReports.map(([title, subtitle, icon, tone]) => (
              <button key={title} type="button" onClick={() => openReportBuilder({ reportName: title })} className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-[#f8fafc]">
                <span className={`grid h-10 w-10 place-items-center rounded-md ${toneClasses[tone]}`}>
                  <FontAwesomeIcon icon={icon} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{title}</span>
                  <span className="block truncate text-xs font-medium text-[#667085]">{subtitle}</span>
                </span>
                <FontAwesomeIcon icon={faArrowRight} className="text-[#344054]" />
              </button>
            ))}
          </div>
        </Panel>

        <Panel>
          <SectionHeader icon={faClock} iconClass="text-[#344054]" title="Recent Reports" subtitle="Your recently generated reports." action="View All" actionTo="/reports/preview" />
          <div className="max-w-full overflow-x-auto rounded-md border border-[#e5e7eb]">
            <table className="w-full min-w-[620px] text-left text-xs">
              <thead className="bg-[#f8fafc] text-[#101828]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Report Name</th>
                  <th className="px-4 py-3 font-semibold">Period</th>
                  <th className="px-4 py-3 font-semibold">Generated On</th>
                  <th className="px-4 py-3 font-semibold">Format</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef2f6]">
                {recentReports.length === 0 && (
                  <tr><td colSpan="5" className="px-4 py-8 text-center text-[#667085]">No reports have been generated yet.</td></tr>
                )}
                {recentReports.map((report) => (
                  <tr key={report.id}>
                    <td className="px-4 py-3 font-semibold">{report.name}</td>
                    <td className="px-4 py-3 text-[#344054]">{formatPeriod(report.periodStart, report.periodEnd)}</td>
                    <td className="px-4 py-3 text-[#344054]">{new Date(report.createdAt).toLocaleDateString("en-GB")}</td>
                    <td className="px-4 py-3"><FormatBadge format={report.format.toUpperCase()} tone={reportTone[report.type] ?? "green"} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-4">
                        <button type="button" onClick={() => downloadRecentReport(report)} className="text-[#101828]" aria-label={`Download ${report.name}`}>
                          <FontAwesomeIcon icon={faDownload} />
                        </button>
                        <button type="button" onClick={() => viewReport(report)} className="text-[#101828]" aria-label={`View ${report.name}`}>
                          <FontAwesomeIcon icon={faEllipsis} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel>
          <SectionHeader icon={faCalendarDays} iconClass="text-[#344054]" title="Scheduled Reports" subtitle="Reports automatically generated and emailed." action="Manage" actionTo="/reports/scheduled" />
          <div className="divide-y divide-[#eef2f6]">
            {scheduledReports.length === 0 && <p className="py-8 text-center text-xs text-[#667085]">No scheduled reports yet.</p>}
            {scheduledReports.map((schedule) => (
              <div key={schedule.id} className="flex items-center gap-3 py-3">
                <span className={`grid h-10 w-10 place-items-center rounded-md ${toneClasses[reportTone[schedule.type] ?? "green"]}`}>
                  <FontAwesomeIcon icon={reportIcon[schedule.type] ?? faCalendarDays} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{schedule.name}</p>
                  <p className="truncate text-xs font-medium text-[#667085]">{scheduleDescription(schedule)}</p>
                </div>
                <button type="button" onClick={() => toggleSchedule(schedule)} className={`relative h-6 w-11 rounded-full transition ${schedule.active ? "bg-[#008f45]" : "bg-[#d0d5dd]"}`} aria-label={`${schedule.active ? "Disable" : "Enable"} ${schedule.name}`} aria-pressed={schedule.active}>
                  <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${schedule.active ? "left-6" : "left-1"}`} />
                </button>
                <button type="button" onClick={() => navigate("/reports/scheduled")} className="text-[#344054]" aria-label={`Manage ${schedule.name}`}>
                  <FontAwesomeIcon icon={faEllipsis} />
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => navigate("/reports/scheduled")} className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[#d0d5dd] bg-white text-sm font-semibold text-[#101828]">
            <FontAwesomeIcon icon={faPlus} />
            Add Schedule
          </button>
        </Panel>
      </div>
    </div>
  );
};

export default Reports;
