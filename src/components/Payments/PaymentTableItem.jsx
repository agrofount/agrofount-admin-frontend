import { useContext, useState } from "react";
import { ShopContext } from "../../context/ShopContext";
import ModalComponent from "../modals/ModalComponent";
import axios from "axios";
import { toast } from "react-toastify";

const PaymentTableItem = ({ payment, setPaymentConfirmed }) => {
  const { currency, backend_url, token } = useContext(ShopContext);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleConfirmPayment = async () => {
    try {
      const response = await axios.patch(
        `${backend_url}/payment/${payment.id}/transfer-received`,
        null,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

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
                : "bg-[#e2e3e5] text-[#6c757d]"
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
              onClick={handleConfirmPayment}
              className="px-6 py-2 bg-[#61BF75] text-white rounded-full hover:bg-[#4aa65e] focus:outline-none"
            >
              Confirm
            </button>
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-2 bg-[#F96767] text-white rounded-full hover:bg-[#e05454] focus:outline-none ml-4"
            >
              Cancel
            </button>
          </div>
        </div>
      </ModalComponent>
    </>
  );
};

export default PaymentTableItem;
