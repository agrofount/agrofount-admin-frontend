import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { ACTIONS, RESOURCES } from "../../constants/permissions";
import { usePermission } from "../Hooks/usePermission";
import {
  fetchLeaderboard,
  fetchMyPerformance,
  getErrorMessage,
  toNumber,
} from "./leadOwnership";

const TIPS = {
  assigned: "Leads you have claimed in this period. Releasing a lead removes it from your numbers.",
  contacted: "Claimed leads you moved past New (contacted, qualified or converted).",
  qualified: "Claimed leads marked Qualified.",
  rejected: "Claimed leads marked Rejected.",
  registered:
    "Leads that got a customer account after you claimed them. These are credited to you.",
  registeredBeforeClaim:
    "Leads that already had an account when you claimed them. Shown separately and not credited.",
  paying:
    "Customers who made a completed payment after you claimed the lead.",
  revenue: "Sum of the completed payments counted under Paying (NGN).",
  contactRate: "Contacted as a percentage of assigned.",
  registrationRate: "Registered as a percentage of assigned.",
  payingRate: "Paying as a percentage of assigned.",
  registeredToPayingRate:
    "Paying as a percentage of registered. Not available until a lead has an account.",
  avgDaysToRegister: "Average days from claim to account creation.",
  avgDaysToFirstPayment: "Average days from claim to first completed payment.",
};

const ngn = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(toNumber(value));

const pct = (value) =>
  value === null || value === undefined ? "N/A" : `${toNumber(value)}%`;
const days = (value) =>
  value === null || value === undefined
    ? "N/A"
    : `${toNumber(value).toFixed(1)} days`;

const Metric = ({ label, value, tip, sub }) => (
  <div
    className="rounded-xl border border-[#e5e7eb] bg-white px-4 py-4"
    title={tip}
  >
    <p className="text-[11px] font-semibold text-[#667085]">{label}</p>
    <p className="mt-1 text-xl font-bold text-[#101828]">{value}</p>
    {sub && <p className="mt-0.5 text-[10px] text-[#667085]">{sub}</p>}
  </div>
);

const DateRange = ({ from, to, onChange }) => (
  <div className="flex flex-wrap items-end gap-2">
    {[
      ["From", "from", from],
      ["To", "to", to],
    ].map(([label, key, value]) => (
      <label key={key} className="text-[10px] font-semibold uppercase tracking-wide text-[#667085]">
        {label}
        <input
          type="date"
          value={value}
          max={key === "from" ? to || undefined : undefined}
          min={key === "to" ? from || undefined : undefined}
          onChange={(e) => onChange(key, e.target.value)}
          className="mt-1 block h-9 rounded-md border border-[#d0d5dd] bg-white px-3 text-xs font-normal normal-case text-[#101828] outline-none focus:border-[#008f45]"
        />
      </label>
    ))}
    {(from || to) && (
      <button
        type="button"
        onClick={() => {
          onChange("from", "");
          onChange("to", "");
        }}
        className="h-9 rounded-md border border-[#d0d5dd] bg-white px-3 text-xs text-[#667085]"
      >
        Clear
      </button>
    )}
  </div>
);

