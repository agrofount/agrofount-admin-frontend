import {
  faCalendarDays,
  faCheckCircle,
  faClipboardList,
  faLink,
  faMoneyBillTransfer,
  faRotate,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useContext, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { ShopContext } from "../../context/ShopContext";
import { apiClient } from "../../lib/apiClient";
import { LoadingButtonContent } from "../common/LoadingStates";

const formatDate = (date) => {
  if (!date) return "-";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(date));
};

const getSupplierName = (request) =>
  request?.user?.username ||
  request?.user?.name ||
  request?.supplier?.name ||
  request?.supplierName ||
  "Unknown";

const getInitials = (name) =>
  String(name || "NA")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const getRequestCode = (request) =>
  request?.requestId ||
  request?.code ||
  request?.reference ||
  String(request?.id || "REQ").slice(0, 32);

const DetailItem = ({ icon, label, value }) => (
  <div className="flex gap-3">
    <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#f2f4f7] text-xs text-[#667085]">
      <FontAwesomeIcon icon={icon} />
    </span>
    <div>
      <p className="text-xs font-medium text-[#667085]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#101828]">{value}</p>
    </div>
  </div>
);

const ApproveForm = ({ request, submitted, setSubmitted, onClose }) => {
  const { currency } = useContext(ShopContext);
  const requestedAmount = Number(request.requestedAmount || 0);
  const [amount, setAmount] = useState(requestedAmount);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [actionType, setActionType] = useState("approve");
  const [approvalType, setApprovalType] = useState("full");

  const supplierName = getSupplierName(request);
  const status = String(request.status || "pending").toLowerCase();

  const formatCurrency = useMemo(
    () => (value) =>
      new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
      }).format(Number(value) || 0),
    [currency]
  );

  const handleAction = async () => {
    if (actionType === "approve") {
      const approvedAmount = approvalType === "full" ? requestedAmount : amount;

      if (approvedAmount <= 0 || approvedAmount > requestedAmount) {
        setError(`Amount must be between 0 and ${formatCurrency(requestedAmount)}`);
        return;
      }
    }

    setProcessing(true);
    setError("");

    try {
      const payload =
        actionType === "approve"
          ? {
              approvedAmount: Number(approvalType === "full" ? requestedAmount : amount),
              approve: true,
            }
          : { approve: false };

      const response = await apiClient.patch(
        `/credit-facility/${request.id}/handle-approval`,
        payload
      );

      if (response.status === 200) {
        setSubmitted(true);
      }

      toast.success(
        actionType === "approve"
          ? `Request approved for ${formatCurrency(payload.approvedAmount)}`
          : "Request denied successfully"
      );
    } catch (err) {
      const message = err.message || `${actionType === "approve" ? "Approval" : "Denial"} failed.`;
      toast.error(message);
      setError(message);
    } finally {
      setProcessing(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-6 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#dcf8e6] text-[#008f45]">
          <FontAwesomeIcon icon={faCheckCircle} />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-[#101828]">
          Request {actionType === "approve" ? "Approved" : "Denied"}
        </h3>
        <p className="mt-2 text-sm text-[#667085]">The request has been processed successfully.</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-[#008f45] px-8 text-sm font-semibold text-white"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="flex items-center justify-between border-b border-[#eef2f6] px-6 py-5">
        <h3 className="text-lg font-semibold text-[#101828]">Credit Facility Request Details</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="grid h-9 w-9 place-items-center rounded-md border border-[#d0d5dd] text-[#101828] hover:bg-[#f2f4f7]"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>

      <div className="px-6 py-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#dcf8e6] text-xl font-semibold text-[#008f45]">
              {getInitials(supplierName)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-lg font-semibold text-[#101828]">{supplierName}</p>
                <span className="rounded-md bg-[#dcf8e6] px-2 py-1 text-[11px] font-semibold capitalize text-[#008f45]">
                  {status}
                </span>
              </div>
              <p className="mt-1 text-sm text-[#667085]">
                Supplier ID: {request.supplierId || request.user?.id || "SUP-0032"}
              </p>
            </div>
          </div>

          <div className="grid gap-4 text-xs sm:grid-cols-2">
            <div>
              <p className="font-medium text-[#667085]">Request ID</p>
              <p className="mt-1 break-all font-semibold text-[#101828]">{getRequestCode(request)}</p>
            </div>
            <div>
              <p className="font-medium text-[#667085]">Request Date</p>
              <p className="mt-1 font-semibold text-[#101828]">{formatDate(request.createdAt)}</p>
            </div>
          </div>
        </div>

        <section className="mt-5 overflow-hidden rounded-lg border border-[#e5e7eb] bg-white shadow-[0_8px_18px_rgba(16,24,40,0.06)]">
          <div className="grid sm:grid-cols-2">
            <div className="space-y-8 border-b border-[#eef2f6] p-5 sm:border-b-0 sm:border-r">
              <DetailItem icon={faMoneyBillTransfer} label="Requested Amount" value={formatCurrency(requestedAmount)} />
              <DetailItem icon={faLink} label="Approved Amount" value={formatCurrency(request.approvedAmount || requestedAmount)} />
              <DetailItem icon={faClipboardList} label="Purpose" value={request.purpose || "Not specified"} />
            </div>
            <div className="space-y-8 p-5">
              <DetailItem icon={faRotate} label="Status" value={<span className="capitalize"><span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[#008f45]" />{status}</span>} />
              <DetailItem icon={faCalendarDays} label="Repayment Period" value={`${request.repaymentPeriod || 0} Weeks`} />
              <DetailItem icon={faCalendarDays} label="Start Date" value={formatDate(request.creditStartDate)} />
            </div>
          </div>
        </section>

        <div className="mt-6">
          <p className="text-sm font-semibold text-[#101828]">Approval Actions</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setActionType("approve")}
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-md border text-sm font-semibold ${
                actionType === "approve"
                  ? "border-[#00a85a] bg-[#f6fffa] text-[#008f45]"
                  : "border-[#d0d5dd] bg-white text-[#344054]"
              }`}
            >
              <FontAwesomeIcon icon={faCheckCircle} />
              Approve Request
            </button>
            <button
              type="button"
              onClick={() => setActionType("deny")}
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-md border text-sm font-semibold ${
                actionType === "deny"
                  ? "border-[#ef3340] bg-[#fff8f8] text-[#ef3340]"
                  : "border-[#ef3340] bg-white text-[#ef3340]"
              }`}
            >
              <FontAwesomeIcon icon={faXmark} />
              Deny Request
            </button>
          </div>
        </div>

        {actionType === "approve" && (
          <div className="mt-5 space-y-4">
            <label className="flex cursor-pointer items-center justify-between gap-4 text-sm font-semibold text-[#101828]">
              <span className="flex items-center gap-3">
                <input
                  type="radio"
                  name="approvalType"
                  checked={approvalType === "full"}
                  onChange={() => setApprovalType("full")}
                  className="h-4 w-4 accent-[#008f45]"
                />
                Approve full amount
              </span>
              <span className="text-[#008f45]">{formatCurrency(requestedAmount)}</span>
            </label>

            <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-[#101828]">
              <input
                type="radio"
                name="approvalType"
                checked={approvalType === "partial"}
                onChange={() => setApprovalType("partial")}
                className="h-4 w-4 accent-[#008f45]"
              />
              Approve partial amount
            </label>

            <div className="ml-7 flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="number"
                value={amount}
                min={0}
                max={requestedAmount}
                onChange={(event) => {
                  const value = Number.parseFloat(event.target.value);
                  setAmount(Number.isNaN(value) ? 0 : value);
                }}
                disabled={processing || approvalType !== "partial"}
                className="h-10 rounded-md border border-[#d0d5dd] px-4 text-sm outline-none focus:border-[#008f45] disabled:bg-[#f9fafb] sm:w-80"
              />
              <span className="text-xs font-medium text-[#667085]">Max: {formatCurrency(requestedAmount)}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-md bg-[#fff1f2] px-3 py-2 text-sm text-[#ef3340]">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleAction}
          disabled={
            processing ||
            (actionType === "approve" &&
              approvalType === "partial" &&
              (amount <= 0 || amount > requestedAmount))
          }
          className={`mt-5 inline-flex h-11 w-full items-center justify-center rounded-md text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 ${
            actionType === "approve" ? "bg-[#008f45]" : "bg-[#ef3340]"
          }`}
        >
          {processing ? (
            <LoadingButtonContent label="Processing..." />
          ) : actionType === "approve" ? (
            "Confirm Approval"
          ) : (
            "Confirm Denial"
          )}
        </button>
      </div>
    </div>
  );
};

export default ApproveForm;
