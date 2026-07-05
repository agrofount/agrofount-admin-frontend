import {
  faChevronLeft,
  faChevronRight,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { apiClient, parseApiError } from "../../lib/apiClient";
import ModalComponent from "../modals/ModalComponent";

const PAGE_SIZE = 15;

const STATUS_STYLES = {
  SENT: "bg-[#dcf8e4] text-[#008f45]",
  FAILED: "bg-[#fee2e2] text-[#ef3340]",
  SKIPPED: "bg-[#f0f2f5] text-[#667085]",
};

const formatDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · ${d.toLocaleTimeString(
    "en-US",
    { hour: "numeric", minute: "2-digit", hour12: true }
  )}`;
};

const RecipientsModal = ({ isOpen, onClose, title, campaignId, jobName }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const baseUrl = campaignId
    ? `/message/campaign/${campaignId}/recipients`
    : `/message/cron-jobs/${jobName}/recipients`;

  useEffect(() => {
    if (!isOpen) return;
    setPage(1);
  }, [isOpen, campaignId, jobName]);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError("");
    apiClient
      .get(`${baseUrl}?page=${page}&limit=${PAGE_SIZE}`)
      .then((res) => {
        const data = res.data;
        setRows(Array.isArray(data?.data) ? data.data : []);
        setTotalPages(data?.meta?.totalPages ?? 1);
        setTotalItems(data?.meta?.totalItems ?? 0);
      })
      .catch((err) => {
        setError(parseApiError(err).message || "Failed to load recipients.");
        setRows([]);
      })
      .finally(() => setLoading(false));
  }, [isOpen, baseUrl, page]);

  return (
    <ModalComponent
      isModalOpen={isOpen}
      onClose={onClose}
      title={title ? `Recipients — ${title}` : "Recipients"}
      panelClassName="max-w-3xl w-full"
    >
      <div className="max-h-[70vh] overflow-y-auto">
        {loading ? (
          <div className="space-y-2 py-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-[#f0f2f5]" />
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 rounded-lg bg-[#fee2e2] px-4 py-3 text-sm text-[#ef3340]">
            <FontAwesomeIcon icon={faTriangleExclamation} />
            {error}
          </div>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-[#667085]">No recipients recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
                  {["Recipient", "Channel", "Status", "Sent At", "Error"].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-[#667085] whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f2f5]">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-3 py-2.5 text-xs text-[#101828]">
                      {r.recipientEmail || r.recipientPhone || r.userId || "-"}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-[#344054]">{r.channel || "-"}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          STATUS_STYLES[r.status] ?? STATUS_STYLES.SKIPPED
                        }`}
                      >
                        {r.status || "SENT"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-[#667085] whitespace-nowrap">
                      {formatDate(r.createdAt)}
                    </td>
                    <td className="max-w-[220px] truncate px-3 py-2.5 text-[11px] text-[#ef3340]" title={r.errorMessage || ""}>
                      {r.errorMessage || ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && !error && totalItems > 0 && (
        <div className="mt-4 flex items-center justify-between border-t border-[#f0f2f5] pt-3">
          <p className="text-xs text-[#667085]">
            {totalItems.toLocaleString()} {totalItems === 1 ? "recipient" : "recipients"}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="grid h-8 w-8 place-items-center rounded-md border border-[#d0d5dd] text-[#667085] disabled:opacity-40 hover:bg-[#f0f2f5]"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="text-[10px]" />
            </button>
            <span className="px-2 text-xs text-[#344054]">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="grid h-8 w-8 place-items-center rounded-md border border-[#d0d5dd] text-[#667085] disabled:opacity-40 hover:bg-[#f0f2f5]"
            >
              <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
            </button>
          </div>
        </div>
      )}
    </ModalComponent>
  );
};

export default RecipientsModal;
