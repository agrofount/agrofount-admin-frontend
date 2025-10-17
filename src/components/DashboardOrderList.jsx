import { assets } from "../assets/assets";
import { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import { DashboardOrderListSkeleton } from "./skeleton/DashboardOrderListSkeleton";

const DashboardOrderList = ({ orders, isLoading, error }) => {
  const [loadedOrders, setLoadedOrders] = useState([]);

  const { currency } = useContext(ShopContext);

  useEffect(() => {
    let allOtherItems = [];

    orders.map(
      (order) =>
        order.items?.map((item) => {
          item["status"] = order.status;
          item["paymentStatus"] = order.paymentStatus;
          item["paymentMethod"] = order.paymentMethod;
          item["code"] = order.code;
          item["orderId"] = order.id;

          item["date"] = order.createdAt;

          allOtherItems.push(item);
        }) || []
    );

    setLoadedOrders(allOtherItems);
  }, [orders]);

  return (
    <div className="h-full w-full overflow-y-scroll">
      <table className="w-full divide-y divide-gray-200 overflow-x-auto border-b border-gray-500 pb-20">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Product
            </th>
            <th
              scope="col"
              className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Code
            </th>
            <th
              scope="col"
              className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Quantity
            </th>
            <th
              scope="col"
              className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Price
            </th>
            <th
              scope="col"
              className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Status
            </th>
          </tr>
        </thead>
        {isLoading ? (
          <DashboardOrderListSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-[300px]">
            <img src={assets.empty_inbox} alt="Error" />
            <p className="text-[#ADADAD] text-sm mt-5">{error}</p>
          </div>
        ) : loadedOrders.length < 1 ? (
          <div className="flex flex-col items-center justify-center h-[300px]">
            <img src={assets.empty_inbox} alt="No Order yet" />
            <p className="text-[#ADADAD] text-sm mt-5">No Orders yet</p>
          </div>
        ) : (
          <tbody className="bg-white divide-y divide-gray-200">
            {loadedOrders.map((order, index) => (
              <tr key={index}>
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <img
                        className="h-10 w-10 rounded-lg"
                        src={order.product.images[0]}
                        alt=""
                      />
                    </div>
                    <div className="ml-4 max-w-[10rem]">
                      <div className="text-sm font-medium text-gray-900 text-wrap">
                        {order.product.name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{order.code}</div>
                  <div className="text-sm text-gray-500">
                    {order.department}
                  </div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap text-sm">
                  {order.quantity}
                </td>
                <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500">
                  {new Intl.NumberFormat("en-NG", {
                    style: "currency",
                    currency,
                  }).format(order.price)}
                </td>
                <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500">
                  <p
                    className={`text-center py-1 rounded-full w-[5rem] px-2 ${
                      order.status === "confirmed"
                        ? "bg-[#d9f5df] text-[#61BF75]"
                        : order.status === "pending"
                        ? "bg-[#e2e3e5] text-[#6c757d]"
                        : order.status === "shipped"
                        ? "bg-[#cce5ff] text-[#007bff]"
                        : order.status === "delivered"
                        ? "bg-[#e2f0cb] text-[#28a745]"
                        : order.status === "cancelled"
                        ? "bg-[#f8d7da] text-[#dc3545]"
                        : order.status === "returned"
                        ? "bg-[#f7c6c7] text-[#e63946]"
                        : "bg-[#e2e3e5] text-[#6c757d]"
                    }`}
                  >
                    {order.status}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        )}
      </table>
    </div>
  );
};

export default DashboardOrderList;
