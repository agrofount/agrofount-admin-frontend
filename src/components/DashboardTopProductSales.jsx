import { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";

const DashboardTopProductSales = ({ orders }) => {
  const [topProducts, setTopProducts] = useState([]);

  const { currency } = useContext(ShopContext);

  useEffect(() => {
    if (!orders?.length) return;

    const productMap = orders.reduce((acc, order) => {
      if (order.paymentStatus !== "completed") return acc;
      order.items.forEach((item) => {
        const productName = item.product.name || "Unknown Product";
        const productImage = item.product.images[0] || "Unknown Product";

        if (!acc[productName]) {
          acc[productName] = {
            productName,
            productImage,
            totalSales: 0,
            totalCount: 0,
          };
        }
        acc[productName].totalSales += parseFloat(item.price) * item.quantity;
        acc[productName].totalCount += item.quantity;
      });

      return acc;
    }, {});

    const sortedProducts = Object.values(productMap).sort(
      (a, b) => b.totalSales - a.totalSales
    );

    setTopProducts(sortedProducts);
  }, [orders]);

  return (
    <div className="flex flex-col gap-1 mt-4 overflow-y-scroll w-full">
      {topProducts.slice(0, 10).map((product, index) => (
        <div className="flex gap-4 mt-4 w-full" key={index}>
          <div className="flex flex-row justify-between gap-2 w-full">
            <div className="flex items-center gap-2">
              <img src={product.productImage} className="w-8 h-8" alt="" />
              <div className="flex flex-col">
                <p className="text-[#4A4A4A] text-base font-semibold leading-normal capitalize">
                  {product.productName}
                </p>
                <p className="text-[#4A4A4A] text-xs leading-normal font-normal">
                  {product.totalCount} Sold
                </p>
              </div>
            </div>
            <p className="text-[#4A4A4A] text-xs font-normal leading-normal ml-auto">
              {new Intl.NumberFormat("en-NG", {
                style: "currency",
                currency,
              }).format(product.totalSales)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardTopProductSales;
