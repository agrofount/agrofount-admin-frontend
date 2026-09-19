import {
  faBriefcase,
  faBox,
  faChartLine,
  faChartSimple,
  faChevronLeft,
  faChevronRight,
  faCircleQuestion,
  faGear,
  faHandshake,
  faHouse,
  faLandmark,
  faListCheck,
  faBell,
  faNewspaper,
  faPlus,
  faReceipt,
  faRobot,
  faBookOpen,
  faStore,
  faTruckFast,
  faUserPlus,
  faUsers,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useContext, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { assets } from "../assets/assets";
import { ACTIONS, RESOURCES } from "../constants/permissions";
import { ShopContext } from "../context/ShopContext";
import { usePermission } from "./Hooks/usePermission";

const NavLink = ({ to, icon, label, badge, end = false, onClick, collapsed = false }) => {
  const location = useLocation();
  const active =
    to === "/"
      ? location.pathname === "/" && label === "Dashboard"
      : location.pathname === to || (!end && location.pathname.startsWith(`${to}/`));

  return (
    <Link
      to={to}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`flex h-9 items-center rounded-md text-[12px] font-medium transition ${
        collapsed ? "justify-center px-0" : "gap-3 px-3"
      } ${
        active
          ? "bg-white/15 text-white shadow-[inset_3px_0_0_rgba(255,255,255,0.5)]"
          : "text-white/90 hover:bg-white/10"
      }`}
    >
      <FontAwesomeIcon icon={icon} className="w-4 text-white/95" />
      <span className={collapsed ? "sr-only" : "min-w-0 flex-1 truncate"}>{label}</span>
      {badge && !collapsed && (
        <span className="rounded-full bg-[#2bc06b] px-2 py-0.5 text-[10px] text-white">
          {badge}
        </span>
      )}
    </Link>
  );
};

const Section = ({ title, children, collapsed = false }) => (
  <div className={collapsed ? "mt-3" : "mt-4"}>
    <p className={`mb-2 px-3 text-[10px] font-semibold uppercase tracking-wide text-white/75 ${collapsed ? "sr-only" : ""}`}>
      {title}
    </p>
    <div className="space-y-1">{children}</div>
  </div>
);

