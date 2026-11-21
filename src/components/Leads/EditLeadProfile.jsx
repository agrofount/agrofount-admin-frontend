import { useState } from "react";
import { toast } from "react-toastify";
import {
  BUYER_TYPES,
  PRODUCT_INTERESTS,
  getErrorMessage,
  updateLeadProfile,
} from "./leadOwnership";

const FIELDS = ["name", "contactPerson", "email", "townOrLga", "state", "buyerType", "productInterest"];
const field =
  "mt-1 h-9 w-full rounded-md border border-[#d0d5dd] px-3 text-xs font-normal outline-none focus:border-[#008f45]";
const label = "block text-[10px] font-semibold uppercase tracking-wide text-[#667085]";

const initial = (lead) =>
  Object.fromEntries(FIELDS.map((k) => [k, lead?.[k] ?? ""]));

// The phone number cannot be changed. Only edited fields are sent.
const EditLeadProfile = ({ lead, onSaved }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initial(lead));
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    const before = initial(lead);
    const body = {};
    FIELDS.forEach((k) => {
      const next = String(form[k]).trim();
      if (next !== String(before[k]).trim() && next !== "") body[k] = next;
    });
    if (Object.keys(body).length === 0) {
      setOpen(false);
      return;
    }
    try {
      setBusy(true);
      const res = await updateLeadProfile(lead.id, body);
      toast.success("Lead updated");
      setOpen(false);
      onSaved(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update lead"));
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setForm(initial(lead));
          setOpen(true);
        }}
        className="text-xs font-semibold text-[#008f45] hover:underline"
      >
        Edit profile
      </button>
    );
  }
  const select = (k, options) => (
    <select value={form[k]} onChange={set(k)} className={field}>
      <option value="">Not set</option>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
  return (
    <div className="space-y-3 rounded-lg border border-[#e5e7eb] p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={label}>Name<input value={form.name} onChange={set("name")} className={field} /></label>
        <label className={label}>Contact person<input value={form.contactPerson} onChange={set("contactPerson")} className={field} /></label>
        <label className={label}>Email<input type="email" value={form.email} onChange={set("email")} className={field} /></label>
        <label className={label}>Town or LGA<input value={form.townOrLga} onChange={set("townOrLga")} className={field} /></label>
        <label className={label}>State<input value={form.state} onChange={set("state")} className={field} /></label>
        <label className={label}>Buyer type{select("buyerType", BUYER_TYPES)}</label>
        <label className={`${label} sm:col-span-2`}>Product interest{select("productInterest", PRODUCT_INTERESTS)}</label>
      </div>
      <p className="text-[10px] text-[#98a2b3]">The phone number cannot be changed. Cleared fields are left as they are.</p>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setOpen(false)} className="h-8 rounded-md border border-[#d0d5dd] px-3 text-xs">Cancel</button>
        <button type="button" onClick={save} disabled={busy || !form.name.trim()}
          className="h-8 rounded-md bg-[#008f45] px-4 text-xs font-semibold text-white disabled:opacity-50">
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
};

export default EditLeadProfile;
