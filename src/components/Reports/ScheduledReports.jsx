import {
  faBox,
  faBriefcase,
  faCalendarDays,
  faChartColumn,
  faCheck,
  faChevronLeft,
  faChevronRight,
  faEllipsis,
  faFileExcel,
  faFilePdf,
  faLightbulb,
  faPen,
  faPlus,
  faRobot,
  faSearch,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";

const tabs = ["All (6)", "Active (5)", "Paused (1)"];

const scheduleRows = [
  {
    id: 1,
    name: "Weekly Sales Report",
    description: "Sales performance summary",
    type: "Sales Report",
    typeIcon: faChartColumn,
    tone: "green",
    frequency: "Weekly",
    schedule: "Every Monday, 8:00 AM",
    nextRun: "Mon, Sep 7, 2026",
    nextRunTime: "8:00 AM",
    recipients: "3 recipients",
    format: "Excel (.xlsx)",
    formatType: "excel",
    active: true,
  },
  {
    id: 2,
    name: "Monthly Inventory Report",
    description: "Stock levels and movements",
    type: "Inventory Report",
    typeIcon: faBox,
    tone: "orange",
    frequency: "Monthly",
    schedule: "1st of every month, 8:00 AM",
    nextRun: "Sep 1, 2026",
    nextRunTime: "8:00 AM",
    recipients: "2 recipients",
    format: "PDF (.pdf)",
    formatType: "pdf",
    active: true,
  },
  {
    id: 3,
    name: "Customer Growth Report",
    description: "New and returning customers",
    type: "Customer Report",
    typeIcon: faUsers,
    tone: "purple",
    frequency: "Weekly",
    schedule: "Every Friday, 8:00 AM",
    nextRun: "Fri, Sep 11, 2026",
    nextRunTime: "8:00 AM",
    recipients: "4 recipients",
    format: "Excel (.xlsx)",
    formatType: "excel",
    active: true,
  },
  {
    id: 4,
    name: "Ayo AI Usage Report",
    description: "Chat usage and top topics",
    type: "Ayo AI Analytics",
    typeIcon: faRobot,
    tone: "pink",
    frequency: "Monthly",
    schedule: "1st of every month, 9:00 AM",
    nextRun: "Sep 1, 2026",
    nextRunTime: "9:00 AM",
    recipients: "2 recipients",
    format: "PDF (.pdf)",
    formatType: "pdf",
    active: true,
  },
  {
    id: 5,
    name: "Career Applications Report",
    description: "Applications and hiring pipeline",
    type: "Career Report",
    typeIcon: faBriefcase,
    tone: "blue",
    frequency: "Weekly",
    schedule: "Every Monday, 9:00 AM",
    nextRun: "Mon, Sep 7, 2026",
    nextRunTime: "9:00 AM",
    recipients: "2 recipients",
    format: "Excel (.xlsx)",
    formatType: "excel",
    active: true,
  },
  {
    id: 6,
    name: "Low Stock Alert Report",
    description: "Products below threshold",
    type: "Inventory Report",
    typeIcon: faBox,
    tone: "orange",
    frequency: "Daily",
    schedule: "Every day, 7:00 AM",
    nextRun: "Tomorrow, 7:00 AM",
    nextRunTime: "Aug 24, 2026",
    recipients: "1 recipient",
    format: "PDF (.pdf)",
    formatType: "pdf",
    active: false,
  },
];

const toneClasses = {
  green: "bg-[#e8f8ee] text-[#008f45]",
  orange: "bg-[#fff2df] text-[#f79009]",
  purple: "bg-[#f1e9ff] text-[#7f3fd9]",
  blue: "bg-[#eaf5ff] text-[#1f7ae0]",
  pink: "bg-[#ffe8ef] text-[#e11d48]",
};

const TypeBadge = ({ icon, tone, label }) => (
  <div className="flex min-w-[150px] items-center gap-3">
    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${toneClasses[tone]}`}>
      <FontAwesomeIcon icon={icon} />
    </span>
    <span className="font-medium text-[#344054]">{label}</span>
  </div>
);

const FormatBadge = ({ type, label }) => {
  const isPdf = type === "pdf";
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap font-medium text-[#344054]">
      <FontAwesomeIcon icon={isPdf ? faFilePdf : faFileExcel} className={isPdf ? "text-[#ef3340]" : "text-[#008f45]"} />
      {label}
    </span>
  );
};

const StatusToggle = ({ active }) => (
  <span className="inline-flex items-center gap-3">
    <span className={`relative h-6 w-11 rounded-full ${active ? "bg-[#008f45]" : "bg-[#d0d5dd]"}`}>
      <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm ${active ? "left-6" : "left-1"}`} />
    </span>
    <span className="font-medium text-[#344054]">{active ? "Active" : "Paused"}</span>
  </span>
);

