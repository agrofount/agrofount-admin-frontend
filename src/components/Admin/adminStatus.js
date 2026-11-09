// "Active" means the account can sign in: email verified and not deactivated.
// A missing isActive (older backend) is treated as active.
export const getAdminStatus = (admin) => {
  if (admin?.isActive === false) return "deactivated";
  if (!admin?.isVerified) return "unverified";
  return "active";
};

export const ADMIN_STATUS_META = {
  active: {
    label: "Active",
    pill: "bg-[#d1fadf] text-[#027a48]",
    dot: "bg-[#12b76a]",
  },
  deactivated: {
    label: "Deactivated",
    pill: "bg-[#fee4e2] text-[#b42318]",
    dot: "bg-[#f04438]",
  },
  unverified: {
    label: "Unverified",
    pill: "bg-[#fef0c7] text-[#b54708]",
    dot: "bg-[#f79009]",
  },
};
