import {
  faCheckCircle,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faDownload,
  faEllipsisVertical,
  faFilter,
  faLocationDot,
  faPenToSquare,
  faPhone,
  faSearch,
  faScrewdriverWrench,
  faTruckFast,
  faUserGroup,
  faXmarkCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { ShopContext } from "../../../context/ShopContext";
import { apiClient } from "../../../lib/apiClient";
import { TableRowsSkeleton } from "../../common/LoadingStates";
import DriverForm from "./AddDriver";

const fallbackDrivers = [
  {
    id: "drv-001",
    name: "Banke Adekunle",
    phone: "0901 917 0333",
    status: "Available",
    licenseNumber: "JGBIA55",
    mainLocation: "Ekiti",
    vehicleType: "Toyota Hilux",
    vehicleNumber: "LAG 123 XY",
    createdAt: "2025-07-25T00:00:00.000Z",
    verified: true,
  },
  {
    id: "drv-002",
    name: "Agrofount Tech",
    phone: "0901 917 0222",
    status: "Available",
    licenseNumber: "JGBIAUB",
    mainLocation: "Bauchi",
    vehicleType: "Mitsubishi L200",
    vehicleNumber: "BAU 456 KL",
    createdAt: "2025-07-25T00:00:00.000Z",
    verified: true,
  },
  {
    id: "drv-003",
    name: "Ajani Ibrahim",
    phone: "0901 917 0272",
    status: "Available",
    licenseNumber: "JGBIAUB",
    mainLocation: "Akwa Ibom",
    vehicleType: "Isuzu D-Max",
    vehicleNumber: "AKS 789 MN",
    createdAt: "2025-07-25T00:00:00.000Z",
    verified: true,
  },
  {
    id: "drv-004",
    name: "Okafor Onyeka",
    phone: "0901 557 1122",
    status: "On Trip",
    licenseNumber: "JGBI099",
    mainLocation: "Oyo",
    vehicleType: "Toyota Hilux",
    vehicleNumber: "OYO 321 PQ",
    createdAt: "2025-07-20T00:00:00.000Z",
    verified: true,
  },
  {
    id: "drv-005",
    name: "Musa Mohammed",
    phone: "0901 334 7788",
    status: "Maintenance",
    licenseNumber: "JGBI776",
    mainLocation: "Kaduna",
    vehicleType: "Nissan Navara",
    vehicleNumber: "KAD 654 RT",
    createdAt: "2025-07-18T00:00:00.000Z",
    verified: true,
  },
];

const tabs = ["All Drivers", "Available", "On Trip", "Maintenance", "Inactive"];

const formatDate = (date) => {
  if (!date) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(date));
};

const getInitials = (name) =>
  String(name || "NA")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const normalizeStatus = (driver) => {
  if (driver.status) return String(driver.status);
  if (driver.available === false) return "Inactive";
  return "Available";
};

const normalizeDriver = (driver, index) => ({
  id: driver.id || driver._id || `driver-${index}`,
  name: driver.name || driver.fullName || "Unnamed Driver",
  phone: driver.phone || driver.phoneNumber || "N/A",
  status: normalizeStatus(driver),
  licenseNumber: driver.licenseNumber || driver.license || "N/A",
  mainLocation: driver.mainLocation || driver.location || "N/A",
  vehicleType: driver.vehicleType || driver.vehicle || "N/A",
  vehicleNumber: driver.vehicleNumber || driver.plateNumber || "",
  createdAt: driver.createdAt,
  verified: driver.verified ?? true,
});

const statusClassName = (status) => {
  const nextStatus = String(status).toLowerCase();
  if (nextStatus.includes("trip")) return "bg-[#fff2dc] text-[#f59e0b]";
  if (nextStatus.includes("maintenance")) return "bg-[#f0e4ff] text-[#7c3fd3]";
  if (nextStatus.includes("inactive")) return "bg-[#ffe5e7] text-[#ef3340]";
  return "bg-[#dcf8e6] text-[#008f45]";
};

