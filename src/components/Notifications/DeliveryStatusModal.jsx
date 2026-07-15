import {
  faChevronLeft,
  faChevronRight,
  faArrowsRotate,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { apiClient, parseApiError } from "../../lib/apiClient";
import ModalComponent from "../modals/ModalComponent";

const PAGE_SIZE = 15;

const CATEGORY_LABELS = {
  INSUFFICIENT_BALANCE: "Insufficient balance",
  PROVIDER_ERROR: "Provider error",
};

const formatDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · ${d.toLocaleTimeString(
    "en-US",
    { hour: "numeric", minute: "2-digit", hour12: true }
  )}`;
};

const DeliveryStatusModal = ({ isOpen, onClose, title, jobName }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [failedCount, setFailedCount] = useState(0);
  const [sentCount, setSentCount] = useState(0);
  const [retrying, setRetrying] = useState(false);

  const load = () => {
    if (!isOpen || !jobName) return;
    setLoading(true);
    setError("");
    Promise.all([
      apiClient.get(`/message/cron-jobs/${jobName}/deliveries`, {
        params: { page: 1, limit: 1, "filter.status": "SENT" },
      }),
      apiClient.get(`/message/cron-jobs/${jobName}/deliveries`, {
        params: { page, limit: PAGE_SIZE, "filter.status": "FAILED" },
      }),
    ])
      .then(([sentRes, failedRes]) => {
        setSentCount(sentRes.data?.meta?.totalItems ?? 0);
        setFailedCount(failedRes.data?.meta?.totalItems ?? 0);
        setRows(Array.isArray(failedRes.data?.data) ? failedRes.data.data : []);
        setTotalPages(failedRes.data?.meta?.totalPages ?? 1);
      })
      .catch((err) => {
        setError(parseApiError(err).message || "Failed to load delivery status.");
        setRows([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isOpen) return;
    setPage(1);
  }, [isOpen, jobName]);

  useEffect(load, [isOpen, jobName, page]);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      const res = await apiClient.post(`/message/cron-jobs/${jobName}/retry-failed`);
      const { sent, total } = res.data || {};
      toast.success(
        total ? `Retried ${total} failed message${total === 1 ? "" : "s"} — ${sent} sent.` : "No failed messages to retry.",
      );
      setPage(1);
      load();
    } catch (err) {
      toast.error(parseApiError(err).message || "Failed to retry.");
    } finally {
      setRetrying(false);
    }
  };

  return (
    <ModalComponent
      isModalOpen={isOpen}
      onClose={onClose}
      title={title ? `Delivery Status — ${title}` : "Delivery Status"}
      panelClassName="max-w-3xl w-full"
    >
      {!loading && !error && (
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-[#dcf8e4] px-4 py-3">
            <p className="text-lg font-bold text-[#006638]">{sentCount.toLocaleString()}</p>
            <p className="text-[11px] font-medium text-[#008f45]">Sent</p>
          </div>
          <div className="rounded-lg bg-[#fee2e2] px-4 py-3">
            <p className="text-lg font-bold text-[#dc2626]">{failedCount.toLocaleString()}</p>
            <p className="text-[11px] font-medium text-[#ef3340]">Failed</p>
          </div>
        </div>
      )}

      <div className="max-h-[55vh] overflow-y-auto">
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
          <p className="py-8 text-center text-sm text-[#667085]">No failed messages for this job.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
                  {["Recipient", "Channel", "Failure", "Error", "Failed At"].map((h) => (
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
                      <span className="inline-flex items-center rounded-full bg-[#fee2e2] px-2 py-0.5 text-[11px] font-semibold text-[#ef3340]">
                        {CATEGORY_LABELS[r.failureCategory] || "Unclassified"}
                      </span>
                    </td>
                    <td className="max-w-[220px] truncate px-3 py-2.5 text-[11px] text-[#667085]" title={r.errorMessage || ""}>
                      {r.errorMessage || ""}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-[#667085] whitespace-nowrap">
                      {formatDate(r.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[#f0f2f5] pt-3">
        <button
          type="button"
          onClick={handleRetry}
          disabled={retrying || loading || failedCount === 0}
          className="flex items-center gap-1.5 rounded-md bg-[#006638] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#008f45] disabled:opacity-40"
        >
          <FontAwesomeIcon
            icon={faArrowsRotate}
            className={`text-[10px] ${retrying ? "animate-spin" : ""}`}
          />
          Retry Failed
        </button>

        {!loading && !error && totalPages > 1 && (
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
        )}
      </div>
    </ModalComponent>
  );
};

export default DeliveryStatusModal;
