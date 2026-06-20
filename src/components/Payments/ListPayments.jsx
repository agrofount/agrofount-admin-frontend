import {
  faCalendarDays,
  faCheck,
  faChevronLeft,
  faChevronRight,
  faCircleExclamation,
  faClipboardList,
  faClock,
  faCopy,
  faCreditCard,
  faDownload,
  faEllipsisVertical,
  faFilter,
  faLock,
  faMagnifyingGlass,
  faMoneyBillTransfer,
  faRotateLeft,
  faWallet,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { assets } from "../../assets/assets";
import { ShopContext } from "../../context/ShopContext";
import { apiClient } from "../../lib/apiClient";
import { TableRowsSkeleton } from "../common/LoadingStates";
import ModalComponent from "../modals/ModalComponent";

const pageSizeOptions = [10, 20, 30, 50];
const statusOptions = ["All Status", "Completed", "Pending", "Cancelled", "Failed", "Refunded"];
const dateRangeOptions = ["Select date range", "Last 7 days", "Last 30 days", "This month"];

const formatMoney = (value, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number(value || 0));

const formatPaymentDate = (value) => {
  if (!value) return ["N/A", ""];
  const date = new Date(value);
  return [
    new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }).format(date),
    new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date),
  ];
};

const customerInitial = (payment) =>
  String(payment.email || payment.customer?.email || payment.user?.email || "A")
    .trim()
    .charAt(0)
    .toUpperCase();

const paymentEmail = (payment) =>
  payment.email || payment.customer?.email || payment.user?.email || "N/A";

const paymentStatus = (payment) =>
  String(payment.paymentStatus || payment.status || "pending").toLowerCase();

const statusClass = (status) => {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "completed") return "bg-[#dcf8e4] text-[#008f45]";
  if (normalized === "pending") return "bg-[#fff1df] text-[#f97316]";
  if (["cancelled", "canceled", "failed"].includes(normalized)) return "bg-[#ffe4e6] text-[#ef3340]";
  if (normalized === "refunded") return "bg-[#fff4d8] text-[#b45309]";
  return "bg-[#e7f0ff] text-[#1f7ae0]";
};

