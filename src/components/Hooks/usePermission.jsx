// hooks/usePermission.js
import { useContext, useMemo } from "react";
import { ShopContext } from "../../context/ShopContext";

// Define your permission constants based on resources and actions
export const PERMISSIONS = {
  // Dashboard permissions
  VIEW_SALES_CHART: { resource: "sales", action: "view_chart" },
  VIEW_INCOME_CHART: { resource: "income", action: "view_chart" },
  VIEW_VISITOR_CHART: { resource: "visitors", action: "view_chart" },

  // Order permissions
  VIEW_ORDERS: { resource: "orders", action: "read" },
  UPDATE_ORDERS: { resource: "orders", action: "update" },

  // User permissions
  VIEW_USERS: { resource: "users", action: "read" },
  MANAGE_USERS: { resource: "users", action: "manage" },

  // Product permissions
  VIEW_PRODUCTS: { resource: "products", action: "read" },
  MANAGE_PRODUCTS: { resource: "products", action: "manage" },

  // Payment permissions
  VIEW_PAYMENTS: { resource: "payments", action: "read" },
  UPDATE_PAYMENTS: { resource: "payments", action: "update" },

  // Location permissions
  VIEW_LOCATIONS: { resource: "locations", action: "read" },
  MANAGE_LOCATIONS: { resource: "locations", action: "manage" },

  // Credit permissions
  VIEW_CREDIT: { resource: "credit", action: "read" },
  MANAGE_CREDIT: { resource: "credit", action: "manage" },

  // Blog permissions
  VIEW_BLOG: { resource: "blogPosts", action: "read" },
  MANAGE_BLOG: { resource: "blogPosts", action: "manage" },

  // Shipment permissions
  VIEW_SHIPMENTS: { resource: "shipments", action: "read" },
  MANAGE_SHIPMENTS: { resource: "shipments", action: "manage" },

  // Driver permissions
  VIEW_DRIVERS: { resource: "drivers", action: "read" },
  MANAGE_DRIVERS: { resource: "drivers", action: "manage" },

  // SEO permissions
  VIEW_SEO: { resource: "SEO", action: "read" },
  MANAGE_SEO: { resource: "SEO", action: "manage" },

  // Cart permissions
  MANAGE_CARTS: { resource: "carts", action: "manage" },

  // Notification permissions
  SEND_NOTIFICATIONS: { resource: "notifications", action: "create" },

  // Price permissions
  SEND_PRICE_UPDATES: { resource: "price", action: "send" },
};

export const usePermission = () => {
  const { user } = useContext(ShopContext);

  // Flatten all permissions from all roles
  const userPermissions = useMemo(() => {
    if (!user || !user.role || !Array.isArray(user.role)) {
      return [];
    }

    // Extract all permissions from all roles
    const permissions = user.role.flatMap(
      (role) =>
        role.permissions?.map((perm) => ({
          resource: perm.resource,
          actions: perm.actions || [],
        })) || [],
    );

    return permissions;
  }, [user]);

  // Check if user has a specific permission
  const hasPermission = (resource, action) => {
    // If no user, no permissions
    if (!user) return false;

    // Check if user has any role with the required permission
    return userPermissions.some(
      (perm) => perm.resource === resource && perm.actions.includes(action),
    );
  };

  // Check if user has any of the given permissions
  const hasAnyPermission = (permissionList) => {
    return permissionList.some(({ resource, action }) =>
      hasPermission(resource, action),
    );
  };

  // Check if user has all of the given permissions
  const hasAllPermissions = (permissionList) => {
    return permissionList.every(({ resource, action }) =>
      hasPermission(resource, action),
    );
  };

  // Check if user has manage access to a resource (usually implies all actions)
  const canManage = (resource) => {
    return (
      hasPermission(resource, "manage") ||
      (hasPermission(resource, "create") &&
        hasPermission(resource, "update") &&
        hasPermission(resource, "delete"))
    );
  };

  // Get all actions user has for a specific resource
  const getActionsForResource = (resource) => {
    const permissions = userPermissions.filter(
      (perm) => perm.resource === resource,
    );
    return permissions.flatMap((perm) => perm.actions);
  };

  // Check if user is admin (has admin role)
  const isAdmin = useMemo(() => {
    return (
      user?.role?.some((r) => r.name === "Admin" || r.name === "Super Admin") ||
      false
    );
  }, [user]);

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canManage,
    getActionsForResource,
    isAdmin,
    user,
    userPermissions,
  };
};
