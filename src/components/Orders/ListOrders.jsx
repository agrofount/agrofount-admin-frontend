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

  // Sort handler
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
    <div>
      <div className="flex flex-row justify-between items-center gap-5">
        <p className="text-black text-[25px] font-bold leading-normal tracking-[0.5px]">
          Orders
        </p>
        <div className="flex flex-row items-center gap-2">
          <Link to="/">
            <p className="text-[#6E6E6E] font-roboto text-[13px] font-normal leading-normal tracking-[0.26px]">
              Dashboard
            </p>
          </Link>
          <p>
            <FontAwesomeIcon
              icon={faChevronRight}
              size="sm"
              className="pt-1 h-3 text-[#6E6E6E]"
            />
          </p>
          <p className="text-[#6E6E6E] font-roboto text-[13px] font-normal leading-normal tracking-[0.26px]">
            Orders
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[12px] shadow-[0px_0px_10px_0px_#EDEDED] mt-5 p-4">
        <div className="flex flex-row justify-between items-center py-3">
          <div className="flex flex-row items-start gap-2">
            <p className="text-sm p-1.5 text-gray-500">showing</p>
            <Menu>
              <MenuButton className="flex flex-row items-center gap-2 border border-gray-500 cursor-pointer py-1.5 px-3 rounded-md">
                <p className="text-sm">{pageLimit}</p>
                <img src={assets.dropdown_icon} alt="" />
              </MenuButton>
              <MenuItems anchor="bottom" className="bg-white py-2 px-4">
                <MenuItem
                  onClick={() => setPageLimit(10)}
                  className="cursor-pointer"
                >
                  <p className="text-sm text-center text-gray-500 py-3">10</p>
                </MenuItem>

                <MenuItem
                  onClick={() => setPageLimit(20)}
                  className="cursor-pointer"
                >
                  <p className="text-sm text-center text-gray-500  py-3">20</p>
                </MenuItem>

                <MenuItem
                  onClick={() => setPageLimit(30)}
                  className="cursor-pointer"
                >
                  <p className="text-sm text-center text-gray-500  py-3">30</p>
                </MenuItem>

                <MenuItem
                  onClick={() => setPageLimit(40)}
                  className="cursor-pointer"
                >
                  <p className="text-sm text-center text-gray-500  py-3">40</p>
                </MenuItem>

                <MenuItem
                  onClick={() => setPageLimit(50)}
                  className="cursor-pointer"
                >
                  <p className="text-sm text-center text-gray-500  py-3">50</p>
                </MenuItem>
              </MenuItems>
            </Menu>
            <p className="text-sm p-1.5 text-gray-500">entries</p>
            <div className="">
              <div className="flex items-center rounded-full bg-white pl-3 outline-1 -outline-offset-1 outline-gray-300 has-[input:focus-within]:outline-2 has-[input:focus-within]:-outline-offset-2 has-[input:focus-within]:outline-indigo-600 border border-gray-500">
                <input
                  id="price"
                  name="price"
                  type="text"
                  placeholder="Search here..."
                  defaultValue={searchValue}
                  onChange={handleSearchChange}
                  className="block w-full py-1.5 pr-3 pl-1 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
                />
                <div className="grid shrink-0 grid-cols-1 focus-within:relative cursor-pointer">
                  <img
                    src={assets.search_icon}
                    className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
                    alt=""
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <table className="w-full divide-y divide-gray-200 border-b border-gray-500 pb-20 overflow-x-hidden">
          <thead className="bg-gray-50 my-2">
            <tr>
              <th
                scope="col"
                className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Product
              </th>
              <th
                scope="col"
                className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("id")}
              >
                Order ID{" "}
                {sortBy === "id" && (sortOrder === "ASC" ? " ▲" : " ▼")}
              </th>
              <th
                scope="col"
                className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("totalPrice")}
              >
                Price{""}
                {sortBy === "totalPrice" && (sortOrder === "ASC" ? " ▲" : " ▼")}
              </th>
              <th
                scope="col"
                className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("quantity")}
              >
                Quantity{""}
                {sortBy === "quantity" && (sortOrder === "ASC" ? " ▲" : " ▼")}
              </th>

              <th
                scope="col"
                className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              >
                Location{""}
              </th>

              <th
                scope="col"
                className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("status")}
              >
                Status{""}
                {sortBy === "status" && (sortOrder === "ASC" ? " ▲" : " ▼")}
              </th>

              <th
                scope="col"
                className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("createdAt")}
              >
                Start Date{""}
                {sortBy === "createdAt" && (sortOrder === "ASC" ? " ▲" : " ▼")}
              </th>
            </tr>
          </thead>
          {isLoading ? (
            <DashboardOrderListSkeleton />
          ) : orders.length < 1 ? (
            <div className="flex flex-col items-center justify-center h-[300px]">
              <img src={assets.empty_inbox} alt="No Order yet" />
              <p className="text-[#ADADAD] text-sm mt-5">No Orders yet</p>
            </div>
          ) : (
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order, index) => (
                <tr
                  key={index}
                  className="hover:bg-[#F7F7F7]"
                  onClick={() => navigate(`/orders/${order.id}`)}
                >
                  <td className="px-2 py-5 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img
                          className="h-10 w-10 rounded-lg"
                          src={order?.items[0]?.product.images[0]}
                          alt=""
                        />
                      </div>
                      <div className="ml-4 max-w-[10rem]">
                        <div className="text-sm font-medium text-gray-900 text-wrap">
                          {order.user?.username}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-5 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{order.code}</div>
                  </td>
                  <td className="px-2 py-5 whitespace-nowrap text-sm text-gray-500">
                    {new Intl.NumberFormat("en-NG", {
                      style: "currency",
                      currency,
                    }).format(order.totalPrice)}
                  </td>
                  <td className="px-2 py-5 whitespace-nowrap text-sm text-center">
                    {order.items.reduce(
                      (total, item) => total + item.quantity,
                      0
                    )}
                  </td>

                  <td className="px-2 py-5 whitespace-nowrap text-sm text-gray-500">
                    {order.address.state || "Ibadan"}
                  </td>

                  <td className="px-2 py-5 whitespace-nowrap text-sm text-gray-500">
                    <p
                      className={`text-center py-1 rounded-full w-[5rem] px-2 ${
                        order.status === "confirmed"
                          ? "bg-[#d9f5df] text-[#61BF75]"
                          : order.status === "pending"
                          ? "bg-[#e2e3e5] text-[#6c757d]"
                          : order.status === "shipped"
                          ? "bg-[#cce5ff] text-[#007bff]"
                          : order.status === "delivered"
                          ? "bg-[#e2f0cb] text-[#28a745]"
                          : order.status === "cancelled"
                          ? "bg-[#f8d7da] text-[#dc3545]"
                          : order.status === "returned"
                          ? "bg-[#f7c6c7] text-[#e63946]"
                          : "bg-[#e2e3e5] text-[#6c757d]"
                      }`}
                    >
                      {order.status}
                    </p>
                  </td>
                  <td className="px-2 py-5 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.createdAt).toDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          )}
        </table>

        {meta && (
          <div className="flex flex-row text-center justify-between my-5">
            <p className="text-sm text-gray-500">
              Showing {meta.currentPage} to {meta.totalPages} of{" "}
              {meta.totalItems} entries
            </p>

            <div className="flex flex-row">
              <button
                className={`flex flex-row px-3 py-1 mx-1 border font-normal rounded-full ${
                  Number(meta.currentPage) === 1
                    ? " bg-[#D5D5D5] text-white cursor-not-allowed"
                    : "bg-white "
                }`}
                onClick={() => handlePageChange(Number(meta.currentPage) - 1)}
                disabled={Number(meta.currentPage) === 1}
              >
                <FontAwesomeIcon
                  icon={faChevronLeft}
                  size="5rem"
                  className="py-1"
                />
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
                className={`flex flex-row  px-3 p-1 mx-1 border font-normal rounded-full ${
                  Number(meta.currentPage) === meta.totalPages
                    ? "bg-[#D5D5D5] text-white cursor-not-allowed "
                    : "bg-white"
                }`}
                onClick={() => handlePageChange(Number(meta.currentPage) + 1)}
                disabled={Number(meta.currentPage) === meta.totalPages}
              >
                <FontAwesomeIcon
                  icon={faChevronRight}
                  size="5rem"
                  className="py-1"
                />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
