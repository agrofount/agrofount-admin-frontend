export const getDisplayName = (user) =>
  user?.username ||
  user?.fullName ||
  `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
  "Customer";

export const getInitials = (name) =>
  name
    .split(/[^\w]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "C";

export const getLocation = (user) =>
  user?.state?.name ||
  user?.state ||
  user?.city?.name ||
  user?.city ||
  user?.location ||
  "N/A";

// Customers who signed up with email plus a contact number have no `phone`;
// `contactPhone` was typed at sign-up and never confirmed by OTP.
export const getDisplayPhone = (user) => {
  const phone = String(user?.phone ?? "").trim();
  if (phone) return { number: phone, unverified: false };
  const contactPhone = String(user?.contactPhone ?? "").trim();
  return { number: contactPhone, unverified: Boolean(contactPhone) };
};

export const formatPhoneForWhatsApp = (phone) => {
  let digits = phone.replace(/[^\d]/g, "");
  digits = digits.replace(/^0+/, "");
  if (!digits.startsWith("234")) {
    digits = "234" + digits;
  }
  return digits;
};

export const formatJoinedDate = (value) => {
  if (!value) return ["N/A", ""];
  const date = new Date(value);
  return [
    new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }).format(date),
    new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date),
  ];
};

export const formatNaira = (value) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(
    Number(value || 0),
  );

export const orderStatusStyles = {
  pending: "bg-[#fff4e5] text-[#b54708]",
  confirmed: "bg-[#e3f6ea] text-[#008f45]",
  shipped: "bg-[#e7f0ff] text-[#1f7ae0]",
  delivered: "bg-[#dcf8e4] text-[#008f45]",
  cancelled: "bg-[#ffe4e6] text-[#ef3340]",
  returned: "bg-[#eef2f6] text-[#667085]",
};
