import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Popover,
  PopoverButton,
  PopoverPanel,
} from "@headlessui/react";
import {
  faCalendarDays,
  faChevronLeft,
  faChevronRight,
  faClock,
  faEllipsis,
  faGift,
  faLayerGroup,
  faMagnifyingGlass,
  faPercent,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { toast } from "react-toastify";
import { apiClient } from "../../lib/apiClient";
import { usePermission } from "../Hooks/usePermission";
import { ACTIONS, RESOURCES } from "../../constants/permissions";
import { VoucherEditor } from "./VoucherEditor";
import { VoucherBulkGenerateModal } from "./VoucherBulkGenerateModal";

const money = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));

const date = (value) => (value ? new Date(value).toLocaleString() : "—");

const dateParts = (value) => {
  if (!value) return { day: "—", time: "" };
  const parsed = new Date(value);
  return {
    day: parsed.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    time: parsed.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }),
  };
};

const shortDate = (value) =>
  new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const statusOf = (voucher) =>
  voucher.used || voucher.status === "redeemed"
    ? "redeemed"
    : voucher.status === "disabled"
    ? "disabled"
    : new Date(voucher.expiresAt) <= new Date()
    ? "expired"
    : voucher.status;

const customerName = (user) =>
  [user?.firstname, user?.lastname].filter(Boolean).join(" ") ||
  "Customer unavailable";

const customerInitial = (user) => {
  const name = customerName(user);
  return name === "Customer unavailable"
    ? null
    : name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
};

const statusStyles = {
  active: "bg-[#e7f8ee] text-[#07883f]",
  redeemed: "bg-[#eaf2ff] text-[#2674d9]",
  expired: "bg-[#fee9e9] text-[#ed3038]",
  disabled: "bg-gray-100 text-gray-600",
};

const buttonClass =
  "rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-50";

