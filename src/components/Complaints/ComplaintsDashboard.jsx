import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle, Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import {
  faChevronLeft,
  faChevronRight,
  faEllipsis,
  faHeadset,
  faMagnifyingGlass,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { toast } from "react-toastify";
import { apiClient } from "../../lib/apiClient";
import { usePermission } from "../Hooks/usePermission";
import { ACTIONS, RESOURCES } from "../../constants/permissions";

const fieldClass =
  "h-12 w-full rounded-lg border border-[#d0d5dd] bg-white px-4 text-sm text-[#101828] outline-none transition focus:border-[#079447] focus:ring-2 focus:ring-[#079447]/15 disabled:bg-gray-50";

const date = (value) => (value ? new Date(value).toLocaleString() : "—");

const customerName = (user) =>
  [user?.firstname, user?.lastname].filter(Boolean).join(" ") ||
  "Customer unavailable";

const adminName = (admin) =>
  admin ? [admin.firstname, admin.lastname].filter(Boolean).join(" ") || admin.email : "Unassigned";

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const statusStyles = {
  open: "bg-[#fee9e9] text-[#ed3038]",
  in_progress: "bg-[#fff4e5] text-[#b25e09]",
  resolved: "bg-[#e7f8ee] text-[#07883f]",
  closed: "bg-gray-100 text-gray-600",
};

const priorityStyles = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-[#eaf2ff] text-[#2674d9]",
  high: "bg-[#fee9e9] text-[#ed3038]",
};

const statusLabel = (value) =>
  STATUS_OPTIONS.find((s) => s.value === value)?.label || value;

function ComplaintActions({ onView }) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <MenuButton
        aria-label="Complaint actions"
        className="grid h-9 w-9 place-items-center rounded-lg border border-[#d0d5dd] text-[#475467] transition hover:bg-gray-50"
      >
        <FontAwesomeIcon icon={faEllipsis} />
      </MenuButton>
      <MenuItems
        anchor="bottom end"
        className="z-30 mt-1 w-40 rounded-lg border border-gray-200 bg-white p-1 text-sm shadow-xl focus:outline-none"
      >
        <MenuItem>
          <button
            type="button"
            className="block w-full rounded-md px-3 py-2 text-left data-[focus]:bg-gray-100"
            onClick={onView}
          >
            View / resolve
          </button>
        </MenuItem>
      </MenuItems>
    </Menu>
  );
}

