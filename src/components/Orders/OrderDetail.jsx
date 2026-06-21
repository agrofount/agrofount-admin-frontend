import {
  faBan,
  faCalendarDays,
  faCheckCircle,
  faChevronLeft,
  faChevronRight,
  faCopy,
  faCreditCard,
  faEllipsisVertical,
  faFileInvoice,
  faLocationDot,
  faReceipt,
  faTag,
  faUser,
  faWarehouse,
  faZap,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ACTIONS, RESOURCES } from "../../constants/permissions";
import { ShopContext } from "../../context/ShopContext";
import { apiClient } from "../../lib/apiClient";
import { usePermission } from "../Hooks/usePermission";
import ModalComponent from "../modals/ModalComponent";
import ShipmentForm from "../Shipment/ShipmentForm";
import OrderDetailSkeleton from "../skeleton/OrderDetailSkeleton";
import OrderItems from "./OrderItems";

const titleCase = (value = "") =>
  value
    .toString()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatDateTime = (date) => {
  if (!date) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(new Date(date))
    .replace(",", "");
};

const formatDate = (date) => {
  if (!date) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(date));
};

const statusClass = (status) => {
  const normalized = status?.toLowerCase?.();
  if (["completed", "confirmed", "delivered", "paid"].includes(normalized)) {
    return "bg-[#dff8e7] text-[#008f45]";
  }
  if (["pending", "not shipped"].includes(normalized)) {
    return "bg-[#fff2df] text-[#f97316]";
  }
  if (["cancelled", "canceled", "failed"].includes(normalized)) {
    return "bg-[#ffe4e6] text-[#ef3340]";
  }
  return "bg-[#eef2f6] text-[#475467]";
};

