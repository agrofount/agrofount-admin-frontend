import { Link } from "react-router-dom";

const OrderTrackComponent = ({ order }) => {
  const getStatusClass = (currentStatus, stepStatus) => {
    const statusOrder = ["pending", "confirmed", "shipped", "delivered"];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepIndex = statusOrder.indexOf(stepStatus);

    return stepIndex <= currentIndex
      ? "bg-[#61BF75] border-[#61BF75] text-white"
      : "bg-gray-300 border-gray-100 text-gray-500";
  };

  const steps = ["pending", "confirmed", "shipped", "delivered"];

  return (
    <div className="rounded-md bg-white shadow-md py-5 text-center">
      <div className="flex flex-row justify-between">
        <p className="font-bold text-xl text-left px-5 sm:px-20 py-5">
          Progress
        </p>
        <Link
          to={`/orders/${order.id}`}
          className="font-bold text-sm text-left px-5 sm:px-20 py-5"
        >
          Back
        </Link>
      </div>
      <ol className="flex flex-row items-center w-full px-5 sm:px-20">
        {steps.map((step, index) => (
          <li key={index} className="flex w-full items-center">
            <div
              className={`w-full h-1 ${
                getStatusClass(order.status, step).includes("bg-[#61BF75]")
                  ? "bg-[#61BF75]"
                  : "bg-gray-300"
              }`}
            ></div>
            <span
              className={`flex items-center justify-center w-10 h-10 rounded-full lg:h-12 lg:w-12 shrink-0 ${getStatusClass(
                order.status,
                step
              )}`}
            >
              <svg
                className="w-3.5 h-3.5 text-white lg:w-4 lg:h-4"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 16 12"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M1 5.917 5.724 10.5 15 1.5"
                />
              </svg>
            </span>
          </li>
        ))}
      </ol>
      <div className="flex flex-row  justify-around items-right text-right w-full px-5 sm:px-20">
        <p className="font-semibold">Pending Order</p>
        <p className="font-semibold">Confirmed Order</p>
        <p className="font-semibold">Shipped Order</p>
        <p className="font-semibold">Delivered Order</p>
      </div>
    </div>
  );
};

export default OrderTrackComponent;