const Funnel = ({ data }) => {
  const steps = [
    ["Assigned", data.assigned, TIPS.assigned],
    ["Contacted", data.contacted, TIPS.contacted],
    ["Registered", data.registered, TIPS.registered],
    ["Paying", data.paying, TIPS.paying],
  ];
  const max = Math.max(1, ...steps.map(([, v]) => toNumber(v)));
  return (
    <div className="space-y-3 rounded-xl border border-[#e5e7eb] bg-white p-4">
      <h2 className="text-sm font-semibold">Conversion funnel</h2>
      {steps.map(([label, value, tip]) => (
        <div key={label} title={tip}>
          <div className="mb-1 flex justify-between text-xs text-[#344054]">
            <span>{label}</span>
            <span className="font-semibold">{toNumber(value).toLocaleString()}</span>
          </div>
          <div className="h-2.5 rounded-full bg-[#f3f4f6]">
            <div
              className="h-2.5 rounded-full bg-[#008f45]"
              style={{ width: `${(toNumber(value) / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const LeadPerformance = () => {
  const { hasPermission } = usePermission();
  const canViewReports = hasPermission(RESOURCES.LEADS, ACTIONS.VIEW_REPORTS);
  const [range, setRange] = useState({ from: "", to: "" });
  const [mine, setMine] = useState(null);
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const params = {
      from: range.from || undefined,
      to: range.to || undefined,
    };
    try {
      setLoading(true);
      const [meRes, boardRes] = await Promise.all([
        fetchMyPerformance(params),
        canViewReports ? fetchLeaderboard(params) : Promise.resolve(null),
      ]);
      setMine(meRes.data);
      setBoard(Array.isArray(boardRes?.data) ? boardRes.data : []);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load performance"));
    } finally {
      setLoading(false);
    }
  }, [range, canViewReports]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-5 text-[#101828]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs text-[#667085]">
            <Link to="/leads" className="hover:text-[#008f45]">Leads</Link> / Performance
          </p>
          <h1 className="text-lg font-semibold">My performance</h1>
          <p className="mt-1 text-xs font-medium text-[#667085]">
            Filtered by the date each lead was assigned to you.
          </p>
        </div>
        <DateRange
          from={range.from}
          to={range.to}
          onChange={(key, value) => setRange((r) => ({ ...r, [key]: value }))}
        />
      </div>

      {loading && !mine ? (
        <div className="h-40 animate-pulse rounded-xl bg-[#f3f4f6]" />
      ) : mine ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Assigned" value={toNumber(mine.assigned)} tip={TIPS.assigned} />
            <Metric label="Registered" value={toNumber(mine.registered)} tip={TIPS.registered}
              sub={`${toNumber(mine.registeredBeforeClaim)} already registered before claim (not credited)`} />
            <Metric label="Paying" value={toNumber(mine.paying)} tip={TIPS.paying} />
            <Metric label="Revenue" value={ngn(mine.revenue)} tip={TIPS.revenue} />
          </section>
          <section className="grid gap-4 lg:grid-cols-2">
            <Funnel data={mine} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Metric label="Contact rate" value={pct(mine.contactRate)} tip={TIPS.contactRate} />
              <Metric label="Registration rate" value={pct(mine.registrationRate)} tip={TIPS.registrationRate} />
              <Metric label="Paying rate" value={pct(mine.payingRate)} tip={TIPS.payingRate} />
              <Metric label="Registered to paying" value={pct(mine.registeredToPayingRate)} tip={TIPS.registeredToPayingRate} />
              <Metric label="Avg. days to register" value={days(mine.avgDaysToRegister)} tip={TIPS.avgDaysToRegister} />
              <Metric label="Avg. days to first payment" value={days(mine.avgDaysToFirstPayment)} tip={TIPS.avgDaysToFirstPayment} />
              <Metric label="Qualified" value={toNumber(mine.qualified)} tip={TIPS.qualified} />
              <Metric label="Rejected" value={toNumber(mine.rejected)} tip={TIPS.rejected} />
            </div>
          </section>
        </>
      ) : null}

      {canViewReports && (
        <section className="rounded-xl border border-[#e5e7eb] bg-white p-4">
          <h2 className="text-sm font-semibold">Leaderboard</h2>
          <p className="mt-1 text-xs text-[#667085]">All owners, best paying first.</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="border-b border-[#e5e7eb] text-[10px] uppercase tracking-wide text-[#667085]">
                <tr>
                  {[
                    ["Owner"],
                    ["Assigned", TIPS.assigned],
                    ["Contacted", TIPS.contacted],
                    ["Registered", TIPS.registered],
                    ["Paying", TIPS.paying],
                    ["Revenue", TIPS.revenue],
                    ["Paying rate", TIPS.payingRate],
                    ["Avg. days to pay", TIPS.avgDaysToFirstPayment],
                  ].map(([h, tip]) => (
                    <th key={h} title={tip} className="px-3 py-2 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef2f6]">
                {board.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-3 py-6 text-center text-[#98a2b3]">
                      No owned leads in this period.
                    </td>
                  </tr>
                ) : (
                  board.map((row, i) => (
                    <tr key={row.owner?.id || i}>
                      <td className="px-3 py-2 font-semibold">{i + 1}. {row.owner?.name || "Unknown"}</td>
                      <td className="px-3 py-2">{toNumber(row.assigned)}</td>
                      <td className="px-3 py-2">{toNumber(row.contacted)}</td>
                      <td className="px-3 py-2">{toNumber(row.registered)}</td>
                      <td className="px-3 py-2">{toNumber(row.paying)}</td>
                      <td className="px-3 py-2">{ngn(row.revenue)}</td>
                      <td className="px-3 py-2">{pct(row.payingRate)}</td>
                      <td className="px-3 py-2">{days(row.avgDaysToFirstPayment)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

export default LeadPerformance;
