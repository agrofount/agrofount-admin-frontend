import {
  faBagShopping,
  faBoxOpen,
  faCalendarDays,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faCircleCheck,
  faCircleXmark,
  faDownload,
  faEllipsis,
  faMagnifyingGlass,
  faRotateLeft,
  faTruck,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { assets } from "../../assets/assets";
import { ShopContext } from "../../context/ShopContext";
import { apiClient } from "../../lib/apiClient";
import { TableRowsSkeleton } from "../common/LoadingStates";

const statusOptions = ["All Statuses", "Pending", "Confirmed", "Shipped", "Cancelled"];
const dateRangeOptions = ["May 12 - May 18, 2025", "Last 30 days", "This month", "All dates"];

const formatMoney = (value, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number(value || 0));

const formatOrderDateTime = (value) => {
  if (!value) return "May 18, 2025 - 10:23 AM";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value)).replace(",", " -");
};

const formatStartDate = (value) => {
  if (!value) return "Sat Mar 14 2026";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value));
};

const titleCase = (value = "") =>
  value
    .toString()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getOrderItems = (order) => (Array.isArray(order?.items) ? order.items : []);

const getQuantity = (order) =>
  getOrderItems(order).reduce((total, item) => total + Number(item?.quantity || 0), 0);

const getProduct = (order) => {
  const item = getOrderItems(order)[0] || {};
  return {
    image: item?.product?.images?.[0] || assets.image_placeholder,
    name: item?.product?.name || item?.name || "Product",
  };
};

const getCustomer = (order) => {
  const name = order?.user?.username || order?.customer?.name || order?.customerName || "Customer";
  const email = order?.user?.email || order?.customer?.email || order?.email || "customer@example.com";
  const initials = name
    .split(/[^\w]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "CU";

  return { name, email, initials };
};

const getLocation = (order) =>
  order?.address?.state ||
  order?.address?.city ||
  order?.deliveryAddress?.state ||
  order?.location ||
  "Ibadan";

const statusStyles = {
  confirmed: "bg-[#dcf8e4] text-[#008f45]",
  delivered: "bg-[#dcf8e4] text-[#008f45]",
  pending: "bg-[#fff1df] text-[#f97316]",
  shipped: "bg-[#e7f0ff] text-[#1f7ae0]",
  cancelled: "bg-[#ffe4e6] text-[#ef3340]",
  canceled: "bg-[#ffe4e6] text-[#ef3340]",
};

const statusClass = (status) =>
  statusStyles[status?.toLowerCase?.()] || "bg-[#eef2f6] text-[#667085]";

const SortLabel = ({ label, field, sortBy, sortOrder, onSort }) => (
  <button
    type="button"
    onClick={() => onSort(field)}
    className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.02em] text-[#667085]"
  >
    {label}
    <span className="grid gap-[1px] text-[7px] text-[#98a2b3]">
      <FontAwesomeIcon
        icon={faChevronUp}
        className={sortBy === field && sortOrder === "ASC" ? "text-[#008f45]" : ""}
      />
      <FontAwesomeIcon
        icon={faChevronDown}
        className={sortBy === field && sortOrder === "DESC" ? "text-[#008f45]" : ""}
      />
    </span>
  </button>
);

const StaticHeadLabel = ({ label }) => (
  <span className="text-[9px] font-semibold uppercase tracking-[0.02em] text-[#667085]">
    {label}
  </span>
);

const getPageNumbers = (currentPage, totalPages) => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, currentPage]);
  if (currentPage > 2) pages.add(currentPage - 1);
  if (currentPage < totalPages - 1) pages.add(currentPage + 1);

  return [...pages]
    .sort((a, b) => a - b)
    .reduce((acc, page, index, source) => {
      if (index > 0 && page - source[index - 1] > 1) acc.push("...");
      acc.push(page);
      return acc;
    }, []);
};

