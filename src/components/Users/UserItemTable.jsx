import { useContext, useState } from "react";
import { ShopContext } from "../../context/ShopContext";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { ExclamationTriangleIcon } from "@heroicons/react/16/solid";
import axios from "axios";
import { toast } from "react-toastify";
import { assets } from "../../assets/assets";

const UserTableItem = ({ user, setItemDeleted, setUpdated }) => {
  const [open, setOpen] = useState(false);
  const { backend_url, token } = useContext(ShopContext);
  const [processingActivation, setProcessingActivation] = useState(false);

  const handleDelete = async () => {
    try {
      await axios.delete(`${backend_url}/state/${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setItemDeleted(true);
      toast.success("User deleted successfully");
      setUpdated(true);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setOpen(false);
    }
  };

  const handleActivation = async () => {
    try {
      setProcessingActivation(true);
      const response = await axios.patch(
        `${backend_url}/user/${user.id}/activate?activate=${!user.isVerified}`,
        null,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        toast.success("User activated successfully");
        setUpdated(true);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setProcessingActivation(false);
    }
  };

  // Add this helper function above your component:
  function formatPhoneForWhatsApp(phone) {
    // Remove all non-digits
    let digits = phone.replace(/[^\d]/g, "");
    // Remove leading zeros
    digits = digits.replace(/^0+/, "");
    // If it doesn't start with country code, add it (e.g., 234 for Nigeria)
    if (!digits.startsWith("234")) {
      digits = "234" + digits;
    }
    return digits;
  }

  return (
    <tr className="hover:bg-[#F7F7F7]">
      <td className="px-2 py-5 whitespace-nowrap text-sm text-gray-500">
        <p className="py-1">{user.username}</p>
      </td>
      <td className="px-2 py-5 whitespace-nowrap text-sm text-gray-500">
        <div className="flex flex-row items-start gap-4 max-w-32">
          <p className="py-1 text-wrap">{user.email || "N/A"}</p>
        </div>
      </td>

      <td className="px-2 py-5 whitespace-nowrap text-sm text-gray-500">
        <div className="flex flex-row items-start gap-4 max-w-32">
          <p className="py-1 text-wrap">{user.gender || "N/A"}</p>
        </div>
      </td>

      <td className="px-2 py-5 whitespace-nowrap text-sm text-gray-500">
        <div className="flex items-center gap-2 py-1">
          {user.phone || "N/A"}
          {user.phone && (
            <a
              href={`https://wa.me/${formatPhoneForWhatsApp(user.phone)}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Message on WhatsApp"
              className="ml-1"
            >
              <img
                src={assets.message_icon}
                alt="WhatsApp"
                className="w-4 h-4 inline"
              />
            </a>
          )}
        </div>
      </td>

      <td className="px-2 py-5 whitespace-nowrap text-sm text-gray-500">
        <div className="flex flex-row items-start gap-4 max-w-32">
          <p className="py-1 text-wrap">{user.state || "N/A"}</p>
        </div>
      </td>

      <td className="px-2 py-5 whitespace-nowrap text-sm text-gray-500">
        <p className="py-1">
          <p
            className={`text-center py-1 rounded-full w-[6rem] px-2 ${
              user.isVerified
                ? "bg-[#d9f5df] text-[#61BF75]"
                : "bg-[#f8d7da] text-[#dc3545]"
            }`}
          >
            {user.isVerified ? "Verified" : "Not Verified"}
          </p>
        </p>
      </td>

      <td className="px-2 py-5 whitespace-nowrap text-sm text-gray-500">
        <p className="py-1">
          {new Date(user.createdAt).toDateString()}{" "}
          {new Date(user.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </td>

      <td className="px-4 py-5 whitespace-nowrap text-sm text-gray-500">
        <div className="flex flex-row gap-3 items-center">
          <Link to={`/users/${user.id}/edit`}>
            <img src={assets.edit_icon} alt="" />
          </Link>
          <div onClick={() => setOpen(true)} className="cursor-pointer">
            <img src={assets.delete_icon} alt="" />
          </div>
          <div className="cursor-pointer">
            <button
              onClick={handleActivation}
              className={`text-sm ${
                user.isVerified ? "bg-green-500" : "bg-red-500"
              } text-white px-3 py-1 rounded-full hover:bg-opacity-80 transition-colors`}
              disabled={processingActivation}
            >
              {processingActivation ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>{user.isVerified ? "Deactivate" : "Activate"}</>
              )}
            </button>
          </div>

          <Dialog open={open} onClose={setOpen} className="relative z-10">
            <DialogBackdrop
              transition
              className="fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
            />

            <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
              <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <DialogPanel
                  transition
                  className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg data-closed:sm:translate-y-0 data-closed:sm:scale-95"
                >
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:size-10">
                        <ExclamationTriangleIcon
                          aria-hidden="true"
                          className="size-6 text-red-600"
                        />
                      </div>
                      <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <DialogTitle
                          as="h3"
                          className="text-base font-semibold text-gray-900"
                        >
                          Delete Country
                        </DialogTitle>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">
                            Are you sure you want to delete your {user.username}
                            ? product location data will be permanently removed.
                            This action cannot be undone.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-red-500 sm:ml-3 sm:w-auto"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      data-autofocus
                      onClick={() => setOpen(false)}
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 shadow-xs ring-gray-300 ring-inset hover:bg-gray-50 sm:mt-0 sm:w-auto"
                    >
                      Cancel
                    </button>
                  </div>
                </DialogPanel>
              </div>
            </div>
          </Dialog>
        </div>
      </td>
    </tr>
  );
};

export default UserTableItem;
