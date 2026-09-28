import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import {
  faCalendarDays,
  faChevronDown,
  faChevronUp,
  faLayerGroup,
  faMagnifyingGlass,
  faUsers,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { toast } from "react-toastify";
import { apiClient } from "../../lib/apiClient";

const fieldClass =
  "h-12 w-full rounded-lg border border-[#d0d5dd] bg-white px-4 text-sm text-[#101828] outline-none transition placeholder:text-[#98a2b3] focus:border-[#079447] focus:ring-2 focus:ring-[#079447]/15 disabled:bg-gray-50";

const SEGMENTS = [
  {
    value: "never_ordered",
    label: "Registered but never ordered",
    hint: "Help them choose products and complete their first order.",
  },
  {
    value: "one_time_buyer",
    label: "Bought once, never returned",
    hint: "Recommend a relevant next purchase.",
  },
  {
    value: "lapsed_regular",
    label: "Previously regular customers",
    hint: "A restocking nudge for people who used to order often.",
  },
  {
    value: "high_value_churned",
    label: "High-spending customers who stopped",
    hint: "High lifetime spend, but gone quiet.",
  },
];

const localDate = (value) => {
  const d = new Date(value);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

const money = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const shortDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const customerName = (c) =>
  [c.firstname, c.lastname].filter(Boolean).join(" ") || "Unnamed customer";

const AVATAR_STYLES = [
  "bg-[#e7edff] text-[#3b5bdb]",
  "bg-[#fff0dd] text-[#f79009]",
  "bg-[#e7f8ee] text-[#078b43]",
  "bg-[#fee9e9] text-[#ed3038]",
  "bg-[#f2e9ff] text-[#7c3aed]",
];

const customerInitial = (c, index) => {
  const name = customerName(c);
  const initial =
    name === "Unnamed customer"
      ? (c.email || c.phone || "?")[0]
      : name[0];
  return {
    letter: initial.toUpperCase(),
    style: AVATAR_STYLES[index % AVATAR_STYLES.length],
  };
};

function FieldLabel({ title, hint, required }) {
  return (
    <div className="mb-2">
      <p className="text-sm font-semibold text-[#101828]">
        {title}
        {required && <span className="ml-1 text-[#f04438]">*</span>}
      </p>
      {hint && <p className="mt-0.5 text-xs text-[#667085]">{hint}</p>}
    </div>
  );
}

export function VoucherBulkGenerateModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    segment: SEGMENTS[0].value,
    amount: "1000",
    minimumSpend: "0",
    campaign: "",
    expiresAt: localDate(Date.now() + 30 * 86400000),
    inactivityDays: "90",
    minOrders: "3",
    minLifetimeSpend: "100000",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState("");
  const [previewOpen, setPreviewOpen] = useState(true);
  const change = (key, value) => setForm((old) => ({ ...old, [key]: value }));

  const matchCriteria = {
    segment: form.segment,
    inactivityDays: Number(form.inactivityDays || 90),
    ...(form.segment === "lapsed_regular"
      ? { minOrders: Number(form.minOrders || 3) }
      : {}),
    ...(form.segment === "high_value_churned"
      ? { minLifetimeSpend: Number(form.minLifetimeSpend || 100000) }
      : {}),
  };

  useEffect(() => {
    const controller = new AbortController();
    setPreviewLoading(true);
    setPreviewError("");
    const timer = setTimeout(async () => {
      try {
        const response = await apiClient.post(
          "/voucher/admin/bulk/preview",
          matchCriteria,
          { signal: controller.signal }
        );
        setPreview(response.data);
      } catch (err) {
        if (!controller.signal.aborted)
          setPreviewError(err.message || "Unable to preview this segment");
      } finally {
        if (!controller.signal.aborted) setPreviewLoading(false);
      }
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.segment, form.inactivityDays, form.minOrders, form.minLifetimeSpend]);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    const amount = Number(form.amount);
    if (!Number.isInteger(amount) || amount < 1) {
      setError("Discount must be a whole naira amount of at least ₦1.");
      return;
    }
    if (!form.campaign.trim()) {
      setError("Give this campaign a label - it's also used to avoid duplicate vouchers if you run it again.");
      return;
    }
    const expiresAt = new Date(form.expiresAt);
    if (!Number.isFinite(expiresAt.getTime()) || expiresAt <= new Date()) {
      setError("Choose a future expiry date.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...matchCriteria,
        amount,
        campaign: form.campaign.trim(),
        expiresAt: expiresAt.toISOString(),
        minimumSpend: Number(form.minimumSpend || 0),
      };
      const response = await apiClient.post("/voucher/admin/bulk", payload);
      const { matched, created } = response.data;
      toast.success(
        created > 0
          ? `Created ${created} voucher${created === 1 ? "" : "s"} for "${form.campaign.trim()}" (${matched} customers matched).`
          : `No new vouchers created - ${matched} customers matched but all already have one for this campaign.`
      );
      onSaved();
    } catch (err) {
      setError(err.message || "Unable to generate vouchers");
    } finally {
      setSaving(false);
    }
  };

  const segment = SEGMENTS.find((s) => s.value === form.segment);
  const canSubmit = !previewLoading && !previewError && (preview?.matched ?? 0) > 0;

  return (
    <Dialog open onClose={() => !saving && onClose()} className="relative z-50">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 overflow-y-auto p-2 sm:p-4">
        <div className="flex min-h-full items-center justify-center">
          <DialogPanel className="w-full max-w-[760px] rounded-2xl bg-white p-4 shadow-xl sm:p-7">
            <div className="flex items-start gap-3 sm:gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#e7f8ee] text-xl text-[#078b43] sm:h-[72px] sm:w-[72px] sm:text-3xl">
                <FontAwesomeIcon icon={faLayerGroup} />
              </span>
              <div className="min-w-0 flex-1 pt-1">
                <DialogTitle className="text-lg font-bold text-[#101828] sm:text-2xl">
                  Bulk generate vouchers
                </DialogTitle>
                <p className="mt-1 text-xs text-[#667085] sm:text-sm">
                  Create one voucher per customer in a segment. Customers with an unresolved
                  complaint are automatically skipped.
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

            <form onSubmit={submit} className="mt-6 space-y-5">
              <div>
                <FieldLabel title="Customer segment" required />
                <select
                  aria-label="Customer segment"
                  className={`${fieldClass} px-4`}
                  value={form.segment}
                  onChange={(e) => change("segment", e.target.value)}
                >
                  {SEGMENTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                {segment && (
                  <p className="mt-1.5 text-xs text-[#667085]">{segment.hint}</p>
                )}
              </div>

              {form.segment !== "never_ordered" && (
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <FieldLabel
                      title="Inactivity threshold (days)"
                      hint="No qualifying order in this many days."
                    />
                    <input
                      aria-label="Inactivity threshold in days"
                      type="number"
                      min={1}
                      max={3650}
                      className={fieldClass}
                      value={form.inactivityDays}
                      onChange={(e) => change("inactivityDays", e.target.value)}
                    />
                  </div>
                  {form.segment === "lapsed_regular" && (
                    <div>
                      <FieldLabel
                        title="Minimum past orders"
                        hint='How many orders make someone "regular".'
                      />
                      <input
                        aria-label="Minimum past orders"
                        type="number"
                        min={2}
                        max={100}
                        className={fieldClass}
                        value={form.minOrders}
                        onChange={(e) => change("minOrders", e.target.value)}
                      />
                    </div>
                  )}
                  {form.segment === "high_value_churned" && (
                    <div>
                      <FieldLabel
                        title="Minimum lifetime spend (₦)"
                        hint='How much makes someone "high value".'
                      />
                      <input
                        aria-label="Minimum lifetime spend"
                        type="number"
                        min={0}
                        className={fieldClass}
                        value={form.minLifetimeSpend}
                        onChange={(e) => change("minLifetimeSpend", e.target.value)}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="rounded-xl border border-[#e4e7ec] bg-[#f9fafb] p-4">
                <button
                  type="button"
                  onClick={() => setPreviewOpen((open) => !open)}
                  aria-expanded={previewOpen}
                  className="flex w-full items-center justify-between gap-3 text-left"
                >
                  <p className="flex items-center gap-2 text-sm font-semibold text-[#101828]">
                    <FontAwesomeIcon icon={faUsers} className="text-[#667085]" />
                    {previewLoading
                      ? "Matching customers…"
                      : previewError
                      ? "Preview unavailable"
                      : `${preview?.matched ?? 0} customer${(preview?.matched ?? 0) === 1 ? "" : "s"} match this segment`}
                  </p>
                  <FontAwesomeIcon
                    icon={previewOpen ? faChevronUp : faChevronDown}
                    className="text-[#667085]"
                  />
                </button>

                {previewOpen && (previewError ? (
                  <p role="alert" className="mt-2 text-sm text-red-600">
                    {previewError}
                  </p>
                ) : previewLoading ? (
                  <p role="status" className="mt-2 text-sm text-[#667085]">
                    <FontAwesomeIcon icon={faMagnifyingGlass} className="mr-2" />
                    Looking up matching customers…
                  </p>
                ) : preview?.customers?.length ? (
                  <div className="mt-3 max-h-72 overflow-auto rounded-lg border border-[#e4e7ec] bg-white">
                    <table className="w-full min-w-[640px] text-left text-sm">
                      <thead className="sticky top-0 border-b border-[#e4e7ec] bg-[#f9fafb] text-xs font-semibold text-[#475467]">
                        <tr>
                          <th className="px-3 py-2.5">#</th>
                          <th className="px-3 py-2.5">Customer</th>
                          <th className="px-3 py-2.5">Contact</th>
                          <th className="px-3 py-2.5">Orders</th>
                          <th className="px-3 py-2.5">Lifetime spend</th>
                          <th className="px-3 py-2.5">Last order</th>
                          <th className="px-3 py-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e4e7ec]">
                        {preview.customers.map((c, index) => {
                          const avatar = customerInitial(c, index);
                          return (
                            <tr key={c.id}>
                              <td className="px-3 py-3 text-[#667085]">{index + 1}</td>
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-2.5">
                                  <span
                                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${avatar.style}`}
                                  >
                                    {avatar.letter}
                                  </span>
                                  <span className="font-medium text-[#101828]">
                                    {customerName(c)}
                                  </span>
                                </div>
                              </td>
                              <td className="px-3 py-3 text-[#667085]">
                                {c.email || c.phone || "—"}
                              </td>
                              <td className="px-3 py-3">{c.orderCount}</td>
                              <td className="px-3 py-3">{money(c.lifetimeSpent)}</td>
                              <td className="px-3 py-3">{shortDate(c.lastOrderAt)}</td>
                              <td className="px-3 py-3">
                                <span className="inline-flex items-center rounded-md bg-[#e7f8ee] px-2.5 py-1 text-xs font-medium text-[#078b43]">
                                  Eligible
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {preview.matched > preview.customers.length && (
                      <p className="border-t border-[#e4e7ec] px-3 py-2 text-[11px] text-[#667085]">
                        Showing {preview.customers.length} of {preview.matched} matched customers.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-[#667085]">
                    No customers currently match this segment and its filters.
                  </p>
                ))}
              </div>

              <div>
                <FieldLabel
                  title="Campaign label"
                  hint="Also used as the idempotency key - re-running the same label won't create duplicate vouchers."
                  required
                />
                <input
                  aria-label="Campaign label"
                  className={fieldClass}
                  maxLength={80}
                  placeholder="e.g. Winback-Sept-2026"
                  value={form.campaign}
                  onChange={(e) => change("campaign", e.target.value)}
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <FieldLabel title="Discount amount (₦)" required />
                  <input
                    aria-label="Discount amount"
                    type="number"
                    min={1}
                    step={100}
                    required
                    className={fieldClass}
                    value={form.amount}
                    onChange={(e) => change("amount", e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel title="Minimum spend (₦)" hint="Optional." />
                  <input
                    aria-label="Minimum spend"
                    type="number"
                    min={0}
                    step={500}
                    className={fieldClass}
                    value={form.minimumSpend}
                    onChange={(e) => change("minimumSpend", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <FieldLabel title="Expires at (your local time)" required />
                <div className="relative">
                  <FontAwesomeIcon
                    icon={faCalendarDays}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#344054]"
                  />
                  <input
                    type="datetime-local"
                    aria-label="Expires at"
                    required
                    className={`${fieldClass} pl-11`}
                    value={form.expiresAt}
                    onChange={(e) => change("expiresAt", e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <p role="alert" className="text-sm text-red-600">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  disabled={saving}
                  className="h-12 rounded-lg border border-[#d0d5dd] bg-white px-6 text-sm font-semibold text-[#101828] hover:bg-gray-50 disabled:opacity-50"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  disabled={saving || !canSubmit}
                  title={
                    !canSubmit && !previewLoading
                      ? "No customers match this segment yet"
                      : undefined
                  }
                  className="flex h-12 items-center gap-2 rounded-lg bg-[#078b43] px-6 text-sm font-semibold text-white shadow-sm hover:bg-[#06793a] disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faLayerGroup} />
                  {saving
                    ? "Generating…"
                    : preview?.matched
                    ? `Generate ${preview.matched} voucher${preview.matched === 1 ? "" : "s"}`
                    : "Generate vouchers"}
                </button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