export const ListOrders = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [pageLimit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [stateInput, setStateInput] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [dateRange, setDateRange] = useState(dateRangeOptions[0]);
  const [meta, setMeta] = useState({});
  const [orderPage, setOrderPage] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("DESC");

  const { currency, navigate } = useContext(ShopContext);
  const searchTimeout = useRef();
  const stateTimeout = useRef();

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await apiClient.get("/order/admin/all", {
        params: {
          page: orderPage,
          limit: pageLimit,
          search: searchValue,
          sortBy: `${sortBy}:${sortOrder}`,
          ...(statusFilter !== "All Statuses"
            ? { "filter.status": `$eq:${statusFilter.toLowerCase()}` }
            : {}),
          ...(stateValue ? { state: stateValue } : {}),
        },
        paramsSerializer: { indexes: null },
      });

      if (response.status === 200) {
        setOrders(response.data.data || []);
        setMeta(response.data.meta || {});
      }
    } catch (error) {
      console.error("an error occurred: ", error);
    } finally {
      setIsLoading(false);
    }
  }, [orderPage, pageLimit, searchValue, sortBy, sortOrder, statusFilter, stateValue]);

  const handlePageChange = (page) => {
    if (page < 1 || page > Number(meta.totalPages || 1)) return;
    setOrderPage(page);
  };

  const handleSort = (field) => {
    if (!field) return;
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
      setOrderPage(1);
      setSearchValue(value);
    }, 400);
  };

  const handleStateChange = (event) => {
    const value = event.target.value;
    setStateInput(value);
    clearTimeout(stateTimeout.current);
    stateTimeout.current = setTimeout(() => {
      setOrderPage(1);
      setStateValue(value);
    }, 400);
  };

  const sourceOrders = orders;

  // Status is already filtered server-side (filter.status), but kept here
  // too as a defensive client-side pass. State is now searched server-side
  // only (address.state is free text, not a fixed catalog) — no client-side
  // re-filtering, since the fetched page already reflects the state search.
  const filteredOrders = useMemo(
    () =>
      sourceOrders.filter((order) => {
        const statusMatches =
          statusFilter === "All Statuses" ||
          order?.status?.toLowerCase?.() === statusFilter.toLowerCase();
        return statusMatches;
      }),
    [sourceOrders, statusFilter],
  );

  const totalOrders = Number(meta.totalItems || filteredOrders.length || 0);
  const statusCounts = useMemo(
    () =>
      sourceOrders.reduce(
        (counts, order) => ({
          ...counts,
          [order?.status?.toLowerCase?.() || "unknown"]:
            (counts[order?.status?.toLowerCase?.() || "unknown"] || 0) + 1,
        }),
        {},
      ),
    [sourceOrders],
  );

  const metricCards = [
    {
      label: "Total Orders",
      value: totalOrders,
      icon: faBagShopping,
      tone: "green",
      trend: "up",
      note: "12.5% vs last month",
    },
    {
      label: "Pending Orders",
      value: statusCounts.pending || 0,
      icon: faBoxOpen,
      tone: "blue",
      trend: "dot",
      note: "37.5% of total",
    },
    {
      label: "Confirmed Orders",
      value: statusCounts.confirmed || 0,
      icon: faCircleCheck,
      tone: "purple",
      trend: "up",
      note: "8.2% vs last month",
    },
    {
      label: "Shipped Orders",
      value: statusCounts.shipped || 0,
      icon: faTruck,
      tone: "orange",
      trend: "up",
      note: "4.1% vs last month",
    },
    {
      label: "Cancelled Orders",
      value: statusCounts.cancelled || statusCounts.canceled || 0,
      icon: faCircleXmark,
      tone: "red",
      trend: "down",
      note: "2.1% vs last month",
    },
  ];

  const exportOrders = () => {
    const rows = filteredOrders.map((order) => {
      const product = getProduct(order);
      const customer = getCustomer(order);
      return [
        order.code || order.id,
        product.name,
        customer.name,
        customer.email,
        getLocation(order),
        getQuantity(order),
        order.totalPrice || 0,
        order.status || "",
        order.createdAt || "",
      ];
    });
    const header = ["Order", "Product", "Customer", "Email", "Location", "Quantity", "Price", "Status", "Date"];
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "orders.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearchValue("");
    setStatusFilter("All Statuses");
    setStateInput("");
    setStateValue("");
    setDateRange(dateRangeOptions[0]);
    setOrderPage(1);
  };

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(
    () => () => {
      clearTimeout(searchTimeout.current);
      clearTimeout(stateTimeout.current);
    },
    [],
  );

  const currentPage = Number(meta.currentPage || orderPage || 1);
  const totalPages = Number(meta.totalPages || Math.max(1, Math.ceil(totalOrders / pageLimit)));
  const shownFrom = totalOrders ? (currentPage - 1) * pageLimit + 1 : 0;
  const shownTo = totalOrders ? Math.min(currentPage * pageLimit, totalOrders) : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[#101828]">Orders</h1>
          <p className="mt-1 text-xs font-medium text-[#667085]">View and manage all customer orders in one place.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-[#667085]">
            <Link to="/" className="hover:text-[#008f45]">Dashboard</Link>
            <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
            <span className="font-medium text-[#344054]">Orders</span>
          </div>
          <button
            type="button"
            onClick={exportOrders}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-3 text-xs font-semibold text-[#008f45] shadow-sm hover:bg-[#f7fbf6]"
          >
            <FontAwesomeIcon icon={faDownload} />
            Export
            <FontAwesomeIcon icon={faChevronDown} className="text-xs text-[#667085]" />
          </button>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {metricCards.map((card) => (
          <div key={card.label} className="rounded-lg border border-[#e5e7eb] bg-white px-4 py-3 shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
            <div className="flex items-center gap-3">
              <div
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
                  card.tone === "green"
                    ? "bg-[#dcf8e4] text-[#008f45]"
                    : card.tone === "blue"
                      ? "bg-[#e7f0ff] text-[#1f7ae0]"
                      : card.tone === "purple"
                        ? "bg-[#eee4ff] text-[#7b3fe4]"
                        : card.tone === "orange"
                          ? "bg-[#fff0df] text-[#f97316]"
                          : "bg-[#ffe4e6] text-[#ef3340]"
                }`}
              >
                <FontAwesomeIcon icon={card.icon} className="text-base" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-[#667085]">{card.label}</p>
                <p className="mt-0.5 text-lg font-semibold text-[#101828]">{card.value}</p>
                <p
                  className={`mt-1.5 flex items-center gap-1 text-[11px] font-semibold ${
                    card.trend === "down"
                      ? "text-[#ef3340]"
                      : card.trend === "dot"
                        ? "text-[#667085]"
                        : "text-[#008f45]"
                  }`}
                >
                  {card.trend === "dot" ? (
                    <span className="h-2 w-2 rounded-full bg-[#f97316]" />
                  ) : (
                    <span>{card.trend === "down" ? "↓" : "↑"}</span>
                  )}
                  {card.note}
                </p>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
        <div className="grid gap-3 lg:grid-cols-[1.8fr_1fr_1fr_1.1fr_auto]">
          <label className="relative">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#667085]" />
            <input
              value={searchInput}
              onChange={handleSearchChange}
              placeholder="Search by order ID, product, customer..."
              className="h-9 w-full rounded-md border border-[#d0d5dd] bg-white pl-9 pr-3 text-xs text-[#101828] outline-none focus:border-[#008f45] focus:ring-2 focus:ring-[#dff4e5]"
            />
          </label>

          <label>
            <span className="mb-1 block text-[11px] font-semibold text-[#667085]">Status</span>
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setOrderPage(1);
              }}
              className="h-9 w-full rounded-md border border-[#d0d5dd] bg-white px-3 text-xs text-[#101828] outline-none focus:border-[#008f45] focus:ring-2 focus:ring-[#dff4e5]"
            >
              {statusOptions.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1 block text-[11px] font-semibold text-[#667085]">State</span>
            <input
              value={stateInput}
              onChange={handleStateChange}
              placeholder="e.g. Lagos"
              className="h-9 w-full rounded-md border border-[#d0d5dd] bg-white px-3 text-xs text-[#101828] outline-none focus:border-[#008f45] focus:ring-2 focus:ring-[#dff4e5]"
            />
          </label>

          <label>
            <span className="mb-1 block text-[11px] font-semibold text-[#667085]">Date Range</span>
            <div className="relative">
              <FontAwesomeIcon icon={faCalendarDays} className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#667085]" />
              <select
                value={dateRange}
                onChange={(event) => setDateRange(event.target.value)}
                className="h-9 w-full rounded-md border border-[#d0d5dd] bg-white pl-9 pr-3 text-xs font-medium text-[#101828] outline-none focus:border-[#008f45] focus:ring-2 focus:ring-[#dff4e5]"
              >
                {dateRangeOptions.map((range) => (
                  <option key={range}>{range}</option>
                ))}
              </select>
            </div>
          </label>

          <button
            type="button"
            onClick={clearFilters}
            className="mt-auto inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-4 text-xs font-semibold text-[#344054] hover:bg-[#f8fafc]"
          >
            <FontAwesomeIcon icon={faRotateLeft} />
            Clear Filters
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-[#e5e7eb] bg-white shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
        <div className="w-full overflow-x-auto">
          <table className="min-w-[1120px] w-full text-left">
            <thead className="border-b border-[#e5e7eb] bg-[#fbfcfd]">
              <tr>
                <th className="px-4 py-3"><SortLabel label="Order" field="id" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} /></th>
                <th className="px-4 py-3"><StaticHeadLabel label="Product" /></th>
                <th className="px-4 py-3"><StaticHeadLabel label="Customer" /></th>
                <th className="px-4 py-3"><StaticHeadLabel label="Location" /></th>
                <th className="px-4 py-3"><StaticHeadLabel label="Quantity" /></th>
                <th className="px-4 py-3"><SortLabel label="Price" field="totalPrice" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} /></th>
                <th className="px-4 py-3"><SortLabel label="Status" field="status" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} /></th>
                <th className="px-4 py-3"><SortLabel label="Start Date" field="createdAt" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} /></th>
                <th className="px-4 py-3 text-[9px] font-semibold uppercase tracking-[0.02em] text-[#667085]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eef2f6]">
              {isLoading ? (
                <TableRowsSkeleton rows={7} columns={9} />
              ) : filteredOrders.length < 1 ? (
                <tr>
                  <td colSpan="9">
                    <div className="flex h-[280px] flex-col items-center justify-center">
                      <img src={assets.empty_table} alt="" className="h-24 w-24 object-contain opacity-70" />
                      <p className="mt-4 text-sm text-[#98a2b3]">No orders found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const product = getProduct(order);
                  const customer = getCustomer(order);
                  return (
                    <tr
                      key={order.id || order.code}
                      className="cursor-pointer hover:bg-[#f9fafb]"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      <td className="px-4 py-3">
                        <p className="text-xs font-semibold text-[#101828]">{order.code || order.id}</p>
                        <p className="mt-1 text-[11px] text-[#667085]">{formatOrderDateTime(order.createdAt)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <img src={product.image} alt="" className="h-8 w-8 rounded object-cover" />
                          <p className="max-w-[140px] text-xs font-medium leading-4 text-[#101828]">{product.name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#dbeafe] text-[11px] font-semibold text-[#1f7ae0]">
                            {customer.initials}
                          </span>
                          <div>
                            <p className="text-xs font-medium text-[#101828]">{customer.name}</p>
                            <p className="text-[11px] text-[#667085]">{customer.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-[#101828]">{getLocation(order)}</td>
                      <td className="px-4 py-3 text-center text-xs font-semibold text-[#101828]">{getQuantity(order)}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-[#101828]">{formatMoney(order.totalPrice, currency)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex min-w-[72px] justify-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClass(order.status)}`}>
                          {titleCase(order.status || "Pending")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-[#101828]">{formatStartDate(order.createdAt)}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            navigate(`/orders/${order.id}`);
                          }}
                          className="grid h-7 w-7 place-items-center rounded-full text-xs text-[#667085] hover:bg-[#eef2f6]"
                        >
                          <FontAwesomeIcon icon={faEllipsis} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#eef2f6] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#667085]">
            Showing {shownFrom} to {shownTo} of {totalOrders || filteredOrders.length} orders
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              className="grid h-8 w-8 place-items-center rounded-md border border-[#d0d5dd] text-xs text-[#667085] disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            {getPageNumbers(currentPage, totalPages).map((page, index) =>
              page === "..." ? (
                <span key={`${page}-${index}`} className="px-1 text-xs text-[#667085]">
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  type="button"
                  onClick={() => handlePageChange(page)}
                  className={`h-8 min-w-8 rounded-md px-2.5 text-xs font-semibold ${
                    currentPage === page
                      ? "bg-[#008f45] text-white shadow-sm"
                      : "text-[#101828] hover:bg-[#eef2f6]"
                  }`}
                >
                  {page}
                </button>
              )
            )}
            <button
              type="button"
              className="grid h-8 w-8 place-items-center rounded-md border border-[#d0d5dd] text-xs text-[#667085] disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
