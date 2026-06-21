import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faLock,
  faBell,
  faBuilding,
  faCreditCard,
  faUsers,
  faGear,
  faCode,
  faChevronRight,
  faCamera,
  faCircleCheck,
  faRobot,
  faArrowRightToBracket,
  faRotate,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import { ShopContext } from "../../context/ShopContext";
import { apiClient } from "../../lib/apiClient";

/* ─── Tab definitions ─────────────────────────────────────────── */
const TABS = [
  { id: "profile",   icon: faUser,         label: "Profile Information",  sub: "Update your personal details" },
  { id: "security",  icon: faLock,         label: "Security",             sub: "Change password and secure your account" },
  { id: "notifs",    icon: faBell,         label: "Notifications",        sub: "Manage your notification preferences" },
  { id: "business",  icon: faBuilding,     label: "Business Information", sub: "Update your business and store details" },
  { id: "payments",  icon: faCreditCard,   label: "Payment & Payouts",    sub: "Manage payment methods and bank details" },
  { id: "users",     icon: faUsers,        label: "Users & Roles",        sub: "Manage users and set permissions" },
  { id: "prefs",     icon: faGear,         label: "Preferences",          sub: "Customize your application experience" },
  { id: "api",       icon: faCode,         label: "API & Integrations",   sub: "Manage API keys and third-party apps" },
];

const DEPARTMENTS = ["Operations", "Technology", "Finance", "Marketing", "Sales", "HR", "Logistics"];
const LANGUAGES   = ["English (UK)", "English (US)", "French", "Arabic", "Hausa", "Yoruba", "Igbo"];
const TIMEZONES   = [
  "(GMT+01:00) West Africa Time (WAT)",
  "(GMT+00:00) Greenwich Mean Time (GMT)",
  "(GMT+02:00) Central Africa Time (CAT)",
  "(GMT-05:00) Eastern Time (ET)",
  "(GMT-08:00) Pacific Time (PT)",
];
const DATE_FORMATS = [
  "Mar 14, 2026",
  "14 Mar 2026",
  "14/03/2026",
  "03/14/2026",
  "2026-03-14",
];

