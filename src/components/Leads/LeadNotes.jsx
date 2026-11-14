import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  addLeadNote,
  deleteLeadNote,
  fetchLeadNotes,
  getErrorMessage,
  getErrorStatus,
} from "./leadOwnership";

const MAX_LENGTH = 5000;

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

// canWrite: update permission and not locked by another owner.
const LeadNotes = ({ leadId, canWrite, lockedReason, currentUserId, isAdmin }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchLeadNotes(leadId);
      setNotes(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load notes"));
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    try {
      setSaving(true);
      const res = await addLeadNote(leadId, trimmed);
      setNotes((prev) => [res.data, ...prev]);
      setBody("");
    } catch (err) {
      // 403 is an expected state (lead owned by someone else).
      toast.error(
        getErrorStatus(err) === 403
          ? getErrorMessage(err, lockedReason)
          : getErrorMessage(err, "Failed to add note"),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (note) => {
    try {
      setDeletingId(note.id);
      await deleteLeadNote(leadId, note.id);
      setNotes((prev) => prev.filter((n) => n.id !== note.id));
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete note"));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-3">
      {canWrite ? (
        <div className="space-y-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, MAX_LENGTH))}
            rows={3}
            placeholder="Add a note about this lead"
            className="w-full rounded-md border border-[#d0d5dd] px-3 py-2 text-xs outline-none focus:border-[#008f45]"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#98a2b3]">
              {body.length}/{MAX_LENGTH}
            </span>
            <button
              type="button"
              onClick={handleAdd}
              disabled={saving || !body.trim()}
              className="h-8 rounded-md bg-[#008f45] px-4 text-xs font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "Add note"}
            </button>
          </div>
        </div>
      ) : (
        lockedReason && (
          <p className="rounded-md bg-[#f9fafb] px-3 py-2 text-[11px] text-[#667085]">
            {lockedReason}
          </p>
        )
      )}

      {loading ? (
        <p className="text-xs text-[#667085]">Loading notes…</p>
      ) : notes.length === 0 ? (
        <p className="text-xs text-[#98a2b3]">No notes yet.</p>
      ) : (
        <ol className="space-y-2">
          {notes.map((note) => {
            const canDelete =
              isAdmin || (note.author?.id && currentUserId && note.author.id === currentUserId);
            return (
              <li
                key={note.id}
                className="rounded-lg border border-[#e5e7eb] px-4 py-3"
              >
                <p className="whitespace-pre-wrap break-words text-xs text-[#344054]">
                  {note.body}
                </p>
                <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-[#667085]">
                  <span>
                    {note.author?.name || "Unknown admin"} · {formatWhen(note.createdAt)}
                  </span>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDelete(note)}
                      disabled={deletingId === note.id}
                      className="font-semibold text-[#dc2626] disabled:opacity-50"
                    >
                      {deletingId === note.id ? "Deleting…" : "Delete"}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
};

export default LeadNotes;
