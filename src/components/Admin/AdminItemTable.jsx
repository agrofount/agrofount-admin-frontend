import {
  faEllipsisVertical,
  faPenToSquare,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/react";
import { ExclamationTriangleIcon } from "@heroicons/react/16/solid";
import { toast } from "react-toastify";
import { apiClient } from "../../lib/apiClient";
import { ADMIN_STATUS_META, getAdminStatus } from "./adminStatus";

const ROLE_CHIPS = [
  "bg-[#ede9fe] text-[#5925dc]",
  "bg-[#d1f4f0] text-[#0e7466]",
  "bg-[#dbeafe] text-[#1d4ed8]",
];
const AVATAR_COLORS = ["#4f7cc9", "#5b6fd6", "#3f8f8a", "#7a5af8", "#c26a3d"];

const getInitials = (name = "") =>
  name.slice(0, 2).toUpperCase() || "?";

const avatarColor = (name = "") =>
  AVATAR_COLORS[
    [...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) %
      AVATAR_COLORS.length
  ];

const UserTableItem = ({
  user,
  setItemDeleted,
  canUpdate = false,
  canDelete = false,
}) => {
  const [open, setOpen] = useState(false);
  const statusMeta = ADMIN_STATUS_META[getAdminStatus(user)];

  const handleDelete = async () => {
    try {
      await apiClient.delete(`/admin/${user.id}`);

      setItemDeleted(true);
      toast.success("admin deleted successfully");
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setOpen(false);
    }
  };

  return (
    <tr className="hover:bg-[#fafafa]" key={user.id}>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <span
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white"
            style={{ background: avatarColor(user.username) }}
          >
            {getInitials(user.username)}
          </span>
          <p className="max-w-[140px] truncate text-sm font-medium text-[#101828]">
            {user.username}
          </p>
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-[#475467]">
        <p className="max-w-[220px] truncate">{user.email}</p>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-[#475467]">
        {user.phone || "—"}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-[#475467]">
        {new Date(user.createdAt).toDateString()}
      </td>
      <td className="px-4 py-3 text-sm">
        <div className="flex max-w-[260px] flex-wrap gap-1.5">
          {user.roles?.length ? (
            user.roles.map((role, i) => (
              <span
                key={role.id}
                className={`rounded-full px-3 py-1 text-xs font-medium ${ROLE_CHIPS[i % ROLE_CHIPS.length]}`}
              >
                {role.name}
              </span>
            ))
          ) : (
            <span className="rounded-full bg-[#f2f4f7] px-3 py-1 text-xs text-[#98a2b3]">
              —
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${statusMeta.pill}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`} />
          {statusMeta.label}
        </span>
      </td>
      {(canUpdate || canDelete) && (
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex flex-row items-center gap-3">
          {canUpdate && (
            <Link
              to={`/admins/${user.id}/edit`}
              title="Edit admin"
              className="text-[#12b76a] hover:text-[#027a48]"
            >
              <FontAwesomeIcon icon={faPenToSquare} />
            </Link>
          )}
          {canDelete && (
            <button
              type="button"
              title="Delete admin"
              onClick={() => setOpen(true)}
              className="text-[#f04438] hover:text-[#b42318]"
            >
              <FontAwesomeIcon icon={faTrashCan} />
            </button>
          )}
          <Menu>
            <MenuButton
              aria-label="More actions"
              className="grid h-7 w-7 place-items-center rounded-md text-[#667085] hover:bg-[#f2f4f7]"
            >
              <FontAwesomeIcon icon={faEllipsisVertical} />
            </MenuButton>
            <MenuItems
              anchor="bottom end"
              className="z-20 w-40 rounded-lg border border-[#e5e7eb] bg-white py-1 text-sm shadow-lg"
            >
              {canUpdate && (
                <MenuItem>
                  <Link
                    to={`/admins/${user.id}/edit`}
                    className="block px-4 py-2 text-[#344054] data-[focus]:bg-[#f2f4f7]"
                  >
                    Edit admin
                  </Link>
                </MenuItem>
              )}
              {canDelete && (
                <MenuItem>
                  <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="block w-full px-4 py-2 text-left text-[#b42318] data-[focus]:bg-[#fef3f2]"
                  >
                    Delete admin
                  </button>
                </MenuItem>
              )}
            </MenuItems>
          </Menu>

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
                          Delete Admin
                        </DialogTitle>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">
                            Are you sure you want to delete {user.username}? This
                            admin will lose access and the account will be
                            permanently removed. This action cannot be undone.
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
      )}
    </tr>
  );
};

export default UserTableItem;
