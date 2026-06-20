import { useContext } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ShopContext } from "../../context/ShopContext";
import LoadingFallback from "../common/LoadingFallback";

const RequireAuth = () => {
  const { token, authLoading, authInitialized } = useContext(ShopContext);
  const location = useLocation();

  if (authLoading && !authInitialized) {
    return <LoadingFallback label="Checking session..." />;
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default RequireAuth;
