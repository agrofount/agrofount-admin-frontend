import {
  faCalendarDays,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faDownload,
  faEllipsisVertical,
  faFileCircleXmark,
  faFilter,
  faMoneyBillTransfer,
  faSearch,
  faWallet,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { ShopContext } from "../../context/ShopContext";
import { apiClient } from "../../lib/apiClient";
import { TableRowsSkeleton } from "../common/LoadingStates";
import ModalComponent from "../modals/ModalComponent";
import ApproveForm from "./ApproveForm";

const statusOptions = ["All Statuses", "Approved", "Pending", "Rejected"];

const formatCurrency = (value = 0, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const formatDate = (date) => {
  if (!date) return "-";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(date));
};

const getSupplierName = (request) =>
  request?.user?.username ||
  request?.user?.name ||
  request?.supplier?.name ||
  request?.supplierName ||
  "Unknown";

const getInitials = (name) =>
  String(name || "NA")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const getRequestCode = (request, index) =>
  request?.requestId ||
  request?.code ||
  request?.reference ||
  `REQ-${String(request?.id || index + 1).slice(0, 6).toUpperCase()}`;

const normaliseStatus = (status) => String(status || "pending").toLowerCase();

const statusClassName = (status) => {
  const nextStatus = normaliseStatus(status);
  if (nextStatus === "approved") return "bg-[#e5f8ed] text-[#008f45]";
  if (nextStatus === "rejected") return "bg-[#ffe5e7] text-[#ef3340]";
  return "bg-[#fff4df] text-[#f59e0b]";
};

const StatCard = ({ label, value, helper, icon, tone }) => (
  <section className="flex min-h-[96px] items-center gap-4 rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
    <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-base ${tone}`}>
      <FontAwesomeIcon icon={icon} />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium text-[#475467]">{label}</p>
      <p className="mt-1 truncate text-xl font-semibold tracking-normal text-[#101828]">{value}</p>
      <p className="mt-1 text-xs text-[#667085]">{helper}</p>
    </div>
  </section>
);

const CreditFacilityRequests = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [requests, setRequests] = useState({ data: [], meta: {} });
  const [pageLimit, setPageLimit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [requestPage, setRequestPage] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const { token, navigate, currency } = useContext(ShopContext);
  const searchTimeout = useRef();

  const fetchRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get("/credit-facility/requests", {
        params: {
          page: requestPage,
          limit: pageLimit,
          search: searchValue,
          status: statusFilter === "All Statuses" ? undefined : statusFilter.toLowerCase(),
        },
      });

      setRequests(response.data || { data: [], meta: {} });
    } catch (error) {
      toast.error(error.message || "Failed to load credit facility requests.");
      setRequests({ data: [], meta: {} });
    } finally {
      setIsLoading(false);
    }
  }, [pageLimit, requestPage, searchValue, statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests, submitted]);

  useEffect(() => {
    if (!token) navigate("/login");
  }, [token, navigate]);

  const rows = useMemo(() => requests.data || [], [requests.data]);
  const meta = requests.meta || {};
  const currentPage = Number(meta.currentPage || requestPage || 1);
  const totalPages = Number(meta.totalPages || 1);
  const totalItems = Number(meta.totalItems || rows.length);
  const shownFrom = totalItems ? (currentPage - 1) * pageLimit + 1 : 0;
  const shownTo = totalItems ? Math.min(currentPage * pageLimit, totalItems) : 0;

  const stats = useMemo(() => {
    const requested = rows.reduce((sum, request) => sum + Number(request.requestedAmount || 0), 0);
    const approved = rows.reduce((sum, request) => sum + Number(request.approvedAmount || 0), 0);
    const pending = rows.filter((request) => normaliseStatus(request.status) === "pending").length;
    const rejected = rows.filter((request) => normaliseStatus(request.status) === "rejected").length;

    return [
      {
        label: "Total Requests",
        value: totalItems || rows.length,
        helper: "All time",
        icon: faMoneyBillTransfer,
        tone: "bg-[#e7f7ed] text-[#008f45]",
      },
      {
        label: "Total Amount Requested",
        value: formatCurrency(requested, currency),
        helper: "All time",
        icon: faWallet,
        tone: "bg-[#e7f7ed] text-[#008f45]",
      },
      {
        label: "Total Amount Approved",
        value: formatCurrency(approved, currency),
        helper: "All time",
        icon: faWallet,
        tone: "bg-[#e7f7ed] text-[#008f45]",
      },
      {
        label: "Pending Requests",
        value: pending,
        helper: "Awaiting approval",
        icon: faFileCircleXmark,
        tone: "bg-[#fff5df] text-[#f5b822]",
      },
      {
        label: "Rejected Requests",
        value: rejected,
        helper: "All time",
        icon: faFileCircleXmark,
        tone: "bg-[#ffe5e7] text-[#ef3340]",
      },
    ];
  }, [currency, rows, totalItems]);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 4) return Array.from({ length: totalPages }, (_, index) => index + 1);
    return [1, 2, 3, "...", totalPages];
  }, [totalPages]);

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchInput(value);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setRequestPage(1);
      setSearchValue(value);
    }, 400);
  };

  const handleLimitChange = (limit) => {
    setPageLimit(limit);
    setRequestPage(1);
  };

  const handleStatusChange = (status) => {
    setStatusFilter(status);
    setRequestPage(1);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setSearchValue("");
    setStatusFilter("All Statuses");
    setRequestPage(1);
  };

  const handleExport = () => {
    const headers = [
      "Request ID",
      "Supplier",
      "Amount Requested",
      "Amount Approved",
      "Status",
      "Start Date",
      "Repayment Period",
      "Date",
    ];
    const csvRows = rows.map((request, index) => [
      getRequestCode(request, index),
      getSupplierName(request),
      request.requestedAmount || 0,
      request.approvedAmount || 0,
      normaliseStatus(request.status),
      formatDate(request.creditStartDate),
      `${request.repaymentPeriod || 0} Weeks`,
      formatDate(request.createdAt),
    ]);
    const csv = [headers, ...csvRows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "credit-facility-requests.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 text-[#101828]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Credit Facility Request List</h1>
          <p className="mt-1 text-xs font-medium text-[#667085]">
            View and manage all supplier credit facility requests in one place.
          </p>
        </div>

        <div className="flex flex-col items-start gap-4 lg:items-end">
          <div className="flex items-center gap-2 text-xs font-medium text-[#667085]">
            <Link to="/" className="hover:text-[#008f45]">Dashboard</Link>
            <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
            <Link to="/suppliers" className="hover:text-[#008f45]">Suppliers</Link>
            <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
            <span>Credit Facility Requests</span>
          </div>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#007f3d] px-5 text-sm font-semibold text-white shadow-[0_8px_16px_rgba(0,127,61,0.18)]"
          >
            <FontAwesomeIcon icon={faDownload} />
            Export
            <FontAwesomeIcon icon={faChevronDown} className="text-[10px]" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <section className="overflow-hidden rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex h-10 min-w-0 items-center rounded-md border border-[#d0d5dd] bg-white px-4 shadow-sm xl:w-[420px]">
            <input
              type="text"
              value={searchInput}
              onChange={handleSearchChange}
              placeholder="Search by Request ID, supplier name..."
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#98a2b3]"
            />
            <FontAwesomeIcon icon={faSearch} className="text-[#667085]" />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Menu>
              <MenuButton className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-4 text-sm font-medium text-[#344054] shadow-sm">
                <FontAwesomeIcon icon={faCalendarDays} />
                Date Range
                <FontAwesomeIcon icon={faChevronDown} className="text-[10px]" />
              </MenuButton>
              <MenuItems anchor="bottom" className="z-20 mt-2 rounded-md border border-[#e5e7eb] bg-white p-1 shadow-lg">
                <MenuItem>
                  <button type="button" className="block w-full rounded px-4 py-2 text-left text-sm text-[#344054] hover:bg-gray-50">
                    All dates
                  </button>
                </MenuItem>
              </MenuItems>
            </Menu>

            <Menu>
              <MenuButton className="inline-flex h-10 min-w-[128px] items-center justify-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-4 text-sm font-medium text-[#344054] shadow-sm">
                <FontAwesomeIcon icon={faFilter} />
                {statusFilter === "All Statuses" ? "Status" : statusFilter}
                <FontAwesomeIcon icon={faChevronDown} className="text-[10px]" />
              </MenuButton>
              <MenuItems anchor="bottom" className="z-20 mt-2 rounded-md border border-[#e5e7eb] bg-white p-1 shadow-lg">
                {statusOptions.map((status) => (
                  <MenuItem key={status}>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(status)}
                      className="block w-full rounded px-4 py-2 text-left text-sm text-[#344054] hover:bg-gray-50"
                    >
                      {status}
                    </button>
                  </MenuItem>
                ))}
              </MenuItems>
            </Menu>

            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex h-10 items-center justify-center rounded-md border border-[#d0d5dd] bg-white px-5 text-sm font-medium text-[#667085] shadow-sm"
            >
              Clear Filters
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left">
            <thead className="bg-[#f8fafc] text-[11px] uppercase text-[#667085]">
              <tr>
                {["Request ID", "Supplier", "Amount Requested", "Amount Approved", "Status", "Start Date", "Repayment Period", "Date", ""].map((heading) => (
                  <th key={heading || "actions"} className="px-3 py-3 font-semibold">
                    {heading}
                    {heading && <span className="ml-2 inline-flex flex-col align-middle text-[8px] leading-[7px] text-[#98a2b3]"><FontAwesomeIcon icon={faChevronUp} /><FontAwesomeIcon icon={faChevronDown} /></span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableRowsSkeleton rows={6} columns={9} />
              ) : rows.length ? (
                rows.map((request, index) => {
                  const supplierName = getSupplierName(request);
                  return (
                    <tr
                      key={request.id || getRequestCode(request, index)}
                      className="border-b border-[#eef2f6] text-xs last:border-0 hover:bg-[#fbfcfd]"
                    >
                      <td className="whitespace-nowrap px-3 py-4 font-medium">{getRequestCode(request, index)}</td>
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-2">
                          <span className="grid h-7 w-7 place-items-center rounded-full bg-[#eef2f6] text-[11px] font-medium text-[#344054]">
                            {getInitials(supplierName)}
                          </span>
                          <span className="font-medium">{supplierName}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 font-medium">{formatCurrency(request.requestedAmount, currency)}</td>
                      <td className="whitespace-nowrap px-3 py-4 font-medium">{formatCurrency(request.approvedAmount, currency)}</td>
                      <td className="px-3 py-4">
                        <span className={`inline-flex items-center gap-2 rounded-md px-3 py-1 text-xs font-medium capitalize ${statusClassName(request.status)}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {normaliseStatus(request.status)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4">{formatDate(request.creditStartDate)}</td>
                      <td className="whitespace-nowrap px-3 py-4">{request.repaymentPeriod || 0} Weeks</td>
                      <td className="whitespace-nowrap px-3 py-4">{formatDate(request.createdAt)}</td>
                      <td className="px-3 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedRequest(request)}
                          aria-label={`Open ${getRequestCode(request, index)}`}
                          className="grid h-8 w-8 place-items-center rounded-md text-[#101828] hover:bg-[#f2f4f7]"
                        >
                          <FontAwesomeIcon icon={faEllipsisVertical} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="px-4 py-16 text-center text-sm text-[#667085]">
                    No credit facility requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-4 border-t border-[#eef2f6] pt-4 text-sm text-[#667085] md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <span>Showing {shownFrom} to {shownTo} of {totalItems} entries</span>
            <Menu>
              <MenuButton className="inline-flex h-8 items-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-3 text-xs text-[#344054]">
                {pageLimit}
                <FontAwesomeIcon icon={faChevronDown} className="text-[10px]" />
              </MenuButton>
              <MenuItems anchor="bottom" className="z-20 mt-2 rounded-md border border-[#e5e7eb] bg-white p-1 shadow-lg">
                {[6, 10, 20, 30, 50].map((limit) => (
                  <MenuItem key={limit}>
                    <button type="button" onClick={() => handleLimitChange(limit)} className="block w-full rounded px-5 py-2 text-left text-sm hover:bg-gray-50">
                      {limit}
                    </button>
                  </MenuItem>
                ))}
              </MenuItems>
            </Menu>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setRequestPage((page) => Math.max(page - 1, 1))}
              className="grid h-9 w-9 place-items-center rounded-md border border-[#d0d5dd] bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            {pageNumbers.map((page, index) =>
              page === "..." ? (
                <span key={`${page}-${index}`} className="px-2">...</span>
              ) : (
                <button
                  key={page}
                  type="button"
                  onClick={() => setRequestPage(page)}
                  className={`grid h-9 w-9 place-items-center rounded-md border text-sm font-semibold ${
                    currentPage === page
                      ? "border-[#008f45] bg-[#008f45] text-white"
                      : "border-[#e5e7eb] bg-white text-[#344054]"
                  }`}
                >
                  {page}
                </button>
              )
            )}
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setRequestPage((page) => Math.min(page + 1, totalPages))}
              className="grid h-9 w-9 place-items-center rounded-md border border-[#d0d5dd] bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
        </div>
      </section>

      <ModalComponent
        isModalOpen={Boolean(selectedRequest)}
        onClose={() => {
          setSelectedRequest(null);
          setSubmitted(false);
        }}
        title="Credit Facility Request Details"
        hideHeader
        panelClassName="max-w-[560px] overflow-hidden !p-0"
      >
        {selectedRequest && (
          <ApproveForm
            request={selectedRequest}
            submitted={submitted}
            setSubmitted={setSubmitted}
            onClose={() => {
              setSelectedRequest(null);
              setSubmitted(false);
            }}
          />
        )}
      </ModalComponent>
    </div>
  );
};

export default CreditFacilityRequests;
