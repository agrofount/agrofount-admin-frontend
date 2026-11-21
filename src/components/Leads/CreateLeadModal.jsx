import { useState } from "react";
import { toast } from "react-toastify";
import {
  BUYER_TYPES,
  LEAD_CREATE_SOURCES,
  PRODUCT_INTERESTS,
  createLead,
  getErrorMessage,
} from "./leadOwnership";

const field =
  "mt-1 h-9 w-full rounded-md border border-[#d0d5dd] px-3 text-xs font-normal outline-none focus:border-[#008f45]";
const label = "block text-[10px] font-semibold uppercase tracking-wide text-[#667085]";
const EMPTY = {
  name: "", phone: "", source: "manual", contactPerson: "", email: "", townOrLga: "",
  state: "", buyerType: "", productInterest: "", note: "", assignToMe: true,
};

const CreateLeadModal = ({ canAssign, onClose, onCreated }) => {
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const body = { name: form.name.trim(), phone: form.phone.trim(), source: form.source };
    ["contactPerson", "email", "townOrLga", "state", "buyerType", "productInterest", "note"].forEach((k) => {
      if (form[k].trim()) body[k] = form[k].trim();
    });
    if (canAssign && form.assignToMe) body.assignToMe = true;
    try {
      setBusy(true);
      const res = await createLead(body);
      if (res.data?.duplicate) {
        toast.info("This phone number already exists. A note was added to the existing lead and its owner is unchanged.");
      } else {
        toast.success("Lead created");
      }
      onCreated();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to create lead"));
    } finally {
      setBusy(false);
    }
  };

  const select = (k, options, placeholder) => (
    <select value={form[k]} onChange={set(k)} className={field}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={submit} className="max-h-[90vh] w-full max-w-lg space-y-3 overflow-y-auto rounded-xl bg-white p-5">
        <h2 className="text-sm font-semibold">Add a lead</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={label}>Name *<input required value={form.name} onChange={set("name")} className={field} /></label>
          <label className={label}>Phone *<input required value={form.phone} onChange={set("phone")} placeholder="0803 000 0000" className={field} /></label>
          <label className={label}>Source *{select("source", LEAD_CREATE_SOURCES)}</label>
          <label className={label}>Contact person<input value={form.contactPerson} onChange={set("contactPerson")} className={field} /></label>
          <label className={label}>Email<input type="email" value={form.email} onChange={set("email")} className={field} /></label>
          <label className={label}>Town or LGA<input value={form.townOrLga} onChange={set("townOrLga")} className={field} /></label>
          <label className={label}>State<input value={form.state} onChange={set("state")} className={field} /></label>
          <label className={label}>Buyer type{select("buyerType", BUYER_TYPES, "Not set")}</label>
          <label className={`${label} sm:col-span-2`}>Product interest{select("productInterest", PRODUCT_INTERESTS, "Not set")}</label>
        </div>
        <label className={label}>Note
          <textarea rows={2} value={form.note} onChange={set("note")} className={`${field} h-auto py-2`} />
        </label>
        {canAssign && (
          <label className="flex items-center gap-2 text-xs text-[#344054]">
            <input type="checkbox" checked={form.assignToMe}
              onChange={(e) => setForm((f) => ({ ...f, assignToMe: e.target.checked }))} />
            Assign this lead to me
          </label>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-9 rounded-md border border-[#d0d5dd] px-4 text-xs">Cancel</button>
          <button type="submit" disabled={busy || !form.name.trim() || !form.phone.trim()}
            className="h-9 rounded-md bg-[#008f45] px-4 text-xs font-semibold text-white disabled:opacity-50">
            {busy ? "Saving…" : "Add lead"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateLeadModal;
