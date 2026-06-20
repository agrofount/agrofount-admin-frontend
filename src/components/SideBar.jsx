import {
  faBriefcase,
  faChartSimple,
  faCircleQuestion,
  faGear,
  faHouse,
  faLandmark,
  faListCheck,
  faNewspaper,
  faPlus,
  faReceipt,
  faRobot,
  faStore,
  faTruckFast,
  faUsers,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useContext, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { assets } from "../assets/assets";
import { ACTIONS, RESOURCES } from "../constants/permissions";
import { ShopContext } from "../context/ShopContext";
import { usePermission } from "./Hooks/usePermission";

const NavLink = ({ to, icon, label, badge, end = false, onClick }) => {
  const location = useLocation();
  const active =
    to === "/"
      ? location.pathname === "/" && label === "Dashboard"
      : location.pathname === to || (!end && location.pathname.startsWith(`${to}/`));

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex h-9 items-center gap-3 rounded-md px-3 text-[12px] font-medium transition ${
        active
          ? "bg-white/15 text-white shadow-[inset_3px_0_0_rgba(255,255,255,0.5)]"
          : "text-white/90 hover:bg-white/10"
      }`}
    >
      <FontAwesomeIcon icon={icon} className="w-4 text-white/95" />
      <span className="flex-1">{label}</span>
      {badge && (
        <span className="rounded-full bg-[#2bc06b] px-2 py-0.5 text-[10px] text-white">
          {badge}
        </span>
      )}
    </Link>
  );
};

const Section = ({ title, children }) => (
  <div className="mt-4">
    <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wide text-white/75">
      {title}
    </p>
    <div className="space-y-1">{children}</div>
  </div>
);

const SideBar = () => {
  const { sidebarVisible, closeSidebar } = useContext(ShopContext);
  const { hasPermission, isAdmin } = usePermission();

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
      creditFacility:
        isAdmin ||
        hasPermission(RESOURCES.CREDIT_FACILITY, ACTIONS.READ) ||
        hasPermission(RESOURCES.CREDIT_FACILITY, ACTIONS.MANAGE),
      supply:
        isAdmin ||
        hasPermission(RESOURCES.SUPPLY_CHAIN, ACTIONS.READ) ||
        hasPermission(RESOURCES.DRIVERS, ACTIONS.READ),
      careers: isAdmin || hasPermission(RESOURCES.CAREERS, ACTIONS.READ),
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
        className={`fixed inset-y-0 left-0 z-30 flex w-[260px] flex-col bg-gradient-to-b from-[#006638] via-[#006235] to-[#004e2b] px-3 py-4 text-white shadow-2xl transition-transform duration-200 ease-out md:sticky md:top-0 md:h-screen ${
          sidebarVisible ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="mb-5 flex items-center justify-between px-2">
          <img src={assets.agrofount_logo} className="w-32" alt="Agrofount" />
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={closeSidebar}
            className="grid h-9 w-9 place-items-center rounded-md text-white/90 hover:bg-white/10 md:hidden"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto pr-1">
          <Section title="Main">
            {can.dashboard && (
              <NavLink to="/" icon={faHouse} label="Dashboard" onClick={closeOnMobile} />
            )}
            {can.orders && <NavLink to="/orders" icon={faReceipt} label="Orders" onClick={closeOnMobile} />}
            {can.products && <NavLink to="/list-products" icon={faStore} label="Products" onClick={closeOnMobile} />}
            {can.users && <NavLink to="/users" icon={faUsers} label="Customers" onClick={closeOnMobile} />}
            {can.payments && <NavLink to="/payments" icon={faBriefcase} label="Payments" onClick={closeOnMobile} />}
              {can.reports && <NavLink to="/" icon={faChartSimple} label="Reports" onClick={closeOnMobile} />}
          </Section>

          <Section title="Reports">
            <NavLink to="/ayo-ai" icon={faRobot} label="Ayo AI Analytics" badge="New" onClick={closeOnMobile} />
          </Section>

          <Section title="Inventory & Operations">
            {can.suppliers && <NavLink to="/suppliers" icon={faBriefcase} label="Suppliers" onClick={closeOnMobile} />}
            {can.creditFacility && <NavLink to="/facility/requests" icon={faLandmark} label="Credit Facility" onClick={closeOnMobile} />}
            {can.supply && <NavLink to="/supply-chain/drivers" icon={faTruckFast} label="Supply Chain" onClick={closeOnMobile} />}
          </Section>

          {can.careers && (
            <Section title="Career">
              <NavLink to="/careers" icon={faBriefcase} label="Careers Overview" badge="New" end onClick={closeOnMobile} />
              <NavLink to="/careers/jobs" icon={faListCheck} label="Job Openings" onClick={closeOnMobile} />
              <NavLink to="/careers/applications" icon={faUsers} label="Applications" onClick={closeOnMobile} />
              <NavLink to="/careers/create" icon={faPlus} label="Create Job" onClick={closeOnMobile} />
            </Section>
          )}

          <Section title="Content">
            {can.blog && <NavLink to="/blogs" icon={faNewspaper} label="Blog" onClick={closeOnMobile} />}
          </Section>

          <Section title="Settings">
            {can.roles && <NavLink to="/roles" icon={faUsers} label="Users & Roles" onClick={closeOnMobile} />}
            <NavLink to="/countries" icon={faGear} label="Settings" onClick={closeOnMobile} />
            <NavLink to="/" icon={faCircleQuestion} label="Help Center" onClick={closeOnMobile} />
          </Section>
        </nav>

        <Link
          to="/"
          onClick={closeOnMobile}
          className="mt-4 flex items-center justify-center gap-2 rounded-md border border-white/25 bg-white/5 px-3 py-2.5 text-xs font-medium text-white"
        >
          <FontAwesomeIcon icon={faCircleQuestion} />
          Need Help?
        </Link>
      </aside>
    </>
  );
};

export default SideBar;
