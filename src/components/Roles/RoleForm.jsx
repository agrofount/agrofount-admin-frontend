import {
  faChevronRight,
  faFileLines,
  faFloppyDisk,
  faGear,
  faMagnifyingGlass,
  faRotateLeft,
  faShieldHalved,
  faShuffle,
  faUserShield,
  faUsers,
  faUsersGear,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { StatusCodes } from "http-status-codes";
import { Fragment, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { RESOURCES } from "../../constants/permissions";
import { ShopContext } from "../../context/ShopContext";
import { apiClient } from "../../lib/apiClient";
import { LoadingButtonContent } from "../common/LoadingStates";

const PERMISSION_KEY_SEPARATOR = "::";

const PRIMARY_ACTIONS = [
  { key: "create", label: "Create" },
  { key: "read", label: "Read" },
  { key: "update", label: "Update" },
  { key: "delete", label: "Delete" },
];

const ALLOWED_RESOURCES = Object.values(RESOURCES);
const RESOURCE_LOOKUP = ALLOWED_RESOURCES.reduce((acc, resource) => {
  acc[resource] = resource;
  acc[resource.toLowerCase()] = resource;
  acc[resource.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase()] = resource;
  acc[resource.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()] = resource;
  return acc;
}, {});

const RESOURCE_ALIASES = {
  audit_logs: RESOURCES.AUDIT_LOGS,
  auditlogs: RESOURCES.AUDIT_LOGS,
  product_locations: RESOURCES.PRODUCT_LOCATIONS,
  productlocations: RESOURCES.PRODUCT_LOCATIONS,
  credit_facility: RESOURCES.CREDIT_FACILITY,
  creditfacility: RESOURCES.CREDIT_FACILITY,
  delivery_zones: RESOURCES.DELIVERY_ZONES,
  deliveryzones: RESOURCES.DELIVERY_ZONES,
  blog_posts: RESOURCES.BLOG_POSTS,
  blogposts: RESOURCES.BLOG_POSTS,
  email_templates: RESOURCES.EMAIL_TEMPLATES,
  emailtemplates: RESOURCES.EMAIL_TEMPLATES,
  sms_templates: RESOURCES.SMS_TEMPLATES,
  smstemplates: RESOURCES.SMS_TEMPLATES,
  contact_submissions: RESOURCES.CONTACT_SUBMISSIONS,
  contactsubmissions: RESOURCES.CONTACT_SUBMISSIONS,
  shipping_methods: RESOURCES.SHIPPING_METHODS,
  shippingmethods: RESOURCES.SHIPPING_METHODS,
  payment_methods: RESOURCES.PAYMENT_METHODS,
  paymentmethods: RESOURCES.PAYMENT_METHODS,
  ai_chat: RESOURCES.AI_CHAT,
  aichat: RESOURCES.AI_CHAT,
  price_updates: RESOURCES.PRICE_UPDATES,
  priceupdates: RESOURCES.PRICE_UPDATES,
  supply_chain: RESOURCES.SUPPLY_CHAIN,
  supplychain: RESOURCES.SUPPLY_CHAIN,
  seo: RESOURCES.SEO,
};

const normalizeResource = (resource) => {
  const value = String(resource || "").trim();
  if (!value) return "";

  return (
    RESOURCE_LOOKUP[value] ||
    RESOURCE_LOOKUP[value.toLowerCase()] ||
    RESOURCE_ALIASES[value] ||
    RESOURCE_ALIASES[value.toLowerCase()] ||
    value
  );
};

const createPermissionKey = (action, resource) =>
  `${action}${PERMISSION_KEY_SEPARATOR}${normalizeResource(resource)}`;

const parsePermissionKey = (permissionKey) => {
  const [action, resource] = permissionKey.split(PERMISSION_KEY_SEPARATOR);
  return { action, resource };
};

const formatResourceLabel = (value = "") =>
  value
    .replace(/[_-]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const actionMatches = (action, key) => {
  const normalized = String(action || "").toLowerCase();
  return normalized === key || normalized.endsWith(`_${key}`);
};

const resourceMeta = {
  roles: {
    icon: faUsersGear,
    color: "text-[#008f45]",
    bg: "bg-[#e4f5ea]",
    description: "Manage roles and their permissions",
  },
  admins: {
    icon: faUserShield,
    color: "text-[#8b3ff0]",
    bg: "bg-[#f0e6ff]",
    description: "Manage admin users",
  },
  users: {
    icon: faUsers,
    color: "text-[#f59e0b]",
    bg: "bg-[#fff3d8]",
    description: "Manage system users",
  },
  permissions: {
    icon: faShieldHalved,
    color: "text-[#1b8ef2]",
    bg: "bg-[#e6f2ff]",
    description: "Manage system permissions",
  },
  audit_logs: {
    icon: faFileLines,
    color: "text-[#ef3340]",
    bg: "bg-[#ffe8ec]",
    description: "View system audit logs",
  },
  auditLogs: {
    icon: faFileLines,
    color: "text-[#ef3340]",
    bg: "bg-[#ffe8ec]",
    description: "View system audit logs",
  },
};

const getResourceMeta = (resource) => {
  const label = formatResourceLabel(resource);
  return {
    icon: faGear,
    color: "text-[#475467]",
    bg: "bg-[#eef2f6]",
    description: `Manage ${label.toLowerCase()}`,
    ...(resourceMeta[resource] || {}),
  };
};

const PermissionCheckbox = ({ checked, disabled, onChange, label }) => (
  <label className="inline-flex min-h-8 items-center justify-center">
    <span className="sr-only">{label}</span>
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      className="h-4 w-4 rounded border-[#84b99a] text-[#008f45] accent-[#008f45] disabled:cursor-not-allowed disabled:opacity-30"
    />
  </label>
);

const RoleForm = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissionOptions, setPermissionOptions] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [initialState, setInitialState] = useState({
    name: "",
    description: "",
    selectedPermissions: [],
  });
  const [permissionSearch, setPermissionSearch] = useState("");
  const [expandedResources, setExpandedResources] = useState(new Set());
  const [permissionLoadError, setPermissionLoadError] = useState("");
  const [processing, setProcessing] = useState(false);
  const { roleId } = useParams();
  const isEditing = Boolean(roleId);

  const { navigate } = useContext(ShopContext);

  const selectedPermissionSet = useMemo(
    () => new Set(selectedPermissions),
    [selectedPermissions]
  );

  const visiblePermissions = useMemo(() => {
    const query = permissionSearch.trim().toLowerCase();
    if (!query) return permissionOptions;

    return permissionOptions.filter((permission) => {
      const label = formatResourceLabel(permission.resource).toLowerCase();
      return (
        label.includes(query) ||
        permission.resource.toLowerCase().includes(query) ||
        permission.actions.some((action) =>
          action.name.toLowerCase().includes(query)
        )
      );
    });
  }, [permissionOptions, permissionSearch]);

  const getActionName = (permission, actionKey) =>
    permission.actions.find((action) => actionMatches(action.name, actionKey))
      ?.name;

  const isActionSelected = (permission, actionKey) => {
    const actionName = getActionName(permission, actionKey);
    return actionName
      ? selectedPermissionSet.has(
          createPermissionKey(actionName, permission.resource)
        )
      : false;
  };

  const areAllActionsSelected = (permission) =>
    permission.actions.length > 0 &&
    permission.actions.every((action) =>
      selectedPermissionSet.has(
        createPermissionKey(action.name, permission.resource)
      )
    );

  const toggleAction = (permission, actionKey, checked) => {
    const actionName = getActionName(permission, actionKey);
    if (!actionName) return;

    const key = createPermissionKey(actionName, permission.resource);
    setSelectedPermissions((current) =>
      checked
        ? [...new Set([...current, key])]
        : current.filter((permissionKey) => permissionKey !== key)
    );
  };

  const toggleResource = (permission, checked) => {
    const resourceKeys = permission.actions.map((action) =>
      createPermissionKey(action.name, permission.resource)
    );

    setSelectedPermissions((current) =>
      checked
        ? [...new Set([...current, ...resourceKeys])]
        : current.filter((permissionKey) => !resourceKeys.includes(permissionKey))
    );
  };

  const handleReset = () => {
    setName(initialState.name);
    setDescription(initialState.description);
    setSelectedPermissions(initialState.selectedPermissions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const permissionsMap = selectedPermissions.reduce((acc, permission) => {
      const { action, resource } = parsePermissionKey(permission);
      const normalizedResource = normalizeResource(resource);
      if (!action || !normalizedResource) return acc;
      if (!ALLOWED_RESOURCES.includes(normalizedResource)) return acc;
      if (!acc[normalizedResource]) acc[normalizedResource] = [];
      acc[normalizedResource].push(action);
      return acc;
    }, {});

    const permissions = Object.entries(permissionsMap).map(
      ([resource, actions]) => ({
        resource,
        actions,
      })
    );

    const payload = {
      name,
      description,
      permissions,
    };

    try {
      setProcessing(true);
      let response;

      if (!roleId) {
        response = await apiClient.post("/role", payload);

        if (response.status === StatusCodes.CREATED) {
          toast.success(response.data.message || "Role successfully created");
          navigate("/roles");
        }
      } else {
        response = await apiClient.put(`/role/${roleId}`, payload);

        if (response.status === StatusCodes.OK) {
          toast.success(response.data.message || "Role successfully updated");
          navigate("/roles");
        }
      }
    } catch (error) {
      const permissionMessage = roleId
        ? "Access denied. Your admin role needs update_roles on roles to update roles."
        : "Access denied. Your admin role needs create_roles on roles to create roles.";
      toast.error(error.status === 403 ? permissionMessage : error.message);
    } finally {
      setProcessing(false);
    }
  };

  const fetchRoleData = useCallback(async () => {
    try {
      const response = await apiClient.get(`/role/${roleId}`);
      if (response.data) {
        const permissions = (response.data.permissions || []).flatMap((perm) =>
          (perm.actions || []).map((action) =>
            createPermissionKey(action, normalizeResource(perm.resource))
          )
        );
        const nextState = {
          name: response.data.name || "",
          description: response.data.description || "",
          selectedPermissions: permissions,
        };

        setName(nextState.name);
        setDescription(nextState.description);
        setSelectedPermissions(nextState.selectedPermissions);
        setInitialState(nextState);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(
        error.status === 403
          ? "Access denied. Your admin role needs read_roles on roles to edit roles."
          : error.message
      );
    }
  }, [roleId]);

  const fetchPermissions = useCallback(async () => {
    try {
      setPermissionLoadError("");
      const response = await apiClient.get("/role/permissions");
      if (response.data) {
        const permissionsByResource = response.data.reduce((acc, permission) => {
          const resource = normalizeResource(permission.resource);
          if (!resource || !ALLOWED_RESOURCES.includes(resource)) return acc;

          acc[resource] = acc[resource] || new Set();
          (permission.actions || []).forEach((action) => {
            if (action) acc[resource].add(action);
          });
          return acc;
        }, {});

        setPermissionOptions(
          Object.entries(permissionsByResource).map(([resource, actions]) => ({
            resource,
            actions: Array.from(actions).map((action) => ({ name: action })),
          }))
        );
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      const message =
        error.status === 403
          ? "Access denied. Your admin role needs read_permissions on permissions to view permission options."
          : error.message;
      setPermissionLoadError(message);
      toast.error(message);
    }
  }, []);

  useEffect(() => {
    if (roleId) {
      fetchRoleData();
    }
  }, [fetchRoleData, roleId]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const expandAll = () => {
    setExpandedResources(new Set(permissionOptions.map((item) => item.resource)));
  };

  const collapseAll = () => {
    setExpandedResources(new Set());
  };

  return (
    <div className="space-y-5 text-[#101828]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-[24px] font-semibold leading-tight text-[#101828]">
            {isEditing ? "Edit Role" : "Create Role"}
          </h1>
          <p className="mt-2 text-sm text-[#475467]">
            Create and manage roles & permissions for your team members.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm text-[#667085]">
          <Link to="/" className="hover:text-[#008f45]">
            Dashboard
          </Link>
          <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3" />
          <Link to="/roles" className="hover:text-[#008f45]">
            Role List
          </Link>
          <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3" />
          <span className="font-semibold text-[#008f45]">
            {isEditing ? "Edit Role" : "Create Role"}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <section className="rounded-lg border border-[#e5e7eb] bg-white p-5 shadow-[0_6px_18px_rgba(16,24,40,0.04)]">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#e4f5ea] text-[#008f45]">
              <FontAwesomeIcon icon={faUsersGear} />
            </span>
            <h2 className="text-base font-semibold">Role Information</h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-[0.68fr_1fr]">
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Role Name <span className="text-[#ef3340]">*</span>
              </label>
              <input
                type="text"
                className="h-11 w-full rounded-md border border-[#d0d5dd] px-3 text-sm outline-none transition focus:border-[#008f45] focus:ring-2 focus:ring-[#d8f3e2]"
                placeholder="Admin"
                onChange={(e) => setName(e.target.value)}
                value={name}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Description
              </label>
              <div className="relative">
                <textarea
                  className="min-h-[96px] w-full resize-none rounded-md border border-[#d0d5dd] px-3 py-3 pb-8 text-sm outline-none transition focus:border-[#008f45] focus:ring-2 focus:ring-[#d8f3e2]"
                  placeholder="Describe what this role can do"
                  onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                  value={description}
                  maxLength={500}
                />
                <span className="absolute bottom-3 right-3 text-xs text-[#667085]">
                  {description.length}/500
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-[#e5e7eb] bg-white shadow-[0_6px_18px_rgba(16,24,40,0.04)]">
          <div className="flex flex-col gap-4 border-b border-[#eef2f6] p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#e4f5ea] text-[#008f45]">
                <FontAwesomeIcon icon={faShieldHalved} />
              </span>
              <div>
                <h2 className="text-base font-semibold">Permissions</h2>
                <p className="mt-1 text-sm text-[#475467]">
                  Choose what this role can access and manage.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={expandAll}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#008f45] px-4 text-sm font-semibold text-[#008f45] transition hover:bg-[#effaf3]"
              >
                <FontAwesomeIcon icon={faShuffle} className="h-3.5 w-3.5" />
                Expand All
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#008f45] px-4 text-sm font-semibold text-[#008f45] transition hover:bg-[#effaf3]"
              >
                <FontAwesomeIcon icon={faShuffle} className="h-3.5 w-3.5" />
                Collapse All
              </button>
              <label className="relative block sm:w-72">
                <span className="sr-only">Search permissions</span>
                <FontAwesomeIcon
                  icon={faMagnifyingGlass}
                  className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98a2b3]"
                />
                <input
                  type="search"
                  value={permissionSearch}
                  onChange={(e) => setPermissionSearch(e.target.value)}
                  placeholder="Search permissions..."
                  className="h-9 w-full rounded-full border border-[#d0d5dd] pl-4 pr-11 text-sm outline-none transition focus:border-[#008f45] focus:ring-2 focus:ring-[#d8f3e2]"
                />
              </label>
            </div>
          </div>

          {permissionLoadError && (
            <div className="mx-5 mt-5 rounded-md border border-[#fecdd3] bg-[#fff1f2] px-4 py-3 text-sm text-[#be123c]">
              {permissionLoadError}
            </div>
          )}

          <div className="overflow-x-auto p-5 pt-4">
            <table className="w-full min-w-[820px] overflow-hidden rounded-lg border border-[#e5e7eb] text-left">
              <thead className="bg-[#f7faf8] text-[11px] font-semibold uppercase text-[#475467]">
                <tr>
                  <th className="w-[34%] px-5 py-3">Module</th>
                  <th className="px-5 py-3 text-center">All</th>
                  {PRIMARY_ACTIONS.map((action) => (
                    <th key={action.key} className="px-5 py-3 text-center">
                      {action.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef2f6] text-sm">
                {visiblePermissions.map((permission) => {
                  const meta = getResourceMeta(permission.resource);
                  const extraActions = permission.actions.filter(
                    (action) =>
                      !PRIMARY_ACTIONS.some((primary) =>
                        actionMatches(action.name, primary.key)
                      )
                  );
                  const isExpanded = expandedResources.has(permission.resource);

                  return (
                    <Fragment key={permission.resource}>
                      <tr className="bg-white">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span
                              className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${meta.bg} ${meta.color}`}
                            >
                              <FontAwesomeIcon icon={meta.icon} />
                            </span>
                            <div>
                              <p className="font-semibold text-[#101828]">
                                {formatResourceLabel(permission.resource)}
                              </p>
                              <p className="mt-1 text-xs text-[#475467]">
                                {meta.description}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <PermissionCheckbox
                            label={`Select all ${permission.resource} permissions`}
                            checked={areAllActionsSelected(permission)}
                            disabled={permission.actions.length === 0}
                            onChange={(e) =>
                              toggleResource(permission, e.target.checked)
                            }
                          />
                        </td>
                        {PRIMARY_ACTIONS.map((action) => {
                          const hasAction = Boolean(
                            getActionName(permission, action.key)
                          );
                          return (
                            <td key={action.key} className="px-5 py-4 text-center">
                              <PermissionCheckbox
                                label={`${action.label} ${permission.resource}`}
                                checked={isActionSelected(permission, action.key)}
                                disabled={!hasAction}
                                onChange={(e) =>
                                  toggleAction(
                                    permission,
                                    action.key,
                                    e.target.checked
                                  )
                                }
                              />
                            </td>
                          );
                        })}
                      </tr>
                      {isExpanded && extraActions.length > 0 && (
                        <tr className="bg-[#fbfcfd]">
                          <td className="px-5 py-3 text-xs font-semibold text-[#475467]">
                            Additional actions
                          </td>
                          <td colSpan={5} className="px-5 py-3">
                            <div className="flex flex-wrap gap-3">
                              {extraActions.map((action) => {
                                const key = createPermissionKey(
                                  action.name,
                                  permission.resource
                                );
                                return (
                                  <label
                                    key={key}
                                    className="inline-flex items-center gap-2 rounded-full border border-[#d0d5dd] bg-white px-3 py-1.5 text-xs font-medium text-[#344054]"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selectedPermissionSet.has(key)}
                                      onChange={(e) =>
                                        setSelectedPermissions((current) =>
                                          e.target.checked
                                            ? [...new Set([...current, key])]
                                            : current.filter(
                                                (item) => item !== key
                                              )
                                        )
                                      }
                                      className="h-3.5 w-3.5 accent-[#008f45]"
                                    />
                                    {formatResourceLabel(action.name)}
                                  </label>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>

            {visiblePermissions.length === 0 && (
              <div className="rounded-b-lg border-x border-b border-[#e5e7eb] bg-white px-5 py-8 text-center text-sm text-[#667085]">
                No permissions match your search.
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-[#eef2f6] bg-white p-5 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => navigate("/roles")}
              className="h-10 rounded-md border border-[#98a2b3] px-8 text-sm font-semibold text-[#101828] transition hover:bg-[#f9fafb]"
            >
              Cancel
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#008f45] px-8 text-sm font-semibold text-[#008f45] transition hover:bg-[#effaf3]"
            >
              <FontAwesomeIcon icon={faRotateLeft} />
              Reset
            </button>
            <button
              type="submit"
              disabled={processing}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#008f45] px-10 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(0,143,69,0.18)] transition hover:bg-[#007a3b] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {processing ? (
                <LoadingButtonContent label="Saving..." />
              ) : (
                <>
                  <FontAwesomeIcon icon={faFloppyDisk} />
                  Save Role
                </>
              )}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
};

export default RoleForm;
