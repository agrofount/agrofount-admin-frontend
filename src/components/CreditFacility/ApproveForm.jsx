import axios from "axios";
import { useContext, useState } from "react";
import { ShopContext } from "../../context/ShopContext";
import { toast } from "react-toastify";

const ApproveForm = ({ request, submitted, setSubmitted }) => {
  const { backend_url, token, currency } = useContext(ShopContext);
  const [amount, setAmount] = useState(request.requestedAmount);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [actionType, setActionType] = useState("approve"); // "approve" or "deny"
  const [approvalType, setApprovalType] = useState("full"); // "full" or "partial"

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
    }).format(value);
  };

  const handleAction = async () => {
    if (actionType === "approve") {
      const approvedAmount =
        approvalType === "full" ? request.requestedAmount : amount;

      if (approvedAmount <= 0 || approvedAmount > request.requestedAmount) {
        setError(
          `Amount must be between 0 and ${formatCurrency(
            request.requestedAmount
          )}`
        );
        return;
      }
    }

    setProcessing(true);
    setError("");

    try {
      let payload = {};
      let endpoint = `${backend_url}/credit-facility/${request.id}/handle-approval`;
      if (actionType === "approve") {
        const approvedAmount =
          approvalType === "full" ? request.requestedAmount : amount;
        payload = { approvedAmount: Number(approvedAmount), approve: true };
      } else {
        payload = { approve: false };
      }

      const response = await axios.patch(endpoint, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status == 200) {
        setSubmitted(true);
      }
      const successMessage =
        actionType === "approve"
          ? `Request approved for ${formatCurrency(payload.approvedAmount)}`
          : "Request denied successfully";

      toast.success(successMessage);
    } catch (e) {
      console.log("Error handling credit facility request:", e);
      const errorMessage =
        e.response?.data?.message ||
        `${actionType === "approve" ? "Approval" : "Denial"} failed.`;
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4">
          Request {actionType === "approve" ? "Approved" : "Denied"}{" "}
          Successfully
        </h3>
        <p className="text-gray-600">
          The request has been processed successfully.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      {/* Credit Facility Details Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">
          Credit Facility Request Details
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Request ID:</p>
            <p className="font-medium">{request.id}</p>
          </div>
          <div>
            <p className="text-gray-600">Customer:</p>
            <p className="font-medium capitalize">
              {request.user.username || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Requested Amount:</p>
            <p className="font-medium">
              {formatCurrency(request.requestedAmount)}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Request Date:</p>
            <p className="font-medium">
              {new Date(request.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Status:</p>
            <p className="font-medium capitalize">{request.status}</p>
          </div>
          <div>
            <p className="text-gray-600">Purpose:</p>
            <p className="font-medium">{request.purpose || "Not specified"}</p>
          </div>
        </div>
      </div>

      {/* Action Selection */}
      <div className="border-t pt-4">
        <div className="flex gap-4 mb-4">
          <button
            className={`px-4 py-2 rounded-md ${
              actionType === "approve"
                ? "bg-[#61BF75] text-white"
                : "bg-gray-200"
            }`}
            onClick={() => setActionType("approve")}
          >
            Approve Request
          </button>
          <button
            className={`px-4 py-2 rounded-md ${
              actionType === "deny" ? "bg-[#dc3545] text-white" : "bg-gray-200"
            }`}
            onClick={() => setActionType("deny")}
          >
            Deny Request
          </button>
        </div>

        {actionType === "approve" && (
          <div className="space-y-4 mb-4">
            <div className="flex items-center gap-3">
              <input
                type="radio"
                id="fullApproval"
                name="approvalType"
                checked={approvalType === "full"}
                onChange={() => setApprovalType("full")}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="fullApproval" className="flex items-center gap-2">
                <span className="font-medium">Approve full amount</span>
                <span className="text-sm text-gray-600">
                  {formatCurrency(request.requestedAmount)}
                </span>
              </label>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="radio"
                id="partialApproval"
                name="approvalType"
                checked={approvalType === "partial"}
                onChange={() => setApprovalType("partial")}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 mt-1"
              />
              <div className="flex-1 space-y-2">
                <label htmlFor="partialApproval" className="font-medium block">
                  Approve partial amount
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    className="border rounded px-3 py-2 w-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={amount}
                    min={0}
                    max={request.requestedAmount}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      setAmount(isNaN(value) ? 0 : value);
                    }}
                    disabled={processing || approvalType !== "partial"}
                  />
                  <span className="text-sm text-gray-500">
                    Max: {formatCurrency(request.requestedAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleAction}
          disabled={
            processing ||
            (actionType === "approve" &&
              approvalType === "partial" &&
              (amount <= 0 || amount > request.requestedAmount))
          }
          className={`w-full py-2 px-4 rounded-md text-white ${
            actionType === "approve"
              ? "bg-green-600 hover:bg-green-700"
              : "bg-red-600 hover:bg-red-700"
          } disabled:opacity-50 transition-colors`}
        >
          {processing
            ? "Processing..."
            : actionType === "approve"
            ? "Confirm Approval"
            : "Confirm Denial"}
        </button>

        {error && (
          <div className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApproveForm;
