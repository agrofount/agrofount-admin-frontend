import { Link } from "react-router-dom";
import { assets } from "../../assets/assets";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faTable,
  faXmark,
  faSort,
  faUsers,
  faShieldHalved,
  faUserPlus,
  faMoon,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { useCallback, useContext, useEffect, useState } from "react";
import { ShopContext } from "../../context/ShopContext";
import TableSkeleton from "../skeleton/TableSkeleton";
import RoleTableItem from "./RoleTableItem";
import { apiClient } from "../../lib/apiClient";

const ListRoles = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [roles, setRoles] = useState({ data: [], meta: {} });
  const [pageLimit, setPageLimit] = useState(10);
  const [searchValue, setSearchValue] = useState("");
  const [rolePage, setRolePage] = useState(1);
  const [itemDeleted, setItemDeleted] = useState(false);
  const [showTip, setShowTip] = useState(true);
  const [stats, setStats] = useState({
    total: null,
    active: null,
    custom: null,
    lastUpdated: null,
  });

  const { token, navigate } = useContext(ShopContext);

  const fetchRoles = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get("/role", {
        params: { page: rolePage, limit: pageLimit, search: searchValue },
      });
      if (response.status === 200) setRoles(response.data);
    } catch (error) {
      console.error("an error occurred: ", error);
    } finally {
      setIsLoading(false);
    }
  }, [rolePage, pageLimit, searchValue]);

  const fetchStats = useCallback(async () => {
    const [totalRes, activeRes, customRes] = await Promise.allSettled([
      apiClient.get("/role", { params: { limit: 1 } }),
      apiClient.get("/role", { params: { limit: 1, isActive: true } }),
      apiClient.get("/role", { params: { limit: 1, type: "custom" } }),
    ]);

    const total =
      totalRes.status === "fulfilled"
        ? totalRes.value.data?.meta?.totalItems
        : null;
    const active =
      activeRes.status === "fulfilled"
        ? activeRes.value.data?.meta?.totalItems
        : null;
    const custom =
      customRes.status === "fulfilled"
        ? customRes.value.data?.meta?.totalItems
        : null;

    let lastUpdated = null;
    if (totalRes.status === "fulfilled") {
      const firstRole = totalRes.value.data?.data?.[0];
      if (firstRole?.updatedAt) lastUpdated = new Date(firstRole.updatedAt);
      else if (firstRole?.createdAt)
        lastUpdated = new Date(firstRole.createdAt);
    }

    setStats({ total, active, custom, lastUpdated });
  }, []);

  const handlePageChange = (page) => setRolePage(page);

  useEffect(() => {
    fetchRoles();
    setItemDeleted(false);
  }, [fetchRoles, itemDeleted]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (!token) navigate("/login");
  }, [navigate, token]);

  const formatStatDate = (date) => {
    if (!date) return "--";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const statCards = [
    {
      icon: faUsers,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      label: "Total Roles",
      value: stats.total ?? "--",
      sub: "All system roles",
      subColor: "text-green-600",
    },
    {
      icon: faShieldHalved,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-500",
      label: "Active Roles",
      value: stats.active ?? "--",
      sub: "Currently active",
      subColor: "text-blue-500",
    },
    {
      icon: faUserPlus,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-500",
      label: "Custom Roles",
      value: stats.custom ?? "--",
      sub: "Created by admins",
      subColor: "text-amber-500",
    },
    {
      icon: faMoon,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-500",
      label: "Last Updated",
      value: formatStatDate(stats.lastUpdated),
      sub: "Recent changes",
      subColor: "text-purple-500",
    },
  ];

  let tableContent;
  if (isLoading) {
    tableContent = <TableSkeleton />;
  } else if (roles.data.length < 1) {
    tableContent = (
      <tbody>
        <tr>
          <td colSpan="6">
            <div className="flex justify-center items-center h-[300px] w-full">
              <div className="flex flex-col items-center gap-3">
                <FontAwesomeIcon
                  icon={faTable}
                  size="2xl"
                  className="text-gray-300"
                />
                <p className="text-[#ADADAD] text-sm">No roles yet</p>
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    );
  } else {
    tableContent = (
      <tbody>
        {roles.data.map((role, index) => (
          <RoleTableItem
            role={role}
            key={index}
            setItemDeleted={setItemDeleted}
          />
        ))}
      </tbody>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-row justify-between items-start gap-5 mb-5">
        <div>
          <p className="text-black text-[25px] font-bold leading-normal tracking-[0.5px]">
            Role List
          </p>
          <p className="text-gray-500 text-sm mt-1">
            Manage and control system roles and their permissions.
          </p>
        </div>
        <div className="flex flex-row items-center gap-2 mt-2 shrink-0">
          <Link to="/">
            <p className="text-[#6E6E6E] text-[13px]">Dashboard</p>
          </Link>
          <FontAwesomeIcon icon={faChevronRight} className="h-3 text-[#6E6E6E]" />
          <Link to="/roles">
            <p className="text-[#6E6E6E] text-[13px]">Users &amp; Roles</p>
          </Link>
          <FontAwesomeIcon icon={faChevronRight} className="h-3 text-[#6E6E6E]" />
          <p className="text-[#6E6E6E] text-[13px]">Role List</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {statCards.map((card, i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow-[0px_0px_10px_0px_#EDEDED] p-4 flex flex-row items-center gap-4"
          >
            <div
              className={`${card.iconBg} rounded-xl flex items-center justify-center w-14 h-14 shrink-0`}
            >
              <FontAwesomeIcon
                icon={card.icon}
                className={`${card.iconColor} text-xl`}
              />
            </div>
            <div>
              <p className="text-gray-500 text-sm">{card.label}</p>
              <p className="text-gray-900 text-2xl font-bold leading-tight">
                {card.value}
              </p>
              <p className={`text-xs font-medium ${card.subColor}`}>
                {card.sub}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-[12px] shadow-[0px_0px_10px_0px_#EDEDED] p-4">
        {/* Tip Banner */}
        {showTip && (
          <div className="flex flex-row justify-between items-center bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 mb-4">
            <div className="flex flex-row items-center gap-2">
              <img src={assets.tip_icon} alt="" className="w-5 h-5 shrink-0" />
              <p className="text-gray-600 text-sm">
                <span className="font-semibold">Tip:</span> Search by Role ID.
                Each product is provided with a unique ID, which you can rely on
                to find the exact product you need.
              </p>
            </div>
            <button
              onClick={() => setShowTip(false)}
              className="text-gray-400 hover:text-gray-600 cursor-pointer ml-4 shrink-0"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        )}

        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 items-center py-3">
          <div className="flex flex-row items-center gap-2 flex-wrap">
            <p className="text-sm text-gray-500">Show</p>
            <Menu>
              <MenuButton className="flex flex-row items-center gap-2 border border-gray-300 cursor-pointer py-1.5 px-3 rounded-md">
                <p className="text-sm">{pageLimit}</p>
                <img src={assets.dropdown_icon} alt="" />
              </MenuButton>
              <MenuItems
                anchor="bottom"
                className="bg-white shadow-lg rounded-md py-2 px-4 z-10"
              >
                {[10, 20, 30, 40, 50].map((n) => (
                  <MenuItem
                    key={n}
                    onClick={() => setPageLimit(n)}
                    className="cursor-pointer"
                  >
                    <p className="text-sm text-center text-gray-500 py-2">{n}</p>
                  </MenuItem>
                ))}
              </MenuItems>
            </Menu>
            <p className="text-sm text-gray-500">entries</p>
            <div className="flex items-center rounded-full bg-white pl-3 border border-gray-300 has-[input:focus-within]:border-green-500">
              <input
                type="text"
                placeholder="Search roles..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="block py-1.5 pr-2 pl-1 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none w-44"
              />
              <div className="px-3">
                <img src={assets.search_icon} className="size-4" alt="" />
              </div>
            </div>
          </div>

          <Link
            to="/roles/add"
            className="flex flex-row gap-2 items-center bg-[#1a4731] text-white px-5 py-2.5 rounded-full hover:bg-[#163d29] transition-colors whitespace-nowrap"
          >
            <FontAwesomeIcon icon={faPlus} className="text-sm" />
            <p className="text-sm font-semibold">Add new role</p>
          </Link>
        </div>

        {/* Table */}
        <table className="w-full divide-y divide-gray-200 overflow-x-auto">
          <thead className="bg-gray-50">
            <tr>
              {[
                { label: "Role ID", sortable: true },
                { label: "Role Name", sortable: true },
                { label: "Description", sortable: true },
                { label: "Created At", sortable: true },
                { label: "Status", sortable: true },
                { label: "Actions", sortable: true },
              ].map(({ label, sortable }) => (
                <th
                  key={label}
                  className="px-3 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  <div className="flex items-center gap-1">
                    {label}
                    {sortable && (
                      <FontAwesomeIcon
                        icon={faSort}
                        className="text-gray-400 text-[10px]"
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          {tableContent}
        </table>

        {/* Pagination */}
        {roles.meta && (
          <div className="flex flex-row justify-between items-center mt-5 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              {roles.meta.totalItems
                ? `Showing 1 to ${Math.min(
                    pageLimit * Number(roles.meta.currentPage),
                    Number(roles.meta.totalItems)
                  )} of ${roles.meta.totalItems} entries`
                : "Showing 0 entries"}
            </p>

            <div className="flex flex-row items-center gap-1">
              <button
                className={`flex items-center justify-center w-8 h-8 rounded-full border text-sm ${
                  Number(roles.meta.currentPage) === 1
                    ? "border-gray-200 text-gray-300 cursor-not-allowed"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
                onClick={() =>
                  handlePageChange(Number(roles.meta.currentPage) - 1)
                }
                disabled={Number(roles.meta.currentPage) === 1}
              >
                <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
              </button>

              {[...Array(roles.meta.totalPages)].map((_, index) => (
                <button
                  key={index}
                  className={`w-8 h-8 rounded-full border text-sm font-medium ${
                    Number(roles.meta.currentPage) === index + 1
                      ? "bg-[#1a4731] text-white border-[#1a4731]"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                  }`}
                  onClick={() => handlePageChange(index + 1)}
                >
                  {index + 1}
                </button>
              ))}

              <button
                className={`flex items-center justify-center w-8 h-8 rounded-full border text-sm ${
                  Number(roles.meta.currentPage) === roles.meta.totalPages
                    ? "border-gray-200 text-gray-300 cursor-not-allowed"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
                onClick={() =>
                  handlePageChange(Number(roles.meta.currentPage) + 1)
                }
                disabled={
                  Number(roles.meta.currentPage) === roles.meta.totalPages
                }
              >
                <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListRoles;
