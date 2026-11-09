import {
  faArrowsRotate,
  faCalendarDays,
  faChevronLeft,
  faChevronRight,
  faCircleCheck,
  faMagnifyingGlass,
  faPause,
  faPlus,
  faShieldHalved,
  faUserGroup,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ShopContext } from "../../context/ShopContext";
import { apiClient } from "../../lib/apiClient";
import TableSkeleton from "../skeleton/TableSkeleton";
import AdminItemTable from "./AdminItemTable";

const PAGE_SIZE = 10;
// Admin accounts are few, so load them in one request and filter locally.
const FETCH_LIMIT = 100;

const StatCard = ({ label, value, icon, bg, color, tint }) => (
  <div
    className="flex items-center gap-4 rounded-xl border border-[#e5e7eb] px-5 py-4 shadow-[0_4px_16px_rgba(16,24,40,0.04)]"
    style={{ background: tint }}
  >
    <div
      className="grid h-12 w-12 shrink-0 place-items-center rounded-full"
      style={{ background: bg }}
    >
      <FontAwesomeIcon icon={icon} style={{ color }} className="text-lg" />
    </div>
    <div className="min-w-0">
      <p className="text-2xl font-bold text-[#101828]">{value}</p>
      <p className="text-xs font-medium text-[#667085]">{label}</p>
    </div>
  </div>
);

const formatLastLogin = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return d.toDateString() === new Date().toDateString()
    ? `Today, ${time}`
    : `${d.toLocaleDateString()}, ${time}`;
};

const selectClass =
  "h-10 rounded-lg border border-[#e5e7eb] bg-white px-3 text-sm text-[#344054] outline-none focus:border-[#008f45]";

