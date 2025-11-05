import { ToastContainer } from "react-toastify";
import { Outlet, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import SideBar from "./components/SideBar";
import Navbar from "./components/Navbar";
import { Dashboard } from "./components/Dashboard";
import ListProducts from "./components/Products/list";
import TopNav from "./components/TopNav";
import AddProducts from "./components/Products/AddProductLocation";
import ProductDetail from "./components/Products/ProductDetail";
import ProductUpdate from "./components/Products/ProductUpdate";
import { ListOrders } from "./components/Orders/ListOrders";
import OrderDetail from "./components/Orders/OrderDetail";
import TrackOrder from "./components/Orders/TrackOrder";
import ListPayments from "./components/Payments/ListPayments";
import ListCountries from "./components/Countries/ListCountries";
import EditCountries from "./components/Countries/EditCountries";
import AddCountry from "./components/Countries/AddCountry";
import ListStates from "./components/States/ListStates";
import AddState from "./components/States/AddStates";
import EditState from "./components/States/EditState";
import ListCities from "./components/Cities/ListCities";
import AddCity from "./components/Cities/AddCity";
import EditCity from "./components/Cities/EditCity";
import ListUsers from "./components/Users/ListUsers";
import ListAdmins from "./components/Admin/ListAdmins";
import InviteAdmin from "./components/Admin/InviteAdmin";
import VerifyEmail from "./pages/VerifyEmail";
import ListRoles from "./components/Roles/ListRoles";
import AddRole from "./components/Roles/AddRole";
import EditRole from "./components/Roles/EditRoles";
import EditAdmin from "./components/Admin/EditAdmin";
import { ListPost } from "./components/Blog/ListPost";
import AddBlogPost from "./components/Blog/AddBlogPost";
import EditBlogPost from "./components/Blog/EditBlogPost";
import CreditFacilityRequests from "./components/CreditFacility/CreditFacilityRequests";
import ListDrivers from "./components/SupplyChain/Driver/Drivers";
import ListShipments from "./components/SupplyChain/Shipments/shipments";
import ListCarts from "./components/Cart/ListCarts";

// Layout component for shared structure (TopNav, SideBar, Navbar)
function Layout() {
  return (
    <div>
      <TopNav />
      <div className="flex bg-white">
        {/* Sidebar */}
        <SideBar />

        {/* Main content */}
        <div className="flex flex-col flex-1 bg-[#EEEEEE]">
          <Navbar />
          <div className="p-4">
            {/* Outlet renders the nested routes */}
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <div>
      <ToastContainer />
      <Routes>
        {/* Route for login (no layout) */}
        <Route path="/login" element={<Login />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* Routes with shared layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/add-products" element={<AddProducts />} />
          <Route path="/countries" element={<ListCountries />} />
          <Route path="/countries/add" element={<AddCountry />} />
          <Route
            path="/countries/:countryId/edit"
            element={<EditCountries />}
          />

          <Route path="/states" element={<ListStates />} />
          <Route path="/states/add" element={<AddState />} />
          <Route path="/states/:stateId/edit" element={<EditState />} />

          <Route path="/list-products" element={<ListProducts />} />
          <Route path="/list-products/:slug" element={<ProductDetail />} />
          <Route path="/list-products/:slug/edit" element={<ProductUpdate />} />

          <Route path="/cities" element={<ListCities />} />
          <Route path="/cities/add" element={<AddCity />} />
          <Route path="/cities/:cityId/edit" element={<EditCity />} />

          <Route path="/orders" element={<ListOrders />} />
          <Route path="/orders/:orderId" element={<OrderDetail />} />
          <Route path="/orders/:orderId/track" element={<TrackOrder />} />

          <Route path="/payments" element={<ListPayments />} />

          <Route path="/admins" element={<ListAdmins />} />
          <Route path="/admins/add" element={<InviteAdmin />} />
          <Route path="/admins/:adminId/edit" element={<EditAdmin />} />

          <Route path="/users" element={<ListUsers />} />

          <Route path="/roles" element={<ListRoles />} />
          <Route path="/roles/add" element={<AddRole />} />
          <Route path="/roles/:roleId/edit" element={<EditRole />} />

          <Route path="/blogs" element={<ListPost />} />
          <Route path="/blogs/add" element={<AddBlogPost />} />
          <Route path="/blogs/:slug/edit" element={<EditBlogPost />} />

          <Route path="/carts" element={<ListCarts />} />

          {/* Add more routes as needed */}
          <Route
            path="/facility/requests"
            element={<CreditFacilityRequests />}
          />
          <Route
            path="/facility/requests/:requestId"
            element={<div>Credit Facility Request Detail</div>}
          />
          <Route
            path="/facility/requests/:requestId/edit"
            element={<div>Edit Credit Facility Request</div>}
          />

          <Route path="/supply-chain/drivers" element={<ListDrivers />} />
          <Route path="/supply-chain/shipments" element={<ListShipments />} />
          {/* Add more routes here */}
        </Route>
      </Routes>
    </div>
  );
}

export default App;
