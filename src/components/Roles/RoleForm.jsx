import axios from "axios";
import { StatusCodes } from "http-status-codes";
import { useCallback, useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ShopContext } from "../../context/ShopContext";
import { useParams } from "react-router-dom";

const RoleForm = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissionOptions, setPermissionOptions] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [roleData, setRoleData] = useState({});
  const { roleId } = useParams();

  const { token, navigate, backend_url } = useContext(ShopContext);

  const handlePermissionChange = (e, resource) => {
    const { value, checked } = e.target;
    let updatedSelectedPermissions = [...selectedPermissions];
    if (value.startsWith("all_")) {
      // Handle "All" checkbox logic
      const resource = value.split("_")[1];
      const permission = permissionOptions.find(
        (permission) => permission.resource === resource
      );

      if (!permission) {
        console.error(`Permission for resource "${resource}" not found.`);
        return;
      }

      const allActions = permission.actions.map(
        (action) => `${action.name}_${resource}`
      );

      if (checked) {
        // Add all actions for the resource
        updatedSelectedPermissions = [
          ...new Set([...updatedSelectedPermissions, ...allActions]),
        ];
      } else {
        // Remove all actions for the resource
        updatedSelectedPermissions = updatedSelectedPermissions.filter(
          (permission) => !allActions.includes(permission)
        );
      }
      const updatedPermissionOptions = permissionOptions.map((perm) =>
        perm.resource === resource
          ? {
              ...perm,
              actions: perm.actions.map((action) => ({
                ...action,
                checked, // Set all actions to the same checked state
              })),
              checked, // Update the "All" checkbox state
            }
          : perm
      );

      setPermissionOptions(updatedPermissionOptions);
    } else {
      // Handle specific action checkbox logic
      if (checked) {
        // Add the specific action
        if (!updatedSelectedPermissions.includes(value)) {
          updatedSelectedPermissions.push(value);
        }
      } else {
        // Remove the specific action
        updatedSelectedPermissions = updatedSelectedPermissions.filter(
          (permission) => permission !== value
        );
      }
      // Update permissionOptions
      const updatedPermissionOptions = permissionOptions.map((perm) =>
        perm.resource === resource
          ? {
              ...perm,
              actions: perm.actions.map((a) => {
                return `${a.name}_${perm.resource}` === value
                  ? { ...a, checked }
                  : a;
              }),
            }
          : perm
      );

      setPermissionOptions(updatedPermissionOptions);
    }

    setSelectedPermissions(updatedSelectedPermissions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Transform selectedPermissions into the expected format
    const permissionsMap = selectedPermissions.reduce((acc, permission) => {
      const [action, resource] = permission.split("_");
      if (!acc[resource]) {
        acc[resource] = [];
      }
      acc[resource].push(action);
      return acc;
    }, {});

    const permissions = Object.entries(permissionsMap).map(
      ([resource, actions]) => ({
        resource,
        actions,
      })
    );

    const payload = {
      name: name,
      description: description,
      permissions: permissions,
    };

    try {
      setProcessing(true);
      let response;
      if (!roleId) {
        response = await axios.post(`${backend_url}/role`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === StatusCodes.CREATED) {
          toast.success(response.data.message || "State successfully created");
          navigate(`/roles`);
        }
      } else {
        response = await axios.put(`${backend_url}/role/${roleId}`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === StatusCodes.OK) {
          toast.success(response.data.message || "Role successfully Updated");
          navigate("/roles");
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setProcessing(false);
    }
  };

  const fetchRoleData = useCallback(async () => {
    try {
      const response = await axios.get(`${backend_url}/role/${roleId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data) {
        setRoleData(response.data);
        setName(response.data.name || "");
        setDescription(response.data.description || "");
        // Transform permissions from {resource, actions[]} to ["action_resource"]
        const permissions = response.data.permissions.flatMap((perm) =>
          perm.actions.map((action) => `${action}_${perm.resource}`)
        );
        setSelectedPermissions(permissions);
      } else {
        console.log("error", response);
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log("error", error);
      toast.error(error.response?.data?.message || error.message);
    }
  }, [backend_url, roleId]);

  const fetchPermissions = useCallback(async () => {
    try {
      const response = await axios.get(`${backend_url}/role/permissions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data) {
        let options = response.data.map((permission) => {
          const allActionsSelected = permission.actions.every((action) =>
            selectedPermissions.includes(`${action}_${permission.resource}`)
          );

          return {
            resource: permission.resource,
            actions: permission.actions.map((action) => ({
              name: action,
              checked: selectedPermissions.includes(
                `${action}_${permission.resource}`
              ),
            })),
            checked: allActionsSelected, // This will control the "All" checkbox
          };
        });

        setPermissionOptions(options);
      } else {
        console.log("error", response);
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log("error", error);
      toast.error(error.response?.data?.message || error.message);
    }
  }, [backend_url, selectedPermissions]);

  useEffect(() => {
    const fetchData = async () => {
      if (roleId) {
        await fetchRoleData();
      }
    };

    fetchData();

    //
  }, [fetchRoleData, roleId]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);
  return (
    <div className="w-full px-2">
      <form onSubmit={handleSubmit} className="py-10">
        <div className="w-full flex flex-col gap-2">
          <label className="font-semibold text-gray-400 ">Name</label>
          <input
            type="text"
            className="border rounded-lg px-3 py-3 mb-5 text-sm w-full outline-none border-gray-500"
            placeholder="Role Name"
            onChange={(e) => setName(e.target.value)}
            value={name !== undefined ? name : roleData.name}
            required
          />
        </div>
        <div className="w-full flex flex-col gap-2">
          <label className="font-semibold text-gray-400 ">Description</label>
          <textarea
            className="border rounded-lg px-3 py-3 mb-5 text-sm w-full outline-none border-gray-500"
            placeholder="Role description Code"
            onChange={(e) => setDescription(e.target.value)}
            value={
              description !== undefined ? description : roleData.description
            }
            rows={5}
            required
          />
        </div>

        <div className="w-full flex flex-col gap-2">
          <label className="font-semibold text-gray-400 bg-gray-200 p-2 ">
            Permissions
          </label>

          <div className="w-96 sm:w-full overflow-x-auto">
            <table className="w-full table-auto divide-y divide-gray-200 pb-20">
              <tbody>
                {permissionOptions.map((permission, index) => (
                  <tr key={index} className="hover:bg-[#F7F7F7]">
                    <td className="px-2 py-5 whitespace-nowrap text-gray-500">
                      <p className="py-1 font-semibold capitalize">
                        {permission.resource}
                      </p>
                    </td>
                    <td className="px-2 py-5 whitespace-nowrap text-gray-500">
                      <div className="flex flex-row justify-start items-start gap-10">
                        <div className="flex flex-row items-center gap-5">
                          <input
                            type="checkbox"
                            className="w-4 h-4"
                            value={`all_${permission.resource}`}
                            checked={permission.checked} // Check if all actions are selected
                            onChange={(e) =>
                              handlePermissionChange(e, permission.resource)
                            }
                          />
                          <p className="py-1">All</p>
                        </div>
                        {permission.actions.map((action) => (
                          <div
                            className="flex flex-row items-center gap-5"
                            key={action.name}
                          >
                            <input
                              type="checkbox"
                              className="w-4 h-4"
                              checked={action.checked}
                              value={`${action.name}_${permission.resource}`}
                              onChange={(e) =>
                                handlePermissionChange(e, permission.resource)
                              }
                            />
                            <p className="py-1">{action.name}</p>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="my-3 w-full">
          <button
            type="submit"
            className="py-2 px-8 bg-[#61BF75] hover:bg-[#61BF75] focus:bg-[#61BF75] text-white w-full sm:w-1/4 mx-auto transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg cursor-pointer select-none"
          >
            {processing ? (
              <div className="flex items-center space-x-2">
                <div
                  className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-white"
                  role="status"
                >
                  <span className="sr-only">Processing...</span>
                </div>
                <span className="text-surface text-white">Processing...</span>
              </div>
            ) : (
              "Submit"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RoleForm;