const Card = ({ title, icon, children, className = "" }) => (
  <section
    className={`rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.04)] ${className}`}
  >
    {title && (
      <div className="mb-4 flex items-center gap-3">
        {icon && (
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[#eef4ff] text-[#4f46e5]">
            <FontAwesomeIcon icon={icon} className="text-sm" />
          </span>
        )}
        <h2 className="text-sm font-medium text-[#101828]">{title}</h2>
      </div>
    )}
    {children}
  </section>
);

const DetailRow = ({ label, value, valueClass = "" }) => (
  <div className="grid grid-cols-[160px_1fr] gap-4 border-b border-[#eef2f6] py-3 text-xs last:border-b-0 max-sm:grid-cols-1 max-sm:gap-1">
    <p className="font-medium text-[#101828]">{label}</p>
    <div className={`font-normal text-[#344054] ${valueClass}`}>{value}</div>
  </div>
);

const StatusTile = ({ icon, label, value, tone = "green" }) => {
  const toneClass =
    tone === "orange"
      ? "bg-[#fff2df] text-[#f97316]"
      : tone === "blue"
        ? "bg-[#e7f0ff] text-[#1f7ae0]"
        : "bg-[#dff8e7] text-[#008f45]";

  return (
    <div className="flex min-w-0 items-center gap-3 border-r border-[#e5e7eb] px-4 last:border-r-0 max-md:border-r-0">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${toneClass}`}>
        <FontAwesomeIcon icon={icon} className="text-sm" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-medium text-[#667085]">{label}</p>
        <p className={`mt-1 truncate text-xs font-medium ${toneClass.split(" ").at(-1)}`}>
          {value}
        </p>
      </div>
    </div>
  );
};

const OrderDetail = () => {
  const { orderId } = useParams();

  const { currency, navigate } = useContext(ShopContext);
  const { hasPermission, isAdmin } = usePermission();
  const [orderData, setOrderData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [orderItems, setOrderItems] = useState([]);
  const [cancelProcessing, setCancelProcessing] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [updated, setUpdated] = useState(false);

  const canCancelOrder =
    isAdmin || hasPermission(RESOURCES.ORDERS, ACTIONS.CANCEL);

  const formatMoney = useCallback(
    (value = 0) =>
      new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency,
      }).format(Number(value) || 0),
    [currency]
  );

  const shippingAddress = useMemo(() => {
    if (!orderData?.address) return "N/A";
    if (orderData.address.pickupLocation) return orderData.address.pickupLocation;

    return [
      orderData.address.street,
      orderData.address.landmark,
      orderData.address.city,
      orderData.address.state,
      orderData.address.country,
    ]
      .filter(Boolean)
      .join(", ");
  }, [orderData]);

  const expectedDeliveryDate = orderData?.createdAt
    ? new Date(
        new Date(orderData.createdAt).setDate(
          new Date(orderData.createdAt).getDate() + 1
        )
      )
    : null;

  const paymentStatus = orderData?.paymentStatus || "pending";
  const orderStatus = orderData?.status || "pending";
  const fulfillmentStatus =
    orderData?.shipment || orderData?.status === "shipped" ? "Shipped" : "Not Shipped";
  const amountPaid =
    paymentStatus?.toLowerCase?.() === "completed" ||
    paymentStatus?.toLowerCase?.() === "paid"
      ? orderData?.totalPrice
      : orderData?.amountPaid || orderData?.payment?.amountPaid || 0;

  const fetchOrderData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get(`/order/admin/${orderId}`);

      if (response.data) {
        setOrderData(response.data);
        setOrderItems(response.data.items || []);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  const copyText = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text || "");
      toast.success(`${label} copied`);
    } catch {
      toast.error(`Could not copy ${label.toLowerCase()}`);
    }
  };

  const handleCancelOrder = async () => {
    if (!canCancelOrder) {
      toast.error("You do not have permission to cancel orders.");
      return;
    }

    try {
      setCancelProcessing(true);

      await apiClient.patch(`/order/admin/${orderId}/cancel`);

      toast.success("Order cancelled");
      await fetchOrderData();
      setShowCancelModal(false);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setCancelProcessing(false);
    }
  };

  useEffect(() => {
    fetchOrderData();
  }, [fetchOrderData, updated]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate("/orders")}
            className="inline-flex items-center gap-2 text-xs font-medium text-[#008f45]"
          >
            <FontAwesomeIcon icon={faChevronLeft} />
            Back to Orders
          </button>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#667085]">
            <Link to="/" className="hover:text-[#008f45]">
              Dashboard
            </Link>
            <FontAwesomeIcon icon={faChevronRight} />
            <Link to="/orders" className="hover:text-[#008f45]">
              Orders
            </Link>
            <FontAwesomeIcon icon={faChevronRight} />
            <span className="font-medium text-[#344054]">
              {orderData?.code || orderId}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-medium tracking-[-0.01em] text-[#101828]">
                {orderData?.code || orderId}
              </h1>
              <span
                className={`inline-flex rounded-md px-2.5 py-1 text-xs font-medium ${statusClass(
                  orderStatus
                )}`}
              >
                {titleCase(orderStatus)}
              </span>
            </div>
            <p className="mt-2 text-xs font-normal text-[#667085]">
              Order placed on {formatDate(orderData?.createdAt)} <span className="px-2">•</span>
              {orderData?.createdAt
                ? new Intl.DateTimeFormat("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(orderData.createdAt))
                : "N/A"}
            </p>
          </div>
          <Menu as="div" className="relative">
            <MenuButton className="inline-flex h-9 items-center gap-3 rounded-md border border-[#d0d5dd] bg-white px-4 text-xs font-medium text-[#101828] shadow-sm">
              More Actions
              <FontAwesomeIcon icon={faEllipsisVertical} />
            </MenuButton>
            <MenuItems
              anchor="bottom end"
              className="z-40 mt-2 w-56 rounded-lg border border-[#e5e7eb] bg-white p-1 text-xs shadow-xl focus:outline-none"
            >
              <MenuItem>
                {({ focus }) => (
                  <button
                    type="button"
                    onClick={() => copyText(orderData?.id || orderId, "Order ID")}
                    className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[#344054] ${
                      focus ? "bg-[#f8fafc]" : ""
                    }`}
                  >
                    <FontAwesomeIcon icon={faCopy} />
                    Copy order ID
                  </button>
                )}
              </MenuItem>
              <MenuItem>
                {({ focus }) => (
                  <button
                    type="button"
                    onClick={() =>
                      copyText(
                        `${orderData?.fullName || ""}\n${
                          orderData?.phoneNumber || ""
                        }\n${shippingAddress}`,
                        "Customer and address"
                      )
                    }
                    className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[#344054] ${
                      focus ? "bg-[#f8fafc]" : ""
                    }`}
                  >
                    <FontAwesomeIcon icon={faUser} />
                    Copy customer details
                  </button>
                )}
              </MenuItem>
              <MenuItem>
                {({ focus }) => (
                  <button
                    type="button"
                    onClick={() => navigate(`/orders/${orderData?.id}/track`)}
                    className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[#344054] ${
                      focus ? "bg-[#f8fafc]" : ""
                    }`}
                  >
                    <FontAwesomeIcon icon={faLocationDot} />
                    Track order
                  </button>
                )}
              </MenuItem>
              {canCancelOrder && (
                <MenuItem>
                  {({ focus }) => (
                    <button
                      type="button"
                      onClick={() => setShowCancelModal(true)}
                      disabled={cancelProcessing || orderData?.status === "cancelled"}
                      className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[#ef3340] disabled:cursor-not-allowed disabled:opacity-50 ${
                        focus ? "bg-[#fff5f5]" : ""
                      }`}
                    >
                      <FontAwesomeIcon icon={faBan} />
                      Cancel order
                    </button>
                  )}
                </MenuItem>
              )}
            </MenuItems>
          </Menu>
        </div>
      </div>

      {isLoading ? (
        <OrderDetailSkeleton />
      ) : (
        <>
          <section className="grid grid-cols-[minmax(0,0.92fr)_minmax(0,1.2fr)] gap-4 max-xl:grid-cols-1">
            <div className="space-y-4">
              <OrderItems
                orderItems={orderItems}
                setOrderItems={setOrderItems}
                orderId={orderId}
                setUpdated={setUpdated}
              />

              <Card title="Order Summary" icon={faReceipt}>
                <div className="divide-y divide-[#eef2f6] text-xs">
                  <div className="flex items-center justify-between py-3">
                    <p className="font-medium text-[#101828]">Subtotal</p>
                    <p className="font-medium text-[#101828]">
                      {formatMoney(orderData?.subTotal)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <p className="font-medium text-[#101828]">Shipping Fee</p>
                    <p className="font-medium text-[#101828]">
                      {formatMoney(orderData?.deliveryFee)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <p className="font-medium text-[#101828]">Tax</p>
                    <p className="font-medium text-[#101828]">
                      {formatMoney(orderData?.vat)}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between rounded-sm bg-[#f3faf5] px-3 py-4">
                    <p className="font-medium text-[#008f45]">Total Amount</p>
                    <p className="font-medium text-[#008f45]">
                      {formatMoney(orderData?.totalPrice)}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              <section className="grid grid-cols-4 rounded-lg border border-[#e5e7eb] bg-white px-3 py-4 shadow-[0_8px_24px_rgba(16,24,40,0.04)] max-md:grid-cols-2 max-md:gap-4 max-sm:grid-cols-1">
                <StatusTile
                  icon={faCheckCircle}
                  label="Order Status"
                  value={titleCase(orderStatus)}
                />
                <StatusTile
                  icon={faCreditCard}
                  label="Payment Status"
                  value={titleCase(paymentStatus)}
                  tone="green"
                />
                <StatusTile
                  icon={faWarehouse}
                  label="Fulfillment Status"
                  value={fulfillmentStatus}
                  tone="orange"
                />
                <StatusTile
                  icon={faTag}
                  label="Order Type"
                  value={orderData?.isPickup ? "Pickup" : "Standard"}
                />
              </section>

              <Card title="Order Information" icon={faFileInvoice}>
                <div className="grid grid-cols-[1fr_1fr] gap-5 max-lg:grid-cols-1">
                  <div>
                    <DetailRow
                      label="Order ID"
                      value={
                        <div className="flex items-center gap-2">
                          <span className="break-all">{orderData?.id || "N/A"}</span>
                          {orderData?.id && (
                            <button
                              type="button"
                              onClick={() => copyText(orderData.id, "Order ID")}
                              className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-[#d0d5dd] text-[#667085]"
                            >
                              <FontAwesomeIcon icon={faCopy} />
                            </button>
                          )}
                        </div>
                      }
                    />
                    <DetailRow
                      label="Order Date"
                      value={formatDateTime(orderData?.createdAt)}
                    />
                    <DetailRow
                      label="Expected Delivery"
                      value={
                        <span className="inline-flex items-center gap-2 font-medium text-[#008f45]">
                          {formatDate(expectedDeliveryDate)}
                          <FontAwesomeIcon icon={faCalendarDays} className="text-[#667085]" />
                        </span>
                      }
                    />
                  </div>

                  <div className="border-l border-[#e5e7eb] pl-5 max-lg:border-l-0 max-lg:pl-0">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faLocationDot} className="text-[#4f46e5]" />
                        <p className="text-xs font-medium text-[#101828]">
                          Shipping Address
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyText(shippingAddress, "Shipping address")}
                        className="inline-flex h-8 items-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-3 text-xs font-medium text-[#101828]"
                      >
                        Copy
                        <FontAwesomeIcon icon={faEllipsisVertical} />
                      </button>
                    </div>
                    <p className="text-xs font-normal leading-6 text-[#667085]">
                      {shippingAddress}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-[1fr_0.86fr] border-t border-[#e5e7eb] pt-4 max-lg:grid-cols-1 max-lg:gap-4">
                  <div>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faUser} className="text-[#4f46e5]" />
                        <p className="text-xs font-medium text-[#101828]">
                          Customer Information
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          copyText(
                            `${orderData?.fullName || ""}\n${orderData?.phoneNumber || ""}`,
                            "Customer information"
                          )
                        }
                        className="inline-flex h-8 items-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-3 text-xs font-medium text-[#101828]"
                      >
                        Copy
                        <FontAwesomeIcon icon={faEllipsisVertical} />
                      </button>
                    </div>
                    <DetailRow label="Fullname" value={orderData?.fullName || "N/A"} />
                    <DetailRow
                      label="Phone Number"
                      value={
                        <div className="flex items-center gap-2">
                          {orderData?.phoneNumber || "N/A"}
                          {orderData?.phoneNumber && (
                            <button
                              type="button"
                              onClick={() =>
                                copyText(orderData.phoneNumber, "Phone number")
                              }
                              className="text-[#667085]"
                            >
                              <FontAwesomeIcon icon={faCopy} />
                            </button>
                          )}
                        </div>
                      }
                    />
                    <DetailRow
                      label="Email"
                      value={orderData?.user?.email || orderData?.email || "-"}
                    />
                  </div>

                  <div className="ml-5 rounded-lg bg-[#f3faf5] p-5 max-lg:ml-0">
                    <div className="mb-4 flex items-center gap-3">
                      <span className="grid h-12 w-12 place-items-center rounded-md border border-[#b7e6c7] text-[#008f45]">
                        <FontAwesomeIcon icon={faFileInvoice} />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-[#008f45]">
                          Copy Customer & Address
                        </p>
                        <p className="mt-1 text-xs font-normal text-[#667085]">
                          Copy both customer information and shipping address
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        copyText(
                          `${orderData?.fullName || ""}\n${
                            orderData?.phoneNumber || ""
                          }\n${shippingAddress}`,
                          "Customer and address"
                        )
                      }
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[#65c98b] bg-white text-xs font-medium text-[#008f45]"
                    >
                      <FontAwesomeIcon icon={faCopy} />
                      Copy All
                    </button>
                  </div>
                </div>
              </Card>

              <Card title="Payment Details" icon={faCreditCard}>
                <DetailRow label="Payment Channel" value={orderData?.paymentChannel || "N/A"} />
                <DetailRow label="Payment Method" value={orderData?.paymentMethod || "N/A"} />
                <DetailRow
                  label="Payment Status"
                  value={
                    <span
                      className={`inline-flex rounded-md px-2.5 py-1 text-xs font-medium ${statusClass(
                        paymentStatus
                      )}`}
                    >
                      {titleCase(paymentStatus)}
                    </span>
                  }
                />
                <DetailRow label="Amount Paid" value={formatMoney(amountPaid)} />
              </Card>
            </div>
          </section>

          <Card title="Order Actions" icon={faZap}>
            <div className="grid gap-4 md:grid-cols-3">
              <button
                type="button"
                onClick={() => navigate(`/orders/${orderData?.id}/track`)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#65c98b] bg-white text-xs font-medium text-[#008f45]"
              >
                <FontAwesomeIcon icon={faLocationDot} />
                Track Order
              </button>
              {orderData && (
                <ShipmentForm
                  orderData={orderData}
                  buttonClassName="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-[#cbd5e1] bg-white text-xs font-medium text-[#475467] disabled:cursor-not-allowed disabled:opacity-60"
                />
              )}
              {canCancelOrder && (
                <button
                  type="button"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#ff9da3] bg-white text-xs font-medium text-[#ef3340] disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => setShowCancelModal(true)}
                  disabled={cancelProcessing || orderData?.status === "cancelled"}
                >
                  <FontAwesomeIcon icon={faBan} />
                  Cancel Order
                </button>
              )}
            </div>
          </Card>
        </>
      )}

      <ModalComponent
        isModalOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel order"
      >
        <p className="text-sm text-gray-600">
          Are you sure you want to cancel order {orderData?.code || orderId}?
          This action may notify the customer and cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700"
            onClick={() => setShowCancelModal(false)}
          >
            Keep order
          </button>
          <button
            type="button"
            className="rounded-md bg-[#e63946] px-4 py-2 text-sm text-white disabled:opacity-60"
            onClick={handleCancelOrder}
            disabled={cancelProcessing}
          >
            {cancelProcessing ? "Cancelling..." : "Cancel order"}
          </button>
        </div>
      </ModalComponent>
    </div>
  );
};

export default OrderDetail;
