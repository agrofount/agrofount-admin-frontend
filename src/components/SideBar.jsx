import {
  faBook,
  faChartSimple,
  faLandmark,
  faMoneyCheck,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useContext, useEffect, useState } from "react";
import { assets } from "../assets/assets";
import { Link } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { RESOURCES, ACTIONS } from "../constants/permissions";
import { usePermission } from "./Hooks/usePermission";

const SideBar = () => {
  // eslint-disable-next-line no-unused-vars
  const [activeTab, setActiveTab] = useState("dashboard");
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const { sidebarVisible, toggleSidebar } = useContext(ShopContext);
  const { hasPermission, isAdmin } = usePermission();

  // Check if mobile on resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close sidebar on route change (mobile only)
  useEffect(() => {
    if (isMobile && sidebarVisible) {
      // Use a small timeout to ensure navigation happens first
      setTimeout(() => {
        toggleSidebar();
      }, 100);
    }
  }, [location.pathname]); // Trigger when route changes

  const toggleSubmenu = (menu) => {
    setOpenSubmenu(openSubmenu === menu ? null : menu);
  };

  // Handle link click - close sidebar and set active tab
  const handleLinkClick = (tabName) => {
    console.log("closing tab: ", tabName);
    setActiveTab(tabName);
    // Close sidebar on mobile after selecting an option
    if (window.innerWidth < 768) {
      toggleSidebar();
    }
  };

  // Permission check helpers
  const canViewDashboard =
    isAdmin || hasPermission(RESOURCES.DASHBOARD, ACTIONS.READ);
  const canViewEcommerce =
    isAdmin ||
    hasPermission(RESOURCES.PRODUCTS, ACTIONS.READ) ||
    hasPermission(RESOURCES.PRODUCTS, ACTIONS.CREATE);
  const canViewProducts =
    isAdmin || hasPermission(RESOURCES.PRODUCTS, ACTIONS.READ);
  const canAddProducts =
    isAdmin || hasPermission(RESOURCES.PRODUCTS, ACTIONS.CREATE);

  const canViewCategories =
    isAdmin ||
    hasPermission(RESOURCES.CATEGORIES, ACTIONS.READ) ||
    hasPermission(RESOURCES.CATEGORIES, ACTIONS.CREATE);
  const canAddCategories =
    isAdmin || hasPermission(RESOURCES.CATEGORIES, ACTIONS.CREATE);
  const canManageCategories =
    isAdmin || hasPermission(RESOURCES.CATEGORIES, ACTIONS.UPDATE);

  const canViewCreditFacility =
    isAdmin ||
    hasPermission(RESOURCES.CREDIT_FACILITY, ACTIONS.READ) ||
    hasPermission(RESOURCES.CREDIT_FACILITY, ACTIONS.MANAGE);
  const canViewCreditRequests =
    isAdmin || hasPermission(RESOURCES.CREDIT_FACILITY, ACTIONS.READ);

  const canViewOrders =
    isAdmin || hasPermission(RESOURCES.ORDERS, ACTIONS.READ);
  const canViewCarts = isAdmin || hasPermission(RESOURCES.CARTS, ACTIONS.READ);
  const canViewPayments =
    isAdmin || hasPermission(RESOURCES.PAYMENTS, ACTIONS.READ);

  const canViewAdmins =
    isAdmin ||
    // hasPermission(RESOURCES.ADMINS, ACTIONS.READ) ||
    hasPermission(RESOURCES.ADMINS, ACTIONS.CREATE);
  const canListAdmins =
    isAdmin || hasPermission(RESOURCES.ADMINS, ACTIONS.READ);
  const canInviteAdmins =
    isAdmin || hasPermission(RESOURCES.ADMINS, ACTIONS.CREATE);

  const canViewUsers = isAdmin || hasPermission(RESOURCES.USERS, ACTIONS.READ);

  const canViewRoles =
    isAdmin ||
    hasPermission(RESOURCES.ROLES, ACTIONS.READ) ||
    hasPermission(RESOURCES.ROLES, ACTIONS.CREATE);
  const canListRoles = isAdmin || hasPermission(RESOURCES.ROLES, ACTIONS.READ);
  const canAddRoles = isAdmin || hasPermission(RESOURCES.ROLES, ACTIONS.CREATE);

  const canViewBlog =
    isAdmin ||
    hasPermission(RESOURCES.BLOG_POSTS, ACTIONS.READ) ||
    hasPermission(RESOURCES.BLOG_POSTS, ACTIONS.CREATE);
  const canListPosts =
    isAdmin || hasPermission(RESOURCES.BLOG_POSTS, ACTIONS.READ);
  const canCreatePosts =
    isAdmin || hasPermission(RESOURCES.BLOG_POSTS, ACTIONS.CREATE);

  const canViewSupplyChain =
    isAdmin ||
    hasPermission(RESOURCES.SUPPLY_CHAIN, ACTIONS.READ) ||
    hasPermission(RESOURCES.DRIVERS, ACTIONS.READ) ||
    hasPermission(RESOURCES.SHIPMENTS, ACTIONS.READ);
  const canViewDrivers =
    isAdmin || hasPermission(RESOURCES.DRIVERS, ACTIONS.READ);
  const canViewShipments =
    isAdmin || hasPermission(RESOURCES.SHIPMENTS, ACTIONS.READ);

  const canViewReports =
    isAdmin || hasPermission(RESOURCES.REPORTS, ACTIONS.READ);

  const canViewLocation =
    isAdmin ||
    hasPermission(RESOURCES.LOCATIONS, ACTIONS.READ) ||
    hasPermission(RESOURCES.COUNTRIES, ACTIONS.READ) ||
    hasPermission(RESOURCES.STATES, ACTIONS.READ) ||
    hasPermission(RESOURCES.CITIES, ACTIONS.READ);
  const canViewCountries =
    isAdmin || hasPermission(RESOURCES.COUNTRIES, ACTIONS.READ);

  const canViewSettings =
    isAdmin || hasPermission(RESOURCES.SETTINGS, ACTIONS.READ);

  // Check if user has any visible menu items
  const hasAnyMenuItems =
    canViewDashboard ||
    canViewEcommerce ||
    canViewCategories ||
    canViewCreditFacility ||
    canViewOrders ||
    canViewCarts ||
    canViewPayments ||
    canViewAdmins ||
    canViewUsers ||
    canViewRoles ||
    canViewBlog ||
    canViewSupplyChain ||
    canViewReports ||
    canViewLocation ||
    canViewSettings;

  if (!hasAnyMenuItems) {
    return (
      <div
        className={`fixed inset-0 z-30 md:relative md:inset-auto md:flex flex-col w-64 bg-white transition-transform transform ${
          sidebarVisible
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0"
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
            <div className="flex justify-center items-center h-64">
              <p className="text-gray-400 text-center px-4">
                You don`&apos;`t have permission to view any menu items
              </p>
            </div>
          </nav>
        </div>
      </div>
    );
  }

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

          {/* MAIN HOME Section */}
          <p className="text-[#ADADAD] font-roboto text-[13px] font-extrabold leading-normal p-4">
            MAIN HOME
          </p>

          {/* Dashboard */}
          {canViewDashboard && (
            <div>
              <Link
                to="/"
                className="flex justify-start items-center px-4 py-3 text-black hover:bg-gray-400 hover:bg-opacity-25"
                onClick={() => handleLinkClick("dashboard")}
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
          )}

          {/* ALL PAGE Section */}
          <p className="text-[#ADADAD] font-roboto text-[13px] font-extrabold leading-normal p-4">
            ALL PAGE
          </p>

          <div className="flex flex-col gap-2">
            {/* Ecommerce Section */}
            {canViewEcommerce && (
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
                    {canAddProducts && (
                      <Link
                        to="/add-products"
                        className="flex items-center px-4 py-2 text-sm text-black hover:bg-gray-400 hover:bg-opacity-25"
                        onClick={() => handleLinkClick("products")}
                      >
                        Add Products
                      </Link>
                    )}
                    {canViewProducts && (
                      <Link
                        to="/list-products"
                        className="flex items-center px-4 py-2 text-sm text-black hover:bg-gray-400 hover:bg-opacity-25"
                        onClick={() => handleLinkClick("listProducts")}
                      >
                        List Products
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Category Section */}
            {canViewCategories && (
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
                    {canAddCategories && (
                      <Link
                        to="/add-category"
                        className="flex items-center px-4 py-2 text-sm text-black hover:bg-gray-400 hover:bg-opacity-25"
                        onClick={() => handleLinkClick("addCategory")}
                      >
                        Add Category
                      </Link>
                    )}
                    {canManageCategories && (
                      <Link
                        to="/manage-categories"
                        className="flex items-center px-4 py-2 text-sm text-black hover:bg-gray-400 hover:bg-opacity-25"
                        onClick={() => handleLinkClick("manageCategories")}
                      >
                        Manage Categories
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Credit Facility Section */}
            {canViewCreditFacility && (
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
                      openSubmenu === "creditFacility" ? "rotate-180" : ""
                    }`}
                  />
                </div>
                {openSubmenu === "creditFacility" && (
                  <div className="pl-8">
                    {canViewCreditRequests && (
                      <Link
                        to="/facility/requests"
                        className="flex items-center px-4 py-2 gap-2 text-sm text-black hover:bg-gray-400 hover:bg-opacity-25"
                        onClick={() =>
                          handleLinkClick("creditFacilityRequests")
                        }
                      >
                        <FontAwesomeIcon icon={faBook} />
                        Requests
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Orders */}
            {canViewOrders && (
              <Link
                to="/orders"
                className="flex justify-between items-center px-4 py-3 text-black hover:bg-gray-400 hover:bg-opacity-25"
                onClick={() => handleLinkClick("orders")}
              >
                <div className="flex">
                  <img src={assets.order_icon} alt="" />
                  <span className="px-3 text-sm font-medium">Orders</span>
                </div>
              </Link>
            )}

            {/* Carts */}
            {canViewCarts && (
              <Link
                to="/carts"
                className="flex justify-between items-center px-4 py-3 text-black hover:bg-gray-400 hover:bg-opacity-25"
                onClick={() => handleLinkClick("carts")}
              >
                <div className="flex">
                  <img src={assets.ecommerce_icon} alt="" />
                  <span className="px-3 text-sm font-medium">Carts</span>
                </div>
              </Link>
            )}

            {/* Payments */}
            {canViewPayments && (
              <Link
                to="/payments"
                className="flex justify-between items-center px-4 py-3 text-black hover:bg-gray-400 hover:bg-opacity-25"
                onClick={() => handleLinkClick("payments")}
              >
                <div className="flex">
                  <FontAwesomeIcon icon={faMoneyCheck} />
                  <span className="px-3 text-sm font-medium">Payments</span>
                </div>
              </Link>
            )}

            {/* Admin Section */}
            {canViewAdmins && (
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
                    {canListAdmins && (
                      <Link
                        to="/admins"
                        className="flex items-center px-4 py-2 text-sm text-black hover:bg-gray-400 hover:bg-opacity-25"
                        onClick={() => handleLinkClick("ListAdmins")}
                      >
                        List Admins
                      </Link>
                    )}
                    {canInviteAdmins && (
                      <Link
                        to="/admins/add"
                        className="flex items-center px-4 py-2 text-sm text-black hover:bg-gray-400 hover:bg-opacity-25"
                        onClick={() => handleLinkClick("InviteAdmin")}
                      >
                        Invite Admin
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Users */}
            {canViewUsers && (
              <Link
                to="/users"
                className="flex justify-between items-center px-3 py-3 text-black hover:bg-gray-400 hover:bg-opacity-25"
                onClick={() => handleLinkClick("users")}
              >
                <div className="flex">
                  <img src={assets.user_icon} alt="" />
                  <span className="px-3 text-sm font-medium">User</span>
                </div>
              </Link>
            )}

            {/* Roles Section */}
            {canViewRoles && (
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
                    {canListRoles && (
                      <Link
                        to="/roles"
                        className="flex items-center px-4 py-2 text-sm text-black hover:bg-gray-400 hover:bg-opacity-25"
                        onClick={() => handleLinkClick("ListRoles")}
                      >
                        List Roles
                      </Link>
                    )}
                    {canAddRoles && (
                      <Link
                        to="/roles/add"
                        className="flex items-center px-4 py-2 text-sm text-black hover:bg-gray-400 hover:bg-opacity-25"
                        onClick={() => handleLinkClick("AddRoles")}
                      >
                        Add Roles
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Blog Section */}
            {canViewBlog && (
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
                    {canListPosts && (
                      <Link
                        to="/blogs"
                        className="flex items-center px-4 py-2 text-sm text-black hover:bg-gray-400 hover:bg-opacity-25"
                        onClick={() => handleLinkClick("ListPosts")}
                      >
                        List Posts
                      </Link>
                    )}
                    {canCreatePosts && (
                      <Link
                        to="/blogs/add"
                        className="flex items-center px-4 py-2 text-sm text-black hover:bg-gray-400 hover:bg-opacity-25"
                        onClick={() => handleLinkClick("CreatePosts")}
                      >
                        Create Posts
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Supply Chain Section */}
            {canViewSupplyChain && (
              <div>
                <div
                  className="flex justify-between items-center px-3 py-3 text-black hover:bg-gray-400 hover:bg-opacity-25"
                  onClick={() => toggleSubmenu("supplyChain")}
                >
                  <div className="flex">
                    <img src={assets.user_icon} alt="" />
                    <span className="px-3 text-sm font-medium">
                      Supply Chain
                    </span>
                  </div>
                  <img
                    src={assets.dropdown_icon}
                    alt="Dropdown Icon"
                    className={`transition-transform ${
                      openSubmenu === "supplyChain" ? "rotate-180" : ""
                    }`}
                  />
                </div>
                {openSubmenu === "supplyChain" && (
                  <div className="pl-8">
                    {canViewDrivers && (
                      <Link
                        to="/supply-chain/drivers"
                        className="flex items-center px-4 py-2 text-sm text-black hover:bg-gray-400 hover:bg-opacity-25"
                        onClick={() => handleLinkClick("ListDrivers")}
                      >
                        Drivers
                      </Link>
                    )}
                    {canViewShipments && (
                      <Link
                        to="/supply-chain/shipments"
                        className="flex items-center px-4 py-2 text-sm text-black hover:bg-gray-400 hover:bg-opacity-25"
                        onClick={() => handleLinkClick("ListShipments")}
                      >
                        Shipments
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Reports */}
            {canViewReports && (
              <Link
                to="/reports"
                className="flex justify-between items-center px-3 py-3 text-black hover:bg-gray-400 hover:bg-opacity-25"
              >
                <div className="flex">
                  <FontAwesomeIcon icon={faChartSimple} />
                  <span className="px-3 text-sm font-medium">Reports</span>
                </div>
                <img src={assets.dropdown_icon} alt="" />
              </Link>
            )}
          </div>

          {/* SETTINGS Section */}
          {(canViewLocation || canViewSettings) && (
            <>
              <p className="text-[#ADADAD] font-roboto text-[13px] font-extrabold leading-normal p-4">
                SETTINGS
              </p>

              <div className="flex flex-col flex-1 gap-2">
                {/* Location Section */}
                {canViewLocation && (
                  <div>
                    <div
                      className="flex justify-between items-center px-3 py-3 text-black hover:bg-gray-400 hover:bg-opacity-25"
                      onClick={() => toggleSubmenu("location")}
                    >
                      <div className="flex">
                        <img src={assets.location_icon} alt="" />
                        <span className="px-3 text-sm font-medium">
                          Location
                        </span>
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
                        {canViewCountries && (
                          <Link
                            to="/countries"
                            className="flex items-center px-4 py-2 text-sm text-black hover:bg-gray-400 hover:bg-opacity-25"
                            onClick={() => handleLinkClick("country")}
                          >
                            Country
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Settings */}
                {canViewSettings && (
                  <Link
                    to="/settings"
                    className="flex justify-start items-center px-3 py-3 text-black hover:bg-gray-400 hover:bg-opacity-25"
                  >
                    <div className="flex">
                      <img src={assets.settings_icon} alt="" />
                      <span className="px-3 text-sm font-medium">Settings</span>
                    </div>
                  </Link>
                )}

                {/* Public/Always Visible Links */}
                <a
                  href="#"
                  className="flex justify-start items-center px-3 py-3 text-black hover:bg-gray-400 hover:bg-opacity-25"
                >
                  <div className="flex">
                    <img src={assets.help_center_icon} alt="" />
                    <span className="px-3 text-sm font-medium">
                      Help Center
                    </span>
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
            </>
          )}
        </nav>
      </div>
    </div>
  );
};

export default SideBar;
