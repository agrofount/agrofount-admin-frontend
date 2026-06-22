import { ACTIONS } from "../constants/permissions.js";

export const normalizeRoles = (user) => {
  const roles = user?.roles || user?.role;
  if (!roles) return [];
  return Array.isArray(roles) ? roles : [roles];
};

export const getUserPermissions = (user) =>
  normalizeRoles(user).flatMap(
    (role) =>
      role.permissions?.map((permission) => ({
        resource: permission.resource,
        actions: permission.actions || [],
      })) || [],
  );

export const isSystemAdmin = (user) =>
  String(user?.principalType || "").toLowerCase() === "admin" &&
  String(user?.userType || "").toLowerCase() === "system";

const normalizeRoleName = (role) =>
  String(role?.name || role || "")
    .toLowerCase()
    .replace(/[\s_-]/g, "");

export const isSuperUser = (user) =>
  isSystemAdmin(user) ||
  normalizeRoles(user).some((role) =>
    ["admin", "superadmin"].includes(normalizeRoleName(role)),
  );

export const hasPermissionFor = (user, resource, action) => {
  if (!user || !resource || !action) return false;
  if (isSuperUser(user)) return true;

  return getUserPermissions(user).some(
    (permission) =>
      permission.resource === resource &&
      (permission.actions.includes(action) ||
        permission.actions.includes(ACTIONS.MANAGE)),
  );
};

export const hasAnyPermissionFor = (user, permissions = []) =>
  permissions.some(({ resource, action }) =>
    hasPermissionFor(user, resource, action),
  );

export const requirePermission = (user, resource, action) => {
  if (!hasPermissionFor(user, resource, action)) {
    throw new Error("You do not have permission to perform this action.");
  }
};
