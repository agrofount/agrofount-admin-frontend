import { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/assets";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationDot } from "@fortawesome/free-solid-svg-icons";

const DashboardTopSalesByState = ({ setTotalSales, orders }) => {
  const [topStates, setTopStates] = useState([]);

  const { currency } = useContext(ShopContext);

  useEffect(() => {
    if (!orders?.length) return;

    // Aggregate orders by user
    const customerMap = orders.reduce(
      (acc, order) => {
        if (order.paymentStatus !== "completed") return acc; // Only consider completed orders
        const state =
          order.address?.state || order.address?.pickupLocation || "Anonymous";
        if (!acc[state]) {
          acc[state] = {
            state, // Assuming user object has name
            totalSales: 0,
            totalOrders: 0,
          };
        }
        acc[state].totalSales += parseFloat(order.totalPrice);
        acc[state].totalOrders += 1;
        acc.totalSales += parseFloat(order.totalPrice);
        return acc;
      },
      { totalSales: 0 }
    );

    // Convert to array and sort by total spent
    const sortedState = Object.values(customerMap)
      .filter((state) => typeof state === "object")
      .sort((a, b) => b.totalSales - a.totalSales);

    setTopStates(sortedState);
    setTotalSales(customerMap.totalSales);
  }, [orders, setTotalSales]);
  return (
    <div className="flex flex-col gap-1 mt-4 overflow-y-scroll w-full">
      {topStates.slice(0, 10).map((stateData, index) => (
        <div className="flex gap-4 mt-4 w-full" key={index}>
          <div className="flex flex-row justify-between gap-2 w-full">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faLocationDot} size="xl" color="#dc3545" />
              <p className="text-[#4A4A4A] text-base font-semibold leading-normal capitalize">
                {stateData.state}
              </p>
              <p className="text-[#4A4A4A] text-xs leading-normal font-normal">
                {stateData.totalOrders} Orders
              </p>
            </div>
            <div className="py-2">
              <img src={assets.bull_icon} className="w-5 h-3 mx-2" alt="" />
            </div>

            <p className="text-[#4A4A4A] text-xs font-normal leading-normal py-2">
              {new Intl.NumberFormat("en-NG", {
                style: "currency",
                currency,
              }).format(stateData.totalSales)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardTopSalesByState;
