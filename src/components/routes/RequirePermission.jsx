import { useContext } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ShopContext } from "../../context/ShopContext";
import { hasPermissionFor } from "../../lib/permissions";
import { PageSkeletonLoader } from "../common/LoadingStates";

const RequirePermission = ({ resource, action }) => {
  const { user, authLoading } = useContext(ShopContext);
  const location = useLocation();

  if (authLoading && !user) {
    return <PageSkeletonLoader />;
  }

  if (!hasPermissionFor(user, resource, action)) {
    return <Navigate to="/access-denied" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default RequirePermission;
