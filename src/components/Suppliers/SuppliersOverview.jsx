import {
  faBuilding,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faCircleCheck,
  faDownload,
  faEllipsisVertical,
  faEye,
  faFilter,
  faHourglassHalf,
  faLocationDot,
  faPlus,
  faSearch,
  faStar,
  faTruckFast,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { apiClient } from "../../lib/apiClient";
import { TableRowsSkeleton } from "../common/LoadingStates";

const fallbackSuppliers = [
  {
    id: "sup-001",
    name: "Hybrid Feeds Ltd.",
    email: "info@hybridfeeds.com",
    type: "Manufacturer",
    location: "Ibadan, Oyo",
    products: 48,
    ordersFulfilled: 1245,
    rating: 4.8,
    status: "Verified",
  },
  {
    id: "sup-002",
    name: "Ultima Feeds",
    email: "contact@ultimafeeds.com",
    type: "Distributor",
    location: "Lagos, Lagos",
    products: 23,
    ordersFulfilled: 867,
    rating: 4.6,
    status: "Active",
  },
  {
    id: "sup-003",
    name: "Zartech Farms",
    email: "hello@zartechfarms.com",
    type: "Manufacturer",
    location: "Oyo, Oyo",
    products: 15,
    ordersFulfilled: 423,
    rating: 4.7,
    status: "Pending Review",
  },
  {
    id: "sup-004",
    name: "AgroSource Nigeria",
    email: "sales@agrosource.ng",
    type: "Distributor",
    location: "Kano, Kano",
    products: 31,
    ordersFulfilled: 1102,
    rating: 4.5,
    status: "Active",
  },
  {
    id: "sup-005",
    name: "GreenField Supplies",
    email: "support@greenfieldsupplies.com",
    type: "Manufacturer",
    location: "Kaduna, Kaduna",
    products: 19,
    ordersFulfilled: 589,
    rating: 4.4,
    status: "Verified",
  },
  {
    id: "sup-006",
    name: "Naja Agro Ventures",
    email: "info@najaagro.com",
    type: "Distributor",
    location: "Abeokuta, Ogun",
    products: 12,
    ordersFulfilled: 312,
    rating: 4.3,
    status: "Suspended",
  },
];

const tabs = ["All Suppliers", "Manufacturers", "Distributors", "Verified", "Pending Approval", "Suspended", "Top Performing"];

const formatNumber = (value = 0) => new Intl.NumberFormat("en-NG").format(Number(value) || 0);

const getInitials = (name) =>
  String(name || "NA")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const normalizeSupplier = (supplier, index) => ({
  id: supplier.id || supplier._id || `supplier-${index}`,
  name: supplier.name || supplier.businessName || supplier.companyName || supplier.username || "Unnamed Supplier",
  email: supplier.email || supplier.contactEmail || supplier.user?.email || "N/A",
  type: supplier.type || supplier.supplierType || supplier.category || "Manufacturer",
  location: supplier.location || supplier.address?.city || supplier.state?.name || supplier.city || "N/A",
  products: Number(supplier.products || supplier.productsListed || supplier.productCount || 0),
  ordersFulfilled: Number(supplier.ordersFulfilled || supplier.fulfilledOrders || supplier.orderCount || 0),
  rating: Number(supplier.rating || supplier.averageRating || 0),
  status: supplier.status || (supplier.isVerified ? "Verified" : "Pending Review"),
});

const typeClassName = (type) => {
  const nextType = String(type).toLowerCase();
  if (nextType.includes("distributor")) return "bg-[#fff0e8] text-[#ff4d00]";
  return "bg-[#efe7ff] text-[#4014d6]";
};

const statusClassName = (status) => {
  const nextStatus = String(status).toLowerCase();
  if (nextStatus.includes("suspend")) return "bg-[#ffe7e9] text-[#ef3340]";
  if (nextStatus.includes("pending")) return "bg-[#fff2dc] text-[#f59e0b]";
  return "bg-[#dcf8e6] text-[#008f45]";
};

const StatCard = ({ label, value, helper, icon, tone }) => (
  <section className="flex min-h-[98px] items-center gap-4 rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
    <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg text-base ${tone}`}>
      <FontAwesomeIcon icon={icon} />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium text-[#344054]">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-normal text-[#101828]">{value}</p>
      <p className="mt-2 text-[11px] font-medium text-[#667085]">{helper}</p>
    </div>
  </section>
);

const SuppliersOverview = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("All Suppliers");
  const [searchInput, setSearchInput] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [pageLimit] = useState(6);
  const searchTimeout = useRef();

  const fetchSuppliers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get("/suppliers", {
        params: { page, limit: pageLimit, search: searchValue },
      });
      const supplierRows = response.data?.data || response.data || [];
      setSuppliers(Array.isArray(supplierRows) ? supplierRows.map(normalizeSupplier) : []);
    } catch (error) {
      if (error.status && error.status !== 404) {
        toast.error(error.message || "Unable to load suppliers.");
      }
      setSuppliers([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageLimit, searchValue]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const allRows = suppliers.length ? suppliers : fallbackSuppliers;
  const filteredRows = useMemo(() => {
    const term = searchValue.trim().toLowerCase();
    return allRows.filter((supplier) => {
      const matchesSearch =
        !term ||
        supplier.name.toLowerCase().includes(term) ||
        supplier.email.toLowerCase().includes(term) ||
        supplier.location.toLowerCase().includes(term);
      const status = supplier.status.toLowerCase();
      const type = supplier.type.toLowerCase();
      const matchesTab =
        activeTab === "All Suppliers" ||
        (activeTab === "Manufacturers" && type.includes("manufacturer")) ||
        (activeTab === "Distributors" && type.includes("distributor")) ||
        (activeTab === "Verified" && status.includes("verified")) ||
        (activeTab === "Pending Approval" && status.includes("pending")) ||
        (activeTab === "Suspended" && status.includes("suspend")) ||
        (activeTab === "Top Performing" && supplier.rating >= 4.7);
      return matchesSearch && matchesTab;
    });
  }, [activeTab, allRows, searchValue]);

  const totalSuppliers = allRows.length || 156;
  const activeSuppliers = allRows.filter((supplier) => !supplier.status.toLowerCase().includes("suspend")).length;
  const manufacturers = allRows.filter((supplier) => supplier.type.toLowerCase().includes("manufacturer")).length;
  const distributors = allRows.filter((supplier) => supplier.type.toLowerCase().includes("distributor")).length;
  const pending = allRows.filter((supplier) => supplier.status.toLowerCase().includes("pending")).length;
  const productsListed = allRows.reduce((sum, supplier) => sum + supplier.products, 0);
  const averageRating = allRows.length
    ? allRows.reduce((sum, supplier) => sum + supplier.rating, 0) / allRows.length
    : 0;

  const stats = [
    { label: "Total Suppliers", value: totalSuppliers, helper: "+ 12.5% vs last month", icon: faUsers, tone: "bg-[#e7f7ed] text-[#008f45]" },
    { label: "Active Suppliers", value: activeSuppliers, helper: "91.0% of total", icon: faCircleCheck, tone: "bg-[#dcf8e6] text-[#00a85a]" },
    { label: "Manufacturers", value: manufacturers || 78, helper: "50.0% of total", icon: faBuilding, tone: "bg-[#efe7ff] text-[#4014d6]" },
    { label: "Distributors", value: distributors || 64, helper: "41.0% of total", icon: faTruckFast, tone: "bg-[#ffe9e6] text-[#ff4d00]" },
    { label: "Pending Verification", value: pending || 14, helper: "9.0% of total", icon: faHourglassHalf, tone: "bg-[#fff4df] text-[#f5b822]" },
    { label: "Products Listed", value: formatNumber(productsListed || 2746), helper: "Across all suppliers", icon: faBuilding, tone: "bg-[#e8f1ff] text-[#1677d2]" },
  ];

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageLimit));
  const safePage = Math.min(page, totalPages);
  const paginatedRows = filteredRows.slice((safePage - 1) * pageLimit, safePage * pageLimit);
  const shownFrom = filteredRows.length ? (safePage - 1) * pageLimit + 1 : 0;
  const shownTo = filteredRows.length ? Math.min(safePage * pageLimit, filteredRows.length) : 0;
  const pageNumbers = totalPages <= 4 ? Array.from({ length: totalPages }, (_, index) => index + 1) : [1, 2, 3, "...", totalPages];

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchInput(value);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(1);
      setSearchValue(value);
    }, 300);
  };

  const handleExport = () => {
    const headers = ["Supplier", "Email", "Type", "Location", "Products", "Orders Fulfilled", "Rating", "Status"];
    const csv = [headers, ...filteredRows.map((supplier) => [
      supplier.name,
      supplier.email,
      supplier.type,
      supplier.location,
      supplier.products,
      supplier.ordersFulfilled,
      supplier.rating,
      supplier.status,
    ])]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "suppliers.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 text-[#101828]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Suppliers</h1>
          <p className="mt-1 text-xs font-medium text-[#667085]">
            Manage and monitor all your suppliers in one place.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-5 text-sm font-semibold text-[#344054] shadow-sm"
          >
            <FontAwesomeIcon icon={faDownload} />
            Export
          </button>
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#008f45] px-5 text-sm font-semibold text-white shadow-[0_8px_16px_rgba(0,143,69,0.18)]"
          >
            <FontAwesomeIcon icon={faPlus} />
            Add Supplier
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <section className="flex items-center gap-4 rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#fff4df] text-[#f5b822]">
          <FontAwesomeIcon icon={faStar} />
        </div>
        <div>
          <p className="text-xs font-medium text-[#344054]">Average Supplier Rating</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <span className="text-xl font-semibold">{averageRating.toFixed(1)} / 5</span>
            <span className="flex gap-1 text-xs text-[#f5b822]">
              {Array.from({ length: 5 }).map((_, index) => (
                <FontAwesomeIcon key={index} icon={faStar} />
              ))}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#667085]">Based on all reviews</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab);
                    setPage(1);
                  }}
                  className={`h-9 rounded-full border px-4 text-xs font-medium transition ${
                    activeTab === tab
                      ? "border-[#00a85a] bg-[#f0fbf5] text-[#101828]"
                      : "border-[#d0d5dd] bg-white text-[#344054] hover:border-[#00a85a]/50"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <Menu>
              <MenuButton className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-4 text-sm font-medium text-[#344054] shadow-sm">
                <FontAwesomeIcon icon={faFilter} />
                Filters
                <FontAwesomeIcon icon={faChevronDown} className="text-[10px]" />
              </MenuButton>
              <MenuItems anchor="bottom" className="z-20 mt-2 rounded-md border border-[#e5e7eb] bg-white p-1 shadow-lg">
                <MenuItem>
                  <button type="button" className="block w-full rounded px-4 py-2 text-left text-sm text-[#344054] hover:bg-gray-50">
                    Current tab filters applied
                  </button>
                </MenuItem>
              </MenuItems>
            </Menu>
          </div>

          <div className="flex h-10 min-w-0 items-center rounded-md border border-[#d0d5dd] bg-white px-4 shadow-sm sm:w-[360px]">
            <input
              type="text"
              value={searchInput}
              onChange={handleSearchChange}
              placeholder="Search supplier by name, email, phone..."
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#98a2b3]"
            />
            <FontAwesomeIcon icon={faSearch} className="text-[#667085]" />
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left">
            <thead className="bg-[#f8fafc] text-[11px] uppercase text-[#667085]">
              <tr>
                {["Supplier", "Type", "Location", "Products", "Orders Fulfilled", "Rating", "Status", "Actions"].map((heading) => (
                  <th key={heading} className={`px-3 py-3 font-semibold ${heading === "Actions" ? "text-right" : ""}`}>
                    {heading}
                    {heading !== "Actions" && (
                      <span className="ml-2 inline-flex flex-col align-middle text-[8px] leading-[7px] text-[#98a2b3]">
                        <FontAwesomeIcon icon={faChevronUp} />
                        <FontAwesomeIcon icon={faChevronDown} />
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableRowsSkeleton rows={6} columns={8} />
              ) : paginatedRows.length ? (
                paginatedRows.map((supplier) => (
                  <tr key={supplier.id} className="border-b border-[#eef2f6] text-xs last:border-0 hover:bg-[#fbfcfd]">
                    <td className="px-3 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#18a957] text-xs font-semibold text-white">
                          {getInitials(supplier.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#101828]">{supplier.name}</p>
                          <p className="mt-0.5 truncate text-xs text-[#667085]">{supplier.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex rounded-md px-2.5 py-1 text-[11px] font-medium ${typeClassName(supplier.type)}`}>
                        {supplier.type}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-[#475467]">
                      <FontAwesomeIcon icon={faLocationDot} className="mr-2 text-[#667085]" />
                      {supplier.location}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 font-semibold">{supplier.products}</td>
                    <td className="whitespace-nowrap px-3 py-3 font-semibold">{formatNumber(supplier.ordersFulfilled)}</td>
                    <td className="whitespace-nowrap px-3 py-3 font-semibold">
                      {supplier.rating.toFixed(1)} <FontAwesomeIcon icon={faStar} className="text-[#f5b822]" />
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center gap-2 rounded-md px-3 py-1 text-xs font-medium ${statusClassName(supplier.status)}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {supplier.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-2">
                        <button type="button" aria-label={`View ${supplier.name}`} className="grid h-8 w-8 place-items-center rounded-md border border-[#d0d5dd] text-[#101828] hover:bg-[#f2f4f7]">
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                        <button type="button" aria-label={`More actions for ${supplier.name}`} className="grid h-8 w-8 place-items-center rounded-md border border-[#d0d5dd] text-[#101828] hover:bg-[#f2f4f7]">
                          <FontAwesomeIcon icon={faEllipsisVertical} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-4 py-16 text-center text-sm text-[#667085]">
                    No suppliers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-4 border-t border-[#eef2f6] px-1 pt-4 text-sm text-[#667085] md:flex-row md:items-center md:justify-between">
          <p>Showing {shownFrom} to {shownTo} of {filteredRows.length || totalSuppliers} suppliers</p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={safePage === 1}
              onClick={() => setPage((currentPage) => Math.max(currentPage - 1, 1))}
              className="grid h-9 w-9 place-items-center rounded-md border border-[#d0d5dd] bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            {pageNumbers.map((pageNumber, index) =>
              pageNumber === "..." ? (
                <span key={`${pageNumber}-${index}`} className="px-2">...</span>
              ) : (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                  className={`grid h-9 w-9 place-items-center rounded-md border text-sm font-semibold ${
                    safePage === pageNumber
                      ? "border-[#008f45] bg-[#008f45] text-white"
                      : "border-[#e5e7eb] bg-white text-[#344054]"
                  }`}
                >
                  {pageNumber}
                </button>
              )
            )}
            <button
              type="button"
              disabled={safePage === totalPages}
              onClick={() => setPage((currentPage) => Math.min(currentPage + 1, totalPages))}
              className="grid h-9 w-9 place-items-center rounded-md border border-[#d0d5dd] bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SuppliersOverview;
