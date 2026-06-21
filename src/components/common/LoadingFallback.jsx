import { useLocation } from "react-router-dom";
import {
  AdminPageSkeleton,
  FullPageAppLoader,
} from "./LoadingStates";

const LoadingFallback = ({ label = "Loading..." }) => {
  const { pathname } = useLocation();
  const isAuthScreen = pathname === "/login" || pathname === "/verify-email";
  const isSessionCheck = /session|permission|auth/i.test(label);

  if (isAuthScreen || isSessionCheck) {
    return (
      <FullPageAppLoader
        title={isSessionCheck ? "Loading Agrofount Admin..." : label}
        subtitle={isSessionCheck ? "Preparing your workspace" : "Please wait"}
      />
    );
  }

  return <AdminPageSkeleton label={label} />;
};

export default LoadingFallback;
