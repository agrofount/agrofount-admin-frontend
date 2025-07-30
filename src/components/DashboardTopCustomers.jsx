import { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";

const DashboardTopCustomers = ({ orders }) => {
  const [topCustomers, setTopCustomers] = useState([]);

  const { currency } = useContext(ShopContext);

  useEffect(() => {
    if (!orders?.length) return;

    // Aggregate orders by user
    const customerMap = orders.reduce((acc, order) => {
      if (order.paymentStatus !== "completed") return acc; // Only consider completed orders
      const userId = order.user?.id || "Anonymous";
      if (!acc[userId]) {
        acc[userId] = {
          name: order.user?.username || "Anonymous", // Assuming user object has name
          totalSpent: 0,
          purchases: 0,
        };
      }
      acc[userId].totalSpent += parseFloat(order.totalPrice);
      acc[userId].purchases += 1;
      return acc;
    }, {});

    // Convert to array and sort by total spent
    const sortedCustomers = Object.values(customerMap).sort(
      (a, b) => b.totalSpent - a.totalSpent
    );

    setTopCustomers(sortedCustomers);
  }, [orders]);
  return (
    <div className="flex flex-col gap-1 mt-4 overflow-y-scroll w-full">
      {topCustomers.slice(0, 10).map((customer, index) => (
        <div className="flex gap-4 mt-4 w-full" key={index}>
          <div className="flex flex-row justify-between gap-2 w-full">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faUser} size="xl" color="#61BF75" />
              <div className="flex flex-col">
                <p className="text-[#4A4A4A] text-base font-semibold leading-normal capitalize">
                  {customer.name}
                </p>
                <p className="text-[#4A4A4A] text-xs leading-normal font-normal">
                  {customer.purchases} Purchases
                </p>
              </div>
            </div>
            <p className="text-[#4A4A4A] text-xs font-normal leading-normal ml-auto py-2">
              {new Intl.NumberFormat("en-NG", {
                style: "currency",
                currency,
              }).format(customer.totalSpent)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardTopCustomers;
