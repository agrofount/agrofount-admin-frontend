import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { assets } from "../../assets/assets";
import axios from "axios";
import { ShopContext } from "../../context/ShopContext";
import { DashboardOrderListSkeleton } from "../skeleton/DashboardOrderListSkeleton";

export const ListOrders = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [pageLimit, setPageLimit] = useState(30);
  const [searchValue, setSearchValue] = useState("");

  const [meta, setMeta] = useState({});
  const [orderPage, setOrderPage] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("DESC");

  const { token, backend_url, currency, navigate } = useContext(ShopContext);

  const searchTimeout = useRef();

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await axios.get(`${backend_url}/order`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          page: orderPage,
          limit: pageLimit,
          search: searchValue,
          sortBy: `${sortBy}:${sortOrder}`,
        },
        paramsSerializer: { indexes: null },
      });

      if (response.status === 200) {
        setOrders(response.data.data);
        setMeta(response.data.meta);
      }
    } catch (error) {
      console.error("an error occured: ", error);
    } finally {
      setIsLoading(false);
    }
  }, [
    orderPage,
    pageLimit,
    searchValue,
    backend_url,
    token,
    sortBy,
    sortOrder,
  ]);

  const handlePageChange = (page) => {
    setOrderPage(page);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortBy(field);
      setSortOrder("ASC");
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;

    clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(() => {
      setSearchValue(value);
    }, 400);
  };

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div className="grid grid-cols-1 gap-6 mt-8 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
        <p className="text-black text-xl md:text-[25px] font-bold">Orders</p>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/">Dashboard</Link>

          <FontAwesomeIcon icon={faChevronRight} size="xs" />

          <p>Orders</p>
        </div>
      </div>

      <div className="bg-white rounded-[12px] shadow mt-5 p-4">
        {/* Filters */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-gray-500">showing</p>

            <Menu>
              <MenuButton className="flex items-center gap-2 border border-gray-500 py-1.5 px-3 rounded-md">
                <p className="text-sm">{pageLimit}</p>
                <img src={assets.dropdown_icon} alt="" />
              </MenuButton>

              <MenuItems anchor="bottom" className="bg-white py-2 px-4 shadow">
                {[10, 20, 30, 40, 50].map((limit) => (
                  <MenuItem
                    key={limit}
                    onClick={() => setPageLimit(limit)}
                    className="cursor-pointer"
                  >
                    <p className="text-sm text-center text-gray-500 py-2">
                      {limit}
                    </p>
                  </MenuItem>
                ))}
              </MenuItems>
            </Menu>

            <p className="text-sm text-gray-500">entries</p>

            {/* Search */}
            <div className="flex items-center rounded-full bg-white pl-3 border border-gray-500">
              <input
                type="text"
                placeholder="Search..."
                defaultValue={searchValue}
                onChange={handleSearchChange}
                className="w-[140px] md:w-[220px] py-1.5 text-sm focus:outline-none"
              />

              <img src={assets.search_icon} className="mr-2 size-4" alt="" />
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="w-full overflow-y-scroll">
          <table className="min-w-[900px] w-full divide-y divide-gray-200 overflow-x-auto border-b">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                  Product
                </th>

                <th
                  onClick={() => handleSort("id")}
                  className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                >
                  Order ID
                  {sortBy === "id" && (sortOrder === "ASC" ? " ▲" : " ▼")}
                </th>

                <th
                  onClick={() => handleSort("totalPrice")}
                  className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                >
                  Price
                  {sortBy === "totalPrice" &&
                    (sortOrder === "ASC" ? " ▲" : " ▼")}
                </th>

                <th
                  onClick={() => handleSort("quantity")}
                  className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                >
                  Quantity
                  {sortBy === "quantity" && (sortOrder === "ASC" ? " ▲" : " ▼")}
                </th>

                <th className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                  Location
                </th>

                <th
                  onClick={() => handleSort("status")}
                  className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                >
                  Status
                  {sortBy === "status" && (sortOrder === "ASC" ? " ▲" : " ▼")}
                </th>

                <th
                  onClick={() => handleSort("createdAt")}
                  className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                >
                  Start Date
                  {sortBy === "createdAt" &&
                    (sortOrder === "ASC" ? " ▲" : " ▼")}
                </th>
              </tr>
            </thead>

            {isLoading ? (
              <DashboardOrderListSkeleton />
            ) : orders.length < 1 ? (
              <tbody>
                <tr>
                  <td colSpan="7">
                    <div className="flex flex-col items-center justify-center h-[300px]">
                      <img src={assets.empty_inbox} alt="" />
                      <p className="text-gray-400 mt-4">No Orders yet</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y">
                {orders.map((order, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    {/* Product */}
                    <td className="px-2 py-5">
                      <div className="flex items-center">
                        <img
                          className="h-10 w-10 rounded-lg"
                          src={order?.items[0]?.product.images[0]}
                          alt=""
                        />

                        <div className="ml-3 max-w-[8rem] md:max-w-[12rem] text-xs md:text-sm font-medium">
                          {order.user?.username}
                        </div>
                      </div>
                    </td>

                    <td className="px-2 py-5 text-xs md:text-sm">
                      {order.code}
                    </td>

                    <td className="px-2 py-5 text-xs md:text-sm">
                      {new Intl.NumberFormat("en-NG", {
                        style: "currency",
                        currency,
                      }).format(order.totalPrice)}
                    </td>

                    <td className="px-2 py-5 text-center text-xs md:text-sm">
                      {order.items.reduce(
                        (total, item) => total + item.quantity,
                        0,
                      )}
                    </td>

                    <td className="px-2 py-5 text-xs md:text-sm">
                      {order.address.state || "Ibadan"}
                    </td>

                    {/* Status */}
                    <td className="px-2 py-5">
                      <p
                        className={`text-center py-1 rounded-full min-w-[70px] text-xs md:text-sm ${
                          order.status === "confirmed"
                            ? "bg-green-100 text-green-600"
                            : order.status === "pending"
                              ? "bg-gray-200 text-gray-600"
                              : order.status === "shipped"
                                ? "bg-blue-100 text-blue-600"
                                : order.status === "delivered"
                                  ? "bg-green-200 text-green-700"
                                  : order.status === "cancelled"
                                    ? "bg-red-100 text-red-600"
                                    : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {order.status}
                      </p>
                    </td>

                    <td className="px-2 py-5 text-xs md:text-sm">
                      {new Date(order.createdAt).toDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>

        {/* Pagination */}
        {meta && (
          <div className="flex flex-col md:flex-row md:justify-between items-center gap-3 my-5">
            <p className="text-sm text-gray-500 text-center">
              Showing {meta.currentPage} to {meta.totalPages} of{" "}
              {meta.totalItems} entries
            </p>

            <div className="flex flex-wrap justify-center">
              <button
                className={`px-3 py-1 mx-1 border rounded-full ${
                  Number(meta.currentPage) === 1
                    ? "bg-gray-300 text-white cursor-not-allowed"
                    : "bg-white"
                }`}
                onClick={() => handlePageChange(Number(meta.currentPage) - 1)}
                disabled={Number(meta.currentPage) === 1}
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>

              {[...Array(meta.totalPages)].map((_, index) => (
                <button
                  key={index}
                  className={`px-3 py-1 mx-1 border rounded-full ${
                    Number(meta.currentPage) === index + 1
                      ? "bg-[#F96767] text-white"
                      : "bg-white"
                  }`}
                  onClick={() => handlePageChange(index + 1)}
                >
                  {index + 1}
                </button>
              ))}

              <button
                className={`px-3 py-1 mx-1 border rounded-full ${
                  Number(meta.currentPage) === meta.totalPages
                    ? "bg-gray-300 text-white cursor-not-allowed"
                    : "bg-white"
                }`}
                onClick={() => handlePageChange(Number(meta.currentPage) + 1)}
                disabled={Number(meta.currentPage) === meta.totalPages}
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