const getUserName = (user) =>
  user?.name ||
  [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
  user?.fullName ||
  "";

/* ─── Profile tab ─────────────────────────────────────────────── */
const ProfileTab = ({ user }) => {
  const [form, setForm] = useState({
    name:       getUserName(user) || "",
    email:      user?.email || "",
    phone:      user?.phone || user?.phoneNumber || "",
    role:       user?.role?.name || user?.role || "Administrator",
    department: user?.department || "Operations",
    language:   user?.language || "English (UK)",
    bio:        user?.bio || "",
    timezone:   user?.timezone || TIMEZONES[0],
    dateFormat: user?.dateFormat || DATE_FORMATS[0],
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await apiClient.patch("/admin/profile", {
        name:       form.name,
        phone:      form.phone,
        department: form.department,
        language:   form.language,
        bio:        form.bio,
        timezone:   form.timezone,
        dateFormat: form.dateFormat,
      });
      toast.success("Profile updated successfully.");
    } catch (err) {
      toast.error(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm({
      name:       getUserName(user) || "",
      email:      user?.email || "",
      phone:      user?.phone || user?.phoneNumber || "",
      role:       user?.role?.name || user?.role || "Administrator",
      department: user?.department || "Operations",
      language:   user?.language || "English (UK)",
      bio:        user?.bio || "",
      timezone:   user?.timezone || TIMEZONES[0],
      dateFormat: user?.dateFormat || DATE_FORMATS[0],
    });
  };

  return (
    <form onSubmit={handleSave}>
      {/* Header row */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Profile Information</h2>
          <p className="text-sm text-gray-500 mt-0.5">Update your personal information and profile details.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            className="flex items-center gap-2 border border-gray-300 text-gray-700 text-sm px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            <FontAwesomeIcon icon={faCamera} className="text-gray-500 text-xs" />
            Change Photo
          </button>
          {user?.photo || user?.avatar ? (
            <img
              src={user.photo || user.avatar}
              alt="Profile"
              className="w-14 h-14 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center border-2 border-gray-200 text-green-700 font-bold text-lg">
              {(form.name || "A").charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
          <input
            name="email"
            value={form.email}
            readOnly
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-500 bg-gray-50 outline-none cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
          />
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
          <select
            name="role"
            value={form.role}
            disabled
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-500 bg-gray-50 outline-none cursor-not-allowed appearance-none"
          >
            <option>{form.role}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
          <select
            name="department"
            value={form.department}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 appearance-none bg-white"
          >
            {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Language</label>
          <select
            name="language"
            value={form.language}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 appearance-none bg-white"
          >
            {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
          </select>
        </div>
      </div>

      {/* Bio */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio (Optional)</label>
        <textarea
          name="bio"
          value={form.bio}
          onChange={handleChange}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 resize-y"
        />
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Time Zone</label>
          <select
            name="timezone"
            value={form.timezone}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 appearance-none bg-white"
          >
            {TIMEZONES.map((tz) => <option key={tz}>{tz}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Date Format</label>
          <select
            name="dateFormat"
            value={form.dateFormat}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 appearance-none bg-white"
          >
            {DATE_FORMATS.map((f) => <option key={f}>{f}</option>)}
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
        <button
          type="button"
          onClick={handleReset}
          className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-[#1a4731] text-white rounded-lg text-sm font-semibold hover:bg-[#163d29] disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
};

/* ─── Placeholder tab ─────────────────────────────────────────── */
const PlaceholderTab = ({ label, sub }) => (
  <div className="flex flex-col items-center justify-center py-24 text-center">
    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
      <FontAwesomeIcon icon={faGear} className="text-gray-400 text-xl" />
    </div>
    <h3 className="text-base font-semibold text-gray-700 mb-1">{label}</h3>
    <p className="text-sm text-gray-400">{sub}</p>
  </div>
);

/* ─── Account summary ─────────────────────────────────────────── */
const formatRelativeDate = (date) => {
  if (!date) return "";
  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffYears  = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365));
  const diffMonths = Math.floor((diffMs % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
  const parts = [];
  if (diffYears)  parts.push(`${diffYears} year${diffYears  !== 1 ? "s" : ""}`);
  if (diffMonths) parts.push(`${diffMonths} month${diffMonths !== 1 ? "s" : ""}`);
  return parts.length ? `${parts.join(", ")} ago` : "Recently";
};

const AccountSummary = ({ user }) => {
  const memberSince = user?.createdAt ? new Date(user.createdAt) : null;
  const memberSinceLabel = memberSince
    ? memberSince.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
    : "--";

  const SUMMARY_CARDS = [
    {
      icon: faCircleCheck,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      label: "Account Status",
      value: "Active",
      valueColor: "text-green-600",
      sub: "Your account is in good standing",
    },
    {
      icon: faRobot,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      label: "Member Since",
      value: memberSinceLabel,
      valueColor: "text-gray-900",
      sub: formatRelativeDate(user?.createdAt),
    },
    {
      icon: faArrowRightToBracket,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      label: "Last Login",
      value: "May 12, 2025",
      valueColor: "text-gray-900",
      sub: "10:24 AM (WAT)",
    },
    {
      icon: faRotate,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-500",
      label: "Total Logins",
      value: "128",
      valueColor: "text-gray-900",
      sub: "Across all devices",
    },
  ];

  return (
    <div className="mt-6">
      <h2 className="text-lg font-bold text-gray-900 leading-tight">Account Summary</h2>
      <p className="text-sm text-gray-500 mt-1 mb-4">Overview of your account activity and status.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {SUMMARY_CARDS.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-[0_0_10px_#EDEDED] p-5 flex items-center gap-4">
            <div className={`${card.iconBg} w-12 h-12 rounded-full flex items-center justify-center shrink-0`}>
              <FontAwesomeIcon icon={card.icon} className={`${card.iconColor} text-lg`} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">{card.label}</p>
              <p className={`text-base font-bold ${card.valueColor} leading-tight mt-0.5`}>{card.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── Page ────────────────────────────────────────────────────── */
const Settings = () => {
  const { user } = useContext(ShopContext);
  const [activeTab, setActiveTab] = useState("profile");

  const active = TABS.find((t) => t.id === activeTab);

  return (
    <div className="space-y-6 pb-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-[25px] font-bold text-gray-900 leading-tight tracking-[0.5px]">Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your account preferences and application settings.</p>
        </div>
        <div className="flex items-center gap-2 text-sm shrink-0 mt-1">
          <Link to="/" className="text-gray-400 hover:text-gray-600">Dashboard</Link>
          <FontAwesomeIcon icon={faChevronRight} className="text-gray-400 text-xs" />
          <span className="text-green-600 font-semibold">Settings</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* ── Left tab list ──────────────────────────────────────── */}
        <div className="w-full lg:w-[280px] shrink-0 bg-white rounded-xl shadow-[0_0_10px_#EDEDED] overflow-hidden">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-left border-b border-gray-50 last:border-b-0 transition-colors relative ${
                activeTab === tab.id
                  ? "bg-green-50 border-l-4 border-l-green-600"
                  : "hover:bg-gray-50 border-l-4 border-l-transparent"
              }`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                activeTab === tab.id ? "bg-green-100" : "bg-gray-100"
              }`}>
                <FontAwesomeIcon
                  icon={tab.icon}
                  className={`text-sm ${activeTab === tab.id ? "text-green-600" : "text-gray-500"}`}
                />
              </div>
              <div>
                <p className={`text-sm font-semibold leading-tight ${
                  activeTab === tab.id ? "text-green-700" : "text-gray-700"
                }`}>
                  {tab.label}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 leading-tight">{tab.sub}</p>
              </div>
            </button>
          ))}
        </div>

        {/* ── Right content ──────────────────────────────────────── */}
        <div className="flex-1 min-w-0 bg-white rounded-xl shadow-[0_0_10px_#EDEDED] p-6">
          {activeTab === "profile" ? (
            <ProfileTab user={user} />
          ) : (
            <PlaceholderTab label={active?.label} sub={active?.sub} />
          )}
        </div>
      </div>

      {/* Account summary — always visible */}
      <AccountSummary user={user} />
    </div>
  );
};

export default Settings;