const ListAdmins = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [admins, setAdmins] = useState({ data: [], meta: {} });
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [itemDeleted, setItemDeleted] = useState(false);

  const { token, navigate } = useContext(ShopContext);

  const fetchAdmins = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get("/admin", {
        params: { page: 1, limit: FETCH_LIMIT },
      });
      if (response.status === 200) setAdmins(response.data);
    } catch (error) {
      console.error("an error occurred: ", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
    setItemDeleted(false);
  }, [fetchAdmins, itemDeleted]);

  useEffect(() => {
    if (!token) navigate("/login");
  }, [navigate, token]);

  const all = useMemo(() => admins.data || [], [admins.data]);
  const totalAdmins = admins.meta?.totalItems ?? all.length;
  const activeCount = all.filter((a) => a.isVerified).length;
  const inactiveCount = all.length - activeCount;
  const lastLogin = useMemo(() => {
    const times = all
      .map((a) => new Date(a.lastLoginAt || a.lastLogin).getTime())
      .filter((t) => !Number.isNaN(t));
    return times.length ? new Date(Math.max(...times)) : null;
  }, [all]);

  const roleOptions = useMemo(
    () =>
      [...new Set(all.flatMap((a) => (a.roles || []).map((r) => r.name)))]
        .filter(Boolean)
        .sort(),
    [all],
  );

  const filtered = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    return all.filter((a) => {
      if (statusFilter === "active" && !a.isVerified) return false;
      if (statusFilter === "inactive" && a.isVerified) return false;
      if (roleFilter !== "all" && !a.roles?.some((r) => r.name === roleFilter))
        return false;
      if (!q) return true;
      return [a.username, a.email, a.phone, a.firstname, a.lastname].some((v) =>
        String(v || "")
          .toLowerCase()
          .includes(q),
      );
    });
  }, [all, searchValue, statusFilter, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(start, start + PAGE_SIZE);

  const resetPageThen = (fn) => (e) => {
    fn(e.target.value);
    setPage(1);
  };

  let tableContent;
  if (isLoading && all.length === 0) {
    tableContent = <TableSkeleton />;
  } else if (pageRows.length === 0) {
    tableContent = (
      <tbody>
        <tr>
          <td colSpan="7">
            <div className="flex h-[240px] items-center justify-center text-sm text-[#98a2b3]">
              {all.length === 0 ? "No admins yet" : "No admins match your filters"}
            </div>
          </td>
        </tr>
      </tbody>
    );
  } else {
    tableContent = (
      <tbody className="divide-y divide-[#f2f4f7]">
        {pageRows.map((user) => (
          <AdminItemTable
            user={user}
            key={user.id}
            setItemDeleted={setItemDeleted}
          />
        ))}
      </tbody>
    );
  }

  const th =
    "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#667085]";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#008f45] text-white">
            <FontAwesomeIcon icon={faShieldHalved} className="text-2xl" />
          </div>
          <div>
            <h1 className="text-[26px] font-bold leading-tight text-[#101828]">
              Admin List
            </h1>
            <p className="text-sm text-[#667085]">
              Manage system administrators and their access permissions
            </p>
          </div>
        </div>
        <Link
          to="/admins/add"
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#008f45] px-5 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(0,143,69,0.25)] hover:bg-[#007a3a]"
        >
          <FontAwesomeIcon icon={faPlus} />
          Add New Admin
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Admins"
          value={totalAdmins}
          icon={faUserGroup}
          bg="#d1fadf"
          color="#12b76a"
          tint="#f0fbf4"
        />
        <StatCard
          label="Active"
          value={activeCount}
          icon={faCircleCheck}
          bg="#dbeafe"
          color="#2e7cf6"
          tint="#f2f7ff"
        />
        <StatCard
          label="Inactive"
          value={inactiveCount}
          icon={faPause}
          bg="#ffedd5"
          color="#f79009"
          tint="#fff8f0"
        />
        <StatCard
          label="Last Login"
          value={formatLastLogin(lastLogin)}
          icon={faCalendarDays}
          bg="#ede9fe"
          color="#7a5af8"
          tint="#f7f5ff"
        />
      </div>

      <div className="mt-5 rounded-xl border border-[#e5e7eb] bg-white shadow-[0_4px_16px_rgba(16,24,40,0.04)]">
        <div className="flex flex-wrap items-center gap-3 border-b border-[#f2f4f7] p-4">
          <div className="flex h-10 min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-[#e5e7eb] px-3 focus-within:border-[#008f45] sm:max-w-xs">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="text-[#98a2b3]"
            />
            <input
              type="text"
              placeholder="Search admins..."
              value={searchValue}
              onChange={resetPageThen(setSearchValue)}
              className="w-full bg-transparent text-sm text-[#101828] outline-none placeholder:text-[#98a2b3]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={resetPageThen(setStatusFilter)}
            className={selectClass}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={roleFilter}
            onChange={resetPageThen(setRoleFilter)}
            className={selectClass}
          >
            <option value="all">All Roles</option>
            {roleOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={fetchAdmins}
            disabled={isLoading}
            className="ml-auto inline-flex h-10 items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-4 text-sm font-medium text-[#008f45] hover:bg-[#f6fef9] disabled:opacity-60"
          >
            <FontAwesomeIcon
              icon={faArrowsRotate}
              className={isLoading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-[#f2f4f7] bg-[#fafafa]">
              <tr>
                <th className={th}>User</th>
                <th className={th}>Email</th>
                <th className={th}>Phone</th>
                <th className={th}>Created At</th>
                <th className={th}>Roles</th>
                <th className={th}>Status</th>
                <th className={th}>Action</th>
              </tr>
            </thead>
            {tableContent}
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f2f4f7] p-4">
          <p className="text-sm text-[#667085]">
            {filtered.length === 0
              ? "Showing 0 admins"
              : `Showing ${start + 1}–${start + pageRows.length} of ${filtered.length} admins`}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Previous page"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
              className="grid h-8 w-8 place-items-center rounded-md border border-[#e5e7eb] text-[#667085] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                type="button"
                key={i}
                onClick={() => setPage(i + 1)}
                className={`h-8 min-w-8 rounded-md px-2 text-sm font-medium ${
                  currentPage === i + 1
                    ? "bg-[#008f45] text-white"
                    : "border border-[#e5e7eb] text-[#344054]"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              type="button"
              aria-label="Next page"
              disabled={currentPage === totalPages}
              onClick={() => setPage(currentPage + 1)}
              className="grid h-8 w-8 place-items-center rounded-md border border-[#e5e7eb] text-[#667085] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListAdmins;