function ComplaintDetail({ complaint, canUpdate, admins, onClose, onSaved }) {
  const [status, setStatus] = useState(complaint.status);
  const [priority, setPriority] = useState(complaint.priority);
  const [assignedAdminId, setAssignedAdminId] = useState(complaint.assignedAdmin?.id || "");
  const [resolutionNotes, setResolutionNotes] = useState(complaint.resolutionNotes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await apiClient.patch(`/complaints/admin/${complaint.id}`, {
        status,
        priority,
        ...(assignedAdminId ? { assignedAdminId } : {}),
        resolutionNotes: resolutionNotes.trim(),
      });
      toast.success("Complaint updated");
      onSaved();
    } catch (err) {
      setError(err.message || "Unable to update complaint");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={() => !saving && onClose()} className="relative z-50">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 overflow-y-auto p-4">
        <div className="flex min-h-full items-center justify-center">
          <DialogPanel className="w-full max-w-[640px] rounded-2xl bg-white p-6 shadow-xl sm:p-7">
            <div className="flex items-start gap-4">
              <span className="grid h-[64px] w-[64px] shrink-0 place-items-center rounded-2xl bg-[#eaf2ff] text-2xl text-[#2674d9]">
                <FontAwesomeIcon icon={faHeadset} />
              </span>
              <div className="min-w-0 flex-1 pt-1">
                <DialogTitle className="text-xl font-bold text-[#101828]">
                  {complaint.subject}
                </DialogTitle>
                <p className="mt-1 text-sm text-[#667085]">
                  {customerName(complaint.user)} · Filed {date(complaint.createdAt)}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                disabled={saving}
                onClick={onClose}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-xl text-[#344054] hover:bg-gray-100"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="mt-5 rounded-xl border border-[#e4e7ec] bg-[#f9fafb] p-4 text-sm text-[#344054]">
              {complaint.description}
            </div>
            {complaint.order && (
              <p className="mt-2 text-xs text-[#667085]">
                Related order: <span className="font-semibold">{complaint.order.code}</span>
              </p>
            )}

            <form onSubmit={submit} className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-[#101828]">
                  Status
                  <select
                    disabled={!canUpdate}
                    className={`${fieldClass} mt-2`}
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-semibold text-[#101828]">
                  Priority
                  <select
                    disabled={!canUpdate}
                    className={`${fieldClass} mt-2`}
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    {PRIORITY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block text-sm font-semibold text-[#101828]">
                Assigned to
                <select
                  disabled={!canUpdate}
                  className={`${fieldClass} mt-2`}
                  value={assignedAdminId}
                  onChange={(e) => setAssignedAdminId(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {admins.map((admin) => (
                    <option key={admin.id} value={admin.id}>
                      {adminName(admin)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-semibold text-[#101828]">
                Resolution notes
                <textarea
                  disabled={!canUpdate}
                  rows={4}
                  maxLength={4000}
                  className="mt-2 w-full rounded-lg border border-[#d0d5dd] bg-white p-4 text-sm outline-none transition focus:border-[#079447] focus:ring-2 focus:ring-[#079447]/15 disabled:bg-gray-50"
                  placeholder="How was this resolved?"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                />
              </label>

              {error && (
                <p role="alert" className="text-sm text-red-600">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  disabled={saving}
                  className="h-11 rounded-lg border border-[#d0d5dd] bg-white px-5 text-sm font-semibold text-[#101828] hover:bg-gray-50 disabled:opacity-50"
                  onClick={onClose}
                >
                  Close
                </button>
                {canUpdate && (
                  <button
                    disabled={saving}
                    className="flex h-11 items-center gap-2 rounded-lg bg-[#078b43] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#06793a] disabled:opacity-50"
                  >
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                )}
              </div>
            </form>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}

export default function ComplaintsDashboard() {
  const { hasPermission, isAdmin } = usePermission();
  const canUpdate = isAdmin || hasPermission(RESOURCES.COMPLAINTS, ACTIONS.UPDATE);
  const [result, setResult] = useState({ data: [], meta: {} });
  const [admins, setAdmins] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const timer = setTimeout(async () => {
      const params = { page, limit: 20, search: search.trim() || undefined };
      if (status) params["filter.status"] = `$eq:${status}`;
      if (priority) params["filter.priority"] = `$eq:${priority}`;
      try {
        const response = await apiClient.get("/complaints/admin/all", {
          params,
          signal: controller.signal,
        });
        setResult(response.data);
      } catch (err) {
        if (!controller.signal.aborted)
          setError(err.message || "Unable to load complaints");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [page, search, status, priority, revision]);

  useEffect(() => {
    const controller = new AbortController();
    apiClient
      .get("/admin", { params: { limit: 100 }, signal: controller.signal })
      .then((response) => setAdmins(response.data?.data || []))
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const totalPages = Math.max(1, result.meta.totalPages || 1);
  const pageNumbers = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => {
      const start = Math.min(Math.max(1, page - 2), Math.max(1, totalPages - 4));
      return start + index;
    }
  );

  return (
    <main className="space-y-4 text-[#101828]">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Complaints</h1>
        <p className="mt-1 text-base text-[#667085]">
          Track and resolve customer complaints and support requests.
        </p>
      </header>

      <section className="rounded-xl border border-[#e4e7ec] bg-white p-4 shadow-sm">
        <div className="grid items-end gap-4 lg:grid-cols-[minmax(280px,2fr)_minmax(180px,0.8fr)_minmax(180px,0.8fr)]">
          <label className="block text-sm font-semibold text-[#101828]">
            Search
            <span className="relative mt-2 block">
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#667085]"
              />
              <input
                className="h-12 w-full rounded-lg border border-[#d0d5dd] pl-11 pr-4 text-sm outline-none transition focus:border-[#079447] focus:ring-2 focus:ring-[#079447]/15"
                placeholder="Search by subject..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </span>
          </label>
          <label className="block text-sm font-semibold text-[#101828]">
            Status
            <select
              className={`${fieldClass} mt-2`}
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-[#101828]">
            Priority
            <select
              className={`${fieldClass} mt-2`}
              value={priority}
              onChange={(event) => {
                setPriority(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All priorities</option>
              {PRIORITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-[#e4e7ec] bg-white shadow-sm">
        {error ? (
          <div className="px-6 py-14 text-center">
            <p role="alert" className="text-red-600">{error}</p>
            <button
              type="button"
              className="mt-3 font-semibold text-[#078b43]"
              onClick={() => setRevision((value) => value + 1)}
            >
              Try again
            </button>
          </div>
        ) : loading ? (
          <p role="status" className="px-6 py-16 text-center text-[#667085]">
            Loading complaints…
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-[#e4e7ec] bg-[#f9fafb] text-xs font-semibold text-[#475467]">
                <tr>
                  <th className="px-5 py-4">Subject</th>
                  <th className="px-3 py-4">Customer</th>
                  <th className="px-3 py-4">Priority</th>
                  <th className="px-3 py-4">Status</th>
                  <th className="px-3 py-4">Assigned to</th>
                  <th className="px-3 py-4">Filed</th>
                  <th className="px-5 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e4e7ec]">
                {result.data.map((complaint) => (
                  <tr key={complaint.id} className="transition hover:bg-[#fcfcfd]">
                    <td className="max-w-64 px-5 py-3.5">
                      <p className="truncate font-semibold text-[#101828]">{complaint.subject}</p>
                    </td>
                    <td className="px-3 py-3.5">
                      <p className="font-medium">{customerName(complaint.user)}</p>
                      <p className="mt-0.5 text-xs text-[#667085]">
                        {complaint.user?.email || complaint.user?.phone || "—"}
                      </p>
                    </td>
                    <td className="px-3 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium capitalize ${
                          priorityStyles[complaint.priority] || priorityStyles.medium
                        }`}
                      >
                        {complaint.priority}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${
                          statusStyles[complaint.status] || statusStyles.open
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {statusLabel(complaint.status)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3.5">{adminName(complaint.assignedAdmin)}</td>
                    <td className="whitespace-nowrap px-3 py-3.5">{date(complaint.createdAt)}</td>
                    <td className="px-5 py-3.5 text-center">
                      <ComplaintActions onView={() => setSelected(complaint)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!result.data.length && (
              <div className="px-6 py-16 text-center text-[#667085]">
                <FontAwesomeIcon icon={faHeadset} className="mb-3 text-3xl text-gray-300" />
                <p className="font-medium text-[#344054]">No complaints found</p>
                <p className="mt-1 text-sm">Try changing the search or filters.</p>
              </div>
            )}
          </div>
        )}

        {!error && !loading && result.data.length > 0 && (
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e4e7ec] px-5 py-4 text-sm text-[#667085]">
            <p>
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, result.meta.totalItems || 0)} of {result.meta.totalItems || 0} complaints
            </p>
            <nav aria-label="Complaints pagination" className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label="Previous page"
                className="grid h-9 w-9 place-items-center rounded-lg border border-[#d0d5dd] disabled:opacity-40"
                disabled={page <= 1}
                onClick={() => setPage((value) => value - 1)}
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
              {pageNumbers.map((pageNumber) => (
                <button
                  type="button"
                  key={pageNumber}
                  aria-current={pageNumber === page ? "page" : undefined}
                  onClick={() => setPage(pageNumber)}
                  className={`h-9 min-w-9 rounded-lg border px-2 font-semibold ${
                    pageNumber === page
                      ? "border-[#078b43] bg-[#078b43] text-white"
                      : "border-[#d0d5dd] bg-white text-[#344054]"
                  }`}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                type="button"
                aria-label="Next page"
                className="grid h-9 w-9 place-items-center rounded-lg border border-[#d0d5dd] disabled:opacity-40"
                disabled={page >= totalPages}
                onClick={() => setPage((value) => value + 1)}
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </nav>
          </footer>
        )}
      </section>

      {selected && (
        <ComplaintDetail
          complaint={selected}
          canUpdate={canUpdate}
          admins={admins}
          onClose={() => setSelected(null)}
          onSaved={() => {
            setSelected(null);
            setRevision((value) => value + 1);
          }}
        />
      )}
    </main>
  );
}
