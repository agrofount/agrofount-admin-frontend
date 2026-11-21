import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  fetchActiveAdmins,
  getErrorMessage,
  reassignLead,
} from "./leadOwnership";

// Needs the leads reassign permission; the server enforces it.
const ReassignLead = ({ lead, onDone }) => {
  const [open, setOpen] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [toOwnerId, setToOwnerId] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || admins.length) return;
    fetchActiveAdmins()
      .then((res) => setAdmins(Array.isArray(res.data?.data) ? res.data.data : []))
      .catch(() => toast.error("Could not load the admin list"));
  }, [open, admins.length]);

  const submit = async () => {
    try {
      setBusy(true);
      const res = await reassignLead(lead.id, {
        toOwnerId,
        ...(reason.trim() ? { reason: reason.trim() } : {}),
      });
      toast.success("Lead reassigned");
      setOpen(false);
      setToOwnerId("");
      setReason("");
      onDone(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to reassign lead"));
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}
        className="flex h-9 flex-1 items-center justify-center rounded-md border border-[#d0d5dd] text-xs font-semibold text-[#344054]">
        Reassign
      </button>
    );
  }
  return (
    <div className="w-full space-y-2 rounded-lg border border-[#e5e7eb] p-3">
      <select value={toOwnerId} onChange={(e) => setToOwnerId(e.target.value)}
        className="h-9 w-full rounded-md border border-[#d0d5dd] px-3 text-xs">
        <option value="">Choose new owner</option>
        {admins.filter((a) => a.id !== lead.ownerId).map((a) => (
          <option key={a.id} value={a.id}>
            {a.name || [a.firstName, a.lastName].filter(Boolean).join(" ") || a.email}
          </option>
        ))}
      </select>
      <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional)"
        className="h-9 w-full rounded-md border border-[#d0d5dd] px-3 text-xs" />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setOpen(false)} className="h-8 rounded-md border border-[#d0d5dd] px-3 text-xs">Cancel</button>
        <button type="button" onClick={submit} disabled={!toOwnerId || busy}
          className="h-8 rounded-md bg-[#008f45] px-4 text-xs font-semibold text-white disabled:opacity-50">
          {busy ? "Moving…" : "Reassign"}
        </button>
      </div>
    </div>
  );
};

export default ReassignLead;
