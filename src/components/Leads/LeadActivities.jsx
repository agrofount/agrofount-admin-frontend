import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  addLeadActivity,
  fetchLeadActivities,
  formatWhen,
  getErrorMessage,
  toNumber,
} from "./leadOwnership";

const TYPES = [
  ["call", "Call"],
  ["whatsapp", "WhatsApp"],
  ["visit", "Visit"],
  ["quote", "Quote"],
  ["note", "Note"],
];
const ngn = (kobo) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 })
    .format(toNumber(kobo) / 100);
const field =
  "w-full rounded-md border border-[#d0d5dd] px-3 py-2 text-xs outline-none focus:border-[#008f45]";

// canWrite: update permission and not locked by another owner.
const LeadActivities = ({ leadId, canWrite, lockedReason, onLogged }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ type: "call", summary: "", quoteNgn: "", nextAction: "", nextActionAt: "" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchLeadActivities(leadId, { page: 1, limit: 50 });
      setItems(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load activity"));
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (form.nextAction && !form.nextActionAt) {
      toast.error("Choose a date for the next action.");
      return;
    }
    const body = { type: form.type, idempotencyKey: crypto.randomUUID() };
    if (form.summary.trim()) body.summary = form.summary.trim();
    if (form.type === "quote" && form.quoteNgn) {
      body.quoteAmountKobo = Math.round(Number(form.quoteNgn) * 100);
    }
    if (form.nextAction.trim()) {
      body.nextAction = form.nextAction.trim();
      body.nextActionAt = new Date(form.nextActionAt).toISOString();
    }
    try {
      setSaving(true);
      await addLeadActivity(leadId, body);
      setForm({ type: "call", summary: "", quoteNgn: "", nextAction: "", nextActionAt: "" });
      await load();
      onLogged?.();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to log activity"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      {canWrite ? (
        <div className="space-y-2 rounded-lg border border-[#e5e7eb] p-3">
          <div className="flex gap-2">
            <select value={form.type} onChange={set("type")} className={`${field} w-32`}>
              {TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
            {form.type === "quote" && (
              <input type="number" min="0" value={form.quoteNgn} onChange={set("quoteNgn")}
                placeholder="Quote amount (NGN)" className={field} />
            )}
          </div>
          <textarea rows={2} value={form.summary} onChange={set("summary")}
            placeholder="What happened" className={field} />
          <div className="flex gap-2">
            <input value={form.nextAction} onChange={set("nextAction")}
              placeholder="Next action (optional)" className={field} />
            <input type="datetime-local" value={form.nextActionAt} onChange={set("nextActionAt")}
              className={`${field} w-52`} />
          </div>
          <div className="flex justify-end">
            <button type="button" onClick={submit} disabled={saving}
              className="h-8 rounded-md bg-[#008f45] px-4 text-xs font-semibold text-white disabled:opacity-50">
              {saving ? "Saving…" : "Log activity"}
            </button>
          </div>
        </div>
      ) : (
        <p className="rounded-md bg-[#f9fafb] px-3 py-2 text-[11px] text-[#667085]">
          {lockedReason || "You can read this activity but not add to it."}
        </p>
      )}

      {loading ? (
        <p className="text-xs text-[#667085]">Loading activity…</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-[#98a2b3]">No activity yet.</p>
      ) : (
        <ol className="space-y-2">
          {items.map((a) => (
            <li key={a.id} className="rounded-lg border border-[#e5e7eb] px-4 py-3 text-xs text-[#344054]">
              <p className="font-semibold capitalize">
                {a.type}
                {a.quoteAmountKobo ? ` · ${ngn(a.quoteAmountKobo)}` : ""}
              </p>
              {a.summary && <p className="mt-1 whitespace-pre-wrap break-words">{a.summary}</p>}
              {a.nextAction && (
                <p className="mt-1 text-[#667085]">
                  Next: {a.nextAction}{a.nextActionAt ? ` (${formatWhen(a.nextActionAt)})` : ""}
                </p>
              )}
              <p className="mt-2 text-[10px] text-[#667085]">
                {a.author?.name || "Unknown admin"} · {formatWhen(a.occurredAt || a.createdAt)}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};

export default LeadActivities;
