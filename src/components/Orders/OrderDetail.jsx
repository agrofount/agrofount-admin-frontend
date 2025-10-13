import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import { useCallback, useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ShopContext } from "../../context/ShopContext";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { assets } from "../../assets/assets";
import OrderDetailSkeleton from "../skeleton/OrderDetailSkeleton";
import ShipmentForm from "../Shipment/ShipmentForm";
import UpdateOrderItem from "./UpdateOrderItem";

const OrderDetail = () => {
  const { orderId } = useParams();

  const { currency, backend_url, token, navigate } = useContext(ShopContext);
  const [orderData, setOrderData] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState("");
  const [orderItems, setOrderItems] = useState([]);
  const [cancelProcessing, setCancelProcessing] = useState(false);
  const [updated, setUpdated] = useState(false);

  const fetchOrderData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${backend_url}/order/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data) {
        setOrderData(response.data);
        setOrderItems(response.data.items);
      } else {
        console.log("error", response);
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log("error", error);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setIsLoading(false); // Set loading to false after fetching
    }
  }, [orderId, backend_url, token, updated]);

  const handleCancelOrder = async () => {
    try {
      setCancelProcessing(true);

      await axios.patch(`${backend_url}/order/${orderId}/cancel`, null, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("order canceled");
    } catch (error) {
      console.log("error", error);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setCancelProcessing(false); // Set loading to false after fetching
    }
  };

  useEffect(() => {
    fetchOrderData();
  }, [fetchOrderData]);

  useEffect(() => {
    console.log("sorting items");
    const sortedItems = [...orderItems].sort((a, b) => {
      if (a[sortBy] < b[sortBy]) return -1;
      if (a[sortBy] > b[sortBy]) return 1;
      return 0;
    });
    setOrderItems(sortedItems);
  }, [sortBy]);

  return (
    <div>
      <div className="flex flex-row justify-between items-center gap-5 mb-3">
        <p className="text-gray-600 text-sm sm:text-[25px] font-normal sm:font-bold leading-normal tracking-[0.5px]">
          {orderData.code}
        </p>
        <div className="flex flex-row items-center gap-2">
          <Link to="/">
            <p className="text-[#6E6E6E] font-roboto text-[13px] font-normal leading-normal tracking-[0.26px]">
              Dashboard
            </p>
          </Link>
          <p>
            <FontAwesomeIcon
              icon={faChevronRight}
              size="sm"
              className="pt-1 h-3 text-[#6E6E6E]"
            />
          </p>
          <Link to="/orders">
            <p className="text-[#6E6E6E] font-roboto text-[13px] font-normal leading-normal tracking-[0.26px]">
              Orders
            </p>
          </Link>
          <p>
            <FontAwesomeIcon
              icon={faChevronRight}
              size="sm"
              className="pt-1 h-3 text-[#6E6E6E]"
            />
          </p>
          <p className="text-[#6E6E6E] font-roboto text-[13px] font-normal leading-normal tracking-[0.26px]">
            {orderId}
          </p>
        </div>
      </div>

      {isLoading ? (
        <OrderDetailSkeleton />
      ) : (
        <section>
          <div className="flex flex-col sm:flex-row gap-6 gap-y-6">
            <div className="w-full sm:w-64 flex-1 ">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col bg-white rounded-lg p-5">
                  <div className="flex flex-row justify-between items-center gap-5 bg-gray-100 p-3 rounded-sm w-full">
                    <p className="font-semibold">All Items</p>
                    <Menu>
                      <MenuButton className="flex flex-row items-center gap-2 border border-gray-500 cursor-pointer py-1.5 px-3 rounded-md">
                        <p className="text-sm">{sortBy || "SortBy"}</p>
                        <img src={assets.dropdown_icon} alt="" />
                      </MenuButton>
                      <MenuItems anchor="bottom" className="bg-white py-2 px-4">
                        <MenuItem
                          onClick={() => setSortBy("name")}
                          className="cursor-pointer"
                        >
                          <p className="text-sm text-left text-gray-500 py-3">
                            Name
                          </p>
                        </MenuItem>

                        <MenuItem
                          onClick={() => setSortBy("quantity")}
                          className="cursor-pointer"
                        >
                          <p className="text-sm text-left text-gray-500  py-3">
                            Quantity
                          </p>
                        </MenuItem>

                        <MenuItem
                          onClick={() => setSortBy("price")}
                          className="cursor-pointer"
                        >
                          <p className="text-sm text-left text-gray-500  py-3">
                            Price
                          </p>
                        </MenuItem>
                      </MenuItems>
                    </Menu>
                  </div>

                  <div className="w-full h-80 overflow-y-scroll overflow-x-auto">
                    <table className="w-full divide-y divide-gray-200  pb-20">
                      <thead>
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
                            Vendor Price
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {orderItems.map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <img
                                    className="h-10 w-10 rounded-lg"
                                    src={item.product.images[0]}
                                    alt=""
                                  />
                                </div>
                                <div className="ml-4 max-w-[10rem]">
                                  <div className="text-sm font-medium text-gray-900 text-wrap">
                                    {item.product.name}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-5 whitespace-nowrap text-sm">
                              {item.quantity}
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500">
                              {new Intl.NumberFormat("en-NG", {
                                style: "currency",
                                currency,
                              }).format(item.price)}
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500">
                              {(() => {
                                const matchedUom = item.uom?.find(
                                  (uom) => uom.platformPrice === item.price
                                );
                                return matchedUom
                                  ? new Intl.NumberFormat("en-NG", {
                                      style: "currency",
                                      currency,
                                    }).format(matchedUom.vendorPrice)
                                  : "-";
                              })()}
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500">
                              <UpdateOrderItem
                                orderId={orderId}
                                orderItem={item}
                                setUpdated={setUpdated}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex flex-col bg-white rounded-lg p-5">
                  <div className="flex flex-col">
                    <div className="overflow-x-auto sm:-mx-6 lg:-mx-8">
                      <div className="inline-block min-w-full py-2 sm:px-6 lg:px-8">
                        <div className="overflow-hidden">
                          <table className="min-w-full text-left text-sm font-light text-surface ">
                            <thead className="border-b border-neutral-200 font-medium dark:border-white/10">
                              <tr className="bg-gray-100 rounded-sm w-full">
                                <th scope="col" className="px-6 py-4">
                                  Cart Total
                                </th>
                                <th scope="col" className="px-6 py-4">
                                  Price
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b border-neutral-200 ">
                                <td className="whitespace-nowrap px-6 py-4 font-medium">
                                  Subtotal
                                </td>
                                <td className="whitespace-nowrap px-6 py-4">
                                  {new Intl.NumberFormat("en-NG", {
                                    style: "currency",
                                    currency,
                                  }).format(orderData.subTotal)}
                                </td>
                              </tr>
                              <tr className="border-b border-neutral-200">
                                <td className="whitespace-nowrap px-6 py-4 font-medium">
                                  Shipping
                                </td>
                                <td className="whitespace-nowrap px-6 py-4">
                                  {new Intl.NumberFormat("en-NG", {
                                    style: "currency",
                                    currency,
                                  }).format(orderData.deliveryFee)}
                                </td>
                              </tr>
                              <tr className="border-b border-neutral-200">
                                <td className="whitespace-nowrap px-6 py-4 font-medium">
                                  Tax
                                </td>
                                <td className="whitespace-nowrap px-6 py-4">
                                  {new Intl.NumberFormat("en-NG", {
                                    style: "currency",
                                    currency,
                                  }).format(orderData.vat)}
                                </td>
                              </tr>
                              <tr className="border-b border-neutral-200">
                                <td className="whitespace-nowrap px-6 py-4 font-medium">
                                  Total Price
                                </td>
                                <td className="whitespace-nowrap px-6 py-4">
                                  {new Intl.NumberFormat("en-NG", {
                                    style: "currency",
                                    currency,
                                  }).format(orderData.totalPrice)}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <div className="bg-white rounded-md p-5">
                <p className="font-semibold">Summary</p>
                <div className="flex flex-col">
                  <div className="overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full sm:px-6 lg:px-8">
                      <div className="overflow-hidden">
                        <table className="min-w-full text-left text-sm font-light text-surface">
                          <tbody>
                            <tr className="border-b border-neutral-200">
                              <td className="whitespace-nowrap px-6 py-4 font-medium">
                                order Id
                              </td>
                              <td className="whitespace-nowrap px-6 py-4">
                                {orderData.id}
                              </td>
                            </tr>
                            <tr className="border-b border-neutral-200">
                              <td className="whitespace-nowrap px-6 py-4 font-medium">
                                Date
                              </td>
                              <td className="whitespace-nowrap px-6 py-4">
                                {new Date(orderData.createdAt).toDateString()}
                              </td>
                            </tr>
                            <tr className="">
                              <td className="whitespace-nowrap px-6 py-4 font-medium">
                                Total
                              </td>
                              <td className="whitespace-nowrap px-6 py-4">
                                {new Intl.NumberFormat("en-NG", {
                                  style: "currency",
                                  currency,
                                }).format(orderData.totalPrice)}
                              </td>
                            </tr>
                            <tr className="">
                              <td className="whitespace-nowrap px-6 py-4 font-medium">
                                Total Profit
                              </td>
                              <td className="whitespace-nowrap px-6 py-4">
                                {(() => {
                                  let totalProfit = 0;
                                  orderItems.forEach((item) => {
                                    const matchedUom = item.uom?.find(
                                      (uom) => uom.platformPrice === item.price
                                    );
                                    if (matchedUom) {
                                      totalProfit +=
                                        (item.price - matchedUom.vendorPrice) *
                                        item.quantity;
                                    }
                                  });
                                  return new Intl.NumberFormat("en-NG", {
                                    style: "currency",
                                    currency,
                                  }).format(totalProfit);
                                })()}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-5">
                <p className="font-semibold mb-3">Shipping Address</p>

                <div className="flex flex-col">
                  <div className="overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full sm:px-6 lg:px-8">
                      <div className="overflow-hidden">
                        <table className="min-w-full text-left text-sm font-light text-surface">
                          <tbody>
                            {orderData.address?.pickupLocation ? (
                              <tr className="border-b border-neutral-200">
                                <td className="whitespace-nowrap px-6 py-4 font-medium">
                                  Pickup Location:
                                </td>
                                <td className="whitespace-nowrap px-6 py-4">
                                  <p>{orderData.address?.pickupLocation}</p>
                                </td>
                              </tr>
                            ) : (
                              <tr className="border-b border-neutral-200">
                                <td className="whitespace-nowrap px-6 py-4 font-medium">
                                  Shipping Address:
                                </td>
                                <td className="whitespace-nowrap px-6 py-4">
                                  <p>{` ${orderData?.address?.address} ${
                                    orderData.address?.landmark
                                      ? orderData.address?.landmark
                                      : ""
                                  }${orderData.address?.city}, ${
                                    orderData.address?.state
                                  }, ${orderData.address?.country}.`}</p>
                                </td>
                              </tr>
                            )}
                            <tr className="border-b border-neutral-200">
                              <td className="whitespace-nowrap px-6 py-4 font-medium">
                                Fullname:
                              </td>
                              <td className="whitespace-nowrap px-6 py-4">
                                {orderData.fullName}
                              </td>
                            </tr>
                            <tr className="">
                              <td className="whitespace-nowrap px-6 py-4 font-medium">
                                Phone Number:
                              </td>
                              <td className="whitespace-nowrap px-6 py-4">
                                {orderData.phoneNumber}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-5">
                <p className="font-semibold">Payment Details</p>
                <div className="flex flex-col">
                  <div className="overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full sm:px-6 lg:px-8">
                      <div className="overflow-hidden">
                        <table className="min-w-full text-left text-sm font-light text-surface">
                          <tbody>
                            <tr className="border-b border-neutral-200">
                              <td className="whitespace-nowrap px-6 py-4 font-medium">
                                Payment Channel
                              </td>
                              <td className="whitespace-nowrap px-6 py-4">
                                {orderData.paymentChannel}
                              </td>
                            </tr>
                            <tr className="border-b border-neutral-200">
                              <td className="whitespace-nowrap px-6 py-4 font-medium">
                                Payment Method
                              </td>
                              <td className="whitespace-nowrap px-6 py-4">
                                {orderData.paymentMethod}
                              </td>
                            </tr>
                            <tr className="">
                              <td className="whitespace-nowrap px-6 py-4 font-medium">
                                Payment Status
                              </td>
                              <td className="whitespace-nowrap px-6 py-4">
                                <p
                                  className={`text-center py-1 rounded-full w-[6rem] px-2 text-sm ${
                                    orderData.paymentStatus === "completed"
                                      ? "bg-[#d9f5df] text-[#61BF75]"
                                      : orderData.paymentStatus === "pending"
                                      ? "bg-[#e2e3e5] text-[#6c757d]"
                                      : orderData.paymentStatus === "shipped"
                                      ? "bg-[#cce5ff] text-[#007bff]"
                                      : orderData.paymentStatus === "delivered"
                                      ? "bg-[#e2f0cb] text-[#28a745]"
                                      : orderData.paymentStatus === "cancelled"
                                      ? "bg-[#f8d7da] text-[#dc3545]"
                                      : orderData.paymentStatus === "returned"
                                      ? "bg-[#f7c6c7] text-[#e63946]"
                                      : "bg-[#e2e3e5] text-[#6c757d]"
                                  }`}
                                >
                                  {orderData.paymentStatus}
                                </p>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-5">
                <p className="font-semibold mb-3">Expected date of delivery</p>

                <p className="text-[#61BF75] font-semibold">
                  {new Date(
                    new Date(orderData.createdAt).setDate(
                      new Date(orderData.createdAt).getDate() + 1
                    )
                  ).toDateString()}
                </p>

                <div className="flex flex-row justify-between items-center gap-5">
                  <button
                    className="w-full border border-[#61BF75] rounded-lg py-3 my-5 hover:bg-gray-200 hover:border-none"
                    onClick={() => navigate(`/orders/${orderData.id}/track`)}
                  >
                    Track order
                  </button>
                  <ShipmentForm orderData={orderData} />
                </div>
                <button
                  className="w-full border border-[#e63946] rounded-lg py-3 my-2 hover:bg-gray-200 hover:border-none"
                  onClick={handleCancelOrder}
                  disabled={cancelProcessing || orderData.status == "cancelled"}
                >
                  {cancelProcessing ? (
                    <div className="flex items-center space-x-2 justify-center">
                      <div
                        className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite]"
                        role="status"
                      >
                        <span className="sr-only">Processing...</span>
                      </div>
                      <p className="text-surface ">Processing...</p>
                    </div>
                  ) : (
                    "Cancel order"
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default OrderDetail;
