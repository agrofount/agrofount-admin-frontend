import { useEffect, useState } from "react";

const DashboardPrimaryCategoryChart = ({ orders }) => {
  const [deals, setDeals] = useState([]);

  useEffect(() => {
    if (orders && orders.length > 0) {
      // Example transformation: top 4 categories by sales
      const categorySales = {};

      orders.forEach((order) => {
        if (order.items && order.items.length > 0) {
          order.items.forEach((item) => {
            if (item.product && item.product.primaryCategory) {
              const category = item.product.primaryCategory;
              const itemTotal = (item.price || 0) * (item.quantity || 1);

              if (!categorySales[category]) {
                categorySales[category] = 0;
              }
              categorySales[category] += itemTotal;
            }
          });
        }
      });

      const sortedDeals = Object.entries(categorySales)
        .map(([category, value]) => ({
          title: category,
          stage: "Category", // you can map categories to stages if needed
          value,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 4); // Top 4 like the design

      setDeals(sortedDeals);
    }
  }, [orders]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 w-full">
      <h2 className="text-gray-800 text-xl font-semibold mb-6 font-sans">
        Top Categories (Sales)
      </h2>

      <div className="flex flex-col gap-4">
        {deals.length > 0 ? (
          deals.map((deal, idx) => (
            <div key={idx} className="flex flex-col">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-800 font-medium">{deal.title}</p>
                  <p className="text-gray-500 text-sm">{deal.stage}</p>
                </div>
                <p className="text-amber-600 font-semibold">
                  ₦{deal.value.toLocaleString()}
                </p>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min(
                      (deal.value / deals[0].value) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 italic text-center">
            No category data available
          </p>
        )}
      </div>
    </div>
  );
};

export default DashboardPrimaryCategoryChart;