const avatarClassName = (status) => {
  const nextStatus = String(status).toLowerCase();
  if (nextStatus.includes("trip")) return "bg-[#fff2dc] text-[#f59e0b]";
  if (nextStatus.includes("maintenance")) return "bg-[#f0e4ff] text-[#7c3fd3]";
  if (nextStatus.includes("inactive")) return "bg-[#ffe5e7] text-[#ef3340]";
  return "bg-[#dcf8e6] text-[#008f45]";
};

const StatCard = ({ label, value, helper, icon, tone }) => (
  <section className="flex min-h-[104px] items-center gap-4 rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
    <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-lg ${tone}`}>
      <FontAwesomeIcon icon={icon} />
    </div>
    <div>
      <p className="text-xs font-medium text-[#475467]">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-normal text-[#101828]">{value}</p>
      <p className="mt-2 text-[11px] font-medium text-[#667085]">{helper}</p>
    </div>
  </section>
);

const ListDrivers = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [drivers, setDrivers] = useState({ data: [], meta: {} });
  const [pageLimit] = useState(5);
  const [searchInput, setSearchInput] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [activeTab, setActiveTab] = useState("All Drivers");
  const [locationFilter, setLocationFilter] = useState("All Locations");
  const [driverPage, setDriverPage] = useState(1);
  const [driverAdded, setDriverAdded] = useState(false);

  const { token, navigate } = useContext(ShopContext);
  const searchTimeout = useRef();

  const fetchDrivers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get("/supply-chain/drivers", {
        params: {
          page: driverPage,
          limit: pageLimit,
          search: searchValue,
        },
      });

      if (response.status === 200) setDrivers(response.data || { data: [], meta: {} });
    } catch (error) {
      toast.error(error.message || "Unable to load drivers.");
      setDrivers({ data: [], meta: {} });
    } finally {
      setIsLoading(false);
    }
  }, [driverPage, pageLimit, searchValue]);

  useEffect(() => {
    fetchDrivers();
    setDriverAdded(false);
  }, [fetchDrivers, driverAdded]);

  useEffect(() => {
    if (!token) navigate("/login");
  }, [token, navigate]);

  const apiRows = useMemo(() => (drivers.data || []).map(normalizeDriver), [drivers.data]);
  const allRows = apiRows.length ? apiRows : fallbackDrivers;
  const locations = useMemo(
    () => ["All Locations", ...Array.from(new Set(allRows.map((driver) => driver.mainLocation).filter(Boolean)))],
    [allRows]
  );

  const filteredRows = useMemo(() => {
    const term = searchValue.trim().toLowerCase();
    return allRows.filter((driver) => {
      const matchesSearch =
        !term ||
        driver.name.toLowerCase().includes(term) ||
        driver.phone.toLowerCase().includes(term) ||
        driver.licenseNumber.toLowerCase().includes(term);
      const matchesTab = activeTab === "All Drivers" || driver.status.toLowerCase() === activeTab.toLowerCase();
      const matchesLocation = locationFilter === "All Locations" || driver.mainLocation === locationFilter;
      return matchesSearch && matchesTab && matchesLocation;
    });
  }, [activeTab, allRows, locationFilter, searchValue]);

  const isFallbackData = apiRows.length === 0;
  const totalDrivers = Number(drivers.meta?.totalItems || (isFallbackData ? 42 : allRows.length));
  const availableCount = allRows.filter((driver) => driver.status.toLowerCase() === "available").length;
  const onTripCount = allRows.filter((driver) => driver.status.toLowerCase() === "on trip").length;
  const maintenanceCount = allRows.filter((driver) => driver.status.toLowerCase() === "maintenance").length;
  const inactiveCount = allRows.filter((driver) => driver.status.toLowerCase() === "inactive").length;

  const stats = [
    { label: "Total Drivers", value: totalDrivers, helper: "All drivers", icon: faUserGroup, tone: "bg-[#dcf8e6] text-[#008f45]" },
    { label: "Available", value: isFallbackData ? 28 : availableCount, helper: "66.7% of total", icon: faCheckCircle, tone: "bg-[#dcf8e6] text-[#008f45]" },
    { label: "On Trip", value: isFallbackData ? 6 : onTripCount, helper: "14.3% of total", icon: faTruckFast, tone: "bg-[#fff2dc] text-[#f59e0b]" },
    { label: "Maintenance", value: isFallbackData ? 4 : maintenanceCount, helper: "9.5% of total", icon: faScrewdriverWrench, tone: "bg-[#f0e4ff] text-[#7c3fd3]" },
    { label: "Inactive", value: isFallbackData ? 4 : inactiveCount, helper: "9.5% of total", icon: faXmarkCircle, tone: "bg-[#ffe5e7] text-[#ef3340]" },
  ];

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageLimit));
  const safePage = Math.min(driverPage, totalPages);
  const paginatedRows = filteredRows.slice((safePage - 1) * pageLimit, safePage * pageLimit);
  const shownFrom = filteredRows.length ? (safePage - 1) * pageLimit + 1 : 0;
  const shownTo = filteredRows.length ? Math.min(safePage * pageLimit, filteredRows.length) : 0;
  const pageNumbers = totalPages <= 4 ? Array.from({ length: totalPages }, (_, index) => index + 1) : [1, 2, 3, "...", totalPages];

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchInput(value);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setDriverPage(1);
      setSearchValue(value);
    }, 300);
  };

  const handleExport = () => {
    const headers = ["Driver", "Phone", "Status", "License Number", "Main Location", "Vehicle", "Joined Date"];
    const csv = [headers, ...filteredRows.map((driver) => [
      driver.name,
      driver.phone,
      driver.status,
      driver.licenseNumber,
      driver.mainLocation,
      `${driver.vehicleType} ${driver.vehicleNumber}`.trim(),
      formatDate(driver.createdAt),
    ])]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "drivers.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 text-[#101828]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#008f45]">Supply Chain</p>
          <h1 className="mt-2 text-xl font-semibold">Drivers</h1>
          <p className="mt-1 text-xs font-medium text-[#667085]">
            Manage your delivery drivers and track their availability, status and performance.
          </p>
        </div>
        <div className="flex flex-col items-start gap-4 lg:items-end">
          <div className="flex items-center gap-2 text-xs font-medium text-[#667085]">
            <Link to="/" className="hover:text-[#008f45]">Dashboard</Link>
            <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
            <span>Supply Chain</span>
            <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
            <span>Drivers</span>
          </div>
          <DriverForm setDriverAdded={setDriverAdded} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <section className="overflow-hidden rounded-lg border border-[#e5e7eb] bg-white shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
        <div className="flex flex-col gap-4 border-b border-[#eef2f6] p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab);
                    setDriverPage(1);
                  }}
                  className={`h-10 border-b-2 px-4 text-xs font-semibold transition ${
                    activeTab === tab
                      ? "border-[#008f45] text-[#008f45]"
                      : "border-transparent text-[#344054] hover:text-[#008f45]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Menu>
                <MenuButton className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-4 text-sm font-medium text-[#344054] shadow-sm">
                  <FontAwesomeIcon icon={faLocationDot} />
                  {locationFilter}
                  <FontAwesomeIcon icon={faChevronDown} className="text-[10px]" />
                </MenuButton>
                <MenuItems anchor="bottom" className="z-20 mt-2 rounded-md border border-[#e5e7eb] bg-white p-1 shadow-lg">
                  {locations.map((location) => (
                    <MenuItem key={location}>
                      <button
                        type="button"
                        onClick={() => {
                          setLocationFilter(location);
                          setDriverPage(1);
                        }}
                        className="block w-full rounded px-4 py-2 text-left text-sm text-[#344054] hover:bg-gray-50"
                      >
                        {location}
                      </button>
                    </MenuItem>
                  ))}
                </MenuItems>
              </Menu>

              <Menu>
                <MenuButton className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-4 text-sm font-medium text-[#344054] shadow-sm">
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

              <button
                type="button"
                onClick={handleExport}
                className="grid h-10 w-10 place-items-center rounded-md border border-[#d0d5dd] bg-white text-[#344054] shadow-sm"
                aria-label="Export drivers"
              >
                <FontAwesomeIcon icon={faDownload} />
              </button>
            </div>
          </div>

          <div className="flex h-10 min-w-0 items-center rounded-full border border-[#d0d5dd] bg-white px-4 shadow-sm sm:w-[380px]">
            <input
              id="search"
              name="search"
              type="text"
              placeholder="Search by driver name, phone or license..."
              value={searchInput}
              onChange={handleSearchChange}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#98a2b3]"
            />
            <FontAwesomeIcon icon={faSearch} className="text-[#667085]" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left">
            <thead className="bg-[#f8fafc] text-[11px] uppercase text-[#667085]">
              <tr>
                {["Driver", "Phone", "Status", "License Number", "Main Location", "Vehicle", "Joined Date", "Actions"].map((heading) => (
                  <th key={heading} className={`px-4 py-3 font-semibold ${heading === "Actions" ? "text-right" : ""}`}>
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
                <TableRowsSkeleton rows={5} columns={8} />
              ) : paginatedRows.length ? (
                paginatedRows.map((driver) => (
                  <tr key={driver.id} className="border-b border-[#eef2f6] text-xs last:border-0 hover:bg-[#fbfcfd]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className={`grid h-9 w-9 place-items-center rounded-full text-xs font-semibold ${avatarClassName(driver.status)}`}>
                          {getInitials(driver.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[#101828]">{driver.name}</p>
                          {driver.verified && (
                            <span className="mt-1 inline-flex rounded-md bg-[#dcf8e6] px-2 py-0.5 text-[10px] font-semibold text-[#008f45]">
                              Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[#475467]">
                      <FontAwesomeIcon icon={faPhone} className="mr-2 text-[#00a85a]" />
                      {driver.phone}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-2 rounded-md px-3 py-1 text-xs font-medium ${statusClassName(driver.status)}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {driver.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{driver.licenseNumber}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-[#475467]">
                      <FontAwesomeIcon icon={faLocationDot} className="mr-2 text-[#667085]" />
                      {driver.mainLocation}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{driver.vehicleType}</p>
                      <p className="mt-0.5 text-xs text-[#667085]">{driver.vehicleNumber || "-"}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{formatDate(driver.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button type="button" className="grid h-8 w-8 place-items-center rounded-md border border-[#d0d5dd] text-[#00a85a] hover:bg-[#f2f4f7]" aria-label={`Edit ${driver.name}`}>
                          <FontAwesomeIcon icon={faPenToSquare} />
                        </button>
                        <button type="button" className="grid h-8 w-8 place-items-center rounded-md border border-[#d0d5dd] text-[#101828] hover:bg-[#f2f4f7]" aria-label={`More actions for ${driver.name}`}>
                          <FontAwesomeIcon icon={faEllipsisVertical} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-4 py-16 text-center text-sm text-[#667085]">
                    No drivers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-4 border-t border-[#eef2f6] px-5 py-4 text-sm text-[#667085] md:flex-row md:items-center md:justify-between">
          <p>Showing {shownFrom} to {shownTo} of {filteredRows.length || totalDrivers} drivers</p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={safePage === 1}
              onClick={() => setDriverPage((page) => Math.max(page - 1, 1))}
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
                  onClick={() => setDriverPage(pageNumber)}
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
              onClick={() => setDriverPage((page) => Math.min(page + 1, totalPages))}
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

export default ListDrivers;
