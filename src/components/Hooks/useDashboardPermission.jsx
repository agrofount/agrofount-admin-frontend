// hooks/useDashboardPermissions.js
import { usePermission } from "./usePermission";

// Dashboard-specific permission checks
export const useDashboardPermissions = () => {
  const { hasPermission, isAdmin } = usePermission();

  // Dashboard widget permissions
  const canViewSalesChart = isAdmin || hasPermission("sales", "read");
  const canViewIncomeChart = isAdmin || hasPermission("income", "read");
  const canViewVisitorChart = isAdmin || hasPermission("visitors", "read");

  // Order section permissions
  const canViewOrders = isAdmin || hasPermission("orders", "read");
  const canUpdateOrders = isAdmin || hasPermission("orders", "update");

  // Customer section permissions
  const canViewCustomers = isAdmin || hasPermission("users", "read");
  const canManageCustomers = isAdmin || hasPermission("users", "manage");

  // Product section permissions
  const canViewProducts = isAdmin || hasPermission("products", "read");
  const canManageProducts = isAdmin || hasPermission("products", "manage");

  // States/Regions sales permissions
  const canViewStatesSales =
    isAdmin ||
    hasPermission("locations", "read") ||
    hasPermission("shipments", "read");

  // Comments/Reviews permissions
  const canViewComments = isAdmin || hasPermission("blogPosts", "read");
  const canModerateComments = isAdmin || hasPermission("blogPosts", "manage");

  // Category permissions
  const canViewCategories = isAdmin || hasPermission("products", "read");

  // Payment permissions
  const canViewPayments = isAdmin || hasPermission("payments", "read");
  const canProcessPayments = isAdmin || hasPermission("payments", "update");

  // Credit facility permissions
  const canViewCredit = isAdmin || hasPermission("credit", "read");
  const canManageCredit = isAdmin || hasPermission("credit", "manage");

  // Shipment permissions
  const canViewShipments = isAdmin || hasPermission("shipments", "read");
  const canManageShipments = isAdmin || hasPermission("shipments", "manage");

  // Driver permissions
  const canViewDrivers = isAdmin || hasPermission("drivers", "read");
  const canManageDrivers = isAdmin || hasPermission("drivers", "manage");

  return {
    // Dashboard charts
    canViewSalesChart,
    canViewIncomeChart,
    canViewVisitorChart,

    // Orders
    canViewOrders,
    canUpdateOrders,

    // Customers
    canViewCustomers,
    canManageCustomers,

    // Products
    canViewProducts,
    canManageProducts,

    // States/Regions
    canViewStatesSales,

    // Comments
    canViewComments,
    canModerateComments,

    // Categories
    canViewCategories,

    // Payments
    canViewPayments,
    canProcessPayments,

    // Credit
    canViewCredit,
    canManageCredit,

    // Shipments
    canViewShipments,
    canManageShipments,

    // Drivers
    canViewDrivers,
    canManageDrivers,

    // Helper to check if user has any dashboard access
    hasAnyDashboardAccess:
      canViewSalesChart ||
      canViewIncomeChart ||
      canViewVisitorChart ||
      canViewOrders ||
      canViewCustomers ||
      canViewProducts ||
      canViewStatesSales ||
      canViewComments ||
      canViewCategories,
  };
};
