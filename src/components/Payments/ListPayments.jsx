import { useCallback, useContext, useEffect, useState } from "react";
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
  const [sortOrder, setSortOrder] = useState("ASC");

  const { token, backend_url, navigate } = useContext(ShopContext);

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

  const handlePageChange = (page) => {
    setPaymentPage(page);
  };

  useEffect(() => {
    fetchPayments();
    setPaymentConfirmed(false);
  }, [fetchPayments, paymentConfirmed]);

  let tableContent;
  if (isLoading) {
    tableContent = <TableSkeleton />;
  } else if (payments.data.length < 1) {
    tableContent = (
      <div className="flex flex-col items-center justify-center h-[300px]">
        <img src={assets.empty_inbox} alt="empty inbox" />
        <p className="text-[#ADADAD] text-sm mt-5">No messages yet</p>
      </div>
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

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  // Sort handler
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortBy(field);
      setSortOrder("ASC");
    }
  };

  return (
    <div>
      <div className="flex flex-row justify-between items-center gap-5">
        <p className="text-black text-[25px] font-bold leading-normal tracking-[0.5px]">
          Payment List
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
          <Link to="/payments">
            <p className="text-[#6E6E6E] font-roboto text-[13px] font-normal leading-normal tracking-[0.26px]">
              Payment List
            </p>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-[12px] shadow-[0px_0px_10px_0px_#EDEDED] mt-5 p-4">
        <div className="flex flex-row justify-between items-center py-3">
          <div className="flex flex-row items-start gap-2">
            <img src={assets.tip_icon} alt="" />
            <p className="text-[#6E6E6E] font-roboto text-[15px] font-normal leading-normal">
              Tip search by Payment ID: Each payment is provided with a unique
              ID, which you can rely on to find the exact payment you need.
            </p>
          </div>
        </div>

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
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
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
                className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("reference")}
              >
                Reference{" "}
                {sortBy === "reference" && (sortOrder === "ASC" ? "▲" : "▼")}
              </th>
              <th
                scope="col"
                className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("email")}
              >
                Email {sortBy === "email" && (sortOrder === "ASC" ? "▲" : "▼")}
              </th>
              <th
                scope="col"
                className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("orderId")}
              >
                Order ID{" "}
                {sortBy === "orderId" && (sortOrder === "ASC" ? "▲" : "▼")}
              </th>
              <th
                scope="col"
                className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("amount")}
              >
                Amount{" "}
                {sortBy === "amount" && (sortOrder === "ASC" ? "▲" : "▼")}
              </th>
              <th
                scope="col"
                className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("paymentStatus")}
              >
                Payment Status{" "}
                {sortBy === "paymentStatus" &&
                  (sortOrder === "ASC" ? "▲" : "▼")}
              </th>
              <th
                scope="col"
                className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("amountPaid")}
              >
                Amount Paid{" "}
                {sortBy === "amountPaid" && (sortOrder === "ASC" ? "▲" : "▼")}
              </th>
              <th
                scope="col"
                className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("createdAt")}
              >
                Date{" "}
                {sortBy === "createdAt" && (sortOrder === "ASC" ? "▲" : "▼")}
              </th>
            </tr>
          </thead>
          {tableContent}
        </table>

        {/* meta */}
        {payments.meta && (
          <div className="flex flex-row text-center justify-between my-5">
            <p className="text-sm text-gray-500">
              Showing {payments.meta.currentPage} to {payments.meta.totalPages}{" "}
              of {payments.meta.totalItems} entries
            </p>

            <div className="flex flex-row">
              <button
                className={`flex flex-row px-3 py-1 mx-1 border font-normal rounded-full ${
                  Number(payments.meta.currentPage) === 1
                    ? " bg-[#D5D5D5] text-white cursor-not-allowed"
                    : "bg-white "
                }`}
                onClick={() =>
                  handlePageChange(Number(payments.meta.currentPage) - 1)
                }
                disabled={Number(payments.meta.currentPage) === 1}
              >
                <FontAwesomeIcon
                  icon={faChevronLeft}
                  size="5rem"
                  className="py-1"
                />
              </button>
              {[...Array(payments.meta.totalPages)].map((_, index) => (
                <button
                  key={index}
                  className={`px-3 py-1 mx-1 border rounded-full ${
                    Number(payments.meta.currentPage) === index + 1
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
                  Number(payments.meta.currentPage) === payments.meta.totalPages
                    ? "bg-[#D5D5D5] text-white cursor-not-allowed "
                    : "bg-white"
                }`}
                onClick={() =>
                  handlePageChange(Number(payments.meta.currentPage) + 1)
                }
                disabled={
                  Number(payments.meta.currentPage) === payments.meta.totalPages
                }
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

export default ListPayments;
