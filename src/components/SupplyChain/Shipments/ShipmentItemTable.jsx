import { useContext } from "react";
import { ShopContext } from "../../../context/ShopContext";

const ShipmentItemTable = ({ shipment }) => {
  const { currency } = useContext(ShopContext);
  return (
    <tr className="hover:bg-[#F7F7F7]">
      <td className="px-2 py-5 whitespace-nowrap text-sm text-gray-500">
        <p className="py-1">{shipment.trackingNumber}</p>
      </td>
      <td className="px-2 py-5 whitespace-nowrap text-sm text-gray-500">
        <div className="flex flex-row items-start gap-4 max-w-32">
          <p className="py-1 text-wrap">{shipment.order.code}</p>
        </div>
      </td>

      <td className="px-2 py-5 whitespace-nowrap text-sm text-gray-500">
        <p className="py-1">{shipment.driver?.name || "N/A"}</p>
      </td>

      <td className="px-2 py-5 whitespace-nowrap text-sm text-gray-500">
        <p className="py-1">
          {new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency,
          }).format(shipment.cost) || "N/A"}
        </p>
      </td>

      <td className="px-2 py-5 whitespace-nowrap text-sm text-gray-500">
        <p className="py-1">{shipment.route || "N/A"}</p>
      </td>

      <td className="px-2 py-5 whitespace-nowrap text-sm text-gray-500">
        <p className="py-1">
          {shipment.estimatedDelivery
            ? new Date(shipment.estimatedDelivery).toDateString()
            : "N/A"}
        </p>
      </td>

      <td className="px-2 py-5 whitespace-nowrap text-sm text-gray-500">
        <p
          className={`text-center py-1 rounded-full w-[5rem] px-2 ${
            shipment.status === "confirmed"
              ? "bg-[#d9f5df] text-[#61BF75]"
              : shipment.status === "pending"
              ? "bg-[#e2e3e5] text-[#6c757d]"
              : shipment.status === "shipped"
              ? "bg-[#cce5ff] text-[#007bff]"
              : shipment.status === "delivered"
              ? "bg-[#e2f0cb] text-[#28a745]"
              : shipment.status === "cancelled"
              ? "bg-[#f8d7da] text-[#dc3545]"
              : shipment.status === "returned"
              ? "bg-[#f7c6c7] text-[#e63946]"
              : "bg-[#e2e3e5] text-[#6c757d]"
          }`}
        >
          {shipment.status}
        </p>
      </td>

      <td className="px-2 py-5 whitespace-nowrap text-sm text-gray-500">
        <p className="py-1">{new Date(shipment.createdAt).toDateString()}</p>
      </td>
    </tr>
  );
};

export default ShipmentItemTable;
