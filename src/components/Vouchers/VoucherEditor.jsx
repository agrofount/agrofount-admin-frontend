import { useEffect, useMemo, useRef, useState } from "react";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Dialog,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import {
  faBullhorn,
  faCalendarDays,
  faChevronDown,
  faChevronUp,
  faCircleXmark,
  faGift,
  faMagnifyingGlass,
  faTag,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { toast } from "react-toastify";
import { apiClient } from "../../lib/apiClient";

const DEFAULT_CAMPAIGNS = ["June Promo", "New Customer", "Welcome Offer", "Feed Discount"];

const fieldClass =
  "h-12 w-full rounded-lg border border-[#d0d5dd] bg-white text-sm text-[#101828] outline-none transition placeholder:text-[#98a2b3] focus:border-[#079447] focus:ring-2 focus:ring-[#079447]/15 disabled:bg-gray-50";

const localDate = (value) => {
  const d = new Date(value);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

const formatAmount = (value) =>
  value === "" || !Number.isFinite(Number(value))
    ? value
    : Number(value).toLocaleString("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

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

function MoneyInput({ value, onChange, min, step, label }) {
  const [focused, setFocused] = useState(false);
  const bump = (direction) => {
    const next = Math.max(min, Number(value || 0) + direction * step);
    onChange(String(next));
  };
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-[#344054]">
        ₦
      </span>
      <input
        aria-label={label}
        inputMode="decimal"
        required
        className={`${fieldClass} pl-11 pr-11`}
        value={focused ? value : formatAmount(value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(event) => {
          const raw = event.target.value.replace(/,/g, "");
          if (/^\d*\.?\d{0,2}$/.test(raw)) onChange(raw);
        }}
      />
      <span className="absolute right-3 top-1/2 flex -translate-y-1/2 flex-col text-[10px] text-[#667085]">
        <button type="button" aria-label={`Increase ${label}`} className="px-1 leading-none hover:text-[#101828]" onClick={() => bump(1)}>
          <FontAwesomeIcon icon={faChevronUp} />
        </button>
        <button type="button" aria-label={`Decrease ${label}`} className="px-1 leading-none hover:text-[#101828]" onClick={() => bump(-1)}>
          <FontAwesomeIcon icon={faChevronDown} />
        </button>
      </span>
    </div>
  );
}

function PercentInput({ value, onChange, label }) {
  const bump = (direction) => {
    const next = Math.min(50, Math.max(1, Number(value || 0) + direction));
    onChange(String(next));
  };
  return (
    <div className="relative">
      <input
        aria-label={label}
        inputMode="numeric"
        required
        className={`${fieldClass} pl-4 pr-16`}
        value={value}
        onChange={(event) => {
          const raw = event.target.value.replace(/[^\d]/g, "");
          if (raw === "" || Number(raw) <= 50) onChange(raw);
        }}
      />
      <span className="pointer-events-none absolute right-11 top-1/2 -translate-y-1/2 font-semibold text-[#344054]">
        %
      </span>
      <span className="absolute right-3 top-1/2 flex -translate-y-1/2 flex-col text-[10px] text-[#667085]">
        <button type="button" aria-label={`Increase ${label}`} className="px-1 leading-none hover:text-[#101828]" onClick={() => bump(1)}>
          <FontAwesomeIcon icon={faChevronUp} />
        </button>
        <button type="button" aria-label={`Decrease ${label}`} className="px-1 leading-none hover:text-[#101828]" onClick={() => bump(-1)}>
          <FontAwesomeIcon icon={faChevronDown} />
        </button>
      </span>
    </div>
  );
}

export function VoucherEditor({ voucher, onClose, onSaved, canReadUsers, campaigns = [] }) {
  const editing = Boolean(voucher);
  // Vouchers created before percentage discounts shipped keep their flat
  // naira amount and editing UX; only percentage-type (new) vouchers use
  // the percent input and its 1-50 validation.
  const isLegacyFixed = editing && voucher?.discountType !== "percentage";
  const [form, setForm] = useState(() => ({
    userId: voucher?.user?.id || "",
    code: voucher?.code || "",
    amount: String(voucher?.amount ?? 10),
    minimumSpend: String(voucher?.minimumSpend ?? 0),
    campaign: voucher?.campaign || "",
    expiresAt: localDate(voucher?.expiresAt || Date.now() + 30 * 86400000),
    status: voucher?.status === "disabled" ? "disabled" : "active",
  }));
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [customerError, setCustomerError] = useState("");
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const expiryRef = useRef(null);
  const change = (key, value) => setForm((old) => ({ ...old, [key]: value }));

  const campaignOptions = useMemo(() => {
    const all = [...new Set([...DEFAULT_CAMPAIGNS, ...campaigns.filter(Boolean)])];
    const query = form.campaign.trim().toLowerCase();
    return query ? all.filter((c) => c.toLowerCase().includes(query)) : all;
  }, [campaigns, form.campaign]);

  useEffect(() => {
    setCustomerLoading(false);
    if (editing || !canReadUsers || search.trim().length < 2 || selected) {
      setCustomers([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setCustomerLoading(true);
      setCustomerError("");
      try {
        const response = await apiClient.get("/user", {
          params: { search: search.trim(), limit: 10 },
          signal: controller.signal,
        });
        setCustomers(response.data.data || []);
      } catch (err) {
        if (!controller.signal.aborted)
          setCustomerError(err.message || "Customer search failed");
      } finally {
        if (!controller.signal.aborted) setCustomerLoading(false);
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, selected, editing, canReadUsers]);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!editing && !form.userId) {
      setError("Select a customer first.");
      return;
    }
    const amount = Number(form.amount);
    const minimumSpend = Number(form.minimumSpend || 0);
    if (isLegacyFixed) {
      if (!Number.isInteger(amount) || amount < 1) {
        setError("Discount must be a whole naira amount of at least ₦1.");
        return;
      }
    } else if (!Number.isInteger(amount) || amount < 1 || amount > 50) {
      setError("Discount must be a whole percentage between 1 and 50.");
      return;
    }
    if (!Number.isFinite(minimumSpend) || minimumSpend < 0) {
      setError("Minimum spend cannot be negative.");
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
        amount,
        minimumSpend,
        campaign: form.campaign.trim(),
        expiresAt: expiresAt.toISOString(),
      };
      if (editing)
        await apiClient.patch(
          `/voucher/admin/${encodeURIComponent(voucher.code)}`,
          { ...payload, status: form.status }
        );
      else
        await apiClient.post("/voucher/admin", {
          ...payload,
          userId: form.userId,
          ...(form.code.trim() ? { code: form.code.trim().toUpperCase() } : {}),
        });
      toast.success(editing ? "Voucher updated" : "Voucher created");
      onSaved();
    } catch (err) {
      setError(err.message || "Unable to save voucher");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={() => !saving && onClose()} className="relative z-50">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 overflow-y-auto p-4">
        <div className="flex min-h-full items-center justify-center">
          <DialogPanel className="w-full max-w-[700px] rounded-2xl bg-white p-6 shadow-xl sm:p-7">
            <div className="flex items-start gap-4">
              <span className="grid h-[72px] w-[72px] shrink-0 place-items-center rounded-2xl bg-[#e7f8ee] text-3xl text-[#078b43]">
                <FontAwesomeIcon icon={faGift} />
              </span>
              <div className="min-w-0 flex-1 pt-1">
                <DialogTitle className="text-2xl font-bold text-[#101828]">
                  {editing ? `Edit voucher ${voucher.code}` : "Create voucher"}
                </DialogTitle>
                <p className="mt-1 text-sm text-[#667085]">
                  {editing
                    ? "Update the discount, expiry or status. Saving does not send a message."
                    : "Create a single-use discount for one customer. Creating a voucher does not send a message."}
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
              {!editing && (
                <div className="rounded-xl border border-[#d6f0df] bg-gradient-to-r from-[#f3fbf6] to-[#fafdfb] p-4">
                  <FieldLabel
                    title="Customer"
                    hint={canReadUsers ? "Find and select the customer who will receive this voucher." : "Enter the ID of the customer who will receive this voucher."}
                    required
                  />
                  {selected ? (
                    <div className="flex items-center gap-3 rounded-lg border border-[#d0d5dd] bg-white px-4 py-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#fff0dd] font-semibold text-[#f79009]">
                        {(selected.firstname?.[0] || selected.email?.[0] || "?").toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#101828]">
                          {[selected.firstname, selected.lastname].filter(Boolean).join(" ") || "Unnamed customer"}
                        </p>
                        <p className="truncate text-xs text-[#667085]">{selected.email || selected.phone}</p>
                      </div>
                      <button
                        type="button"
                        className="text-sm font-semibold text-[#078b43]"
                        onClick={() => {
                          setSelected(null);
                          change("userId", "");
                        }}
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <FontAwesomeIcon
                        icon={faMagnifyingGlass}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#667085]"
                      />
                      <input
                        aria-label={canReadUsers ? "Search customers" : "Customer ID"}
                        className={`${fieldClass} pl-11 pr-4`}
                        placeholder={canReadUsers ? "Search by name, email or phone..." : "Customer ID"}
                        value={canReadUsers ? search : form.userId}
                        required={!canReadUsers}
                        onChange={(e) => {
                          if (canReadUsers) {
                            setSearch(e.target.value);
                            change("userId", "");
                          } else change("userId", e.target.value);
                        }}
                      />
                      {canReadUsers && search.trim().length >= 2 && (
                        <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-52 overflow-y-auto rounded-lg border border-[#e4e7ec] bg-white py-1 shadow-lg">
                          {customerLoading ? (
                            <p role="status" className="px-4 py-2.5 text-sm text-[#667085]">Searching customers…</p>
                          ) : customerError ? (
                            <p role="alert" className="px-4 py-2.5 text-sm text-red-600">{customerError}</p>
                          ) : customers.length === 0 ? (
                            <p className="px-4 py-2.5 text-sm text-[#667085]">No customers found. Refine your search.</p>
                          ) : (
                            customers.map((customer) => (
                              <button
                                key={customer.id}
                                type="button"
                                className="block w-full px-4 py-2.5 text-left hover:bg-[#f3fbf6]"
                                onClick={() => {
                                  setSelected(customer);
                                  change("userId", customer.id);
                                }}
                              >
                                <p className="text-sm font-medium text-[#101828]">
                                  {[customer.firstname, customer.lastname].filter(Boolean).join(" ") || "Unnamed customer"}
                                </p>
                                <p className="text-xs text-[#667085]">{customer.email || customer.phone}</p>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                {!editing && (
                  <div>
                    <FieldLabel title="Voucher code (optional)" hint="Leave blank to auto-generate a unique code." />
                    <div className="relative">
                      <FontAwesomeIcon icon={faTag} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#667085]" />
                      <input
                        aria-label="Voucher code"
                        className={`${fieldClass} pl-11 pr-4 uppercase placeholder:normal-case`}
                        value={form.code}
                        minLength={3}
                        maxLength={40}
                        pattern="[A-Za-z0-9_-]{3,40}"
                        title="3 to 40 letters, numbers, dashes or underscores"
                        placeholder="e.g. AGF-2026-001"
                        onChange={(e) => change("code", e.target.value)}
                      />
                    </div>
                  </div>
                )}
                <div className={editing ? "sm:col-span-2" : ""}>
                  <FieldLabel title="Campaign (optional)" hint="E.g. June Promo, New Customer, etc." />
                  <Combobox
                    value={form.campaign}
                    onChange={(value) => change("campaign", value ?? "")}
                  >
                    <div className="relative">
                      <FontAwesomeIcon icon={faBullhorn} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#344054]" />
                      <ComboboxInput
                        aria-label="Campaign"
                        maxLength={80}
                        className={`${fieldClass} pl-11 pr-10`}
                        placeholder="Select or type campaign"
                        onChange={(e) => change("campaign", e.target.value)}
                      />
                      <ComboboxButton className="absolute inset-y-0 right-0 px-4 text-[#344054]">
                        <FontAwesomeIcon icon={faChevronDown} />
                      </ComboboxButton>
                    </div>
                    {campaignOptions.length > 0 && (
                      <ComboboxOptions
                        anchor="bottom start"
                        className="z-[60] mt-1 max-h-52 w-[var(--input-width)] overflow-y-auto rounded-lg border border-[#e4e7ec] bg-white py-1 shadow-lg empty:invisible"
                      >
                        {campaignOptions.map((option) => (
                          <ComboboxOption
                            key={option}
                            value={option}
                            className="cursor-pointer px-4 py-2.5 text-sm text-[#101828] data-[focus]:bg-[#f3fbf6]"
                          >
                            {option}
                          </ComboboxOption>
                        ))}
                      </ComboboxOptions>
                    )}
                  </Combobox>
                </div>
                <div>
                  {isLegacyFixed ? (
                    <>
                      <FieldLabel title="Discount amount (₦)" hint="Amount to deduct from the customer's order." required />
                      <MoneyInput label="discount amount" value={form.amount} min={1} step={100} onChange={(v) => change("amount", v)} />
                    </>
                  ) : (
                    <>
                      <FieldLabel title="Discount (%)" hint="Percentage of the order subtotal to deduct, 1-50%." required />
                      <PercentInput label="discount percentage" value={form.amount} onChange={(v) => change("amount", v)} />
                    </>
                  )}
                </div>
                <div>
                  <FieldLabel title="Minimum spend (₦)" hint="Minimum order amount required to use this voucher." />
                  <MoneyInput label="minimum spend" value={form.minimumSpend} min={0} step={500} onChange={(v) => change("minimumSpend", v)} />
                </div>
              </div>

              <div>
                <FieldLabel title="Expires at (your local time)" hint="Set the date and time when this voucher will no longer be valid." required />
                <div className="relative">
                  <FontAwesomeIcon icon={faCalendarDays} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#344054]" />
                  <input
                    ref={expiryRef}
                    type="datetime-local"
                    aria-label="Expires at"
                    required
                    className={`${fieldClass} pl-11 pr-11 [&::-webkit-calendar-picker-indicator]:hidden`}
                    value={form.expiresAt}
                    onClick={() => expiryRef.current?.showPicker?.()}
                    onChange={(e) => change("expiresAt", e.target.value)}
                  />
                  {form.expiresAt && (
                    <button
                      type="button"
                      aria-label="Clear expiry date"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#98a2b3] hover:text-[#667085]"
                      onClick={() => change("expiresAt", "")}
                    >
                      <FontAwesomeIcon icon={faCircleXmark} />
                    </button>
                  )}
                </div>
              </div>

              {editing && (
                <div>
                  <FieldLabel title="Status" hint="Disabled vouchers cannot be used at checkout." />
                  <select
                    aria-label="Status"
                    className={`${fieldClass} px-4`}
                    value={form.status}
                    onChange={(e) => change("status", e.target.value)}
                  >
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              )}

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
                  disabled={saving}
                  className="flex h-12 items-center gap-2 rounded-lg bg-[#078b43] px-6 text-sm font-semibold text-white shadow-sm hover:bg-[#06793a] disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faGift} />
                  {saving ? "Saving…" : editing ? "Save changes" : "Create voucher"}
                </button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
