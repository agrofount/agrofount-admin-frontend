import { useContext, useState } from "react";
import { ShopContext } from "../../context/ShopContext";
import ModalComponent from "../modals/ModalComponent";
import axios from "axios";
import { toast } from "react-toastify";

const PaymentTableItem = ({ payment, setPaymentConfirmed }) => {
  const { currency, backend_url, token } = useContext(ShopContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const handleConfirmPayment = async (status) => {
    try {
      let url = `${backend_url}/payment/${payment.id}/confirm-transfer-received`;
      if (status) url += `?status=${status}`;

      if (status === "cancelled") {
        setCancelling(true);
      }
      if (status === "completed") {
        setProcessing(true);
      }
      const response = await axios.patch(url, null, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200 && response.data) {
        toast.success(
          response.data.message || "Payment confirmed successfully!"
        );
        setPaymentConfirmed(true);
      }
    } catch (error) {
      console.log("error", error);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setIsModalOpen(false);
      setProcessing(false);
      setCancelling(false);
    }
  };

  return (
    <>
      <tr className="hover:bg-[#F7F7F7]" onClick={() => setIsModalOpen(true)}>
        <td className="px-2 py-5 whitespace-nowrap">
          <p className="py-1">{payment.reference}</p>
        </td>

        <td className="px-2 py-5 whitespace-nowrap text-sm text-gray-500">
          <p className="py-1">{payment.email}</p>
        </td>

        <td className="px-2 py-5 whitespace-nowrap text-sm text-gray-500">
          <p className="py-1">{payment.orderId}</p>
        </td>

        <td className="px-2 py-5 whitespace-nowrap text-sm text-gray-500">
          <p className="py-1">
            {" "}
            {new Intl.NumberFormat("en-NG", {
              style: "currency",
              currency,
            }).format(payment.amount)}
          </p>
        </td>

        <td className="px-2 py-5 whitespace-nowrap text-sm text-gray-500">
          <p
            className={`text-center py-1 rounded-full w-[5rem] px-2 ${
              payment.paymentStatus === "completed"
                ? "bg-[#d9f5df] text-[#61BF75]"
                : payment.paymentStatus === "pending"
                ? "bg-[#e2e3e5] text-[#6c757d]"
                : payment.paymentStatus === "cancelled"
                ? "bg-[#f8d7da] text-[#dc3545]"
                : payment.paymentStatus === "failed"
                ? "bg-[#f8d7da] text-[#dc3545]"
                : payment.paymentStatus === "refunded"
                ? "bg-[#fff3cd] text-[#856404]"
                : "bg-[#cce5ff] text-[#007bff]"
            }`}
          >
            {payment.paymentStatus}
          </p>
        </td>

        <td className="px-2 py-5 whitespace-nowrap text-sm text-gray-500">
          <p className="py-1">
            {" "}
            {new Intl.NumberFormat("en-NG", {
              style: "currency",
              currency,
            }).format(payment.amountPaid)}
          </p>
        </td>

        <td className="px-2 py-5 whitespace-nowra text-sm text-gray-500">
          <p className="py-1">{new Date(payment.createdAt).toDateString()}</p>
        </td>
      </tr>

      <ModalComponent
        isModalOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <div className="text-center pb-10">
          <p className="text-[#6E6E6E] mb-5">
            Please confirm the payment for this transaction.
          </p>
          <div className="flex flex-row justify-center items-center gap-2">
            <button
              onClick={() => handleConfirmPayment("completed")}
              className="px-6 py-2 bg-[#61BF75] text-white rounded-full hover:bg-[#4aa65e] focus:outline-none"
              disabled={processing}
            >
              {processing ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </>
              ) : (
                "Confirm"
              )}
            </button>
            <button
              onClick={() => handleConfirmPayment("cancelled")}
              className="px-6 py-2 bg-[#F96767] text-white rounded-full hover:bg-[#e05454] focus:outline-none ml-4"
              disabled={cancelling}
            >
              {cancelling ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Canceling...
                </>
              ) : (
                "Cancel"
              )}
            </button>
          </div>
        </div>
      </ModalComponent>
    </>
  );
};

export default PaymentTableItem;
