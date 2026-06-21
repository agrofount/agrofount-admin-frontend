import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { ExclamationTriangleIcon } from "@heroicons/react/16/solid";
import { toast } from "react-toastify";
import { assets } from "../../assets/assets";
import { apiClient } from "../../lib/apiClient";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy, faCalendar, faClock } from "@fortawesome/free-solid-svg-icons";

const RoleTableItem = ({ role, setItemDeleted }) => {
  const [open, setOpen] = useState(false);

  const isActive = role.isActive !== undefined ? role.isActive : true;

  const handleCopyId = () => {
    navigator.clipboard.writeText(role.id).then(() => {
      toast.success("Role ID copied");
    });
  };

  const handleDelete = async () => {
    try {
      await apiClient.delete(`/role/${role.id}`);
      setItemDeleted(true);
      toast.success("Role deleted successfully");
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setOpen(false);
    }
  };

  const createdAt = new Date(role.createdAt);
  const formattedDate = createdAt.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
  const formattedTime = createdAt.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const truncatedId =
    role.id.length > 18 ? `${role.id.slice(0, 18)}...` : role.id;

  const description = role.description || role.desc || "";
  const truncatedDesc =
    description.length > 45
      ? `${description.slice(0, 45)}...`
      : description;

  return (
    <tr className="hover:bg-[#F7F7F7] border-b border-gray-100">
      {/* Role ID */}
      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs">{truncatedId}</span>
          <button
            onClick={handleCopyId}
            className="text-gray-400 hover:text-gray-600 cursor-pointer shrink-0"
            title="Copy Role ID"
          >
            <FontAwesomeIcon icon={faCopy} className="text-xs" />
          </button>
        </div>
      </td>

      {/* Role Name */}
      <td className="px-3 py-4 whitespace-nowrap text-sm">
        <p className="font-semibold text-gray-800">
          {role.name.length > 24
            ? `${role.name.slice(0, 24)}...`
            : role.name}
        </p>
      </td>

      {/* Description */}
      <td className="px-3 py-4 text-sm text-gray-500 max-w-[200px]">
        <p className="leading-snug">{truncatedDesc || "--"}</p>
      </td>

      {/* Created At */}
      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className="flex items-center gap-1.5 text-xs">
          <FontAwesomeIcon icon={faCalendar} className="text-gray-400" />
          <span>{formattedDate}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
          <FontAwesomeIcon icon={faClock} className="text-gray-300" />
          <span>{formattedTime}</span>
        </div>
      </td>

      {/* Status */}
      <td className="px-3 py-4 whitespace-nowrap text-sm">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
            isActive
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-gray-100 text-gray-500 border-gray-200"
          }`}
        >
          {isActive ? "Active" : "Inactive"}
        </span>
      </td>

      {/* Actions */}
      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className="flex flex-row gap-3 items-center">
          <Link to={`/roles/${role.id}/edit`} title="Edit role">
            <img src={assets.edit_icon} alt="Edit" className="w-5 h-5" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen(true)}
            title="Delete role"
            className="cursor-pointer"
          >
            <img src={assets.delete_icon} alt="Delete" className="w-5 h-5" />
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
                        Delete Role
                      </DialogTitle>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Are you sure you want to delete &quot;{role.name}
                          &quot;? This action cannot be undone.
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
      </td>
    </tr>
  );
};

export default RoleTableItem;