const SideBar = () => {
  const { sidebarVisible, closeSidebar } = useContext(ShopContext);
  const { hasPermission, isAdmin } = usePermission();
  const [collapsed, setCollapsed] = useState(false);

  const can = useMemo(
    () => ({
      dashboard: isAdmin || hasPermission(RESOURCES.DASHBOARD, ACTIONS.READ),
      products:
        isAdmin ||
        hasPermission(RESOURCES.PRODUCTS, ACTIONS.READ) ||
        hasPermission(RESOURCES.PRODUCT_LOCATIONS, ACTIONS.READ),
      orders: isAdmin || hasPermission(RESOURCES.ORDERS, ACTIONS.READ),
      users: isAdmin || hasPermission(RESOURCES.USERS, ACTIONS.READ),
      payments: isAdmin || hasPermission(RESOURCES.PAYMENTS, ACTIONS.READ),
      reports: isAdmin || hasPermission(RESOURCES.REPORTS, ACTIONS.READ),
      suppliers: isAdmin || hasPermission(RESOURCES.SUPPLIERS, ACTIONS.READ),
      logisticsPricing: isAdmin || hasPermission(RESOURCES.LOGISTICS_PRICING, ACTIONS.READ),
      creditFacility:
        isAdmin ||
        hasPermission(RESOURCES.CREDIT_FACILITY, ACTIONS.READ) ||
        hasPermission(RESOURCES.CREDIT_FACILITY, ACTIONS.MANAGE),
      supply:
        isAdmin ||
        hasPermission(RESOURCES.SUPPLY_CHAIN, ACTIONS.READ) ||
        hasPermission(RESOURCES.DRIVERS, ACTIONS.READ),
      leads: isAdmin || hasPermission(RESOURCES.LEADS, ACTIONS.READ),
      careers: isAdmin || hasPermission(RESOURCES.CAREERS, ACTIONS.READ),
      aiAnalytics:
        isAdmin ||
        hasPermission(RESOURCES.ANALYTICS, ACTIONS.READ) ||
        hasPermission(RESOURCES.AI_CHAT, ACTIONS.READ),
      blog: isAdmin || hasPermission(RESOURCES.BLOG_POSTS, ACTIONS.READ),
      roles:
        isAdmin ||
        hasPermission(RESOURCES.USERS, ACTIONS.READ) ||
        hasPermission(RESOURCES.ROLES, ACTIONS.READ),
    }),
    [hasPermission, isAdmin]
  );

  const closeOnMobile = () => {
    if (window.innerWidth < 768) closeSidebar();
  };

  return (
    <>
      {sidebarVisible && (
        <button
          type="button"
          aria-label="Close sidebar backdrop"
          onClick={closeSidebar}
          className="fixed inset-0 z-20 bg-black/35 md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-[260px] flex-col bg-gradient-to-b from-[#006638] via-[#006235] to-[#004e2b] px-3 py-4 text-white shadow-2xl transition-[width,transform] duration-200 ease-out md:sticky md:top-0 md:h-screen ${
          sidebarVisible ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } ${collapsed ? "md:w-[76px]" : "md:w-[260px]"}`}
      >
        <div className={`mb-5 flex items-center px-2 ${collapsed ? "md:justify-center" : "justify-between"}`}>
          <Link to="/" className={collapsed ? "hidden md:block" : "hidden"} aria-label="Agrofount dashboard">
            <span className="block h-12 w-12 overflow-hidden">
              <img src={assets.agrofount_logo} className="h-12 w-32 max-w-none object-contain object-left" alt="Agrofount" />
            </span>
          </Link>
          <Link to="/" className={collapsed ? "block md:hidden" : "block"} aria-label="Agrofount dashboard">
            <img src={assets.agrofount_logo} className="w-32" alt="Agrofount" />
          </Link>
          <button
            type="button"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setCollapsed((current) => !current)}
            className="hidden h-9 w-9 place-items-center rounded-md text-white/90 hover:bg-white/10 md:grid"
          >
            <FontAwesomeIcon icon={collapsed ? faChevronRight : faChevronLeft} />
          </button>
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={closeSidebar}
            className="grid h-9 w-9 place-items-center rounded-md text-white/90 hover:bg-white/10 md:hidden"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <nav className={`min-h-0 flex-1 overflow-y-auto ${collapsed ? "pr-0" : "pr-1"}`}>
          <Section title="Main" collapsed={collapsed}>
            {can.dashboard && (
              <NavLink to="/" icon={faHouse} label="Dashboard" onClick={closeOnMobile} collapsed={collapsed} />
            )}
            {can.orders && <NavLink to="/orders" icon={faReceipt} label="Orders" onClick={closeOnMobile} collapsed={collapsed} />}
            {can.products && <NavLink to="/list-products" icon={faStore} label="Products" onClick={closeOnMobile} collapsed={collapsed} />}
            {can.products && <NavLink to="/seller-interests" icon={faHandshake} label="Seller Interests" onClick={closeOnMobile} collapsed={collapsed} />}
            {can.users && <NavLink to="/users" icon={faUsers} label="Customers" onClick={closeOnMobile} collapsed={collapsed} />}
            {can.leads && <NavLink to="/leads" icon={faUserPlus} label="Leads" onClick={closeOnMobile} collapsed={collapsed} />}
            {can.payments && <NavLink to="/payments" icon={faBriefcase} label="Payments" onClick={closeOnMobile} collapsed={collapsed} />}
            {can.reports && <NavLink to="/reports" icon={faChartSimple} label="Reports" onClick={closeOnMobile} collapsed={collapsed} />}
          </Section>

          <Section title="Reports" collapsed={collapsed}>
            <NavLink to="/sales-reports" icon={faChartLine} label="Sales Reports" onClick={closeOnMobile} collapsed={collapsed} />
            <NavLink to="/customer-reports" icon={faUsers} label="Customer Reports" onClick={closeOnMobile} collapsed={collapsed} />
            <NavLink to="/inventory-reports" icon={faBox} label="Inventory Reports" onClick={closeOnMobile} collapsed={collapsed} />
            <NavLink to="/career-reports" icon={faBriefcase} label="Career Reports" onClick={closeOnMobile} collapsed={collapsed} />
            {can.aiAnalytics && <NavLink to="/ayo-ai" icon={faRobot} label="Ayo AI Analytics" badge="New" end onClick={closeOnMobile} collapsed={collapsed} />}
            {can.aiAnalytics && <NavLink to="/ayo-ai/knowledge" icon={faBookOpen} label="Ayo Knowledge Base" badge="New" onClick={closeOnMobile} collapsed={collapsed} />}
          </Section>

          <Section title="Inventory & Operations" collapsed={collapsed}>
            {can.logisticsPricing && <NavLink to="/logistics-pricing" icon={faTruckFast} label="Delivery Pricing" onClick={closeOnMobile} collapsed={collapsed} />}
            {can.suppliers && <NavLink to="/suppliers" icon={faBriefcase} label="Suppliers" onClick={closeOnMobile} collapsed={collapsed} />}
            {can.creditFacility && <NavLink to="/facility/requests" icon={faLandmark} label="Credit Facility" onClick={closeOnMobile} collapsed={collapsed} />}
            {can.supply && <NavLink to="/supply-chain/drivers" icon={faTruckFast} label="Supply Chain" onClick={closeOnMobile} collapsed={collapsed} />}
          </Section>

          {can.careers && (
            <Section title="Career" collapsed={collapsed}>
              <NavLink to="/careers" icon={faBriefcase} label="Careers Overview" badge="New" end onClick={closeOnMobile} collapsed={collapsed} />
              <NavLink to="/careers/jobs" icon={faListCheck} label="Job Openings" onClick={closeOnMobile} collapsed={collapsed} />
              <NavLink to="/careers/applications" icon={faUsers} label="Applications" onClick={closeOnMobile} collapsed={collapsed} />
              <NavLink to="/careers/create" icon={faPlus} label="Create Job" onClick={closeOnMobile} collapsed={collapsed} />
            </Section>
          )}

          <Section title="Content" collapsed={collapsed}>
            {can.blog && <NavLink to="/blogs" icon={faNewspaper} label="Blog" onClick={closeOnMobile} collapsed={collapsed} />}
            <NavLink to="/notifications" icon={faBell} label="Notifications" onClick={closeOnMobile} collapsed={collapsed} />
          </Section>

          <Section title="Settings" collapsed={collapsed}>
            {can.roles && <NavLink to="/roles" icon={faUsers} label="Users & Roles" onClick={closeOnMobile} collapsed={collapsed} />}
            <NavLink to="/settings" icon={faGear} label="Settings" onClick={closeOnMobile} collapsed={collapsed} />
            <NavLink to="/help-center" icon={faCircleQuestion} label="Help Center" onClick={closeOnMobile} collapsed={collapsed} />
          </Section>
        </nav>

        <Link
          to="/help-center"
          onClick={closeOnMobile}
          title={collapsed ? "Need Help?" : undefined}
          className={`mt-4 flex items-center justify-center rounded-md border border-white/25 bg-white/5 text-xs font-medium text-white ${collapsed ? "h-10 px-0" : "gap-2 px-3 py-2.5"}`}
        >
          <FontAwesomeIcon icon={faCircleQuestion} />
          <span className={collapsed ? "sr-only" : ""}>Need Help?</span>
        </Link>
      </aside>
    </>
  );
};

export default SideBar;
