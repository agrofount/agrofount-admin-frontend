import {
  faArrowLeft,
  faArrowRight,
  faBox,
  faBriefcase,
  faCalendarDays,
  faChartColumn,
  faCheck,
  faChevronRight,
  faCreditCard,
  faEye,
  faFileExcel,
  faGear,
  faLocationDot,
  faMap,
  faStore,
  faTags,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { Link } from "react-router-dom";
import { assets } from "../../assets/assets";

const dateRanges = [
  { label: "Today", value: "Sep 5, 2026" },
  { label: "This Week", value: "Aug 31, 2026 - Sep 5, 2026" },
  { label: "This Month", value: "Sep 1, 2026 - Sep 30, 2026" },
  { label: "Last Month", value: "Aug 1, 2026 - Aug 31, 2026" },
  { label: "All Time", value: "All time" },
];

const metrics = [
  ["Total Revenue", "₦12,842,600", "18.4%"],
  ["Total Orders", "428", "12.1%"],
  ["Average Order Value", "₦29,907", "5.2%"],
  ["Total Customers", "1,284", "8.7%"],
];

const topProducts = [
  ["1", "CHI Broiler (Day-Old)", "Day-Old Chicks", "1,250", "1,250,000"],
  ["2", "Agrited Broiler (Day-Old)", "Day-Old Chicks", "980", "960,400"],
  ["3", "Poultry Feed (25kg)", "Feeds", "645", "1,451,250"],
];

const templates = [
  ["Sales Performance", "Revenue, orders, products and sales trends", faChartColumn, "bg-[#e8f8ee] text-[#008f45]"],
  ["Sales by Product", "Detailed sales performance by product", faBriefcase, "bg-[#eaf5ff] text-[#1f7ae0]"],
  ["Sales by Supplier", "Sales and revenue by supplier", faUsers, "bg-[#f1e9ff] text-[#7f3fd9]"],
  ["Revenue by Category", "Sales breakdown by product category", faBox, "bg-[#ffe8ef] text-[#e11d48]"],
  ["Payment Method Report", "Sales by payment method", faCreditCard, "bg-[#e8f8ee] text-[#008f45]"],
];

const FieldLabel = ({ children, required = false }) => (
  <span className="mb-2 block text-xs font-semibold text-[#101828]">
    {children} {required && <span className="text-[#ef3340]">*</span>}
  </span>
);

const selectClass =
  "h-11 w-full rounded-md border border-[#d0d5dd] bg-white px-3 text-sm font-semibold text-[#101828] outline-none focus:border-[#008f45]";

const Stepper = ({ activeStep }) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {[
      [1, "Report Details", "Choose what to report"],
      [2, "Filters", "Refine your data"],
      [3, "Preview & Export", "Review and generate"],
    ].map(([number, title, subtitle]) => {
      const completed = activeStep > number;
      const active = activeStep === number;

      return (
      <div key={title} className="flex min-w-0 items-center gap-3">
        <span className={`grid h-10 w-10 place-items-center rounded-full text-sm font-bold ${active ? "bg-[#008f45] text-white" : completed ? "border border-[#008f45] bg-white text-[#008f45]" : "bg-[#e5e7eb] text-[#101828]"}`}>
          {completed ? <FontAwesomeIcon icon={faCheck} /> : number}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-[#101828]">{title}</span>
          <span className="block text-xs font-medium text-[#667085]">{subtitle}</span>
        </span>
      </div>
      );
    })}
  </div>
);

const PreviewChart = () => {
  const line = [38, 52, 56, 64, 70, 68, 82, 70, 62, 78, 93, 84, 79, 68, 64, 75, 76, 70, 88, 110, 104, 96, 82, 70, 58, 53, 64, 70, 68, 86];
  const bars = [24, 34, 42, 48, 54, 46, 62, 84, 74, 60, 92, 70, 62, 58, 66, 61, 74, 78, 88, 112, 98, 86, 72, 62, 52, 44, 55, 60, 70, 85];
  const points = line.map((value, index) => `${(index / (line.length - 1)) * 100},${100 - value * 0.75}`).join(" ");

  return (
    <div className="min-w-0">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold">Revenue Trend</h3>
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-[#667085]">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#008f45]" />Revenue (₦)</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[#bfead1]" />Orders</span>
        </div>
      </div>
      <div className="relative h-32 border-b border-l border-[#d0d5dd] pl-2">
        <div className="absolute inset-0 grid grid-cols-10">
          {Array.from({ length: 10 }).map((_, index) => <span key={index} className="border-r border-[#eef2f6]" />)}
        </div>
        <div className="absolute inset-x-2 bottom-0 flex h-28 items-end gap-1.5">
          {bars.map((height, index) => (
            <span key={index} className="z-10 flex-1 rounded-t bg-[#bfead1]" style={{ height: `${height}%` }} />
          ))}
        </div>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-x-2 bottom-0 z-20 h-28 w-[calc(100%-1rem)] overflow-visible">
          <polyline points={points} fill="none" stroke="#008f45" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          {line.map((value, index) => (
            <circle key={index} cx={(index / (line.length - 1)) * 100} cy={100 - value * 0.75} r="1.4" fill="#008f45" />
          ))}
        </svg>
      </div>
      <div className="mt-2 grid grid-cols-4 gap-1 text-[10px] font-medium text-[#667085] sm:grid-cols-8">
        {["Aug 1", "Aug 5", "Aug 9", "Aug 13", "Aug 17", "Aug 21", "Aug 25", "Aug 31"].map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  );
};

const IconSelect = ({ label, icon, options, className = "" }) => (
  <label className={`block min-w-0 ${className}`}>
    <FieldLabel>{label}</FieldLabel>
    <div className="relative">
      <FontAwesomeIcon icon={icon} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#101828]" />
      <select className={`${selectClass} pl-12`}>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </div>
  </label>
);

const CurrencyInput = ({ label, placeholder }) => (
  <label className="block min-w-0">
    <FieldLabel>{label}</FieldLabel>
    <div className="flex h-11 min-w-0 items-center rounded-md border border-[#d0d5dd] bg-white focus-within:border-[#008f45]">
      <span className="grid h-full w-11 shrink-0 place-items-center border-r border-[#eef2f6] text-sm font-bold">₦</span>
      <input className="min-w-0 flex-1 bg-transparent px-3 text-sm font-semibold outline-none placeholder:text-[#98a2b3]" placeholder={placeholder} />
    </div>
  </label>
);

const CheckboxOption = ({ label, checked = false }) => (
  <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#344054]">
    <input type="checkbox" defaultChecked={checked} className="h-4 w-4 rounded border-[#b9c1d0] accent-[#008f45]" />
    {label}
  </label>
);

const RadioOption = ({ label, checked = false }) => (
  <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#344054]">
    <input type="radio" name="customerType" defaultChecked={checked} className="h-4 w-4 accent-[#008f45]" />
    {label}
  </label>
);

const ReportDetailsStep = ({ selectedDateRange, setSelectedDateRange, onContinue }) => (
  <>
    <div className="mt-8 grid min-w-0 gap-5 md:grid-cols-2">
      <label className="block min-w-0">
        <FieldLabel required>Report Type</FieldLabel>
        <div className="relative">
          <select className={`${selectClass} border-[#008f45] pl-12`}>
            <option>Sales Report</option>
            <option>Customer Report</option>
            <option>Inventory Report</option>
          </select>
          <FontAwesomeIcon icon={faChartColumn} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#008f45]" />
        </div>
      </label>

      <label className="block min-w-0">
        <FieldLabel required>Report Name</FieldLabel>
        <input className={selectClass} defaultValue="Sales Performance Report" />
      </label>

      <label className="block min-w-0 md:col-span-2">
        <FieldLabel>Description (Optional)</FieldLabel>
        <textarea className="min-h-20 w-full rounded-md border border-[#d0d5dd] bg-white px-4 py-3 text-sm font-medium text-[#101828] outline-none focus:border-[#008f45]" defaultValue="Summary of sales, orders and revenue for the selected period." />
      </label>

      <label className="block min-w-0">
        <FieldLabel required>Date Range</FieldLabel>
        <div className="flex h-11 w-full min-w-0 items-center gap-3 rounded-md border border-[#d0d5dd] bg-white px-4 text-left text-sm font-semibold focus-within:border-[#008f45]">
          <FontAwesomeIcon icon={faCalendarDays} />
          <select
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
            value={selectedDateRange.label}
            onChange={(event) => {
              const nextRange = dateRanges.find((range) => range.label === event.target.value);
              if (nextRange) setSelectedDateRange(nextRange);
            }}
          >
            {dateRanges.map((range) => (
              <option key={range.label} value={range.label}>{range.value}</option>
            ))}
          </select>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {dateRanges.map((range) => (
            <button
              key={range.label}
              type="button"
              onClick={() => setSelectedDateRange(range)}
              className={`h-8 rounded-md border px-3 text-xs font-semibold ${selectedDateRange.label === range.label ? "border-[#008f45] bg-[#e8f8ee] text-[#008f45]" : "border-[#d0d5dd] bg-white text-[#344054]"}`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </label>

      <label className="block min-w-0">
        <FieldLabel>Group By</FieldLabel>
        <select className={selectClass}>
          <option>Day</option>
          <option>Week</option>
          <option>Month</option>
        </select>
      </label>

      <label className="block min-w-0">
        <FieldLabel required>Export Format</FieldLabel>
        <div className="relative">
          <select className={`${selectClass} pl-12`}>
            <option>Excel (.xlsx)</option>
            <option>CSV</option>
            <option>PDF</option>
          </select>
          <FontAwesomeIcon icon={faFileExcel} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#008f45]" />
        </div>
      </label>

      <div>
        <FieldLabel>Include in Report</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {["Summary Metrics", "Charts", "Data Table"].map((item) => (
            <span key={item} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#dff7e8] px-3 text-xs font-semibold text-[#008f45]">
              <FontAwesomeIcon icon={faCheck} />
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>

    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <button type="button" className="inline-flex h-11 items-center justify-center gap-3 rounded-md border border-[#d0d5dd] bg-white px-5 text-sm font-semibold text-[#344054]">
        <FontAwesomeIcon icon={faGear} />
        Advanced Filters
      </button>
      <button type="button" onClick={onContinue} className="inline-flex h-11 items-center justify-center gap-3 rounded-md bg-[#008f45] px-10 text-sm font-semibold text-white shadow-sm hover:bg-[#007a3b]">
        Continue to Filters
        <FontAwesomeIcon icon={faArrowRight} />
      </button>
    </div>
  </>
);

const FiltersStep = () => (
  <>
    <div className="mt-8 grid min-w-0 gap-5 xl:grid-cols-3">
      <IconSelect label="Product" icon={faBox} options={["All Products", "Layer Feed 25kg", "Broiler Starter Feed 25kg"]} />
      <IconSelect label="Category" icon={faTags} options={["All Categories", "Feeds", "Day-Old Chicks", "Equipment"]} />
      <IconSelect label="Supplier" icon={faStore} options={["All Suppliers", "Vital Feeds", "TopFeeds", "AgroEquip"]} />

      <IconSelect label="Location" icon={faLocationDot} options={["All Locations", "Lagos", "Osun", "Abuja"]} />
      <IconSelect label="State" icon={faMap} options={["All States", "Lagos", "Osun", "Oyo"]} />
      <IconSelect label="LGA (Optional)" icon={faMap} options={["All LGAs", "Ikeja", "Ede North", "Ibadan North"]} />

      <div className="min-w-0 xl:col-span-2">
        <FieldLabel>Order Status</FieldLabel>
        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {["All", "Delivered", "Processing", "Pending", "Cancelled"].map((status, index) => (
            <CheckboxOption key={status} label={status} checked={index === 0} />
          ))}
        </div>
      </div>

      <div className="min-w-0">
        <FieldLabel>Customer Type</FieldLabel>
        <div className="grid gap-2">
          {["All Customers", "New Customers", "Returning Customers"].map((type, index) => (
            <RadioOption key={type} label={type} checked={index === 0} />
          ))}
        </div>
      </div>

      <div className="min-w-0 xl:col-span-2">
        <FieldLabel>Payment Status</FieldLabel>
        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {["All", "Paid", "Pending", "Failed", "Refunded"].map((status, index) => (
            <CheckboxOption key={status} label={status} checked={index === 0} />
          ))}
        </div>
      </div>

      <IconSelect label="Payment Method" icon={faCreditCard} options={["All Payment Methods", "Card", "Transfer", "Cash"]} />
      <IconSelect label="Sales Channel" icon={faBriefcase} options={["All Channels", "Website", "Admin", "Marketplace"]} />
      <CurrencyInput label="Minimum Order Value (₦)" placeholder="e.g. 10,000" />
      <CurrencyInput label="Maximum Order Value (₦)" placeholder="e.g. 1,000,000" />
    </div>

    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <button type="button" className="inline-flex h-11 items-center justify-center gap-3 rounded-md border border-[#d0d5dd] bg-white px-5 text-sm font-semibold text-[#344054]">
        <FontAwesomeIcon icon={faGear} />
        Advanced Filters
      </button>
      <Link to="/reports/preview" className="inline-flex h-11 items-center justify-center gap-3 rounded-md bg-[#008f45] px-10 text-sm font-semibold text-white shadow-sm hover:bg-[#007a3b]">
        Continue to Preview
        <FontAwesomeIcon icon={faArrowRight} />
      </Link>
    </div>
  </>
);

const CreateReport = () => {
  const [selectedDateRange, setSelectedDateRange] = useState(dateRanges[3]);
  const [activeStep, setActiveStep] = useState(1);

  return (
  <div className="w-full min-w-0 space-y-4 overflow-hidden text-[#101828]">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium text-[#667085]">
          <Link to="/reports" className="hover:text-[#008f45]">Reports</Link>
          <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
          <span>Create Report</span>
        </div>
        <h1 className="text-2xl font-bold tracking-normal">Create Report</h1>
        <p className="mt-1 text-sm font-medium text-[#667085]">Select a report type, choose your filters and generate a report with the data you need.</p>
      </div>
      <Link to="/reports" className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-5 text-sm font-semibold text-[#101828] shadow-sm sm:self-start lg:self-auto">
        <FontAwesomeIcon icon={faArrowLeft} />
        Back to Reports
      </Link>
    </div>

    <div className="grid min-w-0 gap-4 min-[1400px]:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)]">
      <section className="min-w-0 rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.04)] sm:p-5">
        <Stepper activeStep={activeStep} />
        {activeStep === 1 ? (
          <ReportDetailsStep
            selectedDateRange={selectedDateRange}
            setSelectedDateRange={setSelectedDateRange}
            onContinue={() => setActiveStep(2)}
          />
        ) : (
          <FiltersStep />
        )}
      </section>

      <section className="min-w-0 rounded-lg border border-[#cfeedd] bg-[#f0fbf5] p-4 shadow-[0_8px_24px_rgba(16,24,40,0.04)] sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#d8f5e5] text-[#008f45]">
              <FontAwesomeIcon icon={faEye} />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-semibold">Report Preview</h2>
              <p className="text-xs font-medium text-[#667085]">This is a preview of how your report will look{activeStep === 2 ? " with the selected filters" : ""}.</p>
            </div>
          </div>
          <span className="w-fit rounded-full bg-[#c8f2d8] px-4 py-2 text-xs font-semibold text-[#008f45]">Sample Data</span>
        </div>

        <div className="min-w-0 rounded-lg bg-white p-3 shadow-sm sm:p-4">
          <div className="mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <img src={assets.agrofount_logo} alt="Agrofount" className="h-9 w-auto" />
            <div className="min-w-0">
              <h3 className="text-base font-bold">Sales Performance Report</h3>
              <p className="text-xs font-medium text-[#667085]">{selectedDateRange.value}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 min-[1400px]:grid-cols-4">
            {metrics.map(([label, value, change]) => (
              <div key={label} className="min-w-0 rounded-md border border-[#e5e7eb] p-3">
                <p className="text-xs font-medium text-[#667085]">{label}</p>
                <p className="mt-2 break-words text-lg font-bold leading-tight tracking-normal tabular-nums sm:text-xl">{value}</p>
                <p className="mt-1 text-xs font-semibold text-[#008f45]">↑ {change} <span className="font-medium text-[#667085]">vs previous period</span></p>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <PreviewChart />
          </div>

          <div className="mt-5">
            <h3 className="mb-2 text-sm font-semibold">Top Products</h3>
            <div className="max-w-full overflow-x-auto rounded-md border border-[#e5e7eb]">
              <table className="w-full min-w-[560px] text-left text-xs">
                <thead className="bg-[#f8fafc]">
                  <tr>
                    {["#", "Product", "Category", "Quantity Sold", "Revenue (₦)"].map((heading) => (
                      <th key={heading} className="px-3 py-2 font-semibold">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eef2f6]">
                  {topProducts.map((row) => (
                    <tr key={row[0]}>
                      {row.map((cell) => <td key={cell} className="px-3 py-2 leading-tight text-[#344054] tabular-nums">{cell}</td>)}
                    </tr>
                  ))}
                  <tr>
                    {["...", "...", "...", "...", "..."].map((cell, index) => <td key={index} className="px-3 py-2 text-[#667085]">{cell}</td>)}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <p className="mt-3 text-right text-xs font-medium text-[#667085]">This is sample data. The final report will show your actual data.</p>
        </div>
      </section>
    </div>

    <section className="min-w-0 rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-[#e8f8ee] text-[#008f45]">
            <FontAwesomeIcon icon={faChartColumn} />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold">Popular Report Templates</h2>
            <p className="text-xs font-medium text-[#667085]">Get started quickly with pre-configured reports.</p>
          </div>
        </div>
        <button type="button" className="inline-flex items-center gap-2 text-xs font-semibold text-[#008f45]">
          View All Templates
          <FontAwesomeIcon icon={faArrowRight} />
        </button>
      </div>
      <div className="grid min-w-0 gap-3 md:grid-cols-2 lg:grid-cols-3 min-[1400px]:grid-cols-5">
        {templates.map(([title, subtitle, icon, tone]) => (
          <button key={title} type="button" className="flex min-h-24 min-w-0 items-center gap-3 rounded-md border border-[#e5e7eb] bg-white p-4 text-left hover:bg-[#f8fafc]">
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${tone}`}>
              <FontAwesomeIcon icon={icon} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{title}</span>
              <span className="mt-1 block text-xs font-medium leading-5 text-[#667085]">{subtitle}</span>
            </span>
            <FontAwesomeIcon icon={faArrowRight} className="text-[#101828]" />
          </button>
        ))}
      </div>
    </section>
  </div>
  );
};

export default CreateReport;
