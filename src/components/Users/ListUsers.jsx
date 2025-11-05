import { Link } from "react-router-dom";
import { assets } from "../../assets/assets";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faTable,
} from "@fortawesome/free-solid-svg-icons";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { useCallback, useContext, useEffect, useState, useRef } from "react";
import axios from "axios";
import { ShopContext } from "../../context/ShopContext";
import TableSkeleton from "../skeleton/TableSkeleton";
import UserTableItem from "./UserItemTable";

const ListUsers = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState({ data: [], meta: {} });
  const [pageLimit, setPageLimit] = useState(50);
  const [searchValue, setSearchValue] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [updated, setUpdated] = useState(false);

  const { token, backend_url, navigate } = useContext(ShopContext);

  const searchTimeout = useRef();

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${backend_url}/user`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: userPage,
          limit: pageLimit,
          search: searchValue,
          //   "filter.country.id": countryId,
        },
      });
      if (response.status === 200) setUsers(response.data);
    } catch (error) {
      console.error("an error occurred: ", error);
    } finally {
      setIsLoading(false);
    }
  }, [backend_url, token, userPage, pageLimit, searchValue]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setSearchValue(value);
    }, 400);
  };

  const handlePageChange = (page) => {
    setUserPage(page);
  };

  const debounceTimeout = useRef();

  // Debounced search effect
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      fetchUsers();
    }, 400);
    return () => clearTimeout(debounceTimeout.current);
  }, [searchValue, userPage, pageLimit, updated, fetchUsers]);

  let tableContent;
  if (isLoading) {
    tableContent = <TableSkeleton />;
  } else if (users.data.length < 1) {
    tableContent = (
      <tbody>
        <tr>
          <td colSpan="12">
            <div className="flex justify-center items-center h-[300px] w-full">
              <div className="flex flex-col">
                <FontAwesomeIcon icon={faTable} size="2xl" />
                <p className="text-[#ADADAD] text-sm mt-5">No Users yet</p>
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    );
  } else {
    tableContent = (
      <tbody>
        {users.data.map((user, index) => (
          <UserTableItem user={user} key={index} setUpdated={setUpdated} />
        ))}
      </tbody>
    );
  }

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  return (
    <div>
      <div className="flex flex-row justify-between items-center gap-5">
        <p className="text-black text-[25px] font-bold leading-normal tracking-[0.5px]">
          Users List
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
          <Link to="/users">
            <p className="text-[#6E6E6E] font-roboto text-[13px] font-normal leading-normal tracking-[0.26px]">
              Users List
            </p>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-[12px] shadow-[0px_0px_10px_0px_#EDEDED] mt-5 p-4">
        <div className="flex flex-row justify-between items-center py-3">
          <div className="flex flex-row items-start gap-2">
            <img src={assets.tip_icon} alt="" />
            <p className="text-[#6E6E6E] font-roboto text-[15px] font-normal leading-normal">
              Tip search by User ID: Each product is provided with a unique ID,
              which you can rely on to find the exact product you need.
            </p>
          </div>
        </div>

        <div className="flex flex-row justify-start items-center py-3">
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
                User
              </th>
              <th
                scope="col"
                className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Email
              </th>

              <th
                scope="col"
                className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Gender
              </th>

              <th
                scope="col"
                className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Phone
              </th>

              <th
                scope="col"
                className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Location
              </th>
              <th
                scope="col"
                className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                IsVerified
              </th>
              <th
                scope="col"
                className="px-2 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                CreatedAt
              </th>

              <th
                scope="col"
                className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Action
              </th>
            </tr>
          </thead>
          {tableContent}
        </table>

        {users.meta && (
          <div className="flex flex-row text-center justify-between my-5">
            <p className="text-sm text-gray-500">
              Showing {users.meta.currentPage} to {users.meta.totalPages} of{" "}
              {users.meta.totalItems} entries
            </p>

            <div className="flex flex-row">
              <button
                className={`flex flex-row px-3 py-1 mx-1 border font-normal rounded-full ${
                  Number(users.meta.currentPage) === 1
                    ? " bg-[#D5D5D5] text-white cursor-not-allowed"
                    : "bg-white "
                }`}
                onClick={() =>
                  handlePageChange(Number(users.meta.currentPage) - 1)
                }
                disabled={Number(users.meta.currentPage) === 1}
              >
                <FontAwesomeIcon
                  icon={faChevronLeft}
                  size="5rem"
                  className="py-1"
                />
              </button>
              {[...Array(users.meta.totalPages)].map((_, index) => (
                <button
                  key={index}
                  className={`px-3 py-1 mx-1 border rounded-full ${
                    Number(users.meta.currentPage) === index + 1
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
                  Number(users.meta.currentPage) === users.meta.totalPages
                    ? "bg-[#D5D5D5] text-white cursor-not-allowed "
                    : "bg-white"
                }`}
                onClick={() =>
                  handlePageChange(Number(users.meta.currentPage) + 1)
                }
                disabled={
                  Number(users.meta.currentPage) === users.meta.totalPages
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

export default ListUsers;