function StatCard({ icon, value, label, tone }) {
  const styles = {
    green: {
      card: "border-[#cbeed8] bg-gradient-to-r from-[#f5fff9] to-[#effbf4]",
      icon: "bg-[#d6f5e2] text-[#078b43]",
    },
    blue: {
      card: "border-[#cde2ff] bg-gradient-to-r from-[#f5faff] to-[#eff6ff]",
      icon: "bg-[#dcecff] text-[#2781e8]",
    },
    red: {
      card: "border-[#ffd5d5] bg-gradient-to-r from-[#fff8f8] to-[#fff1f1]",
      icon: "bg-[#ffdddd] text-[#ef343c]",
    },
  }[tone];

  return (
    <div
      className={`flex min-h-[82px] items-center gap-4 rounded-xl border px-4 py-3 ${styles.card}`}
    >
      <span
        className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-xl ${styles.icon}`}
      >
        <FontAwesomeIcon icon={icon} />
      </span>
      <div>
        <p className="text-2xl font-bold leading-none text-[#101828]">{value}</p>
        <p className="mt-2 text-sm text-[#667085]">{label}</p>
      </div>
    </div>
  );
}

function VoucherActions({ voucher, canUpdate, onDetail, onEdit, onDisable }) {
  const canChange = canUpdate && !voucher.used && voucher.status !== "redeemed";
  return (
    <Menu as="div" className="relative inline-block text-left">
      <MenuButton
        aria-label={`Actions for voucher ${voucher.code}`}
        className="grid h-9 w-9 place-items-center rounded-lg border border-[#d0d5dd] text-[#475467] transition hover:bg-gray-50"
      >
        <FontAwesomeIcon icon={faEllipsis} />
      </MenuButton>
      <MenuItems
        anchor="bottom end"
        className="z-30 mt-1 w-44 rounded-lg border border-gray-200 bg-white p-1 text-sm shadow-xl focus:outline-none"
      >
        <MenuItem>
          <button
            type="button"
            className="block w-full rounded-md px-3 py-2 text-left data-[focus]:bg-gray-100"
            onClick={onDetail}
          >
            View details
          </button>
        </MenuItem>
        {canChange && (
          <MenuItem>
            <button
              type="button"
              className="block w-full rounded-md px-3 py-2 text-left data-[focus]:bg-gray-100"
              onClick={onEdit}
            >
              {statusOf(voucher) === "active" ? "Edit voucher" : "Edit / reactivate"}
            </button>
          </MenuItem>
        )}
        {canChange && voucher.status !== "disabled" && (
          <MenuItem>
            <button
              type="button"
              className="block w-full rounded-md px-3 py-2 text-left text-red-600 data-[focus]:bg-red-50"
              onClick={onDisable}
            >
              Disable voucher
            </button>
          </MenuItem>
        )}
      </MenuItems>
    </Menu>
  );
}

export default function VoucherDashboard() {
  const { hasPermission, isAdmin } = usePermission();
  const canCreate =
    isAdmin || hasPermission(RESOURCES.VOUCHERS, ACTIONS.CREATE);
  const canUpdate =
    isAdmin || hasPermission(RESOURCES.VOUCHERS, ACTIONS.UPDATE);
  const canReadUsers = isAdmin || hasPermission(RESOURCES.USERS, ACTIONS.READ);
  const [result, setResult] = useState({ data: [], meta: {} });
  const [stats, setStats] = useState({
    totalVouchers: 0,
    activeVouchers: 0,
    expiredVouchers: 0,
  });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState("");
  const [editor, setEditor] = useState(null);
  const [bulkGenerate, setBulkGenerate] = useState(false);
  const [detail, setDetail] = useState(null);
  const [disableTarget, setDisableTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const timer = setTimeout(async () => {
      const params = { page, limit: 20, search: search.trim() || undefined };
      const now = new Date();
      // The API only allows $gt/$lt on expiresAt, so the status bound and the
      // date range are merged into at most one lower and one upper bound.
      let after = null;
      let before = null;
      if (status === "expired") {
        before = now;
        params["filter.used"] = "$eq:false";
      } else if (status) {
        params["filter.status"] = `$eq:${status}`;
        if (status === "active") after = now;
      }
      if (dateFrom) {
        const start = new Date(new Date(`${dateFrom}T00:00:00`).getTime() - 1);
        if (!after || start > after) after = start;
      }
      if (dateTo) {
        const end = new Date(`${dateTo}T23:59:59.999`);
        if (!before || end < before) before = end;
      }
      const expiryFilters = [
        after && `$gt:${after.toISOString()}`,
        before && `$lt:${before.toISOString()}`,
      ].filter(Boolean);
      if (expiryFilters.length) params["filter.expiresAt"] = expiryFilters;
      try {
        const response = await apiClient.get("/voucher/admin/all", {
          params,
          paramsSerializer: { indexes: null },
          signal: controller.signal,
        });
        setResult(response.data);
        setSelected([]);
      } catch (err) {
        if (!controller.signal.aborted)
          setError(err.message || "Unable to load vouchers");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [page, search, status, dateFrom, dateTo, revision]);

  useEffect(() => {
    const controller = new AbortController();
    setStatsLoading(true);
    apiClient
      .get("/voucher/admin/stats", { signal: controller.signal })
      .then((response) => setStats(response.data))
      .catch((err) => {
        if (!controller.signal.aborted)
          toast.error(err.message || "Unable to load voucher totals");
      })
      .finally(() => {
        if (!controller.signal.aborted) setStatsLoading(false);
      });
    return () => controller.abort();
  }, [revision]);

  const visibleIds = useMemo(
    () => result.data.map((voucher) => voucher.id),
    [result.data]
  );
  const campaigns = useMemo(
    () => [...new Set(result.data.map((voucher) => voucher.campaign).filter(Boolean))],
    [result.data]
  );
  const dateLabel =
    dateFrom && dateTo
      ? `${shortDate(dateFrom)} – ${shortDate(dateTo)}`
      : dateFrom
      ? `From ${shortDate(dateFrom)}`
      : dateTo
      ? `Until ${shortDate(dateTo)}`
      : "";
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));

  const disable = async () => {
    setSaving(true);
    try {
      await apiClient.patch(
        `/voucher/admin/${encodeURIComponent(disableTarget.code)}`,
        { status: "disabled" }
      );
      toast.success("Voucher disabled");
      setDisableTarget(null);
      setRevision((value) => value + 1);
    } catch (err) {
      toast.error(err.message || "Unable to disable voucher");
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.max(1, result.meta.totalPages || 1);
  const pageNumbers = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => {
      const start = Math.min(
        Math.max(1, page - 2),
        Math.max(1, totalPages - 4)
      );
      return start + index;
    }
  );

  return (
    <main className="space-y-4 text-[#101828]">
      <header className="grid gap-4 xl:grid-cols-[minmax(260px,1fr)_minmax(620px,1.45fr)] xl:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vouchers</h1>
          <p className="mt-1 text-base text-[#667085]">
            Create and manage customer discounts.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard
            icon={faGift}
            value={statsLoading ? "—" : stats.totalVouchers}
            label="Total Vouchers"
            tone="green"
          />
          <StatCard
            icon={faPercent}
            value={statsLoading ? "—" : stats.activeVouchers}
            label="Active Vouchers"
            tone="blue"
          />
          <StatCard
            icon={faClock}
            value={statsLoading ? "—" : stats.expiredVouchers}
            label="Expired Vouchers"
            tone="red"
          />
        </div>
      </header>

      <section className="rounded-xl border border-[#e4e7ec] bg-white p-4 shadow-sm">
        <div className="grid items-end gap-4 lg:grid-cols-[minmax(280px,2fr)_minmax(180px,0.8fr)_minmax(210px,1.1fr)_auto]">
          <label className="block text-sm font-semibold text-[#101828]">
            Search
            <span className="relative mt-2 block">
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#667085]"
              />
              <input
                className="h-12 w-full rounded-lg border border-[#d0d5dd] pl-11 pr-4 text-sm outline-none transition focus:border-[#079447] focus:ring-2 focus:ring-[#079447]/15"
                placeholder="Search by voucher code or campaign name..."
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
              className="mt-2 h-12 w-full rounded-lg border border-[#d0d5dd] bg-white px-4 text-sm outline-none focus:border-[#079447]"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="redeemed">Redeemed</option>
              <option value="expired">Expired</option>
              <option value="disabled">Disabled</option>
            </select>
          </label>
          <div className="text-sm font-semibold text-[#101828]">
            Date range
            <Popover className="relative mt-2">
              <PopoverButton className="flex h-12 w-full items-center gap-3 rounded-lg border border-[#d0d5dd] bg-white px-4 text-left text-sm font-normal outline-none focus:border-[#079447]">
                <FontAwesomeIcon icon={faCalendarDays} className="text-[#667085]" />
                <span className={`flex-1 truncate ${dateLabel ? "text-[#101828]" : "text-[#667085]"}`}>
                  {dateLabel || "Select date range"}
                </span>
              </PopoverButton>
              <PopoverPanel
                anchor="bottom start"
                className="z-30 mt-2 w-72 rounded-xl border border-[#e4e7ec] bg-white p-4 font-normal shadow-xl"
              >
                <p className="text-xs text-[#667085]">Show vouchers that expire between these dates.</p>
                <div className="mt-3 grid gap-3">
                  <label className="block text-xs font-semibold text-[#344054]">
                    From
                    <input
                      type="date"
                      className="mt-1 h-10 w-full rounded-lg border border-[#d0d5dd] px-3 text-sm outline-none focus:border-[#079447]"
                      value={dateFrom}
                      max={dateTo || undefined}
                      onChange={(event) => {
                        setDateFrom(event.target.value);
                        setPage(1);
                      }}
                    />
                  </label>
                  <label className="block text-xs font-semibold text-[#344054]">
                    To
                    <input
                      type="date"
                      className="mt-1 h-10 w-full rounded-lg border border-[#d0d5dd] px-3 text-sm outline-none focus:border-[#079447]"
                      value={dateTo}
                      min={dateFrom || undefined}
                      onChange={(event) => {
                        setDateTo(event.target.value);
                        setPage(1);
                      }}
                    />
                  </label>
                </div>
                {(dateFrom || dateTo) && (
                  <button
                    type="button"
                    className="mt-3 text-sm font-semibold text-[#078b43]"
                    onClick={() => {
                      setDateFrom("");
                      setDateTo("");
                      setPage(1);
                    }}
                  >
                    Clear dates
                  </button>
                )}
              </PopoverPanel>
            </Popover>
          </div>
          {canCreate && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditor({})}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-[#078b43] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#06793a]"
              >
                <FontAwesomeIcon icon={faGift} />
                Create voucher
              </button>
              <button
                type="button"
                onClick={() => setBulkGenerate(true)}
                className="flex h-12 items-center justify-center gap-2 rounded-lg border border-[#078b43] px-5 text-sm font-semibold text-[#078b43] shadow-sm transition hover:bg-[#f3fbf6]"
              >
                <FontAwesomeIcon icon={faLayerGroup} />
                Bulk generate
              </button>
            </div>
          )}
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
            Loading vouchers…
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="border-b border-[#e4e7ec] bg-[#f9fafb] text-xs font-semibold text-[#475467]">
                <tr>
                  <th className="w-14 px-5 py-4">
                    <input
                      type="checkbox"
                      aria-label="Select all vouchers on this page"
                      checked={allVisibleSelected}
                      onChange={(event) =>
                        setSelected(
                          event.target.checked
                            ? visibleIds
                            : selected.filter((id) => !visibleIds.includes(id))
                        )
                      }
                      className="h-4 w-4 rounded border-gray-300 accent-[#078b43]"
                    />
                  </th>
                  <th className="px-3 py-4">Code / Campaign</th>
                  <th className="px-3 py-4">Customer</th>
                  <th className="px-3 py-4">Discount</th>
                  <th className="px-3 py-4">Minimum Spend</th>
                  <th className="px-3 py-4">Status</th>
                  <th className="px-3 py-4">Expires</th>
                  <th className="min-w-40 px-3 py-4">Usage</th>
                  <th className="px-5 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e4e7ec]">
                {result.data.map((voucher) => {
                  const currentStatus = statusOf(voucher);
                  const expires = dateParts(voucher.expiresAt);
                  const initial = customerInitial(voucher.user);
                  const isUsed = voucher.used || currentStatus === "redeemed";
                  return (
                    <tr key={voucher.id} className="transition hover:bg-[#fcfcfd]">
                      <td className="px-5 py-3.5">
                        <input
                          type="checkbox"
                          aria-label={`Select voucher ${voucher.code}`}
                          checked={selected.includes(voucher.id)}
                          onChange={(event) =>
                            setSelected((values) =>
                              event.target.checked
                                ? [...values, voucher.id]
                                : values.filter((id) => id !== voucher.id)
                            )
                          }
                          className="h-4 w-4 rounded border-gray-300 accent-[#078b43]"
                        />
                      </td>
                      <td className="px-3 py-3.5">
                        <p className="font-bold text-[#101828]">{voucher.code}</p>
                        <p className="mt-1 text-xs text-[#667085]">
                          {voucher.campaign || "No campaign"}
                        </p>
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-3">
                          <span
                            className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-semibold ${
                              initial
                                ? "bg-[#fff0dd] text-[#f79009]"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {initial || <FontAwesomeIcon icon={faUser} />}
                          </span>
                          <div className="min-w-0">
                            <p className="max-w-56 truncate font-semibold text-[#101828]">
                              {customerName(voucher.user)}
                            </p>
                            <p className="mt-0.5 max-w-56 truncate text-xs text-[#667085]">
                              {voucher.user?.email || voucher.user?.phone || "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3.5 font-semibold">
                        {money(voucher.amount)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3.5 font-semibold">
                        {money(voucher.minimumSpend)}
                      </td>
                      <td className="px-3 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium capitalize ${
                            statusStyles[currentStatus] || statusStyles.disabled
                          }`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {currentStatus}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3.5">
                        <p className="font-medium">{expires.day}</p>
                        <p className="mt-0.5 text-xs text-[#667085]">{expires.time}</p>
                      </td>
                      <td className="px-3 py-3.5">
                        <p className="font-medium">{isUsed ? "1 / 1" : "0 / 1"}</p>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                          <div
                            className={`h-full rounded-full ${
                              currentStatus === "expired"
                                ? "bg-[#f04438]"
                                : currentStatus === "disabled"
                                ? "bg-gray-400"
                                : "bg-[#079447]"
                            }`}
                            style={{ width: isUsed ? "100%" : "0%" }}
                          />
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <VoucherActions
                          voucher={voucher}
                          canUpdate={canUpdate}
                          onDetail={() => setDetail(voucher)}
                          onEdit={() => setEditor({ voucher })}
                          onDisable={() => setDisableTarget(voucher)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!result.data.length && (
              <div className="px-6 py-16 text-center text-[#667085]">
                <FontAwesomeIcon icon={faGift} className="mb-3 text-3xl text-gray-300" />
                <p className="font-medium text-[#344054]">No vouchers found</p>
                <p className="mt-1 text-sm">Try changing the search or filters.</p>
              </div>
            )}
          </div>
        )}

        {!error && !loading && result.data.length > 0 && (
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e4e7ec] px-5 py-4 text-sm text-[#667085]">
            <p>
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, result.meta.totalItems || 0)} of {result.meta.totalItems || 0} vouchers
            </p>
            <nav aria-label="Voucher pagination" className="flex items-center gap-1.5">
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

      {editor && (
        <VoucherEditor
          voucher={editor.voucher}
          canReadUsers={canReadUsers}
          campaigns={campaigns}
          onClose={() => setEditor(null)}
          onSaved={() => {
            setEditor(null);
            setRevision((value) => value + 1);
          }}
        />
      )}

      {bulkGenerate && (
        <VoucherBulkGenerateModal
          onClose={() => setBulkGenerate(false)}
          onSaved={() => {
            setBulkGenerate(false);
            setRevision((value) => value + 1);
          }}
        />
      )}

      <Dialog
        open={Boolean(detail || disableTarget)}
        onClose={() => {
          if (!saving) {
            setDetail(null);
            setDisableTarget(null);
          }
        }}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-4">
          <DialogPanel className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <DialogTitle className="text-lg font-semibold">
              {disableTarget ? "Disable voucher?" : "Voucher details"}
            </DialogTitle>
            {disableTarget ? (
              <p className="my-4 text-sm text-[#475467]">
                {disableTarget.code} will no longer be usable at checkout. You can reactivate it later.
              </p>
            ) : (
              detail && (
                <dl className="my-5 grid grid-cols-2 gap-4 text-sm">
                  {Object.entries({
                    Code: detail.code,
                    Status: statusOf(detail),
                    Discount: money(detail.amount),
                    "Minimum spend": money(detail.minimumSpend),
                    Campaign: detail.campaign || "—",
                    Created: date(detail.createdAt),
                    Expires: date(detail.expiresAt),
                    Redeemed: date(detail.redeemedAt),
                  }).map(([key, value]) => (
                    <div key={key}>
                      <dt className="text-[#667085]">{key}</dt>
                      <dd className="mt-1 break-words font-medium capitalize">{value}</dd>
                    </div>
                  ))}
                </dl>
              )
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className={buttonClass}
                disabled={saving}
                onClick={() => {
                  setDetail(null);
                  setDisableTarget(null);
                }}
              >
                {disableTarget ? "Cancel" : "Close"}
              </button>
              {disableTarget && (
                <button
                  type="button"
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  disabled={saving}
                  onClick={disable}
                >
                  {saving ? "Disabling…" : "Disable voucher"}
                </button>
              )}
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </main>
  );
}