const titleCase = (value = "") =>
  value
    .toString()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const MetricCard = ({ label, value, note, icon, tone = "green", orange = false }) => {
  const toneClass =
    tone === "blue"
      ? "bg-[#e7f0ff] text-[#1f7ae0]"
      : tone === "orange"
        ? "bg-[#fff1df] text-[#f97316]"
        : tone === "purple"
          ? "bg-[#eee4ff] text-[#7b3fe4]"
          : "bg-[#dcf8e4] text-[#008f45]";

  return (
    <div className="rounded-lg border border-[#e5e7eb] bg-white px-4 py-3 shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
      <div className="flex items-center gap-3">
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${toneClass}`}>
          <FontAwesomeIcon icon={icon} className="text-base" />
        </div>
        <div>
          <p className="text-[11px] font-semibold text-[#667085]">{label}</p>
          <p className="mt-0.5 text-lg font-semibold text-[#101828]">{value}</p>
          <p className={`mt-1.5 text-[11px] font-semibold ${orange ? "text-[#f97316]" : "text-[#008f45]"}`}>
            {note}
          </p>
        </div>
      </div>
    </div>
  );
};

const ListPayments = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [payments, setPayments] = useState({ data: [], meta: {} });
  const [pageLimit, setPageLimit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [dateRange, setDateRange] = useState(dateRangeOptions[0]);
  const [paymentPage, setPaymentPage] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("DESC");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [processingAction, setProcessingAction] = useState("");

  const { currency } = useContext(ShopContext);
  const searchTimeout = useRef();

  const fetchPayments = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await apiClient.get("/payment", {
        params: {
          page: paymentPage,
          limit: pageLimit,
          search: searchValue,
          sortBy: `${sortBy}:${sortOrder}`,
        },
        paramsSerializer: { indexes: null },
      });

      if (response.status === 200) setPayments(response.data);
    } catch (error) {
      toast.error(error.message || "Unable to load payments.");
    } finally {
      setIsLoading(false);
    }
  }, [paymentPage, pageLimit, searchValue, sortBy, sortOrder]);

  const paymentList = useMemo(() => payments.data || [], [payments.data]);

  const filteredPayments = useMemo(
    () =>
      paymentList.filter((payment) => {
        if (statusFilter === "All Status") return true;
        return paymentStatus(payment) === statusFilter.toLowerCase();
      }),
    [paymentList, statusFilter],
  );

  const totalItems = Number(payments.meta?.totalItems || filteredPayments.length || 0);
  const currentPage = Number(payments.meta?.currentPage || paymentPage || 1);
  const totalPages = Number(payments.meta?.totalPages || Math.max(1, Math.ceil(totalItems / pageLimit)));
  const shownFrom = totalItems ? (currentPage - 1) * pageLimit + 1 : 0;
  const shownTo = totalItems ? Math.min(currentPage * pageLimit, totalItems) : 0;
  const totalAmount = paymentList.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const completedCount = paymentList.filter((payment) => paymentStatus(payment) === "completed").length;
  const pendingCount = paymentList.filter((payment) => paymentStatus(payment) === "pending").length;
  const completedPercent = paymentList.length ? Math.round((completedCount / paymentList.length) * 1000) / 10 : 0;
  const pendingPercent = paymentList.length ? Math.round((pendingCount / paymentList.length) * 1000) / 10 : 0;

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setPaymentPage(page);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortBy(field);
      setSortOrder("ASC");
    }
  };

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchInput(value);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPaymentPage(1);
      setSearchValue(value);
    }, 400);
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearchValue("");
    setStatusFilter("All Status");
    setDateRange(dateRangeOptions[0]);
    setPaymentPage(1);
  };

  const exportPayments = () => {
    const header = ["Reference", "Customer", "Order ID", "Amount", "Status", "Paid", "Date"];
    const rows = filteredPayments.map((payment) => [
      payment.reference || payment.id,
      paymentEmail(payment),
      payment.orderId || payment.order?.id || "N/A",
      payment.amount || 0,
      titleCase(paymentStatus(payment)),
      payment.amountPaid || 0,
      payment.createdAt || "",
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "payments.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyOrderId = async (event, orderId) => {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(orderId);
      toast.success("Order ID copied");
    } catch {
      toast.error("Unable to copy order ID.");
    }
  };

  const handleConfirmPayment = async (status) => {
    if (!selectedPayment) return;

    try {
      setProcessingAction(status);
      let url = `/payment/${selectedPayment.id}/confirm-transfer-received`;
      if (status) url += `?status=${status}`;

      const response = await apiClient.patch(url);
      if (response.status === 200 && response.data) {
        toast.success(response.data.message || "Payment updated successfully.");
        setSelectedPayment(null);
        fetchPayments();
      }
    } catch (error) {
      toast.error(error.message || "Unable to update payment.");
    } finally {
      setProcessingAction("");
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(
    () => () => {
      clearTimeout(searchTimeout.current);
    },
    [],
  );

  return (
    <div className="space-y-4 text-[#101828]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-lg font-semibold">Payment List</h1>
          <p className="mt-1 text-xs font-medium text-[#667085]">Track and manage all customer payments in one place.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#667085]">
          <Link to="/" className="hover:text-[#008f45]">Dashboard</Link>
          <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
          <span className="font-semibold text-[#008f45]">Payments</span>
        </div>
      </div>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Payments" value={totalItems} note="↑ 18.6% from last month" icon={faWallet} />
        <MetricCard label="Total Amount" value={formatMoney(totalAmount, currency)} note="↑ 22.4% from last month" icon={faCreditCard} tone="blue" />
        <MetricCard label="Completed" value={completedCount} note={`${completedPercent}% of total`} icon={faClock} tone="orange" />
        <MetricCard label="Pending" value={pendingCount} note={`${pendingPercent}% of total`} icon={faMoneyBillTransfer} tone="purple" orange />
      </section>

      <section className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
        <div className="grid gap-3 lg:grid-cols-[1.55fr_1fr_1.15fr_auto]">
          <label className="relative">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#667085]" />
            <input
              type="text"
              placeholder="Search by reference, email, order ID..."
              value={searchInput}
              onChange={handleSearchChange}
              className="h-9 w-full rounded-md border border-[#d0d5dd] bg-white pl-9 pr-9 text-xs text-[#101828] outline-none focus:border-[#008f45] focus:ring-2 focus:ring-[#dff4e5]"
            />
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#344054]" />
          </label>

          <label>
            <span className="mb-1 block text-[11px] font-semibold text-[#667085]">Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-9 w-full rounded-md border border-[#d0d5dd] bg-white px-3 text-xs text-[#101828] outline-none focus:border-[#008f45]"
            >
              {statusOptions.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1 block text-[11px] font-semibold text-[#667085]">Date Range</span>
            <div className="relative">
              <FontAwesomeIcon icon={faCalendarDays} className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#667085]" />
              <select
                value={dateRange}
                onChange={(event) => setDateRange(event.target.value)}
                className="h-9 w-full rounded-md border border-[#d0d5dd] bg-white pl-9 pr-3 text-xs text-[#101828] outline-none focus:border-[#008f45]"
              >
                {dateRangeOptions.map((range) => (
                  <option key={range}>{range}</option>
                ))}
              </select>
            </div>
          </label>

          <button
            type="button"
            onClick={exportPayments}
            className="mt-auto inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-4 text-xs font-semibold text-[#344054] shadow-sm"
          >
            <FontAwesomeIcon icon={faDownload} />
            Export
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-[#344054]">
            <span>Show</span>
            <select
              value={pageLimit}
              onChange={(event) => {
                setPageLimit(Number(event.target.value));
                setPaymentPage(1);
              }}
              className="h-9 rounded-md border border-[#d0d5dd] bg-white px-3 text-xs outline-none focus:border-[#008f45]"
            >
              {pageSizeOptions.map((limit) => (
                <option key={limit}>{limit}</option>
              ))}
            </select>
            <span>entries</span>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={clearFilters} className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-4 text-xs font-semibold text-[#344054]">
              <FontAwesomeIcon icon={faRotateLeft} />
              Clear Filters
            </button>
            <button type="button" className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#006b3a] px-5 text-xs font-semibold text-white">
              <FontAwesomeIcon icon={faFilter} />
              Filter
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border border-[#e5e7eb]">
          <div className="w-full overflow-x-auto">
            <table className="min-w-[1120px] w-full text-left">
              <thead className="border-b border-[#e5e7eb] bg-[#fbfcfd]">
                <tr>
                  {[
                    ["Reference", "reference"],
                    ["Customer", "email"],
                    ["Order ID", "orderId"],
                    ["Amount", "amount"],
                    ["Status", "paymentStatus"],
                    ["Paid", "amountPaid"],
                    ["Date", "createdAt"],
                    ["", ""],
                  ].map(([label, field]) => (
                    <th key={`${label}-${field}`} className="px-4 py-3 text-[9px] font-semibold uppercase tracking-[0.02em] text-[#667085]">
                      {field ? (
                        <button type="button" onClick={() => handleSort(field)} className="inline-flex items-center gap-1">
                          {label}
                          {["orderId", "amount", "paymentStatus", "amountPaid", "createdAt"].includes(field) && (
                            <span className="text-[8px] text-[#98a2b3]">
                              {sortBy === field ? (sortOrder === "ASC" ? "↑" : "↓") : "↕"}
                            </span>
                          )}
                        </button>
                      ) : label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef2f6]">
                {isLoading ? (
                  <TableRowsSkeleton rows={7} columns={8} />
                ) : filteredPayments.length < 1 ? (
                  <tr>
                    <td colSpan="8">
                      <div className="flex h-64 flex-col items-center justify-center">
                        <img src={assets.empty_table} alt="" className="h-24 w-24 object-contain opacity-70" />
                        <p className="mt-4 text-xs text-[#98a2b3]">No payments found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment, index) => {
                    const [date, time] = formatPaymentDate(payment.createdAt);
                    const orderId = payment.orderId || payment.order?.id || "N/A";
                    const status = paymentStatus(payment);
                    return (
                      <tr key={payment.id || payment.reference || index} className="hover:bg-[#f9fafb]">
                        <td className="border-l-2 border-[#22c55e] px-4 py-3">
                          <p className="text-xs font-semibold text-[#101828]">{payment.reference || payment.id}</p>
                          <p className="mt-0.5 text-[11px] font-medium text-[#667085]">{payment.paymentCode || `#PAY-${String(index + 250).padStart(6, "0")}`}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${index % 3 === 2 ? "bg-[#eee4ff] text-[#7b3fe4]" : "bg-[#dcf8e4] text-[#008f45]"}`}>
                              {customerInitial(payment)}
                            </span>
                            <p className="text-xs text-[#475467]">{paymentEmail(payment)}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button type="button" onClick={(event) => copyOrderId(event, orderId)} className="inline-flex max-w-[210px] items-center gap-2 text-left text-xs text-[#475467]">
                            <span className="truncate">{orderId}</span>
                            {orderId !== "N/A" && <FontAwesomeIcon icon={faCopy} className="text-[#667085]" />}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-[#101828]">{formatMoney(payment.amount, currency)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex min-w-[78px] justify-center rounded-full px-3 py-1 text-[11px] font-semibold ${statusClass(status)}`}>
                            {titleCase(status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#475467]">{formatMoney(payment.amountPaid ?? payment.amount, currency)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-2 text-xs text-[#475467]">
                            <FontAwesomeIcon icon={faCalendarDays} className="mt-0.5 text-[#667085]" />
                            <div>
                              <p>{date}</p>
                              <p className="mt-0.5 text-[11px] text-[#667085]">{time}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => setSelectedPayment(payment)}
                            className="grid h-8 w-8 place-items-center rounded-md border border-[#e5e7eb] text-[#667085] hover:bg-[#f8fafc]"
                          >
                            <FontAwesomeIcon icon={faEllipsisVertical} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-3 px-1 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#667085]">
            Showing {shownFrom} to {shownTo} of {totalItems} entries
          </p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1} className="grid h-8 w-8 place-items-center rounded-md border border-[#d0d5dd] text-xs text-[#667085] disabled:cursor-not-allowed disabled:opacity-50">
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            {[1, 2, 3].filter((page) => page <= totalPages).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => handlePageChange(page)}
                className={`h-8 min-w-8 rounded-md px-2.5 text-xs font-semibold ${currentPage === page ? "bg-[#008f45] text-white" : "border border-[#e5e7eb] text-[#344054]"}`}
              >
                {page}
              </button>
            ))}
            {totalPages > 4 && <span className="px-2 text-xs text-[#667085]">...</span>}
            {totalPages > 3 && (
              <button type="button" onClick={() => handlePageChange(totalPages)} className={`h-8 min-w-8 rounded-md px-2.5 text-xs font-semibold ${currentPage === totalPages ? "bg-[#008f45] text-white" : "border border-[#e5e7eb] text-[#344054]"}`}>
                {totalPages}
              </button>
            )}
            <button type="button" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages} className="grid h-8 w-8 place-items-center rounded-md border border-[#d0d5dd] text-xs text-[#667085] disabled:cursor-not-allowed disabled:opacity-50">
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
        </div>
      </section>

      <ModalComponent
        isModalOpen={Boolean(selectedPayment)}
        onClose={() => setSelectedPayment(null)}
        hideHeader={true}
        title="Confirm Payment Update"
        panelClassName="relative max-w-[460px]"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={() => setSelectedPayment(null)}
          aria-label="Close"
          className="absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 text-lg leading-none"
        >
          &times;
        </button>

        {/* Icon */}
        <div className="mb-5 flex justify-center">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-50 border border-green-100">
              <FontAwesomeIcon icon={faClipboardList} className="text-4xl text-green-200" />
            </div>
            <div className="absolute bottom-0.5 right-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-green-500">
              <FontAwesomeIcon icon={faCheck} className="text-[9px] text-white" />
            </div>
          </div>
        </div>

        {/* Title + subtitle */}
        <h2 className="mb-1 text-center text-lg font-bold text-[#101828]">Confirm Payment Update</h2>
        <p className="mx-auto mb-5 max-w-xs text-center text-sm text-[#667085]">
          You&apos;re about to update this payment status. Please review the details before confirming.
        </p>

        {/* Details card */}
        <div className="mb-4 grid grid-cols-3 gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Reference</p>
            <p className="break-all text-[11px] font-bold leading-tight text-[#101828]">
              {selectedPayment?.reference || selectedPayment?.id || "--"}
            </p>
            <p className="mt-0.5 text-[11px] text-gray-500">
              {selectedPayment?.paymentCode || "--"}
            </p>
          </div>
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Customer</p>
            <p className="text-[11px] font-bold text-[#101828]">
              {selectedPayment?.customer?.name ||
                selectedPayment?.user?.name ||
                selectedPayment?.customerName ||
                "N/A"}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-gray-500">
              {selectedPayment ? paymentEmail(selectedPayment) : "--"}
            </p>
          </div>
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Amount</p>
            <p className="text-[11px] font-bold text-[#101828]">
              {selectedPayment ? formatMoney(selectedPayment.amount, currency) : "--"}
            </p>
          </div>
        </div>

        {/* Warning */}
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-orange-100 bg-orange-50 px-4 py-3">
          <FontAwesomeIcon icon={faCircleExclamation} className="shrink-0 text-base text-orange-500" />
          <p className="text-xs font-medium text-orange-700">
            This action will update the payment status and notify the customer.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setSelectedPayment(null)}
            disabled={Boolean(processingAction)}
            className="h-10 flex-1 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleConfirmPayment("completed")}
            disabled={Boolean(processingAction)}
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-[#006638] text-sm font-semibold text-white hover:bg-[#005530] disabled:opacity-60"
          >
            <FontAwesomeIcon icon={faLock} className="text-xs" />
            {processingAction === "completed" ? "Updating..." : "Confirm Update"}
          </button>
        </div>
      </ModalComponent>
    </div>
  );
};

export default ListPayments;
