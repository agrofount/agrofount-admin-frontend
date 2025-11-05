import {
  faBook,
  faChartSimple,
  faLandmark,
  faMoneyCheck,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useContext, useState } from "react";
import { assets } from "../assets/assets";
import { Link } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";

const SideBar = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [openSubmenu, setOpenSubmenu] = useState(null);

  const { sidebarVisible, toggleSidebar } = useContext(ShopContext);

  const toggleSubmenu = (menu) => {
    setOpenSubmenu(openSubmenu === menu ? null : menu);
  };

  return (
    <div
      className={`fixed inset-0 z-30 md:relative md:inset-auto md:flex flex-col w-64 bg-white transition-transform transform ${
        sidebarVisible ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}
    >
      <div className="flex flex-col flex-1 overflow-y-auto">
        <nav className="flex flex-col flex-1 overflow-y-auto px-2 py-2 gap-1">
          <div className="flex flex-row justify-between border-b border-gray-300 pb-3 h-20">
            <img src={assets.agrofount_logo} className="w-32 px-4" alt="" />
            <div
              onClick={toggleSidebar}
              className="flex md:hidden cursor-pointer"
            >
              <FontAwesomeIcon
                icon={faXmark}
                size="2x"
                className="py-4 pr-4 text-cursor-pointer"
              />
            </div>
          </div>
          <p className="text-[#ADADAD] font-roboto text-[13px] font-extrabold leading-normal p-4">
            MAIN HOME
          </p>

          <div>
            <Link
              to="/"
              className="flex justify-start items-center px-4 py-3 text-black hover:bg-gray-400 hover:bg-opacity-25"
              onClick={() => setActiveTab("dashboard")}
            >
              <div className="flex">
                <img
                  src={assets.dashboard_icon}
                  className="w-5 h-5 p-0.5"
                  alt=""
                />
                <span className="px-3 text-sm font-medium">Dashboard</span>
              </div>
            </Link>
          </div>

          <p className="text-[#ADADAD] font-roboto text-[13px] font-extrabold leading-normal p-4">
            ALL PAGE
          </p>

          <div className="flex flex-col gap-2">
            <div>
              <div
                className="flex justify-between items-center px-4 py-3 text-black hover:bg-gray-400 hover:bg-opacity-25"
                onClick={() => toggleSubmenu("ecommerce")}
              >
                <div className="flex">
                  <img src={assets.ecommerce_icon} alt="" />
                  <span className="px-3 text-sm font-medium">Ecommerce</span>
                </div>
                <img
                  src={assets.dropdown_icon}
                  alt="Dropdown Icon"
                  className={`transition-transform ${
                    openSubmenu === "ecommerce" ? "rotate-180" : ""
                  }`}
                />
              </div>

              {openSubmenu === "ecommerce" && (
                <div className="pl-8">
                  <Link
                    to="/add-products"
                    className="flex items-center px-4 py-2 text-sm text-black hover:bg-gray-400 hover:bg-opacity-25"
                    onClick={() => setActiveTab("products")}
                  >
                    Add Products
                  </Link>
                  <Link
                    to="/list-products"
                    className="flex items-center px-4 py-2 text-sm text-black hover:bg-gray-400 hover:bg-opacity-25"
                    onClick={() => setActiveTab("listProducts")}
                  >
                    List Products
                  </Link>
                </div>
              )}
            </div>

            <div>
              <div
                className="flex justify-between items-center px-4 py-3 text-black hover:bg-gray-400 hover:bg-opacity-25"
                onClick={() => toggleSubmenu("category")}
              >
                <div className="flex">
                  <img src={assets.category_icon} alt="" />
                  <span className="px-3 text-sm font-medium">Category</span>
                </div>
                <img
                  src={assets.dropdown_icon}
                  alt="Dropdown Icon"
                  className={`transition-transform ${
                    openSubmenu === "category" ? "rotate-180" : ""
                  }`}
                />
              </div>
              {openSubmenu === "category" && (
                <div className="pl-8">
                  <Link
                    to="#"
                    className="flex items-center px-4 py-2 text-sm text-black hover:bg-gray-400 hover:bg-opacity-25"
                    onClick={() => setActiveTab("addCategory")}
                  >
                    Add Category
                  </Link>
                  <Link
                    to="#"
                    className="flex items-center px-4 py-2 text-sm text-black hover:bg-gray-400 hover:bg-opacity-25"
                    onClick={() => setActiveTab("manageCategories")}
                  >
                    Manage Categories
                  </Link>
                </div>
              )}
            </div>

            <div>
              <div
                className="flex justify-between items-center px-4 py-3 text-black hover:bg-gray-400 hover:bg-opacity-25"
                onClick={() => toggleSubmenu("creditFacility")}
              >
                <div className="flex">
                  <FontAwesomeIcon icon={faLandmark} />
                  <span className="px-3 text-sm font-medium">
                    Credit Facility
                  </span>
                </div>
                <img
                  src={assets.dropdown_icon}
                  alt="Dropdown Icon"
                  className={`transition-transform ${
                    openSubmenu === "attributes" ? "rotate-180" : ""
                  }`}
                />
              </div>
              {openSubmenu === "creditFacility" && (
                <div className="pl-8">
                  <Link
                    to="/facility/requests"
                    className="flex items-center px-4 py-2  gap-2 text-sm text-black hover:bg-gray-400 hover:bg-opacity-25"
                    onClick={() => setActiveTab("creditFacilityRequests")}
                  >
                    <FontAwesomeIcon icon={faBook} />
                    Requests
                  </Link>
                </div>
              )}
            </div>
            <Link
              to="/orders"
              className="flex justify-between items-center px-4 py-3 text-black hover:bg-gray-400 hover:bg-opacity-25"
              onClick={() => setActiveTab("orders")}
            >
              <div className="flex">
                <img src={assets.order_icon} alt="" />
                <span className="px-3 text-sm font-medium">Orders</span>
              </div>
            </Link>

            <Link
              to="/carts"
              className="flex justify-between items-center px-4 py-3 text-black hover:bg-gray-400 hover:bg-opacity-25"
              onClick={() => setActiveTab("carts")}
            >
              <div className="flex">
                <img src={assets.ecommerce_icon} alt="" />
                <span className="px-3 text-sm font-medium">Carts</span>
              </div>
            </Link>

            <Link
              to="/payments"
              className="flex justify-between items-center px-4 py-3 text-black hover:bg-gray-400 hover:bg-opacity-25"
              onClick={() => setActiveTab("payments")}
            >
              <div className="flex">
                <FontAwesomeIcon icon={faMoneyCheck} SIZE="2xl" />
                <span className="px-3 text-sm font-medium">Payments</span>
              </div>
            </Link>
            <div>
              <div
                className="flex justify-between items-center px-3 py-3 text-black hover:bg-gray-400 hover:bg-opacity-25"
                onClick={() => toggleSubmenu("admin")}
              >
                <div className="flex">
                  <img src={assets.user_icon} alt="" />
                  <span className="px-3 text-sm font-medium">Admin</span>
                </div>
                <img
                  src={assets.dropdown_icon}
                  alt="Dropdown Icon"
                  className={`transition-transform ${
                    openSubmenu === "admin" ? "rotate-180" : ""
                  }`}
                />
              </div>
              {openSubmenu === "admin" && (
                <div className="pl-8">
                  <Link
                    to="/admins"
                    className="flex items-center px-4 py-2 text-sm text-black hover:bg-gray-400 hover:bg-opacity-25"
                    onClick={() => setActiveTab("ListAdmins")}
                  >
                    List Admins
                  </Link>
                  <Link
                    to="/admins/add"
                    className="flex items-center px-4 py-2 text-sm text-black hover:bg-gray-400 hover:bg-opacity-25"
                    onClick={() => setActiveTab("InviteAdmin")}
                  >
                    Invite Admin
                  </Link>
                </div>
              )}
            </div>

            <Link
              to="/users"
              className="flex justify-between items-center px-3 py-3 text-black hover:bg-gray-400 hover:bg-opacity-25"
              onClick={() => setActiveTab("users")}
            >
              <div className="flex">
                <img src={assets.user_icon} alt="" />
                <span className="px-3 text-sm font-medium">User</span>
              </div>
            </Link>

            <div>
              <div
                className="flex justify-between items-center px-3 py-3 text-black hover:bg-gray-400 hover:bg-opacity-25"
                onClick={() => toggleSubmenu("role")}
              >
                <div className="flex">
                  <img src={assets.roles_icon} alt="" />
                  <span className="px-3 text-sm font-medium">Roles</span>
                </div>
                <img
                  src={assets.dropdown_icon}
                  alt="Dropdown Icon"
                  className={`transition-transform ${
                    openSubmenu === "role" ? "rotate-180" : ""
                  }`}
                />
              </div>
              {openSubmenu === "role" && (
                <div className="pl-8">
                  <Link
                    to="/roles"
                    className="flex items-center px-4 py-2 text-sm text-black hover:bg-gray-400 hover:bg-opacity-25"
                    onClick={() => setActiveTab("ListRoles")}
                  >
                    List Roles
                  </Link>
                  <Link
                    to="/roles/add"
                    className="flex items-center px-4 py-2 text-sm text-black hover:bg-gray-400 hover:bg-opacity-25"
                    onClick={() => setActiveTab("Add Roles")}
                  >
                    Add Roles
                  </Link>
                </div>
              )}
            </div>

            <div>
              <div
                className="flex justify-between items-center px-3 py-3 text-black hover:bg-gray-400 hover:bg-opacity-25"
                onClick={() => toggleSubmenu("blog")}
              >
                <div className="flex">
                  <FontAwesomeIcon icon={faBook} />
                  <span className="px-3 text-sm font-medium">Blog</span>
                </div>
                <img
                  src={assets.dropdown_icon}
                  alt="Dropdown Icon"
                  className={`transition-transform ${
                    openSubmenu === "blog" ? "rotate-180" : ""
                  }`}
                />
              </div>
              {openSubmenu === "blog" && (
                <div className="pl-8">
                  <Link
                    to="/blogs"
                    className="flex items-center px-4 py-2 text-sm text-black hover:bg-gray-400 hover:bg-opacity-25"
                    onClick={() => setActiveTab("ListPosts")}
                  >
                    List Posts
                  </Link>
                  <Link
                    to="/blogs/add"
                    className="flex items-center px-4 py-2 text-sm text-black hover:bg-gray-400 hover:bg-opacity-25"
                    onClick={() => setActiveTab("CreatePosts")}
                  >
                    Create Posts
                  </Link>
                </div>
              )}
            </div>
            <div>
              <div
                className="flex justify-between items-center px-3 py-3 text-black hover:bg-gray-400 hover:bg-opacity-25"
                onClick={() => toggleSubmenu("supplyChain")}
              >
                <div className="flex">
                  <img src={assets.user_icon} alt="" />
                  <span className="px-3 text-sm font-medium">Supply Chain</span>
                </div>
                <img
                  src={assets.dropdown_icon}
                  alt="Dropdown Icon"
                  className={`transition-transform ${
                    openSubmenu === "admin" ? "rotate-180" : ""
                  }`}
                />
              </div>
              {openSubmenu === "supplyChain" && (
                <div className="pl-8">
                  <Link
                    to="/supply-chain/drivers"
                    className="flex items-center px-4 py-2 text-sm text-black hover:bg-gray-400 hover:bg-opacity-25"
                    onClick={() => setActiveTab("ListDrivers")}
                  >
                    Drivers
                  </Link>
                  <Link
                    to="/supply-chain/shipments"
                    className="flex items-center px-4 py-2 text-sm text-black hover:bg-gray-400 hover:bg-opacity-25"
                    onClick={() => setActiveTab("ListShipments")}
                  >
                    Shipments
                  </Link>
                </div>
              )}
            </div>

            <a
              href="#"
              className="flex justify-between items-center px-3 py-3 text-black hover:bg-gray-400 hover:bg-opacity-25"
            >
              <div className="flex">
                <FontAwesomeIcon icon={faChartSimple} />
                <span className="px-3 text-sm font-medium">Reports</span>
              </div>
              <img src={assets.dropdown_icon} alt="" />
            </a>
          </div>

          <p className="text-[#ADADAD] font-roboto text-[13px] font-extrabold leading-normal p-4">
            SETTINGS
          </p>

          <div className="flex flex-col flex-1 gap-2">
            <div>
              <div
                className="flex justify-between items-center px-3 py-3 text-black hover:bg-gray-400 hover:bg-opacity-25"
                onClick={() => toggleSubmenu("location")}
              >
                <div className="flex">
                  <img src={assets.location_icon} alt="" />
                  <span className="px-3 text-sm font-medium">Location</span>
                </div>
                <img
                  src={assets.dropdown_icon}
                  alt="Dropdown Icon"
                  className={`transition-transform ${
                    openSubmenu === "location" ? "rotate-180" : ""
                  }`}
                />
              </div>
              {openSubmenu === "location" && (
                <div className="pl-8">
                  <Link
                    to="/countries"
                    className="flex items-center px-4 py-2 text-sm text-black hover:bg-gray-400 hover:bg-opacity-25"
                    onClick={() => setActiveTab("country")}
                  >
                    Country
                  </Link>
                </div>
              )}
            </div>
            <a
              href="#"
              className="flex justify-start items-center px-3 py-3 text-black hover:bg-gray-400 hover:bg-opacity-25"
            >
              <div className="flex">
                <img src={assets.settings_icon} alt="" />
                <span className="px-3 text-sm font-medium">Settings</span>
              </div>
            </a>
            <a
              href="#"
              className="flex justify-start items-center px-3 py-3 text-black hover:bg-gray-400 hover:bg-opacity-25"
            >
              <div className="flex">
                <img src={assets.help_center_icon} alt="" />
                <span className="px-3 text-sm font-medium">Help Center</span>
              </div>
            </a>
            <a
              href="#"
              className="flex justify-start items-center px-3 py-3 text-black hover:bg-gray-400 hover:bg-opacity-25"
            >
              <div className="flex">
                <img src={assets.faq_icon} alt="" />
                <span className="px-3 text-sm font-medium">FAQ</span>
              </div>
            </a>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default SideBar;
