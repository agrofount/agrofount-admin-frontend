import {
  faCalendarDays,
  faChevronLeft,
  faChevronRight,
  faEllipsisVertical,
  faEnvelope,
  faEye,
  faFilter,
  faLocationDot,
  faMagnifyingGlass,
  faMars,
  faPenToSquare,
  faPhone,
  faPlus,
  faRotateLeft,
  faShieldHalved,
  faTimes,
  faTrashCan,
  faUser,
  faUserCheck,
  faUserPlus,
  faUsers,
  faVenus,
  faDownload,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/react";
import { ExclamationTriangleIcon } from "@heroicons/react/16/solid";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { assets } from "../../assets/assets";
import { apiClient } from "../../lib/apiClient";
import { TableRowsSkeleton } from "../common/LoadingStates";

const pageSizeOptions = [10, 20, 30, 50];
const verificationOptions = ["All Status", "Verified", "Not Verified"];
const genderOptions = ["All Gender", "Male", "Female", "Other"];
const dateRangeOptions = ["Select date range", "Last 7 days", "Last 30 days", "This month"];

const getDisplayName = (user) =>
  user?.username || user?.fullName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Customer";

const getCustomerCode = (user, index) =>
  user?.code || user?.customerCode || `#CUS-${String(user?.serial || index + 1).padStart(6, "0")}`;

const getInitials = (name) =>
  name
    .split(/[^\w]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "C";

const getLocation = (user) =>
  user?.state?.name || user?.state || user?.city?.name || user?.city || user?.location || "N/A";

const formatJoinedDate = (value) => {
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

const MetricCard = ({ label, value, note, icon, tone = "green", down = false }) => {
  const toneClass =
    tone === "blue"
      ? "bg-[#e7f0ff] text-[#1f7ae0]"
      : tone === "yellow"
        ? "bg-[#fff4d8] text-[#f59e0b]"
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
          <p className={`mt-1.5 text-[11px] font-semibold ${down ? "text-[#ef3340]" : "text-[#008f45]"}`}>
            {down ? "↓" : "↑"} {note}
          </p>
        </div>
      </div>
    </div>
  );
};

const CustomerDetailDrawer = ({ user, onClose }) => {
  if (!user) return null;

  const name = getDisplayName(user);
  const initials = getInitials(name);
  const location = getLocation(user);
  const [joinedDate, joinedTime] = formatJoinedDate(user.createdAt);
  const gender = user.gender || "N/A";

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e5e7eb] px-5 py-4">
          <h2 className="text-sm font-semibold text-[#101828]">Customer Details</h2>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-md text-[#667085] hover:bg-[#f3f4f6]">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="flex flex-col items-center gap-3 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-5 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-[#dcf8e4] text-xl font-bold text-[#008f45]">
              {initials}
            </span>
            <div>
              <p className="text-sm font-semibold text-[#101828]">{name}</p>
              <p className="mt-0.5 text-[11px] text-[#667085]">{getCustomerCode(user, 0)}</p>
            </div>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ${user.isVerified ? "bg-[#dcf8e4] text-[#008f45]" : "bg-[#ffe4e6] text-[#ef3340]"}`}>
              <FontAwesomeIcon icon={faShieldHalved} className="text-[10px]" />
              {user.isVerified ? "Verified" : "Not Verified"}
            </span>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#98a2b3]">Contact</p>
            <div className="flex items-center gap-3 rounded-lg border border-[#e5e7eb] px-4 py-3">
              <FontAwesomeIcon icon={faEnvelope} className="w-4 shrink-0 text-[#008f45]" />
              <div>
                <p className="text-[10px] text-[#667085]">Email</p>
                <p className="text-xs font-medium text-[#101828] break-all">{user.email || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-[#e5e7eb] px-4 py-3">
              <FontAwesomeIcon icon={faPhone} className="w-4 shrink-0 text-[#008f45]" />
              <div>
                <p className="text-[10px] text-[#667085]">Phone</p>
                <p className="text-xs font-medium text-[#101828]">{user.phone || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-[#e5e7eb] px-4 py-3">
              <FontAwesomeIcon icon={faLocationDot} className="w-4 shrink-0 text-[#008f45]" />
              <div>
                <p className="text-[10px] text-[#667085]">Location</p>
                <p className="text-xs font-medium text-[#101828]">{location}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#98a2b3]">Profile</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-[#e5e7eb] px-4 py-3">
                <p className="text-[10px] text-[#667085]">Gender</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-[#101828]">
                  <FontAwesomeIcon
                    icon={String(gender).toLowerCase() === "female" ? faVenus : faMars}
                    className={String(gender).toLowerCase() === "female" ? "text-[#ef3f7a]" : "text-[#1f7ae0]"}
                  />
                  {gender}
                </p>
              </div>
              <div className="rounded-lg border border-[#e5e7eb] px-4 py-3">
                <p className="text-[10px] text-[#667085]">Joined</p>
                <p className="mt-1 text-xs font-medium text-[#101828]">{joinedDate}</p>
                <p className="text-[10px] text-[#667085]">{joinedTime}</p>
              </div>
            </div>
            {user.businessType && (
              <div className="rounded-lg border border-[#e5e7eb] px-4 py-3">
                <p className="text-[10px] text-[#667085]">Business Type</p>
                <p className="mt-1 text-xs font-medium text-[#101828]">{user.businessType}</p>
              </div>
            )}
          </div>

          {user.id && (
            <div className="rounded-lg border border-[#e5e7eb] px-4 py-3">
              <p className="text-[10px] text-[#667085]">Customer ID</p>
              <p className="mt-1 font-mono text-[10px] text-[#475467] break-all">{user.id}</p>
            </div>
          )}
        </div>

        <div className="border-t border-[#e5e7eb] px-5 py-4">
          <Link
            to={`/users/${user.id}/edit`}
            className="flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#008f45] text-xs font-semibold text-white"
          >
            <FontAwesomeIcon icon={faPenToSquare} />
            Edit Customer
          </Link>
        </div>
      </div>
    </>
  );
};

const ListUsers = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState({ data: [], meta: {} });
  const [pageLimit, setPageLimit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("All Status");
  const [locationFilter, setLocationFilter] = useState("All Locations");
  const [genderFilter, setGenderFilter] = useState("All Gender");
  const [dateRange, setDateRange] = useState(dateRangeOptions[0]);
  const [userPage, setUserPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [detailUser, setDetailUser] = useState(null);

  const searchTimeout = useRef();

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get("/user", {
        params: {
          page: userPage,
          limit: pageLimit,
          search: searchValue,
        },
      });
      if (response.status === 200) setUsers(response.data);
    } catch (error) {
      toast.error(error.message || "Unable to load customers.");
    } finally {
      setIsLoading(false);
    }
  }, [userPage, pageLimit, searchValue]);

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchInput(value);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setUserPage(1);
      setSearchValue(value);
    }, 400);
  };

  const handlePageChange = (page) => {
    const totalPages = Number(users.meta?.totalPages || 1);
    if (page < 1 || page > totalPages) return;
    setUserPage(page);
  };

  const userList = useMemo(() => users.data || [], [users.data]);

  const locationOptions = useMemo(() => {
    const locations = new Set(userList.map(getLocation).filter((location) => location && location !== "N/A"));
    return ["All Locations", ...locations];
  }, [userList]);

  const filteredUsers = useMemo(
    () =>
      userList.filter((user) => {
        const verifiedMatches =
          verificationFilter === "All Status" ||
          (verificationFilter === "Verified" ? user.isVerified : !user.isVerified);
        const locationMatches =
          locationFilter === "All Locations" || getLocation(user) === locationFilter;
        const genderMatches =
          genderFilter === "All Gender" ||
          String(user.gender || "").toLowerCase() === genderFilter.toLowerCase();
        return verifiedMatches && locationMatches && genderMatches;
      }),
    [genderFilter, locationFilter, userList, verificationFilter],
  );

  const totalItems = Number(users.meta?.totalItems || filteredUsers.length || 0);
  const currentPage = Number(users.meta?.currentPage || userPage || 1);
  const totalPages = Number(users.meta?.totalPages || Math.max(1, Math.ceil(totalItems / pageLimit)));
  const shownFrom = totalItems ? (currentPage - 1) * pageLimit + 1 : 0;
  const shownTo = totalItems ? Math.min(currentPage * pageLimit, totalItems) : 0;
  const verifiedCount = userList.filter((user) => user.isVerified).length;
  const unverifiedCount = userList.filter((user) => !user.isVerified).length;
  const newThisMonth = userList.filter((user) => {
    if (!user.createdAt) return false;
    const created = new Date(user.createdAt);
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;

  const clearFilters = () => {
    setSearchInput("");
    setSearchValue("");
    setVerificationFilter("All Status");
    setLocationFilter("All Locations");
    setGenderFilter("All Gender");
    setDateRange(dateRangeOptions[0]);
    setUserPage(1);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await apiClient.delete(`/user/${deleteTarget.id}`);
      toast.success("Customer deleted successfully.");
      setDeleteTarget(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.message || "Unable to delete customer.");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleVerification = async (user) => {
    try {
      setActionLoadingId(user.id);
      await apiClient.patch(`/user/${user.id}/activate?activate=${!user.isVerified}`);
      toast.success(`Customer ${user.isVerified ? "unverified" : "verified"} successfully.`);
      fetchUsers();
    } catch (error) {
      toast.error(error.message || "Unable to update verification.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const exportCustomers = () => {
    const header = ["Customer", "Email", "Gender", "Phone", "Location", "Verification", "Joined"];
    const rows = filteredUsers.map((user, index) => [
      getDisplayName(user),
      user.email || "N/A",
      user.gender || "N/A",
      user.phone || "N/A",
      getLocation(user),
      user.isVerified ? "Verified" : "Not Verified",
      user.createdAt || "",
      getCustomerCode(user, index),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "customers.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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
          <h1 className="text-lg font-semibold">Customers</h1>
          <p className="mt-1 text-xs font-medium text-[#667085]">Manage and monitor all your customers</p>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <div className="flex items-center gap-2 text-xs text-[#667085]">
            <Link to="/" className="hover:text-[#008f45]">Dashboard</Link>
            <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
            <span className="font-semibold text-[#008f45]">Customers</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => toast.info("Add customer flow is not connected yet.")}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#008f45] px-4 text-xs font-semibold text-white shadow-[0_8px_16px_rgba(0,143,69,0.18)]"
            >
              <FontAwesomeIcon icon={faPlus} />
              Add Customer
            </button>
            <button
              type="button"
              onClick={exportCustomers}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-4 text-xs font-semibold text-[#344054] shadow-sm"
            >
              <FontAwesomeIcon icon={faDownload} />
              Export
            </button>
          </div>
        </div>
      </div>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Customers" value={totalItems} note="12.5% from last month" icon={faUsers} />
        <MetricCard label="Verified Customers" value={verifiedCount} note="8.3% from last month" icon={faShieldHalved} tone="blue" />
        <MetricCard label="Unverified Customers" value={unverifiedCount} note="4.2% from last month" icon={faUserPlus} tone="yellow" down />
        <MetricCard label="New This Month" value={newThisMonth} note="15.7% from last month" icon={faUser} tone="purple" />
      </section>

      <section className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
        <div className="grid gap-3 xl:grid-cols-[1.6fr_1fr_1fr_1fr_1.2fr]">
          <label className="relative">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#667085]" />
            <input
              value={searchInput}
              onChange={handleSearchChange}
              placeholder="Search by name, email or phone..."
              className="h-9 w-full rounded-md border border-[#d0d5dd] bg-white pl-9 pr-3 text-xs text-[#101828] outline-none focus:border-[#008f45] focus:ring-2 focus:ring-[#dff4e5]"
            />
          </label>

          <label>
            <span className="mb-1 block text-[11px] font-semibold text-[#667085]">Verification Status</span>
            <select value={verificationFilter} onChange={(event) => setVerificationFilter(event.target.value)} className="h-9 w-full rounded-md border border-[#d0d5dd] bg-white px-3 text-xs outline-none focus:border-[#008f45]">
              {verificationOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>

          <label>
            <span className="mb-1 block text-[11px] font-semibold text-[#667085]">Location</span>
            <select value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)} className="h-9 w-full rounded-md border border-[#d0d5dd] bg-white px-3 text-xs outline-none focus:border-[#008f45]">
              {locationOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>

          <label>
            <span className="mb-1 block text-[11px] font-semibold text-[#667085]">Gender</span>
            <select value={genderFilter} onChange={(event) => setGenderFilter(event.target.value)} className="h-9 w-full rounded-md border border-[#d0d5dd] bg-white px-3 text-xs outline-none focus:border-[#008f45]">
              {genderOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>

          <label>
            <span className="mb-1 block text-[11px] font-semibold text-[#667085]">Date Range</span>
            <div className="relative">
              <FontAwesomeIcon icon={faCalendarDays} className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#667085]" />
              <select value={dateRange} onChange={(event) => setDateRange(event.target.value)} className="h-9 w-full rounded-md border border-[#d0d5dd] bg-white pl-9 pr-3 text-xs outline-none focus:border-[#008f45]">
                {dateRangeOptions.map((option) => <option key={option}>{option}</option>)}
              </select>
            </div>
          </label>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-[#344054]">
            <span>Show</span>
            <select
              value={pageLimit}
              onChange={(event) => {
                setPageLimit(Number(event.target.value));
                setUserPage(1);
              }}
              className="h-9 rounded-md border border-[#d0d5dd] bg-white px-3 text-xs outline-none focus:border-[#008f45]"
            >
              {pageSizeOptions.map((size) => <option key={size}>{size}</option>)}
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
            <table className="min-w-[1100px] w-full text-left">
              <thead className="border-b border-[#e5e7eb] bg-[#fbfcfd]">
                <tr>
                  {["Customer", "Email", "Gender", "Phone", "Location", "Verification", "Joined", "Action"].map((heading) => (
                    <th key={heading} className="px-4 py-3 text-[9px] font-semibold uppercase tracking-[0.02em] text-[#667085]">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef2f6]">
                {isLoading ? (
                  <TableRowsSkeleton rows={6} columns={8} />
                ) : filteredUsers.length < 1 ? (
                  <tr>
                    <td colSpan="8">
                      <div className="flex h-64 flex-col items-center justify-center">
                        <img src={assets.empty_table} alt="" className="h-24 w-24 object-contain opacity-70" />
                        <p className="mt-4 text-xs text-[#98a2b3]">No customers found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, index) => {
                    const name = getDisplayName(user);
                    const [date, time] = formatJoinedDate(user.createdAt);
                    const gender = user.gender || "N/A";
                    return (
                      <tr key={user.id || user.email || index} className="hover:bg-[#f9fafb]">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#dcf8e4] text-xs font-semibold text-[#008f45]">
                              {getInitials(name)}
                            </span>
                            <div>
                              <p className="text-xs font-semibold text-[#101828]">{name}</p>
                              <p className="mt-0.5 text-[11px] text-[#667085]">{getCustomerCode(user, index)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#475467]">{user.email || "N/A"}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-2 text-xs text-[#475467]">
                            {String(gender).toLowerCase() === "female" ? (
                              <FontAwesomeIcon icon={faVenus} className="text-[#ef3f7a]" />
                            ) : (
                              <FontAwesomeIcon icon={faMars} className="text-[#1f7ae0]" />
                            )}
                            {gender}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-2 text-xs text-[#475467]">
                            <FontAwesomeIcon icon={faPhone} className="text-[#008f45]" />
                            {user.phone || "N/A"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-2 text-xs text-[#475467]">
                            <FontAwesomeIcon icon={faLocationDot} className="text-[#008f45]" />
                            {getLocation(user)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex min-w-[88px] justify-center rounded-full px-3 py-1 text-[11px] font-semibold ${user.isVerified ? "bg-[#dcf8e4] text-[#008f45]" : "bg-[#ffe4e6] text-[#ef3340]"}`}>
                            {user.isVerified ? "Verified" : "Not Verified"}
                          </span>
                        </td>
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
                          <Menu as="div" className="relative inline-block">
                            <MenuButton className="grid h-8 w-8 place-items-center rounded-md border border-[#e5e7eb] text-[#667085] hover:bg-[#f8fafc] disabled:opacity-50" disabled={actionLoadingId === user.id}>
                              <FontAwesomeIcon icon={faEllipsisVertical} />
                            </MenuButton>
                            <MenuItems className="absolute right-0 z-20 mt-1 w-44 rounded-md border border-[#e5e7eb] bg-white py-1 shadow-lg focus:outline-none">
                              <MenuItem>
                                <button
                                  type="button"
                                  onClick={() => setDetailUser(user)}
                                  className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#344054] hover:bg-[#f9fafb]"
                                >
                                  <FontAwesomeIcon icon={faEye} className="text-[#1f7ae0]" />
                                  View Details
                                </button>
                              </MenuItem>
                              <MenuItem>
                                <Link
                                  to={`/users/${user.id}/edit`}
                                  className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#344054] hover:bg-[#f9fafb]"
                                >
                                  <FontAwesomeIcon icon={faPenToSquare} className="text-[#008f45]" />
                                  Edit Customer
                                </Link>
                              </MenuItem>
                              <MenuItem>
                                <button
                                  type="button"
                                  onClick={() => handleToggleVerification(user)}
                                  className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#344054] hover:bg-[#f9fafb]"
                                >
                                  <FontAwesomeIcon icon={faUserCheck} className={user.isVerified ? "text-[#f59e0b]" : "text-[#008f45]"} />
                                  {user.isVerified ? "Unverify" : "Verify"} Customer
                                </button>
                              </MenuItem>
                              <MenuItem>
                                <button
                                  type="button"
                                  onClick={() => setDeleteTarget(user)}
                                  className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#ef3340] hover:bg-[#fff5f5]"
                                >
                                  <FontAwesomeIcon icon={faTrashCan} />
                                  Delete Customer
                                </button>
                              </MenuItem>
                            </MenuItems>
                          </Menu>
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

      <CustomerDetailDrawer user={detailUser} onClose={() => setDetailUser(null)} />

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} className="relative z-50">
        <DialogBackdrop className="fixed inset-0 bg-black/30" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#fee2e2]">
                <ExclamationTriangleIcon className="h-5 w-5 text-[#ef3340]" />
              </div>
              <div>
                <DialogTitle className="text-sm font-semibold text-[#101828]">Delete Customer</DialogTitle>
                <p className="mt-1 text-xs text-[#667085]">
                  Are you sure you want to delete <span className="font-semibold text-[#101828]">{getDisplayName(deleteTarget ?? {})}</span>? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setDeleteTarget(null)} className="h-9 rounded-md border border-[#d0d5dd] px-4 text-xs font-semibold text-[#344054]">
                Cancel
              </button>
              <button type="button" onClick={handleDelete} disabled={deleting} className="h-9 rounded-md bg-[#ef3340] px-4 text-xs font-semibold text-white disabled:opacity-60">
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
};

export default ListUsers;
