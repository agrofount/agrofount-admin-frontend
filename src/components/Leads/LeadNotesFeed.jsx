import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ACTIONS, RESOURCES } from "../../constants/permissions";
import { usePermission } from "../Hooks/usePermission";
import {
  fetchLeaderboard,
  fetchNotesFeed,
  getErrorMessage,
  toNumber,
} from "./leadOwnership";

const PAGE_SIZE = 20;

const formatWhen = (value) =>
  value
    ? new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value))
    : "";

// Notes across every lead, from GET /leads/notes (view_reports_leads).
const LeadNotesFeed = () => {
  const { hasPermission } = usePermission();
  const canViewReports = hasPermission(RESOURCES.LEADS, ACTIONS.VIEW_REPORTS);
  const [searchParams, setSearchParams] = useSearchParams();
  const adminId = searchParams.get("adminId") || "";
  const [range, setRange] = useState({ from: "", to: "" });
  const [page, setPage] = useState(1);
  const [admins, setAdmins] = useState([]);
  const [feed, setFeed] = useState({ data: [], total: 0 });
  const [loading, setLoading] = useState(false);

  // Admin choices come from the leaderboard owners (admins who own leads).
  useEffect(() => {
    if (!canViewReports) return;
    fetchLeaderboard()
      .then((res) =>
        setAdmins(
          (Array.isArray(res.data) ? res.data : [])
            .map((row) => row.owner)
            .filter((o) => o?.id),
        ),
      )
      .catch(() => setAdmins([]));
  }, [canViewReports]);

  const load = useCallback(async () => {
    if (!canViewReports) return;
    try {
      setLoading(true);
      const res = await fetchNotesFeed({
        adminId: adminId || undefined,
        from: range.from || undefined,
        to: range.to || undefined,
        page,
        limit: PAGE_SIZE,
      });
      setFeed({
        data: Array.isArray(res.data?.data) ? res.data.data : [],
        total: toNumber(res.data?.total),
      });
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load notes"));
    } finally {
      setLoading(false);
    }
  }, [canViewReports, adminId, range, page]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(feed.total / PAGE_SIZE));
  const inputClass =
    "mt-1 block h-9 rounded-md border border-[#d0d5dd] bg-white px-3 text-xs font-normal normal-case text-[#101828] outline-none focus:border-[#008f45]";
  const labelClass = "text-[10px] font-semibold uppercase tracking-wide text-[#667085]";

  if (!canViewReports) {
    return (
      <p className="rounded-xl border border-[#e5e7eb] bg-white p-6 text-xs text-[#667085]">
        You do not have access to the notes feed.
      </p>
    );
  }

  return (
    <div className="space-y-5 text-[#101828]">
      <div>
        <p className="text-xs text-[#667085]">
          <Link to="/leads" className="hover:text-[#008f45]">Leads</Link> /{" "}
          <Link to="/leads/performance" className="hover:text-[#008f45]">Performance</Link> / Notes
        </p>
        <h1 className="text-lg font-semibold">All admin notes</h1>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <label className={labelClass}>
          Admin
          <select
            value={adminId}
            onChange={(e) => {
              setPage(1);
              setSearchParams(e.target.value ? { adminId: e.target.value } : {}, { replace: true });
            }}
            className={inputClass}
          >
            <option value="">All admins</option>
            {admins.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </label>
        {[
          ["From", "from"],
          ["To", "to"],
        ].map(([label, key]) => (
          <label key={key} className={labelClass}>
            {label}
            <input
              type="date"
              value={range[key]}
              onChange={(e) => {
                setPage(1);
                setRange((r) => ({ ...r, [key]: e.target.value }));
              }}
              className={inputClass}
            />
          </label>
        ))}
      </div>

      <section className="rounded-xl border border-[#e5e7eb] bg-white p-4">
        {loading && feed.data.length === 0 ? (
          <div className="h-32 animate-pulse rounded-lg bg-[#f3f4f6]" />
        ) : feed.data.length === 0 ? (
          <p className="text-xs text-[#98a2b3]">No notes found.</p>
        ) : (
          <ol className="space-y-2">
            {feed.data.map((note) => (
              <li key={note.id} className="rounded-lg border border-[#e5e7eb] px-4 py-3">
                <p className="text-[11px] font-semibold text-[#344054]">{note.leadName}</p>
                <p className="mt-1 whitespace-pre-wrap break-words text-xs text-[#344054]">{note.body}</p>
                <p className="mt-2 text-[10px] text-[#667085]">
                  {note.author?.name || "Unknown admin"} · {formatWhen(note.createdAt)}
                </p>
              </li>
            ))}
          </ol>
        )}
        <div className="mt-4 flex items-center justify-between text-xs text-[#667085]">
          <span>{feed.total.toLocaleString()} notes</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => p - 1)}
              className="h-8 rounded-md border border-[#d0d5dd] px-3 disabled:opacity-50"
            >
              Previous
            </button>
            <span>Page {page} of {totalPages}</span>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="h-8 rounded-md border border-[#d0d5dd] px-3 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LeadNotesFeed;
