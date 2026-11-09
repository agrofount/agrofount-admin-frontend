import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { useContext, useState } from "react";
import { toast } from "react-toastify";
import { ACTIONS, RESOURCES } from "../../constants/permissions";
import { ShopContext } from "../../context/ShopContext";
import { apiClient } from "../../lib/apiClient";
import { usePermission } from "../Hooks/usePermission";
import { ADMIN_STATUS_META, getAdminStatus } from "./adminStatus";

const ConfirmDialog = ({ open, title, body, confirmLabel, danger, busy, onConfirm, onClose }) => (
  <Dialog open={open} onClose={busy ? () => {} : onClose} className="relative z-30">
    <DialogBackdrop className="fixed inset-0 bg-gray-500/75" />
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4">
      <DialogPanel className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <DialogTitle className="text-base font-semibold text-gray-900">
          {title}
        </DialogTitle>
        <p className="mt-2 text-sm text-gray-500">{body}</p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={`rounded-md px-3 py-2 text-sm font-semibold text-white disabled:opacity-60 ${
              danger ? "bg-red-600 hover:bg-red-500" : "bg-[#008f45] hover:bg-[#007a3a]"
            }`}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </DialogPanel>
    </div>
  </Dialog>
);

const AdminAccessPanel = ({ admin, onChanged }) => {
  const { user } = useContext(ShopContext);
  const { hasPermission, isAdmin: isSuperAdmin } = usePermission();
  const [dialog, setDialog] = useState(null); // "status" | "mfa" | null
  const [busy, setBusy] = useState(false);

  const canUpdate = hasPermission(RESOURCES.ADMINS, ACTIONS.UPDATE);
  if (!admin?.id || (!canUpdate && !isSuperAdmin)) return null;

  const isSelf = user?.id === admin.id;
  const status = getAdminStatus(admin);
  const meta = ADMIN_STATUS_META[status];
  const isActive = admin.isActive !== false;
  const mfaKnown = typeof admin.mfaEnabled === "boolean";

  const run = async (request, success) => {
    try {
      setBusy(true);
      await request();
      toast.success(success);
      setDialog(null);
      await onChanged?.();
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || "Request failed");
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = () =>
    run(
      () => apiClient.patch(`/admin/${admin.id}/status`, { isActive: !isActive }),
      isActive ? "Admin deactivated" : "Admin reactivated",
    );

  const resetMfa = () =>
    run(
      () => apiClient.post(`/admin/${admin.id}/mfa/reset`),
      "MFA reset. The admin must set it up again at next sign-in.",
    );

  const rowClass = "flex flex-wrap items-center justify-between gap-3 py-4";

  return (
    <div className="mt-5 rounded-[12px] bg-white p-4 shadow-[0px_0px_10px_0px_#EDEDED]">
      <div className="mx-auto grid w-full grid-cols-5 gap-5 px-2 py-5 sm:w-9/12">
        <div className="col-span-5 sm:col-span-2">
          <p className="text-xl font-bold">Account access</p>
          <p className="text-sm text-gray-700">
            Control whether this admin can sign in and manage their MFA.
          </p>
        </div>

        <div className="col-span-5 divide-y divide-gray-100 sm:col-span-3">
          {canUpdate && (
            <div className={rowClass}>
              <div>
                <p className="text-sm font-semibold text-gray-900">Status</p>
                <span
                  className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${meta.pill}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                  {meta.label}
                </span>
                {isSelf && (
                  <p className="mt-1 text-xs text-gray-500">
                    You cannot deactivate your own account.
                  </p>
                )}
              </div>
              <button
                type="button"
                disabled={isSelf}
                onClick={() => setDialog("status")}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
                  isActive
                    ? "border-red-300 text-red-600 hover:bg-red-50"
                    : "border-[#008f45] text-[#008f45] hover:bg-[#f6fef9]"
                }`}
              >
                {isActive ? "Deactivate admin" : "Reactivate admin"}
              </button>
            </div>
          )}

          {isSuperAdmin && (
            <div className={rowClass}>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Multi-factor authentication
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {mfaKnown
                    ? admin.mfaEnabled
                      ? "Enabled"
                      : "Not enabled"
                    : "Status unavailable"}
                </p>
              </div>
              <button
                type="button"
                disabled={isSelf || admin.mfaEnabled === false}
                onClick={() => setDialog("mfa")}
                title={isSelf ? "You cannot reset your own MFA" : undefined}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reset MFA
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={dialog === "status"}
        busy={busy}
        danger={isActive}
        title={isActive ? "Deactivate admin" : "Reactivate admin"}
        body={
          isActive
            ? `${admin.username} will be signed out immediately and will not be able to sign in until reactivated.`
            : `${admin.username} will be able to sign in again.`
        }
        confirmLabel={isActive ? "Deactivate" : "Reactivate"}
        onConfirm={changeStatus}
        onClose={() => setDialog(null)}
      />
      <ConfirmDialog
        open={dialog === "mfa"}
        busy={busy}
        danger
        title="Reset MFA"
        body={`${admin.username} will be signed out and must set up multi-factor authentication again at next sign-in.`}
        confirmLabel="Reset MFA"
        onConfirm={resetMfa}
        onClose={() => setDialog(null)}
      />
    </div>
  );
};

export default AdminAccessPanel;
