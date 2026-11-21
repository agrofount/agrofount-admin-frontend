import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ACTIONS, RESOURCES } from "../../constants/permissions";
import { usePermission } from "../Hooks/usePermission";
import {
  fetchAdminPerformance,
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

const STAGE_LABELS = [
  ["new", "New"],
  ["contacted", "Contacted"],
  ["visited", "Visited"],
  ["quoted", "Quoted"],
  ["ordered_paid", "Ordered and paid"],
  ["lost", "Lost"],
];

// Extra detail for one admin from GET /leads/performance/:adminId. Falls back
// silently to the leaderboard numbers shown above it if the call fails.
const AdminDetail = ({ adminId, range }) => {
  const [detail, setDetail] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setDetail(null);
    setFailed(false);
    fetchAdminPerformance(adminId, {
      from: range.from || undefined,
      to: range.to || undefined,
    })
      .then((res) => !cancelled && setDetail(res.data))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [adminId, range.from, range.to]);

  if (failed) {
    return (
      <p className="text-xs text-[#98a2b3]">
        Stage and lost reason detail is not available right now.
      </p>
    );
  }
  if (!detail) return <div className="h-24 animate-pulse rounded-lg bg-[#f3f4f6]" />;

  const lostReasons = Array.isArray(detail.lostReasons) ? detail.lostReasons : [];
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-xl border border-[#e5e7eb] p-4">
        <h3 className="text-xs font-semibold">Pipeline stages</h3>
        <dl className="mt-2 space-y-1 text-xs">
          {STAGE_LABELS.map(([key, label]) => (
            <div key={key} className="flex justify-between">
              <dt className="text-[#667085]">{label}</dt>
              <dd className="font-semibold">{toNumber(detail.stages?.[key])}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="rounded-xl border border-[#e5e7eb] p-4">
        <h3 className="text-xs font-semibold">Lost reasons</h3>
        {lostReasons.length === 0 ? (
          <p className="mt-2 text-xs text-[#98a2b3]">No lost reasons recorded yet.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-xs">
            {lostReasons.map((r) => (
              <li key={r.reason} className="flex justify-between">
                <span className="capitalize text-[#667085]">{String(r.reason).replace(/_/g, " ")}</span>
                <span className="font-semibold">{toNumber(r.count)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Metric
        label="Overdue follow-ups"
        value={toNumber(detail.overdueFollowUps)}
        tip="Leads with a past-due next action that are not ordered and paid or lost."
      />
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
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedOwnerId = searchParams.get("owner");
  const selectedRow = canViewReports
    ? board.find((row) => row.owner?.id === selectedOwnerId)
    : null;
  const selectOwner = (id) =>
    setSearchParams(id ? { owner: id } : {}, { replace: true });

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

      {selectedRow && (
        <section className="space-y-4 rounded-xl border border-[#008f45]/30 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">
                {selectedRow.owner?.name || "Unknown"}: conversion funnel
              </h2>
              <p className="mt-1 text-xs text-[#667085]">
                Same period as the leaderboard.{" "}
                <Link
                  to={`/leads?ownerId=${encodeURIComponent(selectedRow.owner.id)}&ownerName=${encodeURIComponent(selectedRow.owner.name || "")}`}
                  className="font-semibold text-[#008f45] hover:underline"
                >
                  View their leads and notes
                </Link>
              </p>
            </div>
            <button
              type="button"
              onClick={() => selectOwner(null)}
              className="h-8 rounded-md border border-[#d0d5dd] px-3 text-xs text-[#667085]"
            >
              Close
            </button>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Funnel data={selectedRow} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Metric label="Revenue" value={ngn(selectedRow.revenue)} tip={TIPS.revenue} />
              <Metric label="Registered" value={toNumber(selectedRow.registered)} tip={TIPS.registered}
                sub={`${toNumber(selectedRow.registeredBeforeClaim)} already registered before claim (not credited)`} />
              <Metric label="Contact rate" value={pct(selectedRow.contactRate)} tip={TIPS.contactRate} />
              <Metric label="Registration rate" value={pct(selectedRow.registrationRate)} tip={TIPS.registrationRate} />
              <Metric label="Paying rate" value={pct(selectedRow.payingRate)} tip={TIPS.payingRate} />
              <Metric label="Registered to paying" value={pct(selectedRow.registeredToPayingRate)} tip={TIPS.registeredToPayingRate} />
              <Metric label="Avg. days to register" value={days(selectedRow.avgDaysToRegister)} tip={TIPS.avgDaysToRegister} />
              <Metric label="Avg. days to first payment" value={days(selectedRow.avgDaysToFirstPayment)} tip={TIPS.avgDaysToFirstPayment} />
              <Metric label="Qualified" value={toNumber(selectedRow.qualified)} tip={TIPS.qualified} />
              <Metric label="Rejected" value={toNumber(selectedRow.rejected)} tip={TIPS.rejected} />
            </div>
          </div>
          <AdminDetail adminId={selectedRow.owner.id} range={range} />
        </section>
      )}

      {canViewReports && (
        <section className="rounded-xl border border-[#e5e7eb] bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-sm font-semibold">Leaderboard</h2>
            <Link to="/leads/notes" className="text-xs font-semibold text-[#008f45] hover:underline">
              All admin notes
            </Link>
          </div>
          <p className="mt-1 text-xs text-[#667085]">All owners, best paying first. Select a row for that admin&apos;s funnel; click a name for their leads and notes.</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-xs">
              <thead className="border-b border-[#e5e7eb] text-[10px] uppercase tracking-wide text-[#667085]">
                <tr>
                  {[
                    ["Owner"],
                    ["Assigned", TIPS.assigned],
                    ["Contacted", TIPS.contacted],
                    ["Registered", TIPS.registered],
                    ["Paying", TIPS.paying],
                    ["Revenue", TIPS.revenue],
                    ["Reg. rate", TIPS.registrationRate],
                    ["Paying rate", TIPS.payingRate],
                    ["Reg. to paying", TIPS.registeredToPayingRate],
                    ["Avg. days to register", TIPS.avgDaysToRegister],
                    ["Avg. days to pay", TIPS.avgDaysToFirstPayment],
                  ].map(([h, tip]) => (
                    <th key={h} title={tip} className="px-3 py-2 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef2f6]">
                {board.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="px-3 py-6 text-center text-[#98a2b3]">
                      No owned leads in this period.
                    </td>
                  </tr>
                ) : (
                  board.map((row, i) => (
                    <tr
                      key={row.owner?.id || i}
                      onClick={() => row.owner?.id && selectOwner(row.owner.id)}
                      className={`cursor-pointer hover:bg-[#f9fafb] ${row.owner?.id === selectedOwnerId ? "bg-[#f0fdf4]" : ""}`}
                    >
                      <td className="px-3 py-2 font-semibold">
                        {row.owner?.id ? (
                          <Link
                            to={`/leads?ownerId=${encodeURIComponent(row.owner.id)}&ownerName=${encodeURIComponent(row.owner.name || "")}`}
                            onClick={(e) => e.stopPropagation()}
                            title="View this admin's leads and notes"
                            className="hover:text-[#008f45] hover:underline"
                          >
                            {i + 1}. {row.owner.name || "Unknown"}
                          </Link>
                        ) : (
                          `${i + 1}. Unknown`
                        )}
                      </td>
                      <td className="px-3 py-2">{toNumber(row.assigned)}</td>
                      <td className="px-3 py-2">{toNumber(row.contacted)}</td>
                      <td className="px-3 py-2">{toNumber(row.registered)}</td>
                      <td className="px-3 py-2">{toNumber(row.paying)}</td>
                      <td className="px-3 py-2">{ngn(row.revenue)}</td>
                      <td className="px-3 py-2">{pct(row.registrationRate)}</td>
                      <td className="px-3 py-2">{pct(row.payingRate)}</td>
                      <td className="px-3 py-2">{pct(row.registeredToPayingRate)}</td>
                      <td className="px-3 py-2">{days(row.avgDaysToRegister)}</td>
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
