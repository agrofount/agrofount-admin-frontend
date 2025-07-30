import axios from "axios";
import { StatusCodes } from "http-status-codes";
import { useCallback, useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ShopContext } from "../../context/ShopContext";
import { useParams } from "react-router-dom";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import flags from "react-phone-number-input/flags";
import { Switch } from "@headlessui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

const AdminForm = () => {
  const [firstname, setFirstName] = useState("");
  const [lastname, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [roleOptions, setRoleOptions] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);

  const [processing, setProcessing] = useState(false);
  const [adminData, setAdminData] = useState({});
  const { adminId } = useParams();

  const { token, navigate, backend_url } = useContext(ShopContext);

  const toggleRole = (roleName, roleId) => {
    setRoleOptions((prevOptions) =>
      prevOptions.map((role) =>
        role.name === roleName ? { ...role, isActive: !role.isActive } : role
      )
    );

    setSelectedRoles((prevRoles) => {
      const roleExists = prevRoles.some((role) => role.name === roleName);

      if (roleExists) {
        // Toggle the isActive property for the existing role
        return prevRoles.map((role) =>
          role.name === roleName ? { ...role, isActive: !role.isActive } : role
        );
      } else {
        // Add the role with isActive set to true
        return [...prevRoles, { name: roleName, id: roleId, isActive: true }];
      }
    });
  };

  const phoneInputStyle = {
    minHeight: "2rem",
    width: "100%",
    borderRadius: "0.375rem",
    border: "1px solid #ADADAD",
    color: "#6E6E6E",
    backgroundColor: "transparent",
    padding: "0.6rem 0.75rem",
    lineHeight: "1.6",
    outline: "none",
    transition: "all 0.2s ease-linear",
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);

    // Validate passwords in real-time
    if (confirmPassword && newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
    } else {
      setPasswordError("");
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const newConfirmPassword = e.target.value;
    setConfirmPassword(newConfirmPassword);

    // Validate passwords in real-time
    if (password && newConfirmPassword !== password) {
      setPasswordError("Passwords do not match");
    } else {
      setPasswordError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (phone && !isValidPhoneNumber(phone)) {
      toast.error("Please enter a valid phone number");
      return;
    }

    const activeRoles = selectedRoles
      .filter((role) => role.isActive)
      .map((role) => role.id);

    const payload = {
      firstname,
      lastname,
      username,
      email,
      phone,
      roleIds: activeRoles,
      ...(adminId ? {} : { password }),
    };

    try {
      setProcessing(true);
      let response;
      if (!adminId) {
        response = await axios.post(`${backend_url}/admin/register`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === StatusCodes.CREATED) {
          toast.success(response.data.message || "Admin successfully created");
          navigate(`/admins`);
        }
      } else {
        response = await axios.put(
          `${backend_url}/admin/${adminData.id}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === StatusCodes.OK) {
          toast.success(response.data.message || "Admin successfully Updated");
          navigate("/admins");
        }
      }
    } catch (error) {
      console.error(error);
      if (Array.isArray(error.response?.data?.message)) {
        error.response.data.message.forEach((msg) => toast.error(msg));
      } else {
        toast.error(error.response?.data?.message || error.message);
      }
    } finally {
      setProcessing(false);
    }
  };

  const fetchRoles = useCallback(async () => {
    try {
      const response = await axios.get(`${backend_url}/role`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data) {
        let options = response.data.data.map((role) => {
          return {
            ...role,
            isActive: false,
          };
        });

        setRoleOptions(options);
      } else {
        console.log("error", response);
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log("error", error);
      toast.error(error.response?.data?.message || error.message);
    }
  }, [backend_url, token]);

  const fetchAdminData = useCallback(async () => {
    try {
      const response = await axios.get(`${backend_url}/admin/${adminId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("admin data response", response.data);
      if (response.data) {
        setAdminData(response.data);
        setFirstName(response.data.firstname || "");
        setLastName(response.data.lastname || "");
        setUsername(response.data.username || "");
        setPhone(response.data.phone || "");
        setEmail(response.data.email || "");

        // Initialize selectedRoles with isActive property
        const rolesWithActiveState = response.data.roles.map((role) => ({
          ...role,
          isActive: true, // Mark all roles as active initially
        }));

        setSelectedRoles(rolesWithActiveState);

        // Update roleOptions to reflect the admin's assigned roles
        setRoleOptions((prevOptions) =>
          prevOptions.map((role) => ({
            ...role,
            isActive: response.data.roles.some(
              (adminRole) => adminRole.id === role.id
            ),
          }))
        );
      } else {
        console.log("error", response);
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log("error", error);
      toast.error(error.response?.data?.message || error.message);
    }
  }, [backend_url, adminId, token]);

  useEffect(() => {
    const fetchData = async () => {
      fetchRoles();

      if (adminId) {
        await fetchAdminData();
      }
    };

    fetchData();
  }, [fetchRoles, fetchAdminData, adminId]);

  //   useEffect(() => {
  //     fetchRoles();
  //   }, [fetchRoles]);

  return (
    <form onSubmit={handleSubmit} className="">
      <div className="bg-white rounded-[12px] shadow-[0px_0px_10px_0px_#EDEDED] mt-5 p-4">
        <div className="grid grid-cols-5 w-full gap-5 sm:w-9/12 mx-auto px-2 py-5">
          <div className="col-span-5 sm:col-span-2">
            <p className="font-bold text-xl">Account</p>
            <p className="text-gray-700 text-sm">
              Fill in the information below to add a new account
            </p>
          </div>
          <div className="col-span-5 sm:col-span-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="w-full flex flex-col gap-2">
                <label className="font-semibold text-gray-400 ">
                  Firstname
                </label>
                <input
                  type="text"
                  className="border rounded-lg px-3 py-3 mb-5 text-sm w-full outline-none border-gray-500"
                  placeholder="First Name"
                  onChange={(e) => setFirstName(e.target.value)}
                  value={
                    firstname !== undefined ? firstname : adminData.firstname
                  }
                  required
                />
              </div>

              <div className="w-full flex flex-col gap-2">
                <label className="font-semibold text-gray-400 ">Lastname</label>
                <input
                  type="text"
                  className="border rounded-lg px-3 py-3 mb-5 text-sm w-full outline-none border-gray-500"
                  placeholder="Last Name"
                  onChange={(e) => setLastName(e.target.value)}
                  value={lastname !== undefined ? lastname : adminData.lastName}
                  required
                />
              </div>
            </div>
            <div className="w-full flex flex-col gap-2">
              <label className="font-semibold text-gray-400 ">Username</label>
              <input
                type="text"
                className="border rounded-lg px-3 py-3 mb-5 text-sm w-full outline-none border-gray-500"
                placeholder="Username"
                onChange={(e) => setUsername(e.target.value)}
                value={username !== undefined ? username : adminData.username}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="w-full flex flex-col gap-2">
                <label className="font-semibold text-gray-400 ">Email</label>
                <input
                  type="email"
                  className="border rounded-lg px-3 py-3 mb-5 text-sm w-full outline-none border-gray-500"
                  placeholder="Email"
                  onChange={(e) => setEmail(e.target.value)}
                  value={email !== undefined ? email : adminData.email}
                  required
                />
              </div>

              <div className="w-full flex flex-col gap-2">
                <label className="font-semibold text-gray-400 ">
                  Phone Number
                </label>
                <PhoneInput
                  name="phoneNumber"
                  placeholder="Enter phone number"
                  defaultCountry="NG"
                  international
                  onChange={(e) => setPhone(e)}
                  value={phone !== undefined ? phone : adminData.phone}
                  flags={flags}
                  style={phoneInputStyle}
                />
                <p className="text-[#F96767] text-sm">
                  {phone && !isValidPhoneNumber(phone)
                    ? "Invalid phone number"
                    : ""}
                </p>
              </div>
            </div>
            {!adminId && (
              <>
                <div className="w-full flex flex-col gap-2">
                  <label className="font-semibold text-gray-400 ">
                    Password
                  </label>
                  <div className="relative w-full">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="border rounded-lg px-3 py-3 mb-5 text-sm w-full outline-none border-gray-500"
                      placeholder="Password"
                      onChange={handlePasswordChange}
                      value={
                        password !== undefined ? password : adminData.password
                      }
                      required
                    />
                    <button
                      type="button"
                      onClick={setShowPassword.bind(null, !showPassword)}
                      className="absolute inset-y-0 right-0 bottom-2 px-3 flex items-center focus:outline-none"
                    >
                      {showPassword ? (
                        <FontAwesomeIcon icon={faEye} color="gray" />
                      ) : (
                        <FontAwesomeIcon icon={faEyeSlash} color="gray" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="w-full flex flex-col gap-2">
                  <label className="font-semibold text-gray-400 ">
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="border rounded-lg px-3 py-3 mb-5 text-sm w-full outline-none border-gray-500"
                    placeholder="Confirm Password"
                    onChange={handleConfirmPasswordChange}
                    value={confirmPassword}
                    required
                  />
                </div>

                {passwordError && (
                  <p className="text-red-500 text-sm mb-5">{passwordError}</p>
                )}
              </>
            )}
          </div>

          {/* <div className="w-full flex flex-col gap-2">
          <label className="font-semibold text-sm text-gray-400 ">
            Is Active
          </label>
          <Switch
            checked={active}
            onChange={setActive}
            className="group relative flex h-7 w-14 cursor-pointer rounded-full bg-white p-1 transition-colors duration-200 ease-in-out focus:outline-none border border-gray-500 data-[focus]:outline-1 data-[focus]:outline-[#61BF75] data-[checked]:bg-[#61BF75]"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none inline-block size-5 translate-x-0 rounded-full bg-[#fb4747] ring-0 shadow-lg transition duration-200 ease-in-out group-data-[checked]:translate-x-7"
            />
          </Switch>
        </div> */}
        </div>
      </div>
      <div className="bg-white rounded-[12px] shadow-[0px_0px_10px_0px_#EDEDED] mt-5 p-4">
        <div className="grid grid-cols-5 gap-5 w-full sm:w-9/12 mx-auto px-2 py-5">
          <div className="col-span-5 sm:col-span-2">
            <p className="font-bold text-xl">Roles</p>
            <p className="text-gray-700 text-sm">
              Items that the account is allowed to edit
            </p>
          </div>

          <div className="col-span-5 sm:col-span-3">
            <div className="grid grid-cols-3 gap-4">
              {roleOptions.map((role) => (
                <div key={role.name} className="w-full flex flex-col gap-2">
                  <label className="font-semibold text-sm text-gray-400">
                    {`Is ${role.name}`}
                  </label>
                  <Switch
                    checked={role.isActive}
                    onChange={() => toggleRole(role.name, role.id)}
                    className={`group relative flex h-9 w-20 cursor-pointer rounded-full bg-white px-1 py-1.5 transition-colors duration-200 ease-in-out focus:outline-none border border-gray-500 ${
                      role.isActive ? "data-[checked]:bg-[#61BF75]" : ""
                    }`}
                  >
                    {role.isActive && (
                      <p className="px-0.5 text-white">Allow</p>
                    )}
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block size-6 translate-x-0 rounded-full bg-white ring-1 shadow-lg transition duration-200 ease-in-out ${
                        role.isActive
                          ? "group-data-[checked]:translate-x-1"
                          : ""
                      }`}
                    >
                      <FontAwesomeIcon
                        icon={faCheck}
                        color={`${role.isActive ? "#61BF75" : "gray"}`}
                      />
                    </span>
                    {!role.isActive && (
                      <p className="px-1 text-gray-500">Deny</p>
                    )}
                  </Switch>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="w-full sm:w-1/2 mx-auto my-3">
          <button
            type="submit"
            className="py-2 px-8 bg-[#61BF75] hover:bg-[#61BF75] focus:bg-[#61BF75] text-white w-full transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg cursor-pointer select-none"
          >
            {processing ? (
              <div className="flex items-center space-x-2 justify-center">
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
      </div>
    </form>
  );
};

export default AdminForm;
