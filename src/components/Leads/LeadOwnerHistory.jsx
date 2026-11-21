import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { fetchOwnerHistory, formatWhen, getErrorMessage } from "./leadOwnership";

const LeadOwnerHistory = ({ leadId, refreshKey }) => {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchOwnerHistory(leadId)
      .then((res) => !cancelled && setRows(Array.isArray(res.data) ? res.data : []))
      .catch((err) => {
        if (cancelled) return;
        setRows([]);
        toast.error(getErrorMessage(err, "Failed to load owner history"));
      });
    return () => {
      cancelled = true;
    };
  }, [leadId, refreshKey]);

  if (rows === null) return <p className="text-xs text-[#667085]">Loading owner history…</p>;
  if (rows.length === 0) return <p className="text-xs text-[#98a2b3]">No ownership changes yet.</p>;
  return (
    <ol className="space-y-2">
      {rows.map((r) => (
        <li key={r.id} className="rounded-lg border border-[#e5e7eb] px-4 py-3 text-xs text-[#344054]">
          <p className="font-semibold">
            {r.from?.name || "Unowned"} to {r.to?.name || "Unowned"}
          </p>
          {r.reason && <p className="mt-1 text-[#667085]">{r.reason}</p>}
          <p className="mt-2 text-[10px] text-[#667085]">
            {r.actor?.name ? `By ${r.actor.name} · ` : ""}{formatWhen(r.createdAt)}
          </p>
        </li>
      ))}
    </ol>
  );
};

export default LeadOwnerHistory;
