import { lazy, Suspense } from "react";
import { ToastContainer } from "react-toastify";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import SideBar from "./components/SideBar";
import Navbar from "./components/Navbar";
import ErrorBoundary from "./components/common/ErrorBoundary";
import LoadingFallback from "./components/common/LoadingFallback";
import { PageSkeletonLoader } from "./components/common/LoadingStates";
import RequireAuth from "./components/routes/RequireAuth";
import RequirePermission from "./components/routes/RequirePermission";
import { routePermissions } from "./components/routes/routePermissions";

const Login = lazy(() => import("./pages/Login"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const AccessDenied = lazy(() => import("./pages/AccessDenied"));
const Dashboard = lazy(() =>
  import("./components/Dashboard").then((module) => ({
    default: module.Dashboard,
  }))
);
const ListProducts = lazy(() => import("./components/Products/list"));
const AddProducts = lazy(() => import("./components/Products/AddProductLocation"));
const ProductDetail = lazy(() => import("./components/Products/ProductDetail"));
const ProductUpdate = lazy(() => import("./components/Products/ProductUpdate"));
const ListOrders = lazy(() =>
  import("./components/Orders/ListOrders").then((module) => ({
    default: module.ListOrders,
  }))
);
const OrderDetail = lazy(() => import("./components/Orders/OrderDetail"));
const TrackOrder = lazy(() => import("./components/Orders/TrackOrder"));
const ListPayments = lazy(() => import("./components/Payments/ListPayments"));
const ListCountries = lazy(() => import("./components/Countries/ListCountries"));
const EditCountries = lazy(() =>
  import("./components/Countries/EditCountries")
);
const AddCountry = lazy(() => import("./components/Countries/AddCountry"));
const ListStates = lazy(() => import("./components/States/ListStates"));
const AddState = lazy(() => import("./components/States/AddStates"));
const EditState = lazy(() => import("./components/States/EditState"));
const ListCities = lazy(() => import("./components/Cities/ListCities"));
const AddCity = lazy(() => import("./components/Cities/AddCity"));
const EditCity = lazy(() => import("./components/Cities/EditCity"));
const ListUsers = lazy(() => import("./components/Users/ListUsers"));
const ListAdmins = lazy(() => import("./components/Admin/ListAdmins"));
const InviteAdmin = lazy(() => import("./components/Admin/InviteAdmin"));
const ListRoles = lazy(() => import("./components/Roles/ListRoles"));
const AddRole = lazy(() => import("./components/Roles/AddRole"));
const EditRole = lazy(() => import("./components/Roles/EditRoles"));
const EditAdmin = lazy(() => import("./components/Admin/EditAdmin"));
const ListPost = lazy(() =>
  import("./components/Blog/ListPost").then((module) => ({
    default: module.ListPost,
  }))
);
const AddBlogPost = lazy(() => import("./components/Blog/AddBlogPost"));
const EditBlogPost = lazy(() => import("./components/Blog/EditBlogPost"));
const CreditFacilityRequests = lazy(() =>
  import("./components/CreditFacility/CreditFacilityRequests")
);
const SuppliersOverview = lazy(() => import("./components/Suppliers/SuppliersOverview"));
const ListDrivers = lazy(() => import("./components/SupplyChain/Driver/Drivers"));
const ListShipments = lazy(() =>
  import("./components/SupplyChain/Shipments/shipments")
);
const ListCarts = lazy(() => import("./components/Cart/ListCarts"));
const AyoAIAnalytics = lazy(() => import("./components/AyoAI/AyoAIAnalytics"));
const AyoKnowledgeBase = lazy(() =>
  import("./components/AyoAI/AyoKnowledgeBase")
);
const Settings = lazy(() => import("./components/Settings/Settings"));
const CareersOverview = lazy(() => import("./components/Careers/CareersOverview"));
const JobOpenings = lazy(() => import("./components/Careers/JobOpenings"));
const JobDetail = lazy(() => import("./components/Careers/JobDetail"));
const Applications = lazy(() => import("./components/Careers/Applications"));
const CreateJob = lazy(() => import("./components/Careers/CreateJob"));
const Notifications = lazy(() => import("./components/Notifications/Notifications"));
const ListLeads = lazy(() => import("./components/Leads/ListLeads"));

const adminRoutes = [
  { path: "/", element: <Dashboard /> },
  { path: "/add-products", element: <AddProducts /> },
  { path: "/countries", element: <ListCountries /> },
  { path: "/countries/add", element: <AddCountry /> },
  { path: "/countries/:countryId/edit", element: <EditCountries /> },
  { path: "/states", element: <ListStates /> },
  { path: "/states/add", element: <AddState /> },
  { path: "/states/:stateId/edit", element: <EditState /> },
  { path: "/list-products", element: <ListProducts /> },
  { path: "/list-products/:slug", element: <ProductDetail /> },
  { path: "/list-products/:slug/edit", element: <ProductUpdate /> },
  { path: "/cities", element: <ListCities /> },
  { path: "/cities/add", element: <AddCity /> },
  { path: "/cities/:cityId/edit", element: <EditCity /> },
  { path: "/orders", element: <ListOrders /> },
  { path: "/orders/:orderId", element: <OrderDetail /> },
  { path: "/orders/:orderId/track", element: <TrackOrder /> },
  { path: "/payments", element: <ListPayments /> },
  { path: "/admins", element: <ListAdmins /> },
  { path: "/admins/add", element: <InviteAdmin /> },
  { path: "/admins/:adminId/edit", element: <EditAdmin /> },
  { path: "/users", element: <ListUsers /> },
  { path: "/roles", element: <ListRoles /> },
  { path: "/roles/add", element: <AddRole /> },
  { path: "/roles/:roleId/edit", element: <EditRole /> },
  { path: "/blogs", element: <ListPost /> },
  { path: "/blogs/add", element: <AddBlogPost /> },
  { path: "/blogs/:slug/edit", element: <EditBlogPost /> },
  { path: "/carts", element: <ListCarts /> },
  { path: "/suppliers", element: <SuppliersOverview /> },
  { path: "/facility/requests", element: <CreditFacilityRequests /> },
  {
    path: "/facility/requests/:requestId",
    element: <div>Credit Facility Request Detail</div>,
  },
  {
    path: "/facility/requests/:requestId/edit",
    element: <div>Edit Credit Facility Request</div>,
  },
  { path: "/supply-chain/drivers", element: <ListDrivers /> },
  { path: "/supply-chain/shipments", element: <ListShipments /> },
  { path: "/careers", element: <CareersOverview /> },
  { path: "/careers/jobs", element: <JobOpenings /> },
  { path: "/careers/jobs/:jobId", element: <JobDetail /> },
  { path: "/careers/jobs/:jobId/edit", element: <CreateJob /> },
  { path: "/careers/applications", element: <Applications /> },
  { path: "/careers/create", element: <CreateJob /> },
  { path: "/leads", element: <ListLeads /> },
  { path: "/notifications", element: <Notifications /> },
  { path: "/ayo-ai", element: <AyoAIAnalytics /> },
  { path: "/ayo-ai/knowledge", element: <AyoKnowledgeBase /> },
  { path: "/settings", element: <Settings /> },
];

function Layout() {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen bg-[#f7f8fb]">
      <div className="flex">
        <SideBar />
        <div className="flex min-w-0 flex-1 flex-col bg-[#f7f8fb]">
          <Navbar />
          <div className="p-3 md:p-6">
            <Suspense key={pathname} fallback={<PageSkeletonLoader />}>
              <Outlet />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

const renderProtectedRoute = (route) => {
  const permission = routePermissions[route.path];

  if (!permission) {
    return <Route key={route.path} path={route.path} element={route.element} />;
  }

  return (
    <Route
      key={route.path}
      element={
        <RequirePermission
          resource={permission.resource}
          action={permission.action}
        />
      }
    >
      <Route path={route.path} element={route.element} />
    </Route>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <ToastContainer />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          <Route element={<RequireAuth />}>
            <Route path="/access-denied" element={<AccessDenied />} />
            <Route element={<Layout />}>
              {adminRoutes.map(renderProtectedRoute)}
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
