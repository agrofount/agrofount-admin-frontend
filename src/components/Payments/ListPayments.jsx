import { useCallback, useContext, useEffect, useRef, useState } from "react";
import TableSkeleton from "../skeleton/TableSkeleton";
import { assets } from "../../assets/assets";
import { ShopContext } from "../../context/ShopContext";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import PaymentTableItem from "./PaymentTableItem";

const ListPayments = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [payments, setPayments] = useState({ data: [], meta: {} });
  const [pageLimit, setPageLimit] = useState(50);
  const [searchValue, setSearchValue] = useState("");
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("DESC");

  const { token, backend_url, navigate } = useContext(ShopContext);
  const searchTimeout = useRef();

  const fetchPayments = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await axios.get(`${backend_url}/payment`, {
        headers: { Authorization: `Bearer ${token}` },
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
      console.error("an error occurred: ", error);
    } finally {
      setIsLoading(false);
    }
  }, [
    backend_url,
    token,
    paymentPage,
    pageLimit,
    searchValue,
    sortBy,
    sortOrder,
  ]);

  const handlePageChange = (page) => setPaymentPage(page);

  useEffect(() => {
    fetchPayments();
    setPaymentConfirmed(false);
  }, [fetchPayments, paymentConfirmed]);

  useEffect(() => {
    if (!token) navigate("/login");
  }, [token, navigate]);

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

  let tableContent;

  if (isLoading) {
    tableContent = <TableSkeleton />;
  } else if (payments.data.length < 1) {
    tableContent = (
      <tbody>
        <tr>
          <td colSpan="7">
            <div className="flex flex-col items-center justify-center h-[300px]">
              <img src={assets.empty_inbox} alt="empty inbox" />
              <p className="text-gray-400 text-sm mt-5">No payments yet</p>
            </div>
          </td>
        </tr>
      </tbody>
    );
  } else {
    tableContent = (
      <tbody>
        {payments.data.map((payment, index) => (
          <PaymentTableItem
            key={index}
            payment={payment}
            setPaymentConfirmed={setPaymentConfirmed}
          />
        ))}
      </tbody>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 mt-8 w-full">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
        <p className="text-xl md:text-2xl font-bold">Payment List</p>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/">Dashboard</Link>
          <FontAwesomeIcon icon={faChevronRight} size="xs" />
          <Link to="/payments">Payment List</Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow mt-5 p-4">
        {/* TIP */}
        <div className="flex flex-col md:flex-row gap-3 py-3">
          <img src={assets.tip_icon} alt="" className="w-5 h-5 mt-1" />
          <p className="text-gray-600 text-sm">
            Tip: search by Payment ID to find exact payments quickly.
          </p>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-gray-500">showing</p>

            <Menu>
              <MenuButton className="flex items-center gap-2 border border-gray-400 px-3 py-1.5 rounded-md">
                <p className="text-sm">{pageLimit}</p>
                <img src={assets.dropdown_icon} alt="" />
              </MenuButton>

              <MenuItems
                anchor="bottom"
                className="bg-white shadow rounded-md p-2"
              >
                {[10, 20, 30, 40, 50].map((limit) => (
                  <MenuItem key={limit} onClick={() => setPageLimit(limit)}>
                    <p className="cursor-pointer text-sm text-center py-2">
                      {limit}
                    </p>
                  </MenuItem>
                ))}
              </MenuItems>
            </Menu>

            <p className="text-sm text-gray-500">entries</p>

            {/* SEARCH */}
            <div className="flex items-center border border-gray-400 rounded-full px-2">
              <input
                type="text"
                placeholder="Search..."
                defaultValue={searchValue}
                onChange={handleSearchChange}
                className="w-[130px] sm:w-[180px] md:w-[220px] py-1 text-sm focus:outline-none"
              />
              <img src={assets.search_icon} className="w-4 h-4 ml-2" alt="" />
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="w-full overflow-x-auto">
          <table className="min-w-[1200px] w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-2 py-4 text-xs text-left text-gray-500 uppercase cursor-pointer"
                  onClick={() => handleSort("reference")}
                >
                  Reference{" "}
                  {sortBy === "reference" && (sortOrder === "ASC" ? "▲" : "▼")}
                </th>

                <th
                  className="px-2 py-4 text-xs text-left text-gray-500 uppercase cursor-pointer"
                  onClick={() => handleSort("email")}
                >
                  Email{" "}
                  {sortBy === "email" && (sortOrder === "ASC" ? "▲" : "▼")}
                </th>

                <th
                  className="px-2 py-4 text-xs text-left text-gray-500 uppercase cursor-pointer"
                  onClick={() => handleSort("orderId")}
                >
                  Order ID{" "}
                  {sortBy === "orderId" && (sortOrder === "ASC" ? "▲" : "▼")}
                </th>

                <th
                  className="px-2 py-4 text-xs text-left text-gray-500 uppercase cursor-pointer"
                  onClick={() => handleSort("amount")}
                >
                  Amount{" "}
                  {sortBy === "amount" && (sortOrder === "ASC" ? "▲" : "▼")}
                </th>

                <th
                  className="px-2 py-4 text-xs text-left text-gray-500 uppercase cursor-pointer"
                  onClick={() => handleSort("paymentStatus")}
                >
                  Status{" "}
                  {sortBy === "paymentStatus" &&
                    (sortOrder === "ASC" ? "▲" : "▼")}
                </th>

                <th
                  className="px-2 py-4 text-xs text-left text-gray-500 uppercase cursor-pointer"
                  onClick={() => handleSort("amountPaid")}
                >
                  Paid{" "}
                  {sortBy === "amountPaid" && (sortOrder === "ASC" ? "▲" : "▼")}
                </th>

                <th
                  className="px-2 py-4 text-xs text-left text-gray-500 uppercase cursor-pointer"
                  onClick={() => handleSort("createdAt")}
                >
                  Date{" "}
                  {sortBy === "createdAt" && (sortOrder === "ASC" ? "▲" : "▼")}
                </th>
              </tr>
            </thead>

            {tableContent}
          </table>
        </div>

        {/* PAGINATION */}
        {payments.meta && (
          <div className="flex flex-col md:flex-row md:justify-between items-center gap-3 my-5">
            <p className="text-sm text-gray-500 text-center">
              Showing {payments.meta.currentPage} to {payments.meta.totalPages}{" "}
              of {payments.meta.totalItems}
            </p>

            <div className="flex flex-wrap justify-center">
              <button
                className="px-3 py-1 mx-1 border rounded-full"
                disabled={payments.meta.currentPage === 1}
                onClick={() => handlePageChange(payments.meta.currentPage - 1)}
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>

              {[...Array(payments.meta.totalPages)].map((_, index) => (
                <button
                  key={index}
                  className={`px-3 py-1 mx-1 border rounded-full ${
                    payments.meta.currentPage === index + 1
                      ? "bg-red-500 text-white"
                      : ""
                  }`}
                  onClick={() => handlePageChange(index + 1)}
                >
                  {index + 1}
                </button>
              ))}

              <button
                className="px-3 py-1 mx-1 border rounded-full"
                disabled={
                  payments.meta.currentPage === payments.meta.totalPages
                }
                onClick={() => handlePageChange(payments.meta.currentPage + 1)}
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

export default ListPayments;
