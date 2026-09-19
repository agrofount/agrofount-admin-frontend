import {
  faArrowLeft,
  faCalendarDays,
  faCartShopping,
  faChartColumn,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faColumns,
  faDownload,
  faEllipsis,
  faFileLines,
  faFilter,
  faMoneyBillTrendUp,
  faSave,
  faSearch,
  faTags,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";

const statCards = [
  ["Total Revenue", "₦12,842,600", "18.4%", faMoneyBillTrendUp],
  ["Total Orders", "428", "12.1%", faCartShopping],
  ["Total Customers", "1,284", "8.7%", faUsers],
  ["Average Order Value", "₦29,907", "5.2%", faTags],
];

const categoryRows = [
  ["Day-Old Chicks", "48%", "₦6,254,300", "#008f45"],
  ["Feeds", "27%", "₦3,487,200", "#fbbf24"],
  ["Medications", "15%", "₦1,946,800", "#3b82f6"],
  ["Equipment", "10%", "₦1,154,300", "#ef4444"],
];

const productRows = [
  ["1", "CHI Broiler (Day-Old)", "Day-Old Chicks", "1,250", "1,250,000", "125", "1,000", "12.5%", "up"],
  ["2", "Agrited Broiler (Day-Old)", "Day-Old Chicks", "980", "960,400", "98", "980", "8.3%", "up"],
  ["3", "Poultry Feed (25kg)", "Feeds", "645", "1,451,250", "72", "2,250", "15.6%", "up"],
  ["4", "Poultry Multivitamin (100ml)", "Medications", "520", "520,000", "65", "1,000", "4.2%", "down"],
  ["5", "Automatic Drinker (50 Birds)", "Equipment", "310", "930,000", "31", "3,000", "22.1%", "up"],
];

const Chart = () => {
  const line = [36, 48, 58, 70, 76, 82, 94, 88, 116, 90, 86, 96, 74, 86, 90, 101, 74, 70, 72, 102, 100, 126, 151, 130, 124, 104, 94, 74, 78, 90, 88, 116];
  const bars = [24, 34, 42, 48, 54, 62, 68, 64, 74, 66, 60, 58, 50, 62, 58, 61, 54, 56, 62, 68, 66, 76, 92, 118, 88, 82, 66, 58, 54, 62, 64, 78];
  const points = line.map((value, index) => `${(index / (line.length - 1)) * 100},${100 - value * 0.55}`).join(" ");

  return (
    <div className="min-w-0 rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.04)] xl:col-span-2">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-bold">Revenue & Orders Trend</h2>
        <div className="flex flex-wrap items-center gap-5 text-xs font-medium text-[#667085]">
          <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#008f45]" />Revenue (₦)</span>
          <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#60a5fa]" />Orders</span>
        </div>
      </div>
      <div className="grid grid-cols-[42px_minmax(0,1fr)_32px] gap-3">
        <div className="grid h-48 grid-rows-5 text-right text-xs font-medium text-[#667085]">
          {["2.0M", "1.5M", "1.0M", "500K", "0"].map((label) => <span key={label}>{label}</span>)}
        </div>
        <div className="relative h-48 border-b border-l border-[#d0d5dd]">
          <div className="absolute inset-0 grid grid-cols-10">
            {Array.from({ length: 10 }).map((_, index) => <span key={index} className="border-r border-[#eef2f6]" />)}
          </div>
          <div className="absolute inset-0 grid grid-rows-4">
            {Array.from({ length: 4 }).map((_, index) => <span key={index} className="border-b border-[#eef2f6]" />)}
          </div>
          <div className="absolute inset-x-3 bottom-0 flex h-44 items-end gap-1.5">
            {bars.map((height, index) => (
              <span key={index} className="z-10 flex-1 rounded-t bg-[#bfead1]" style={{ height: `${height}%` }} />
            ))}
          </div>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-x-3 bottom-0 z-20 h-44 w-[calc(100%-1.5rem)] overflow-visible">
            <polyline points={points} fill="none" stroke="#008f45" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
            {line.map((value, index) => (
              <circle key={index} cx={(index / (line.length - 1)) * 100} cy={100 - value * 0.55} r="1.4" fill="#008f45" />
            ))}
          </svg>
        </div>
        <div className="grid h-48 grid-rows-5 text-xs font-medium text-[#667085]">
          {["120", "90", "60", "30", "0"].map((label) => <span key={label}>{label}</span>)}
        </div>
      </div>
      <div className="ml-12 mt-3 grid grid-cols-4 gap-2 text-xs font-medium text-[#667085] sm:grid-cols-8">
        {["Aug 1", "Aug 4", "Aug 7", "Aug 10", "Aug 13", "Aug 16", "Aug 19", "Aug 22", "Aug 25", "Aug 28", "Aug 31"].map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  );
};

const ReportPreview = () => (
  <div className="w-full min-w-0 space-y-4 overflow-hidden text-[#101828]">
    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-medium text-[#667085]">
          <Link to="/reports" className="hover:text-[#008f45]">Reports</Link>
          <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
          <Link to="/reports/create" className="hover:text-[#008f45]">Create Report</Link>
          <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
          <span>Report Preview</span>
        </div>
        <h1 className="text-2xl font-bold tracking-normal">Sales Performance Report</h1>
        <p className="mt-1 text-sm font-medium text-[#667085]">Detailed overview of sales, orders and revenue for the selected period.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Link to="/reports/create" className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-5 text-sm font-semibold shadow-sm">
          <FontAwesomeIcon icon={faArrowLeft} />
          Edit Filters
        </Link>
        <button type="button" className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#008f45] px-5 text-sm font-semibold text-white shadow-sm">
          <FontAwesomeIcon icon={faDownload} />
          Export
          <FontAwesomeIcon icon={faChevronDown} />
        </button>
        <button type="button" className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#008f45] bg-white px-5 text-sm font-semibold text-[#008f45] shadow-sm">
          <FontAwesomeIcon icon={faSave} />
          Save Report
        </button>
      </div>
    </div>

    <section className="grid gap-4 rounded-lg border border-[#cfeedd] bg-[#f0fbf5] p-4 shadow-[0_8px_24px_rgba(16,24,40,0.04)] md:grid-cols-2 xl:grid-cols-4">
      {[
        [faCalendarDays, "Date Range", "Aug 1, 2026 - Aug 31, 2026"],
        [faFileLines, "Report Type", "Sales Report"],
        [faChartColumn, "Group By", "Day"],
        [faFilter, "Filters", "All Products • All Categories • All Locations"],
      ].map(([icon, label, value]) => (
        <div key={label} className="flex min-w-0 items-center gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#dff7e8] text-xl text-[#008f45]">
            <FontAwesomeIcon icon={icon} />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium text-[#667085]">{label}</span>
            <span className="block break-words text-sm font-bold leading-tight">{value}</span>
          </span>
        </div>
      ))}
    </section>

    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {statCards.map(([label, value, change, icon]) => (
        <div key={label} className="flex min-w-0 items-center gap-4 rounded-lg border border-[#e5e7eb] bg-white p-5 shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#dff7e8] text-xl text-[#008f45]">
            <FontAwesomeIcon icon={icon} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#667085]">{label}</p>
            <p className="mt-1 break-words text-xl font-bold leading-tight tracking-normal tabular-nums sm:text-2xl">{value}</p>
            <p className="mt-1 text-xs font-semibold text-[#008f45]">↑ {change} <span className="font-medium text-[#667085]">vs previous period</span></p>
          </div>
        </div>
      ))}
    </section>

    <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(360px,0.98fr)]">
      <Chart />

      <div className="min-w-0 rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
        <h2 className="mb-5 text-base font-bold">Sales by Category</h2>
        <div className="grid gap-5 sm:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-1 2xl:grid-cols-[220px_minmax(0,1fr)]">
          <div className="mx-auto grid h-52 w-52 place-items-center rounded-full" style={{ background: "conic-gradient(#008f45 0 48%, #fbbf24 48% 75%, #3b82f6 75% 90%, #ef4444 90% 100%)" }}>
            <div className="grid h-28 w-28 place-items-center rounded-full bg-white text-center">
              <div>
                <p className="break-words text-xl font-bold leading-tight tracking-normal tabular-nums sm:text-2xl">₦12.8M</p>
                <p className="text-xs font-medium text-[#667085]">Total Revenue</p>
              </div>
            </div>
          </div>
          <div className="grid content-center gap-4">
            {categoryRows.map(([name, percent, amount, color]) => (
              <div key={name} className="grid grid-cols-[16px_minmax(0,1fr)_minmax(36px,max-content)_minmax(0,110px)] items-center gap-3 text-sm">
                <span className="h-4 w-4 rounded-full" style={{ backgroundColor: color }} />
                <span className="truncate font-medium text-[#344054]">{name}</span>
                <span className="text-right font-bold">{percent}</span>
                <span className="break-words text-right font-semibold leading-tight text-[#667085] tabular-nums">{amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    <section className="min-w-0 rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-base font-bold">Product Performance</h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative block">
            <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#667085]" />
            <input className="h-10 w-full rounded-md border border-[#d0d5dd] bg-white pl-10 pr-4 text-sm outline-none focus:border-[#008f45] sm:w-72" placeholder="Search products..." />
          </label>
          <button type="button" className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#d0d5dd] px-4 text-sm font-semibold">
            <FontAwesomeIcon icon={faColumns} />
            Columns
          </button>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto rounded-md border border-[#e5e7eb]">
        <table className="w-full min-w-[980px] text-left text-xs">
          <thead className="bg-[#f8fafc]">
            <tr>
              {["#", "Product", "Category", "Quantity Sold", "Revenue (₦)", "Total Orders", "Average Price (₦)", "Growth", "Action"].map((heading) => (
                <th key={heading} className="px-4 py-3 font-bold">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eef2f6]">
            {productRows.map((row) => (
              <tr key={row[0]}>
                {row.slice(0, 7).map((cell) => <td key={`${row[0]}-${cell}`} className="px-4 py-3 font-medium leading-tight text-[#344054] tabular-nums">{cell}</td>)}
                <td className={`px-4 py-3 font-bold ${row[8] === "down" ? "text-[#ef3340]" : "text-[#008f45]"}`}>
                  {row[8] === "down" ? "↓" : "↑"} {row[7]}
                </td>
                <td className="px-4 py-3">
                  <button type="button" className="text-[#101828]" aria-label={`Actions for ${row[1]}`}>
                    <FontAwesomeIcon icon={faEllipsis} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-[#667085]">Showing 1 - 5 of 42 products</p>
        <div className="flex flex-wrap items-center gap-1">
          <button type="button" className="grid h-9 w-9 place-items-center rounded-md border border-[#e5e7eb] text-[#98a2b3]">
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          {["1", "2", "3", "4", "5", "...", "9"].map((page) => (
            <button key={page} type="button" className={`grid h-9 min-w-9 place-items-center rounded-md px-2 text-sm font-semibold ${page === "1" ? "bg-[#008f45] text-white" : "border border-[#e5e7eb] text-[#344054]"}`}>
              {page}
            </button>
          ))}
          <button type="button" className="grid h-9 w-9 place-items-center rounded-md border border-[#e5e7eb] text-[#101828]">
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      </div>
    </section>
  </div>
);

export default ReportPreview;