const ScheduledReports = () => (
  <div className="w-full min-w-0 space-y-4 overflow-hidden text-[#101828]">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium text-[#667085]">
          <Link to="/reports" className="hover:text-[#008f45]">Reports</Link>
          <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
          <span>Scheduled Reports</span>
        </div>
        <h1 className="text-2xl font-bold tracking-normal">Scheduled Reports</h1>
        <p className="mt-1 text-sm font-medium text-[#667085]">
          Set up automated reports to be generated and sent to your email or team members.
        </p>
      </div>
      <button type="button" className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#008f45] px-6 text-sm font-semibold text-white shadow-sm hover:bg-[#007a3b] sm:self-start lg:self-auto">
        <FontAwesomeIcon icon={faPlus} />
        Create Schedule
      </button>
    </div>

    <section className="overflow-hidden rounded-lg border border-[#cfeedd] bg-[#f0fbf5] px-4 py-5 shadow-[0_8px_24px_rgba(16,24,40,0.04)] sm:px-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px_minmax(240px,300px)] lg:items-center">
        <div className="flex min-w-0 items-center gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-[#d8f5e5] text-2xl text-[#008f45]">
            <FontAwesomeIcon icon={faCalendarDays} />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-bold tracking-normal text-[#101828]">Save time with automated reports</h2>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-[#475467]">
              Schedule your reports to be generated and delivered automatically at your preferred time.
            </p>
          </div>
        </div>

        <div className="hidden justify-center lg:flex">
          <div className="relative h-24 w-40">
            <div className="absolute left-3 top-2 h-20 w-20 rounded-md bg-white shadow-lg">
              <div className="mx-auto mt-4 h-1.5 w-8 rounded bg-[#d8f5e5]" />
              <div className="mx-auto mt-3 flex h-8 w-12 items-end gap-1">
                {[22, 34, 48].map((height) => (
                  <span key={height} className="flex-1 rounded-t bg-[#15b76c]" style={{ height }} />
                ))}
              </div>
              <div className="mx-auto mt-3 h-1.5 w-12 rounded bg-[#d8f5e5]" />
            </div>
            <div className="absolute right-3 top-8 grid h-14 w-14 place-items-center rounded-full border-4 border-[#008f45] bg-white text-[#008f45] shadow-md">
              <FontAwesomeIcon icon={faCalendarDays} />
            </div>
          </div>
        </div>

        <div className="grid gap-3 text-sm font-medium text-[#344054] sm:grid-cols-2 lg:grid-cols-1">
          {["Daily, weekly or monthly", "Multiple recipients", "Choose report format", "Custom filters"].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-[#008f45] text-white">
                <FontAwesomeIcon icon={faCheck} className="text-xs" />
              </span>
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="min-w-0 rounded-lg border border-[#e5e7eb] bg-white p-3 shadow-[0_8px_24px_rgba(16,24,40,0.04)] sm:p-4">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab, index) => (
            <button key={tab} type="button" className={`h-10 rounded-md border px-5 text-sm font-semibold ${index === 0 ? "border-[#008f45] bg-white text-[#008f45]" : "border-[#d0d5dd] bg-white text-[#344054]"}`}>
              {tab}
            </button>
          ))}
        </div>
        <label className="relative block w-full lg:w-[340px]">
          <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#667085]" />
          <input className="h-10 w-full rounded-md border border-[#d0d5dd] bg-white pl-11 pr-4 text-sm font-medium outline-none placeholder:text-[#98a2b3] focus:border-[#008f45]" placeholder="Search scheduled reports..." />
        </label>
      </div>

      <div className="max-w-full overflow-x-auto rounded-md border border-[#e5e7eb]">
        <table className="w-full min-w-[1120px] text-left text-xs">
          <thead className="bg-[#f8fafc] text-[#101828]">
            <tr>
              {["#", "Report Name", "Report Type", "Frequency", "Next Run", "Recipients", "Format", "Status", "Actions"].map((heading) => (
                <th key={heading} className="border-r border-[#eef2f6] px-4 py-3 font-semibold last:border-r-0">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eef2f6]">
            {scheduleRows.map((row) => (
              <tr key={row.id} className="align-middle">
                <td className="border-r border-[#eef2f6] px-4 py-3 font-semibold">{row.id}</td>
                <td className="min-w-[220px] border-r border-[#eef2f6] px-4 py-3">
                  <p className="font-semibold text-[#101828]">{row.name}</p>
                  <p className="mt-1 font-medium text-[#667085]">{row.description}</p>
                </td>
                <td className="border-r border-[#eef2f6] px-4 py-3">
                  <TypeBadge icon={row.typeIcon} tone={row.tone} label={row.type} />
                </td>
                <td className="min-w-[170px] border-r border-[#eef2f6] px-4 py-3">
                  <p className="font-semibold text-[#101828]">{row.frequency}</p>
                  <p className="mt-1 font-medium text-[#667085]">{row.schedule}</p>
                </td>
                <td className="min-w-[160px] border-r border-[#eef2f6] px-4 py-3">
                  <p className="font-semibold text-[#101828]">{row.nextRun}</p>
                  <p className="mt-1 font-medium text-[#667085]">{row.nextRunTime}</p>
                </td>
                <td className="border-r border-[#eef2f6] px-4 py-3">
                  <span className="inline-flex items-center gap-2 whitespace-nowrap font-medium text-[#344054]">
                    <FontAwesomeIcon icon={faUsers} />
                    {row.recipients}
                  </span>
                </td>
                <td className="border-r border-[#eef2f6] px-4 py-3">
                  <FormatBadge type={row.formatType} label={row.format} />
                </td>
                <td className="border-r border-[#eef2f6] px-4 py-3">
                  <StatusToggle active={row.active} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-5 text-[#101828]">
                    <button type="button" aria-label={`Edit ${row.name}`}>
                      <FontAwesomeIcon icon={faPen} />
                    </button>
                    <button type="button" aria-label={`More actions for ${row.name}`}>
                      <FontAwesomeIcon icon={faEllipsis} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col gap-3 text-sm font-medium text-[#667085] sm:flex-row sm:items-center sm:justify-between">
        <span>Showing 1 - 6 of 6 scheduled reports</span>
        <div className="flex items-center gap-1">
          <button type="button" className="grid h-9 w-9 place-items-center rounded-md border border-[#d0d5dd] bg-white text-[#98a2b3]">
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <button type="button" className="grid h-9 w-9 place-items-center rounded-md bg-[#008f45] text-sm font-semibold text-white">1</button>
          <button type="button" className="grid h-9 w-9 place-items-center rounded-md border border-[#d0d5dd] bg-white text-[#98a2b3]">
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      </div>
    </section>

    <section className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#fff4e5] text-xl text-[#f79009]">
            <FontAwesomeIcon icon={faLightbulb} />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-[#101828]">Tips for scheduled reports</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs font-medium leading-5 text-[#475467]">
              <li>Add multiple recipients to keep your team informed.</li>
              <li>Use filters to get more relevant data.</li>
              <li>You can pause or edit a schedule at any time.</li>
            </ul>
          </div>
        </div>
        <button type="button" className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-6 text-sm font-semibold text-[#101828]">
          <FontAwesomeIcon icon={faCalendarDays} />
          Learn more about scheduled reports
        </button>
      </div>
    </section>
  </div>
);

export default ScheduledReports;
