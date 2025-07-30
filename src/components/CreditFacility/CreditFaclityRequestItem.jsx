import { useContext, useState } from "react";
import ModalComponent from "../modals/ModalComponent";
import ApproveForm from "./ApproveForm";
import { ShopContext } from "../../context/ShopContext";

const CreditFacilityRequestItem = ({ request, submitted, setSubmitted }) => {
  const { currency } = useContext(ShopContext);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <tr
        className="hover:bg-[#F7F7F7] capitalize"
        onClick={() => setIsModalOpen(true)}
      >
        <td className="px-2 py-5 whitespace-nowrap">
          <p className="py-1">{request.user?.username}</p>
        </td>

        <td className="px-2 py-5 whitespace-nowrap text-sm text-gray-500">
          <p className="py-1">
            {new Intl.NumberFormat("en-NG", {
              style: "currency",
              currency,
            }).format(request.requestedAmount)}
          </p>
        </td>

        <td className="px-2 py-5 whitespace-nowrap text-sm text-gray-500">
          <p className="py-1">
            {new Intl.NumberFormat("en-NG", {
              style: "currency",
              currency,
            }).format(request.approvedAmount)}
          </p>
        </td>

        <td className="px-2 py-5 whitespace-nowrap text-sm text-gray-500">
          <p
            className={`text-center py-1 rounded-full w-[6rem] px-2 text-sm ${
              request.status === "approved"
                ? "bg-[#d9f5df] text-[#61BF75]"
                : request.status === "pending"
                ? "bg-[#e2e3e5] text-[#6c757d]"
                : request.status === "rejected"
                ? "bg-[#f8d7da] text-[#dc3545]"
                : "bg-[#e2e3e5] text-[#6c757d]"
            }`}
          >
            {request.status}
          </p>
        </td>

        <td className="px-2 py-5 whitespace-nowrap text-sm text-gray-500">
          <p className="py-1">
            {new Date(request.creditStartDate).toDateString()}
          </p>
        </td>

        <td className="px-2 py-5 whitespace-nowrap text-sm text-gray-500">
          <p className="py-1">{request.repaymentPeriod} weeks </p>
        </td>

        <td className="px-2 py-5 whitespace-nowrap text-sm text-gray-500">
          <p className="py-1">{new Date(request.createdAt).toDateString()}</p>
        </td>
      </tr>

      <ModalComponent
        isModalOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <ApproveForm
          request={request}
          submitted={submitted}
          setSubmitted={setSubmitted}
        />
      </ModalComponent>
    </>
  );
};

export default CreditFacilityRequestItem;
