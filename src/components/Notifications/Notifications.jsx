import {
  faArrowPointer,
  faArrowRight,
  faArrowsRotate,
  faBolt,
  faBullhorn,
  faCheck,
  faCalendarDays,
  faCartShopping,
  faChartBar,
  faChevronLeft,
  faChevronRight,
  faCircleCheck,
  faCircleXmark,
  faClock,
  faClockRotateLeft,
  faComment,
  faCommentDots,
  faCreditCard,
  faDesktop,
  faDownload,
  faEllipsisVertical,
  faEnvelope,
  faEye,
  faFileLines,
  faFloppyDisk,
  faImage,
  faLeaf,
  faLightbulb,
  faLink,
  faListCheck,
  faMagnifyingGlass,
  faMobileScreen,
  faPaperPlane,
  faPencil,
  faSeedling,
  faShieldHalved,
  faSyringe,
  faTag,
  faTriangleExclamation,
  faUserPlus,
  faUsers,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { apiClient, parseApiError } from "../../lib/apiClient";

const NOTIFICATION_TYPES = ["Promotion", "Announcement", "Reminder", "Order Update", "System Alert"];

const CHANNELS = [
  { id: "push", label: "Push", icon: faMobileScreen },
  { id: "in-app", label: "In-app", icon: faDesktop },
  { id: "email", label: "Email", icon: faEnvelope },
  { id: "sms", label: "SMS", icon: faComment },
  { id: "whatsapp", label: "WhatsApp", icon: faCommentDots },
];

const TABS = [
  { label: "Create Notification", icon: faBullhorn },
  { label: "Scheduled", icon: faClock },
  { label: "Sent History", icon: faClockRotateLeft },
  { label: "Templates", icon: faFileLines },
];

const PREVIEW_TABS = ["Push Preview", "In-app Preview", "WhatsApp Preview", "Email Preview"];


const CATEGORY_ICON_MAP = {
  announcement: { icon: faPaperPlane, bg: "#006638", color: "#fff" },
  promotional: { icon: faCreditCard, bg: "#fef3c7", color: "#d97706" },
  educational: { icon: faChartBar, bg: "#dbeafe", color: "#3b82f6" },
  reminder: { icon: faCartShopping, bg: "#ede9fe", color: "#7c3fd3" },
  transactional: { icon: faCreditCard, bg: "#fef3c7", color: "#d97706" },
};

const CHANNEL_DISPLAY = {
  push: { icon: faMobileScreen, color: "#1f7ae0", bg: "#eaf4ff", label: "Push" },
  in_app: { icon: faDesktop, color: "#008f45", bg: "#dcf8e4", label: "In-app" },
  email: { icon: faEnvelope, color: "#f59e0b", bg: "#fef3c7", label: "Email" },
  sms: { icon: faComment, color: "#7c3fd3", bg: "#ede9fe", label: "SMS" },
  whatsapp: { icon: faCommentDots, color: "#059669", bg: "#d1fae5", label: "WhatsApp" },
};

const EMAIL_FEATURE_ICONS = [
  { key: "seedling", icon: faSeedling, label: "Seedling" },
  { key: "leaf", icon: faLeaf, label: "Leaf" },
  { key: "syringe", icon: faSyringe, label: "Syringe" },
  { key: "shield", icon: faShieldHalved, label: "Shield" },
  { key: "calendar", icon: faCalendarDays, label: "Calendar" },
  { key: "check", icon: faCheck, label: "Checkmark" },
  { key: "chart", icon: faChartBar, label: "Chart" },
  { key: "lightbulb", icon: faLightbulb, label: "Lightbulb" },
  { key: "bolt", icon: faBolt, label: "Quick Tip" },
  { key: "users", icon: faUsers, label: "Users" },
  { key: "tag", icon: faTag, label: "Tag" },
  { key: "list", icon: faListCheck, label: "Checklist" },
];

const EMAIL_ICON_FA_MAP = Object.fromEntries(EMAIL_FEATURE_ICONS.map(({ key, icon }) => [key, icon]));

const ICON_SYMBOL_MAP = {
  seedling: "&#127807;", leaf: "&#127807;", syringe: "&#128137;",
  shield: "&#128737;", calendar: "&#128197;", check: "&#10003;",
  chart: "&#128202;", lightbulb: "&#128161;", bolt: "&#9889;",
  users: "&#128101;", tag: "&#127991;", list: "&#128203;",
};

const generateEmailHtml = ({ title, message, ctaText, ctaLink, categoryLabel, heroImageUrl, features, showAyo }) => {
  const cleanFeatures = (features || []).filter((f) => f.title && f.description);

  const bannerRow = heroImageUrl
    ? `<tr><td style="padding:0 0 16px;"><img src="${heroImageUrl}" alt="" style="width:100%;border-radius:8px;display:block;" /></td></tr>`
    : "";

  const categoryRow = categoryLabel
    ? `<tr><td style="padding:0 0 14px;"><span style="display:inline-block;background:#dcf8e4;color:#006638;font-size:11px;font-weight:700;letter-spacing:1.5px;padding:4px 14px;border-radius:20px;text-transform:uppercase;">${categoryLabel}</span></td></tr>`
    : "";

  const ctaRow =
    ctaText && ctaLink
      ? `<tr><td style="padding:20px 0 4px;"><a href="${ctaLink}" style="display:inline-block;background:#008f45;color:#ffffff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;">${ctaText}</a></td></tr>`
      : "";

  const featuresRows = cleanFeatures.length
    ? `<tr><td style="padding:24px 0 0;">
        <p style="font-size:14px;font-weight:700;color:#101828;margin:0 0 14px;">In This Guide, You&rsquo;ll Learn:</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${cleanFeatures
            .map(
              (f) => `
          <tr>
            <td style="width:40px;vertical-align:top;padding:0 12px 14px 0;">
              <div style="width:36px;height:36px;background:#dcf8e4;border-radius:50%;text-align:center;line-height:36px;font-size:18px;">${ICON_SYMBOL_MAP[f.icon] ?? "&#10003;"}</div>
            </td>
            <td style="vertical-align:top;padding-bottom:14px;">
              <p style="font-size:13px;font-weight:700;color:#101828;margin:0 0 3px;">${f.title}</p>
              <p style="font-size:12px;color:#667085;margin:0;line-height:1.5;">${f.description}</p>
            </td>
          </tr>`,
            )
            .join("")}
        </table>
      </td></tr>`
    : "";

  const ayoRow = showAyo
    ? `<tr><td style="padding:24px 0 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fbf5;border-radius:10px;">
          <tr><td style="padding:20px;">
            <p style="font-size:14px;font-weight:700;color:#101828;margin:0 0 6px;">Have Questions? Ask Ayo &#129302;</p>
            <p style="font-size:12px;color:#475467;margin:0 0 14px;line-height:1.5;">Ayo is your AI farming assistant. Get personalised advice on crops, livestock, and market prices &mdash; 24/7.</p>
            <a href="https://agrofount.com/ayo" style="display:inline-block;background:#008f45;color:#ffffff;font-size:13px;font-weight:600;padding:10px 22px;border-radius:8px;text-decoration:none;">Chat with Ayo</a>
          </td></tr>
        </table>
      </td></tr>`
    : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td align="center" style="padding:0;">
      <!-- Header -->
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#006638;">
        <tr>
          <td align="center" style="padding:20px 24px 18px;">
            <p style="margin:0;font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Agrofount</p>
            <p style="margin:4px 0 0;font-size:11px;color:#a7f3c0;letter-spacing:0.5px;">Empowering Nigerian Farmers</p>
          </td>
        </tr>
      </table>
      <!-- Body -->
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;">
        <tr><td style="padding:28px 32px 8px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            ${categoryRow}
            ${bannerRow}
            <tr><td style="padding:0 0 12px;"><h1 style="font-size:22px;font-weight:700;color:#101828;margin:0;line-height:1.3;">${title}</h1></td></tr>
            <tr><td style="padding:0 0 4px;"><p style="font-size:14px;color:#475467;line-height:1.6;margin:0;">${message}</p></td></tr>
            ${ctaRow}
            ${featuresRows}
            ${ayoRow}
          </table>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #f0f2f5;">
          <p style="font-size:11px;color:#98a2b3;margin:0;">You are receiving this because you have a registered Agrofount account. &nbsp;<a href="#" style="color:#667085;text-decoration:none;">Unsubscribe</a> &middot; <a href="#" style="color:#667085;text-decoration:none;">Manage Preferences</a></p>
        </td></tr>
      </table>
      <!-- Footer -->
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#1a2e22;">
        <tr>
          <td align="center" style="padding:18px 24px;">
            <p style="font-size:11px;color:#98a2b3;margin:0;">support@agrofount.com &nbsp;&middot;&nbsp; 08000-AGROFOUNT</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
};

const getCampaignIcon = (campaign) =>
  CATEGORY_ICON_MAP[campaign.category] ?? { icon: faBullhorn, bg: "#006638", color: "#fff" };

const getAudienceLabel = (audience) => {
  if (!audience) return { name: "All Users", location: "All Locations" };
  if (audience.name) return { name: audience.name, location: audience.location || "All Locations" };
  if (audience.all) return { name: "All Users", location: "All Locations" };
  const bt = audience.businessTypes?.map((b) => b.charAt(0).toUpperCase() + b.slice(1)).join(", ");
  const states = audience.states?.join(", ");
  return { name: bt || "Custom Audience", location: states || "All Locations" };
};

const formatScheduled = (scheduledAt, frequency) => {
  if (frequency && frequency !== "once") {
    const label = { daily: "Daily", weekly: "Weekly", monthly: "Monthly" }[frequency] ?? frequency;
    const time = scheduledAt
      ? new Date(scheduledAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
      : "08:00 AM";
    return { type: "recurring", label: `Recurring ${label}`, time };
  }
  if (!scheduledAt) return { type: "none", label: "Not scheduled", time: "" };
  const d = new Date(scheduledAt);
  return {
    type: "once",
    label: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
  };
};

const formatCreatedDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const StatusPill = ({ status }) => {
  const map = {
    scheduled: { dot: "bg-[#008f45]", bg: "bg-[#dcf8e4]", text: "text-[#008f45]", label: "Scheduled" },
    sending: { dot: "bg-[#3b82f6]", bg: "bg-[#dbeafe]", text: "text-[#3b82f6]", label: "Sending" },
    sent: { dot: "bg-[#008f45]", bg: "bg-[#dcf8e4]", text: "text-[#008f45]", label: "Completed" },
    failed: { dot: "bg-[#ef3340]", bg: "bg-[#fee2e2]", text: "text-[#ef3340]", label: "Failed" },
    draft: { dot: "bg-[#98a2b3]", bg: "bg-[#f0f2f5]", text: "text-[#667085]", label: "Draft" },
  };
  const cfg = map[status] ?? map.scheduled;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

const PAGE_SIZE = 5;

const ScheduledTab = ({ onScheduleNew }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [openActionId, setOpenActionId] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    apiClient
      .get("/message/campaign")
      .then((res) => {
        if (Array.isArray(res.data)) setCampaigns(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const stats = {
    scheduled: campaigns.filter((c) => ["scheduled", "sending"].includes(c.status)).length,
    sendingToday: campaigns.filter((c) => {
      if (!c.scheduledAt) return false;
      const d = new Date(c.scheduledAt);
      return d >= today && d < tomorrow;
    }).length,
    recurring: campaigns.filter((c) => c.frequency && c.frequency !== "once").length,
    draft: campaigns.filter((c) => c.status === "draft").length,
  };

  const filtered = campaigns.filter((c) => {
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (channelFilter !== "all" && !c.channels.includes(channelFilter)) return false;
    if (dateFrom && c.scheduledAt && new Date(c.scheduledAt) < new Date(dateFrom)) return false;
    if (dateTo && c.scheduledAt && new Date(c.scheduledAt) > new Date(dateTo + "T23:59:59")) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, filtered.length);

  return (
    <div className="space-y-5">
      {openActionId && <div className="fixed inset-0 z-[9]" onClick={() => setOpenActionId(null)} />}
      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: faCalendarDays, bg: "bg-[#dcf8e4]", color: "text-[#008f45]", value: stats.scheduled, label: "Scheduled Campaigns", note: "Upcoming notifications", noteColor: "text-[#008f45]" },
          { icon: faClock, bg: "bg-[#fef3c7]", color: "text-[#f59e0b]", value: stats.sendingToday, label: "Sending Today", note: "Due to be sent today", noteColor: "text-[#f59e0b]" },
          { icon: faArrowsRotate, bg: "bg-[#ede9fe]", color: "text-[#7c3fd3]", value: stats.recurring, label: "Recurring Campaigns", note: "Active recurring", noteColor: "text-[#7c3fd3]" },
          { icon: faFileLines, bg: "bg-[#dbeafe]", color: "text-[#3b82f6]", value: stats.draft, label: "Draft Campaigns", note: "Not yet scheduled", noteColor: "text-[#3b82f6]" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-3 rounded-lg border border-[#e5e7eb] bg-white px-4 py-3 shadow-[0_2px_8px_rgba(16,24,40,0.04)]">
            <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${s.bg}`}>
              <FontAwesomeIcon icon={s.icon} className={`text-base ${s.color}`} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-[#667085]">{s.label}</p>
              <p className="text-xl font-bold text-[#101828]">{s.value}</p>
              <p className={`text-[11px] font-medium ${s.noteColor}`}>{s.note}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="rounded-lg border border-[#e5e7eb] bg-white shadow-[0_2px_8px_rgba(16,24,40,0.04)]">
        <div className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative min-w-[200px] flex-1">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#98a2b3]" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="h-9 w-full rounded-md border border-[#d0d5dd] bg-white pl-8 pr-3 text-sm text-[#101828] outline-none focus:border-[#008f45] focus:ring-2 focus:ring-[#dff4e5]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="h-9 rounded-md border border-[#d0d5dd] bg-white px-3 text-sm text-[#344054] outline-none focus:border-[#008f45]"
          >
            <option value="all">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="sending">Sending</option>
            <option value="sent">Sent</option>
            <option value="draft">Draft</option>
            <option value="failed">Failed</option>
          </select>
          <select
            value={channelFilter}
            onChange={(e) => { setChannelFilter(e.target.value); setPage(1); }}
            className="h-9 rounded-md border border-[#d0d5dd] bg-white px-3 text-sm text-[#344054] outline-none focus:border-[#008f45]"
          >
            <option value="all">All Channels</option>
            <option value="push">Push</option>
            <option value="in_app">In-app</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
          <select className="h-9 rounded-md border border-[#d0d5dd] bg-white px-3 text-sm text-[#344054] outline-none focus:border-[#008f45]">
            <option>All Audience</option>
            <option>All Users</option>
            <option>Farmers</option>
            <option>New Customers</option>
          </select>
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="h-9 rounded-md border border-[#d0d5dd] bg-white px-2 text-sm text-[#344054] outline-none focus:border-[#008f45]"
            />
            <span className="text-xs text-[#98a2b3]">–</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="h-9 rounded-md border border-[#d0d5dd] bg-white px-2 text-sm text-[#344054] outline-none focus:border-[#008f45]"
            />
          </div>
          <button
            type="button"
            onClick={onScheduleNew}
            className="ml-auto flex h-9 items-center gap-2 rounded-md bg-[#006638] px-4 text-sm font-semibold text-white hover:bg-[#005530]"
          >
            <span className="text-base leading-none">+</span>
            Schedule New Notification
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full border-collapse text-left">
            <thead>
              <tr className="border-y border-[#e5e7eb] bg-[#f9fafb]">
                {["Campaign", "Audience", "Channels", "Scheduled For", "Status", "Recipients", "Created By", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[#667085]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-[#667085]">
                    Loading campaigns...
                  </td>
                </tr>
              )}
              {!loading && paged.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-[#667085]">
                    No campaigns found.
                  </td>
                </tr>
              )}
              {!loading && paged.map((campaign) => {
                const ic = getCampaignIcon(campaign);
                const audience = getAudienceLabel(campaign.audience);
                const scheduled = formatScheduled(campaign.scheduledAt, campaign.frequency);
                return (
                  <tr key={campaign.id} className="border-b border-[#f0f2f5] hover:bg-[#fafafa]">
                    {/* Campaign */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg"
                          style={{ background: ic.bg }}
                        >
                          <FontAwesomeIcon icon={ic.icon} className="text-sm" style={{ color: ic.color }} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#101828]">{campaign.title}</p>
                          <p className="truncate text-[11px] text-[#667085]">{campaign.message}</p>
                        </div>
                      </div>
                    </td>
                    {/* Audience */}
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        <FontAwesomeIcon icon={faUsers} className="mt-0.5 shrink-0 text-[11px] text-[#98a2b3]" />
                        <div>
                          <p className="text-xs font-semibold text-[#101828]">{audience.name}</p>
                          <p className="text-[11px] text-[#667085]">{audience.location}</p>
                        </div>
                      </div>
                    </td>
                    {/* Channels */}
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {campaign.channels.map((ch) => {
                          const cfg = CHANNEL_DISPLAY[ch];
                          if (!cfg) return null;
                          return (
                            <div key={ch} className="grid h-6 w-6 place-items-center rounded-md" style={{ background: cfg.bg }}>
                              <FontAwesomeIcon icon={cfg.icon} className="text-[9px]" style={{ color: cfg.color }} />
                            </div>
                          );
                        })}
                      </div>
                      <p className="mt-1 text-[11px] text-[#667085]">
                        {campaign.channels.map((ch) => CHANNEL_DISPLAY[ch]?.label).filter(Boolean).join(" • ")}
                      </p>
                    </td>
                    {/* Scheduled For */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <FontAwesomeIcon
                          icon={scheduled.type === "recurring" ? faArrowsRotate : faCalendarDays}
                          className="shrink-0 text-[11px] text-[#667085]"
                        />
                        <p className="text-xs font-semibold text-[#101828]">{scheduled.label}</p>
                      </div>
                      <p className="mt-0.5 text-[11px] text-[#667085]">{scheduled.time}</p>
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusPill status={campaign.status} />
                    </td>
                    {/* Recipients */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faUsers} className="text-[11px] text-[#98a2b3]" />
                        <span className="text-xs font-semibold text-[#101828]">
                          {(campaign.totalRecipients ?? 0).toLocaleString()} users
                        </span>
                      </div>
                    </td>
                    {/* Created By */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#006638] text-[11px] font-bold text-white">
                          {(campaign.createdBy ?? "A")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#101828]">{campaign.createdBy ?? "Admin"}</p>
                          <p className="text-[11px] text-[#667085]">{formatCreatedDate(campaign.createdAt)}</p>
                        </div>
                      </div>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setOpenActionId(openActionId === campaign.id ? null : campaign.id)}
                          className="grid h-7 w-7 place-items-center rounded-md text-[#667085] hover:bg-[#f0f2f5]"
                        >
                          <FontAwesomeIcon icon={faEllipsisVertical} className="text-sm" />
                        </button>
                        {openActionId === campaign.id && (
                          <div className="absolute right-0 top-full z-10 mt-1 w-44 rounded-lg border border-[#e5e7eb] bg-white py-1 shadow-lg">
                            <button
                              type="button"
                              onClick={() => setOpenActionId(null)}
                              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-[#344054] hover:bg-[#f9fafb]"
                            >
                              <FontAwesomeIcon icon={faEye} className="text-xs text-[#667085]" />
                              View Details
                            </button>
                            <button
                              type="button"
                              onClick={() => { onScheduleNew(); setOpenActionId(null); }}
                              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-[#344054] hover:bg-[#f9fafb]"
                            >
                              <FontAwesomeIcon icon={faPencil} className="text-xs text-[#667085]" />
                              Edit Campaign
                            </button>
                            <div className="mx-3 my-1 border-t border-[#f0f2f5]" />
                            <button
                              type="button"
                              onClick={() => setOpenActionId(null)}
                              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-[#ef3340] hover:bg-[#fff5f5]"
                            >
                              <FontAwesomeIcon icon={faCircleXmark} className="text-xs" />
                              Cancel Campaign
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-[#e5e7eb] px-4 py-3">
          <p className="text-[12px] text-[#667085]">
            {filtered.length === 0
              ? "No entries"
              : `Showing ${from} to ${to} of ${filtered.length} entries`}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="grid h-8 w-8 place-items-center rounded-md border border-[#d0d5dd] text-[#667085] disabled:opacity-40 hover:bg-[#f0f2f5]"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="text-[10px]" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`grid h-8 w-8 place-items-center rounded-md border text-xs font-semibold transition-colors ${
                  page === p
                    ? "border-[#006638] bg-[#006638] text-white"
                    : "border-[#d0d5dd] text-[#667085] hover:bg-[#f0f2f5]"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="grid h-8 w-8 place-items-center rounded-md border border-[#d0d5dd] text-[#667085] disabled:opacity-40 hover:bg-[#f0f2f5]"
            >
              <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


const EngagementChart = ({ data }) => {
  if (!data?.length) return null;
  const W = 248, H = 114, PT = 8, PB = 22, PL = 26, PR = 6;
  const CW = W - PL - PR;
  const CH = H - PT - PB;
  const maxVal = Math.max(...data.flatMap((d) => [d.opened, d.clicked]), 1);
  const ceil = Math.ceil(maxVal / 2000) * 2000 || 2000;
  const gridVals = Array.from({ length: Math.floor(ceil / 2000) + 1 }, (_, i) => i * 2000);
  const xOf = (i) => PL + (i / Math.max(data.length - 1, 1)) * CW;
  const yOf = (v) => PT + CH * (1 - v / ceil);
  const makePath = (key) =>
    data.map((d, i) => `${i === 0 ? "M" : "L"}${xOf(i).toFixed(1)},${yOf(d[key]).toFixed(1)}`).join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="w-full">
      {gridVals.map((v) => (
        <g key={v}>
          <line x1={PL} y1={yOf(v)} x2={W - PR} y2={yOf(v)} stroke="#f0f2f5" strokeWidth="0.8" />
          <text x={PL - 3} y={yOf(v)} textAnchor="end" dominantBaseline="middle" fontSize="7" fill="#98a2b3">
            {v === 0 ? "0" : v >= 1000 ? `${v / 1000}K` : v}
          </text>
        </g>
      ))}
      <path d={makePath("opened")} fill="none" stroke="#7c3fd3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d={makePath("clicked")} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => (
        <text key={i} x={xOf(i)} y={H - 4} textAnchor="middle" fontSize="6.5" fill="#98a2b3">
          {d.date.replace("Jun ", "")}
        </text>
      ))}
    </svg>
  );
};

const SentHistoryTab = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [openActionId, setOpenActionId] = useState(null);
  const [page, setPage] = useState(1);
  const PSIZE = 5;

  useEffect(() => {
    apiClient
      .get("/message/campaign?status=sent")
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.data;
        if (Array.isArray(data)) {
          setCampaigns(data);
          setSelected(data[0] ?? null);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = campaigns.filter((c) => {
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (channelFilter !== "all" && !(c.channels ?? []).includes(channelFilter)) return false;
    if (dateFrom && c.sentAt && new Date(c.sentAt) < new Date(dateFrom)) return false;
    if (dateTo && c.sentAt && new Date(c.sentAt) > new Date(dateTo + "T23:59:59")) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PSIZE));
  const paged = filtered.slice((page - 1) * PSIZE, page * PSIZE);
  const from = filtered.length === 0 ? 0 : (page - 1) * PSIZE + 1;
  const to = Math.min(page * PSIZE, filtered.length);

  const totalRecipients = campaigns.reduce((s, c) => s + (c.totalRecipients ?? c.totalSent ?? 0), 0);
  const withOpenPct = campaigns.filter((c) => c.openedPct != null);
  const avgOpenRate = withOpenPct.length ? (withOpenPct.reduce((s, c) => s + c.openedPct, 0) / withOpenPct.length).toFixed(1) + "%" : "—";
  const withClickPct = campaigns.filter((c) => (c.clickedPct ?? c.ctr) != null);
  const avgClickRate = withClickPct.length ? (withClickPct.reduce((s, c) => s + (c.clickedPct ?? c.ctr), 0) / withClickPct.length).toFixed(1) + "%" : "—";

  const formatSentDate = (iso) => {
    if (!iso) return { date: "-", time: "" };
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
    };
  };

  return (
    <>
      {openActionId && <div className="fixed inset-0 z-[9]" onClick={() => setOpenActionId(null)} />}
      <div className="flex gap-4 items-start">
      {/* Left: main content */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { icon: faPaperPlane, bg: "bg-[#dcf8e4]", color: "text-[#008f45]", value: loading ? "…" : campaigns.length.toString(), label: "Total Notifications Sent", note: null },
            { icon: faUsers, bg: "bg-[#dbeafe]", color: "text-[#3b82f6]", value: loading ? "…" : totalRecipients.toLocaleString(), label: "Total Recipients Reached", note: null },
            { icon: faEye, bg: "bg-[#ede9fe]", color: "text-[#7c3fd3]", value: loading ? "…" : avgOpenRate, label: "Average Open Rate", note: null },
            { icon: faArrowPointer, bg: "bg-[#fef3c7]", color: "text-[#f59e0b]", value: loading ? "…" : avgClickRate, label: "Average Click Rate", note: null },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3 rounded-lg border border-[#e5e7eb] bg-white px-4 py-3 shadow-[0_2px_8px_rgba(16,24,40,0.04)]">
              <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${s.bg}`}>
                <FontAwesomeIcon icon={s.icon} className={`text-base ${s.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-[#667085]">{s.label}</p>
                <p className="text-xl font-bold text-[#101828]">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filter + table card */}
        <div className="rounded-lg border border-[#e5e7eb] bg-white shadow-[0_2px_8px_rgba(16,24,40,0.04)]">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 border-b border-[#f0f2f5] p-4">
            <div className="relative">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#98a2b3]" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="h-9 w-48 rounded-md border border-[#d0d5dd] bg-white pl-8 pr-3 text-sm text-[#101828] outline-none focus:border-[#008f45]"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                className="h-9 rounded-md border border-[#d0d5dd] bg-white px-2 text-sm text-[#344054] outline-none focus:border-[#008f45]"
              />
              <span className="text-xs text-[#98a2b3]">–</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                className="h-9 rounded-md border border-[#d0d5dd] bg-white px-2 text-sm text-[#344054] outline-none focus:border-[#008f45]"
              />
            </div>
            <select
              value={channelFilter}
              onChange={(e) => { setChannelFilter(e.target.value); setPage(1); }}
              className="h-9 rounded-md border border-[#d0d5dd] bg-white px-3 text-sm text-[#344054] outline-none"
            >
              <option value="all">All Channels</option>
              <option value="push">Push</option>
              <option value="in_app">In-app</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
            <select className="h-9 rounded-md border border-[#d0d5dd] bg-white px-3 text-sm text-[#344054] outline-none">
              <option>All Audience</option>
            </select>
            <select className="h-9 rounded-md border border-[#d0d5dd] bg-white px-3 text-sm text-[#344054] outline-none">
              <option>All Status</option>
              <option>Completed</option>
              <option>Failed</option>
            </select>
            <button type="button" className="ml-auto flex h-9 items-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-4 text-sm font-medium text-[#344054] hover:bg-[#f9fafb]">
              <FontAwesomeIcon icon={faDownload} className="text-xs" />
              Export Report
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-[920px] w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
                  {["Campaign", "Channel", "Audience", "Sent Date", "Recipients", "Delivered", "Opened", "Clicked", "CTR", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-[#667085] whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={11} className="px-4 py-10 text-center text-sm text-[#667085]">Loading…</td>
                  </tr>
                )}
                {!loading && paged.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-4 py-10 text-center text-sm text-[#667085]">No campaigns found.</td>
                  </tr>
                )}
                {paged.map((c) => {
                  const ic = getCampaignIcon(c);
                  const aud = getAudienceLabel(c.audience);
                  const sd = formatSentDate(c.sentAt ?? c.scheduledAt ?? c.createdAt);
                  const isSelected = selected?.id === c.id;
                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelected(c)}
                      className={`cursor-pointer border-b border-[#f0f2f5] transition-colors ${isSelected ? "bg-[#f0fbf5]" : "hover:bg-[#fafafa]"}`}
                    >
                      <td className="px-3 py-3 max-w-[170px]">
                        <div className="flex items-center gap-2.5">
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg" style={{ background: ic.bg }}>
                            <FontAwesomeIcon icon={ic.icon} className="text-xs" style={{ color: ic.color }} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-[#101828]">{c.title}</p>
                            <p className="truncate text-[10px] text-[#667085]">{c.message}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="space-y-0.5">
                          {(c.channels ?? []).map((ch) => {
                            const cfg = CHANNEL_DISPLAY[ch];
                            return cfg ? (
                              <div key={ch} className="flex items-center gap-1">
                                <FontAwesomeIcon icon={cfg.icon} className="text-[10px]" style={{ color: cfg.color }} />
                                <span className="text-[11px] text-[#344054]">{cfg.label}</span>
                              </div>
                            ) : null;
                          })}
                        </div>
                      </td>
                      <td className="px-3 py-3 max-w-[120px]">
                        <p className="truncate text-xs font-semibold text-[#101828]">{aud.name}</p>
                        <p className="truncate text-[10px] text-[#667085]">{aud.location}</p>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <p className="text-xs font-semibold text-[#101828]">{sd.date}</p>
                        <p className="text-[11px] text-[#667085]">{sd.time}</p>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <p className="text-xs font-semibold text-[#101828]">{(c.totalRecipients ?? 0).toLocaleString()}</p>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <p className="text-xs font-semibold text-[#101828]">{(c.delivered ?? c.totalSent ?? 0).toLocaleString()}</p>
                        <p className="text-[11px] text-[#667085]">{c.deliveredPct ?? 0}%</p>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <p className="text-xs font-semibold text-[#101828]">{(c.opened ?? 0).toLocaleString()}</p>
                        <p className="text-[11px] text-[#3b82f6]">{c.openedPct ?? 0}%</p>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <p className="text-xs font-semibold text-[#101828]">{(c.clicked ?? 0).toLocaleString()}</p>
                        <p className="text-[11px] text-[#008f45]">{c.clickedPct ?? 0}%</p>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <p className="text-xs font-semibold text-[#101828]">{c.ctr ?? 0}%</p>
                      </td>
                      <td className="px-3 py-3">
                        <StatusPill status={c.status} />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setSelected(c); }}
                            className="grid h-7 w-7 place-items-center rounded-md text-[#667085] hover:bg-[#f0f2f5]"
                          >
                            <FontAwesomeIcon icon={faEye} className="text-xs" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => e.stopPropagation()}
                            className="grid h-7 w-7 place-items-center rounded-md text-[#667085] hover:bg-[#f0f2f5]"
                          >
                            <FontAwesomeIcon icon={faEllipsisVertical} className="text-sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-[#e5e7eb] px-4 py-3">
            <p className="text-[12px] text-[#667085]">
              {filtered.length === 0 ? "No entries" : `Showing ${from} to ${to} of ${filtered.length} entries`}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="grid h-8 w-8 place-items-center rounded-md border border-[#d0d5dd] text-[#667085] disabled:opacity-40 hover:bg-[#f0f2f5]"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="text-[10px]" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`grid h-8 w-8 place-items-center rounded-md border text-xs font-semibold transition-colors ${page === p ? "border-[#006638] bg-[#006638] text-white" : "border-[#d0d5dd] text-[#667085] hover:bg-[#f0f2f5]"}`}
                >
                  {p}
                </button>
              ))}
              {totalPages > 5 && <span className="px-1 text-xs text-[#667085]">...</span>}
              {totalPages > 5 && (
                <button
                  type="button"
                  onClick={() => setPage(totalPages)}
                  className={`grid h-8 w-8 place-items-center rounded-md border text-xs font-semibold ${page === totalPages ? "border-[#006638] bg-[#006638] text-white" : "border-[#d0d5dd] text-[#667085] hover:bg-[#f0f2f5]"}`}
                >
                  {totalPages}
                </button>
              )}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="grid h-8 w-8 place-items-center rounded-md border border-[#d0d5dd] text-[#667085] disabled:opacity-40 hover:bg-[#f0f2f5]"
              >
                <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right: detail panel */}
      {selected && (
        <div className="w-[280px] shrink-0 space-y-4 rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_2px_8px_rgba(16,24,40,0.04)] max-h-[calc(100vh-180px)] overflow-y-auto sticky top-4">
          {/* Header */}
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-bold text-[#101828] leading-snug">{selected.title}</h3>
              <StatusPill status={selected.status} />
            </div>
            <p className="mt-1 text-[11px] text-[#667085]">
              Sent on{" "}
              {new Date(selected.sentAt ?? selected.scheduledAt ?? "").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}{" "}
              at{" "}
              {new Date(selected.sentAt ?? selected.scheduledAt ?? "").toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
            </p>
          </div>

          <div className="border-t border-[#f0f2f5]" />

          {/* Metrics */}
          <div className="space-y-2.5">
            {[
              { icon: faUsers, label: "Recipients", value: (selected.totalRecipients ?? 0).toLocaleString(), color: "text-[#101828]" },
              { icon: faEnvelope, label: "Delivered", value: `${(selected.delivered ?? selected.totalSent ?? 0).toLocaleString()} (${selected.deliveredPct ?? 0}%)`, color: "text-[#101828]" },
              { icon: faEye, label: "Opened", value: `${(selected.opened ?? 0).toLocaleString()} (${selected.openedPct ?? 0}%)`, color: "text-[#3b82f6]" },
              { icon: faArrowPointer, label: "Clicked", value: `${(selected.clicked ?? 0).toLocaleString()} (${selected.clickedPct ?? 0}%)`, color: "text-[#008f45]" },
              { icon: faCircleXmark, label: "Failed", value: `${(selected.failed ?? 0).toLocaleString()} (${selected.failedPct ?? 0}%)`, color: "text-[#ef3340]" },
            ].map(({ icon, label, value, color }) => (
              <div key={label} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[#667085]">
                  <FontAwesomeIcon icon={icon} className="w-3 text-xs" />
                  <span className="text-[12px]">{label}</span>
                </div>
                <span className={`text-[12px] font-semibold ${color}`}>{value}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-[#f0f2f5]" />

          {/* Engagement chart */}
          {selected.chartData?.length > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-xs font-semibold text-[#101828]">Engagement Over Time</h4>
                <div className="flex items-center gap-3 text-[10px] text-[#667085]">
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#7c3fd3]" />
                    Opened
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#f59e0b]" />
                    Clicked
                  </span>
                </div>
              </div>
              <EngagementChart data={selected.chartData} />
            </div>
          )}

          {selected.topLocations?.length > 0 && (
            <>
              <div className="border-t border-[#f0f2f5]" />
              <div>
                <h4 className="mb-2.5 text-xs font-semibold text-[#101828]">Top Locations</h4>
                <div className="space-y-2">
                  {selected.topLocations.map((loc) => (
                    <div key={loc.name}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[11px] text-[#344054]">{loc.name}</span>
                        <span className="text-[11px] text-[#667085]">{loc.count.toLocaleString()} ({loc.pct}%)</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-[#f0f2f5]">
                        <div className="h-1.5 rounded-full bg-[#006638]" style={{ width: `${loc.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {selected.topCta?.length > 0 && (
            <>
              <div className="border-t border-[#f0f2f5]" />
              <div>
                <h4 className="mb-2.5 text-xs font-semibold text-[#101828]">Top CTA Clicked</h4>
                {selected.topCta.map((cta) => (
                  <div key={cta.label} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="min-w-0 truncate text-[11px] text-[#344054]">{cta.label}</span>
                      <span className="ml-2 shrink-0 text-[11px] font-semibold text-[#101828]">{cta.count.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#f0f2f5]">
                      <div className="h-1.5 rounded-full bg-[#006638]" style={{ width: `${cta.pct}%` }} />
                    </div>
                    <p className="text-[10px] text-[#98a2b3]">(100% of total clicks)</p>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="border-t border-[#f0f2f5]" />

          <button type="button" className="flex h-9 w-full items-center justify-center rounded-md border border-[#d0d5dd] bg-white text-sm font-medium text-[#344054] hover:bg-[#f9fafb]">
            View Detailed Report
          </button>
        </div>
      )}
      </div>
    </>
  );
};

const StatCard = ({ icon, label, value, note, iconBg, iconColor, noteColor }) => (
  <div className="flex items-center gap-3 rounded-lg border border-[#e5e7eb] bg-white px-4 py-3 shadow-[0_2px_8px_rgba(16,24,40,0.04)]">
    <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${iconBg}`}>
      <FontAwesomeIcon icon={icon} className={`text-base ${iconColor}`} />
    </div>
    <div className="min-w-0">
      <p className="text-[11px] font-medium text-[#667085]">{label}</p>
      <p className="truncate text-xl font-bold text-[#101828]">{value}</p>
      <p className={`text-[11px] font-medium ${noteColor}`}>{note}</p>
    </div>
  </div>
);

const Step = ({ number, title, children }) => (
  <div className="space-y-2.5">
    <div className="flex items-center gap-2">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#008f45] text-[11px] font-bold text-white">
        {number}
      </span>
      <p className="text-sm font-semibold text-[#101828]">{title}</p>
    </div>
    {children}
  </div>
);

const PushPreview = ({ title, message, bannerPreview }) => (
  <div className="flex justify-center rounded-lg bg-[#1c1c1e] px-3 py-5">
    <div className="w-full max-w-[264px]">
      <div className="mb-2 flex justify-between px-1 text-[10px] text-white/40">
        <span>9:41</span>
        <span>▐ ▌▌</span>
      </div>
      <div className="rounded-2xl bg-white/95 p-3 shadow-lg">
        <div className="mb-1.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="grid h-4 w-4 place-items-center rounded-[4px] bg-[#008f45]">
              <FontAwesomeIcon icon={faBullhorn} className="text-[7px] text-white" />
            </div>
            <span className="text-[10px] font-medium text-[#667085]">Agrofount</span>
          </div>
          <span className="text-[10px] text-[#98a2b3]">now</span>
        </div>
        <div className="flex gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold leading-tight text-[#101828]">
              {title || "Notification title"}
            </p>
            <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-[#475467]">
              {message || "Notification message preview"}
            </p>
          </div>
          {bannerPreview ? (
            <img src={bannerPreview} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
          ) : (
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#f0fbf5]">
              <FontAwesomeIcon icon={faImage} className="text-sm text-[#008f45]/30" />
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

const EmailPreview = ({ title, message, ctaText, categoryLabel, heroImageUrl, features, showAyo }) => {
  const hasRich = !!(categoryLabel || heroImageUrl || features?.some((f) => f.title));
  if (!hasRich) {
    return (
      <div className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3">
        <div className="mx-auto max-w-[264px] rounded-lg bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 border-b border-[#f0f2f5] pb-2.5">
            <div className="grid h-6 w-6 place-items-center rounded-full bg-[#008f45]">
              <FontAwesomeIcon icon={faBullhorn} className="text-[9px] text-white" />
            </div>
            <span className="text-xs font-bold text-[#008f45]">Agrofount</span>
          </div>
          <p className="text-xs font-bold text-[#101828]">{title || "Notification Title"}</p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-[#475467]">
            {message || "Your message will appear here."}
          </p>
          {ctaText && (
            <div className="mt-3">
              <span className="inline-block rounded-md bg-[#008f45] px-3 py-1 text-[11px] font-semibold text-white">
                {ctaText}
              </span>
            </div>
          )}
          <p className="mt-4 border-t border-[#f0f2f5] pt-2.5 text-[10px] text-[#98a2b3]">
            You are receiving this because you are a registered Agrofount user.
          </p>
        </div>
      </div>
    );
  }

  const cleanFeatures = (features || []).filter((f) => f.title);
  return (
    <div className="overflow-hidden rounded-lg border border-[#e5e7eb]">
      {/* Header */}
      <div className="bg-[#006638] px-4 py-3 text-center">
        <p className="text-sm font-extrabold text-white">Agrofount</p>
        <p className="mt-0.5 text-[9px] tracking-wide text-[#a7f3c0]">Empowering Nigerian Farmers</p>
      </div>
      {/* Body */}
      <div className="max-h-[320px] overflow-y-auto bg-white px-4 py-4">
        {categoryLabel && (
          <span className="mb-3 inline-block rounded-full bg-[#dcf8e4] px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#006638]">
            {categoryLabel}
          </span>
        )}
        {heroImageUrl && (
          <img
            src={heroImageUrl}
            alt=""
            className="mb-3 h-20 w-full rounded-md object-cover"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        )}
        <p className="text-xs font-bold text-[#101828]">{title || "Email Headline"}</p>
        <p className="mt-1.5 text-[10px] leading-relaxed text-[#475467]">
          {message || "Your message will appear here."}
        </p>
        {ctaText && (
          <div className="mt-3">
            <span className="inline-block rounded-md bg-[#008f45] px-3 py-1.5 text-[10px] font-semibold text-white">
              {ctaText}
            </span>
          </div>
        )}
        {cleanFeatures.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-[10px] font-bold text-[#101828]">In This Guide, You&apos;ll Learn:</p>
            <div className="space-y-2">
              {cleanFeatures.map((f, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#dcf8e4]">
                    <FontAwesomeIcon
                      icon={EMAIL_ICON_FA_MAP[f.icon] ?? faCheck}
                      className="text-[8px] text-[#008f45]"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-[#101828]">{f.title}</p>
                    {f.description && <p className="text-[9px] text-[#667085]">{f.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {showAyo && (
          <div className="mt-4 rounded-lg bg-[#f0fbf5] p-3">
            <p className="text-[10px] font-bold text-[#101828]">Have Questions? Ask Ayo</p>
            <p className="mt-1 text-[9px] leading-relaxed text-[#475467]">
              Get personalised AI farming advice 24/7.
            </p>
            <span className="mt-2 inline-block rounded-md bg-[#008f45] px-2.5 py-1 text-[9px] font-semibold text-white">
              Chat with Ayo
            </span>
          </div>
        )}
      </div>
      {/* Footer */}
      <div className="bg-[#1a2e22] px-4 py-2.5 text-center">
        <p className="text-[9px] text-[#98a2b3]">support@agrofount.com &middot; Unsubscribe</p>
      </div>
    </div>
  );
};

const EmailFeatureItem = ({ index, feature, onUpdate }) => {
  const [expanded, setExpanded] = useState(!!feature.title);
  return (
    <div className="rounded-lg border border-[#e5e7eb] bg-[#fafafa]">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2.5"
      >
        <span className="flex items-center gap-2">
          <div className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#dcf8e4]">
            <FontAwesomeIcon
              icon={EMAIL_ICON_FA_MAP[feature.icon] ?? faCheck}
              className="text-[8px] text-[#008f45]"
            />
          </div>
          <span className="text-xs font-medium text-[#344054]">
            {feature.title || `Highlight ${index + 1}`}
          </span>
        </span>
        <FontAwesomeIcon
          icon={faChevronRight}
          className={`text-[10px] text-[#98a2b3] transition-transform ${expanded ? "rotate-90" : "rotate-0"}`}
        />
      </button>
      {expanded && (
        <div className="space-y-2 border-t border-[#f0f2f5] px-3 pb-3 pt-2.5">
          <div>
            <p className="mb-1.5 text-[11px] font-medium text-[#667085]">Icon</p>
            <div className="flex flex-wrap gap-1.5">
              {EMAIL_FEATURE_ICONS.map(({ key, icon, label }) => (
                <button
                  key={key}
                  type="button"
                  title={label}
                  onClick={() => onUpdate({ ...feature, icon: key })}
                  className={`grid h-7 w-7 place-items-center rounded-md border transition-colors ${
                    feature.icon === key
                      ? "border-[#008f45] bg-[#dcf8e4] text-[#008f45]"
                      : "border-[#e5e7eb] bg-white text-[#667085] hover:border-[#b1efcd]"
                  }`}
                >
                  <FontAwesomeIcon icon={icon} className="text-[11px]" />
                </button>
              ))}
            </div>
          </div>
          <input
            type="text"
            value={feature.title}
            onChange={(e) => onUpdate({ ...feature, title: e.target.value })}
            placeholder={`Title for highlight ${index + 1}`}
            className="h-8 w-full rounded-md border border-[#d0d5dd] px-3 text-xs text-[#101828] outline-none focus:border-[#008f45] focus:ring-2 focus:ring-[#dff4e5]"
          />
          <textarea
            value={feature.description}
            onChange={(e) => onUpdate({ ...feature, description: e.target.value })}
            placeholder="Brief description..."
            rows={2}
            className="w-full resize-none rounded-md border border-[#d0d5dd] px-3 py-2 text-xs text-[#101828] outline-none focus:border-[#008f45] focus:ring-2 focus:ring-[#dff4e5]"
          />
        </div>
      )}
    </div>
  );
};

const WhatsAppPreview = ({ title, message, ctaText, ctaLink }) => (
  <div className="rounded-lg bg-[#e5ddd5] p-3">
    <div className="ml-auto max-w-[200px]">
      <div className="rounded-xl rounded-tr-sm bg-[#dcf8c6] p-3 shadow-sm">
        <p className="text-xs font-semibold text-[#101828]">{title || "Notification Title"}</p>
        <p className="mt-1 text-[11px] text-[#475467]">{message || "Your message preview."}</p>
        {ctaText && ctaLink && (
          <p className="mt-1.5 text-[11px] font-medium text-[#008f45] underline">{ctaText}</p>
        )}
        <p className="mt-1.5 text-right text-[10px] text-[#667085]">✓✓</p>
      </div>
    </div>
  </div>
);

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo",
  "Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa",
  "Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba",
  "Yobe","Zamfara",
];

const AI_AUDIENCES = [
  { id: "highValuePoultry", label: "High-value Poultry Farmers", userTypes: ["farmer"], businessTypes: ["poultry"] },
  { id: "creditEligible", label: "Credit Eligible Farmers", userTypes: ["farmer"], creditStatus: ["creditEligible"] },
  { id: "feedBuyers", label: "Feed Buyers (Last 60 Days)", productInterest: ["poultryFeed"], lastPurchase: "60days" },
  { id: "vaccinationReminder", label: "Farmers due for vaccination reminders", userTypes: ["farmer"] },
  { id: "inactiveCustomers", label: "Inactive customers", userActivity: ["inactiveUsers"] },
];

const CheckPill = ({ label, checked, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm transition-colors ${
      checked
        ? "border-[#008f45] bg-[#dcf8e4] text-[#006638]"
        : "border-[#d0d5dd] bg-white text-[#344054] hover:border-[#98a2b3]"
    }`}
  >
    <span className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border-2 transition-colors ${checked ? "border-[#008f45] bg-[#008f45]" : "border-[#d0d5dd]"}`}>
      {checked && <FontAwesomeIcon icon={faCheck} className="text-[7px] text-white" />}
    </span>
    {label}
  </button>
);

const EditAudienceModal = ({ isOpen, initial, onApply, onClose }) => {
  const [audienceType, setAudienceType] = useState("custom");
  const [userRoles, setUserRoles] = useState([]);
  const [farmTypes, setFarmTypes] = useState([]);
  const [states, setStates] = useState([]);
  const [stateSearch, setStateSearch] = useState("");
  const [showStateDrop, setShowStateDrop] = useState(false);
  const [creditStatus, setCreditStatus] = useState([]);
  const [minOrders, setMinOrders] = useState("");
  const [spentAbove, setSpentAbove] = useState("");
  const [lastPurchase, setLastPurchase] = useState("");
  const [productInterest, setProductInterest] = useState([]);
  const [userActivity, setUserActivity] = useState([]);
  const [estimatedReach, setEstimatedReach] = useState(0);
  const [loadingEstimate, setLoadingEstimate] = useState(false);

  // Reset from initial prop when modal opens
  useEffect(() => {
    if (!isOpen) return;
    if (!initial || initial.all) {
      setAudienceType("all");
      setUserRoles([]); setFarmTypes([]); setStates([]);
      setCreditStatus([]); setProductInterest([]); setUserActivity([]);
      setMinOrders(""); setSpentAbove(""); setLastPurchase("");
    } else {
      setAudienceType("custom");
      setUserRoles(initial.userTypes ?? []);
      setFarmTypes(initial.businessTypes ?? []);
      setStates(initial.states ?? []);
      setCreditStatus(initial.creditStatus ?? []);
      setProductInterest(initial.productInterest ?? []);
      setUserActivity(initial.userActivity ?? []);
      setMinOrders(String(initial.minOrders ?? ""));
      setSpentAbove(initial.spentAbove ? String(initial.spentAbove) : "");
      setLastPurchase(initial.lastPurchase ?? "");
    }
  }, [isOpen]);  // eslint-disable-line react-hooks/exhaustive-deps

  // Stable string for effect deps
  const depsKey = [
    audienceType,
    [...userRoles].sort().join(","),
    [...farmTypes].sort().join(","),
    [...states].sort().join(","),
    [...creditStatus].sort().join(","),
    [...productInterest].sort().join(","),
    [...userActivity].sort().join(","),
    minOrders, spentAbove, lastPurchase,
  ].join("|");

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const audience = audienceType === "all" ? { all: true } : (() => {
      const a = {};
      // Map UI role/farm-type keys to valid DB businessType enum values
      const roleTobt = { farmer: "farmer", supplier: null, buyer: null, driver: null, admin: null };
      const farmTobt = { poultry: "farmer", fishery: "farmer", piggery: "farmer", cropfarming: "farmer", cattle: "farmer" };
      const bts = [...new Set([...userRoles.map((r) => roleTobt[r]).filter(Boolean), ...farmTypes.map((f) => farmTobt[f]).filter(Boolean)])];
      if (bts.length) a.businessTypes = bts;
      if (states.length) a.states = states;
      if (creditStatus.length) a.creditStatus = creditStatus;
      if (productInterest.length) a.productInterest = productInterest;
      if (userActivity.length) a.userActivity = userActivity;
      if (minOrders) a.minOrders = Number(minOrders);
      if (spentAbove) a.spentAbove = Number(String(spentAbove).replace(/[^0-9]/g, ""));
      if (lastPurchase) a.lastPurchase = lastPurchase;
      return Object.keys(a).length ? a : { all: true };
    })();
    const timer = setTimeout(() => {
      setLoadingEstimate(true);
      apiClient
        .post("/message/campaign/audience-estimate", { audience })
        .then((res) => { if (!cancelled) setEstimatedReach(res.data?.count ?? 0); })
        .catch(() => { if (!cancelled) setEstimatedReach(0); })
        .finally(() => { if (!cancelled) setLoadingEstimate(false); });
    }, 450);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [depsKey, isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (setter, key) =>
    setter((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);

  const handleApply = () => {
    const audience = audienceType === "all" ? { all: true } : (() => {
      const a = {};
      const roleTobt = { farmer: "farmer", supplier: null, buyer: null, driver: null, admin: null };
      const farmTobt = { poultry: "farmer", fishery: "farmer", piggery: "farmer", cropfarming: "farmer", cattle: "farmer" };
      const bts = [...new Set([...userRoles.map((r) => roleTobt[r]).filter(Boolean), ...farmTypes.map((f) => farmTobt[f]).filter(Boolean)])];
      if (bts.length) a.businessTypes = bts;
      if (states.length) a.states = states;
      if (creditStatus.length) a.creditStatus = creditStatus;
      if (productInterest.length) a.productInterest = productInterest;
      if (userActivity.length) a.userActivity = userActivity;
      if (minOrders) a.minOrders = Number(minOrders);
      if (spentAbove) a.spentAbove = Number(String(spentAbove).replace(/[^0-9]/g, ""));
      if (lastPurchase) a.lastPurchase = lastPurchase;
      return Object.keys(a).length ? a : { all: true };
    })();
    onApply(audience, estimatedReach);
    onClose();
  };

  const handleReset = () => {
    setAudienceType("custom");
    setUserRoles([]); setFarmTypes([]); setStates([]);
    setCreditStatus([]); setMinOrders(""); setSpentAbove("");
    setLastPurchase(""); setProductInterest([]); setUserActivity([]);
  };

  const applyAiSuggestion = (sug) => {
    setAudienceType("custom");
    if (sug.userTypes) setUserRoles(sug.userTypes);
    if (sug.businessTypes) setFarmTypes(sug.businessTypes);
    if (sug.creditStatus) setCreditStatus(sug.creditStatus);
    if (sug.productInterest) setProductInterest(sug.productInterest);
    if (sug.userActivity) setUserActivity(sug.userActivity);
    if (sug.lastPurchase) setLastPurchase(sug.lastPurchase);
  };

  const filteredStates = NIGERIAN_STATES.filter(
    (s) => !states.includes(s) && s.toLowerCase().includes(stateSearch.toLowerCase()),
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative flex max-h-[90vh] w-full max-w-[500px] flex-col rounded-2xl bg-white shadow-2xl">
        {/* Title bar */}
        <div className="flex items-center justify-between border-b border-[#f0f2f5] px-6 py-4">
          <h2 className="text-base font-bold text-[#101828]">Edit Target Audience</h2>
          <button type="button" onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-[#667085] hover:bg-[#f0f2f5]">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* Estimate + Save */}
        <div className="flex items-center justify-between bg-[#f9fafb] px-6 py-3 border-b border-[#f0f2f5]">
          <div>
            <p className="text-[11px] font-medium text-[#667085]">Estimated Reach</p>
            <p className="text-xl font-bold text-[#008f45]">
              {loadingEstimate ? "..." : estimatedReach.toLocaleString()} users
            </p>
          </div>
          <button
            type="button"
            onClick={() => toast.success("Audience preset saved.")}
            className="flex items-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-3 py-1.5 text-sm font-medium text-[#344054] hover:bg-[#f9fafb]"
          >
            <FontAwesomeIcon icon={faFloppyDisk} className="text-xs text-[#667085]" />
            Save Audience
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">

          {/* Audience Type */}
          <section>
            <p className="mb-2.5 text-xs font-semibold text-[#344054]">Audience Type</p>
            <div className="flex flex-wrap gap-5">
              {[
                { value: "all", label: "All Users" },
                { value: "custom", label: "Custom Audience" },
                { value: "saved", label: "Saved Audience" },
              ].map((opt) => (
                <label key={opt.value} className="flex cursor-pointer items-center gap-2 text-sm text-[#344054]">
                  <input
                    type="radio"
                    name="aud-type"
                    value={opt.value}
                    checked={audienceType === opt.value}
                    onChange={(e) => setAudienceType(e.target.value)}
                    className="accent-[#008f45]"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </section>

          {audienceType === "custom" && (
            <>
              {/* User Role */}
              <section>
                <p className="mb-2.5 text-xs font-semibold text-[#344054]">User Role</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "farmer", label: "Farmers" },
                    { key: "supplier", label: "Suppliers" },
                    { key: "buyer", label: "Customers" },
                    { key: "driver", label: "Drivers" },
                    { key: "admin", label: "Admins" },
                  ].map(({ key, label }) => (
                    <CheckPill key={key} label={label} checked={userRoles.includes(key)} onToggle={() => toggle(setUserRoles, key)} />
                  ))}
                </div>
              </section>

              {/* Farm Type */}
              <section>
                <p className="mb-2.5 text-xs font-semibold text-[#344054]">Farm Type</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "poultry", label: "Poultry" },
                    { key: "fishery", label: "Fishery" },
                    { key: "piggery", label: "Piggery" },
                    { key: "cropfarming", label: "Crop Farming" },
                    { key: "cattle", label: "Cattle" },
                  ].map(({ key, label }) => (
                    <CheckPill key={key} label={label} checked={farmTypes.includes(key)} onToggle={() => toggle(setFarmTypes, key)} />
                  ))}
                </div>
              </section>

              {/* Location */}
              <section>
                <p className="mb-2.5 text-xs font-semibold text-[#344054]">Location</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="mb-1 block text-[11px] text-[#667085]">Country</label>
                    <select className="h-9 w-full rounded-md border border-[#d0d5dd] bg-white px-3 text-sm text-[#344054] outline-none">
                      <option>Nigeria</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-[#667085]">LGA (Optional)</label>
                    <input
                      type="text"
                      placeholder="Select LGA"
                      className="h-9 w-full rounded-md border border-[#d0d5dd] bg-white px-3 text-sm text-[#344054] outline-none focus:border-[#008f45]"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-[#667085]">State</label>
                  {states.length > 0 && (
                    <div className="mb-1.5 flex flex-wrap gap-1.5">
                      {states.map((s) => (
                        <span key={s} className="flex items-center gap-1 rounded-full bg-[#dcf8e4] px-2.5 py-0.5 text-xs font-medium text-[#006638]">
                          {s}
                          <button type="button" onClick={() => setStates((p) => p.filter((x) => x !== s))}>
                            <FontAwesomeIcon icon={faXmark} className="text-[9px]" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search and select states..."
                      value={stateSearch}
                      onFocus={() => setShowStateDrop(true)}
                      onBlur={() => setTimeout(() => setShowStateDrop(false), 150)}
                      onChange={(e) => { setStateSearch(e.target.value); setShowStateDrop(true); }}
                      className="h-9 w-full rounded-md border border-[#d0d5dd] bg-white px-3 text-sm text-[#344054] outline-none focus:border-[#008f45]"
                    />
                    {showStateDrop && filteredStates.length > 0 && (
                      <div className="absolute left-0 top-full z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-md border border-[#d0d5dd] bg-white shadow-lg">
                        {filteredStates.slice(0, 12).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onMouseDown={() => { setStates((p) => [...p, s]); setStateSearch(""); }}
                            className="flex w-full px-3 py-2 text-sm text-[#344054] hover:bg-[#f0fbf5] text-left"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Credit Status */}
              <section>
                <p className="mb-2.5 text-xs font-semibold text-[#344054]">Credit Status</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "creditEligible", label: "Credit Eligible" },
                    { key: "activeLoan", label: "Active Loan" },
                    { key: "loanDefaulters", label: "Loan Defaulters" },
                    { key: "repaidCustomers", label: "Repaid Customers" },
                  ].map(({ key, label }) => (
                    <CheckPill key={key} label={label} checked={creditStatus.includes(key)} onToggle={() => toggle(setCreditStatus, key)} />
                  ))}
                </div>
              </section>

              {/* Purchase Behaviour */}
              <section>
                <p className="mb-2.5 text-xs font-semibold text-[#344054]">Purchase Behaviour</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1 block text-[11px] text-[#667085]">Minimum Orders</label>
                    <input
                      type="number"
                      min="0"
                      value={minOrders}
                      onChange={(e) => setMinOrders(e.target.value)}
                      placeholder="e.g. 5"
                      className="h-9 w-full rounded-md border border-[#d0d5dd] bg-white px-3 text-sm text-[#344054] outline-none focus:border-[#008f45]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-[#667085]">Spent Above</label>
                    <input
                      type="text"
                      value={spentAbove}
                      onChange={(e) => setSpentAbove(e.target.value)}
                      placeholder="e.g. ₦100,000"
                      className="h-9 w-full rounded-md border border-[#d0d5dd] bg-white px-3 text-sm text-[#344054] outline-none focus:border-[#008f45]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-[#667085]">Last Purchase</label>
                    <select
                      value={lastPurchase}
                      onChange={(e) => setLastPurchase(e.target.value)}
                      className="h-9 w-full rounded-md border border-[#d0d5dd] bg-white px-3 text-sm text-[#344054] outline-none focus:border-[#008f45]"
                    >
                      <option value="">Any Time</option>
                      <option value="7days">Within 7 Days</option>
                      <option value="30days">Within 30 Days</option>
                      <option value="60days">Within 60 Days</option>
                      <option value="90days">Within 90 Days</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Product Interest */}
              <section>
                <p className="mb-2.5 text-xs font-semibold text-[#344054]">Product Interest</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "poultryFeed", label: "Poultry Feed" },
                    { key: "dayOldChicks", label: "Day Old Chicks" },
                    { key: "medication", label: "Medication" },
                    { key: "equipment", label: "Equipment" },
                    { key: "fertilizer", label: "Fertilizer" },
                  ].map(({ key, label }) => (
                    <CheckPill key={key} label={label} checked={productInterest.includes(key)} onToggle={() => toggle(setProductInterest, key)} />
                  ))}
                </div>
              </section>

              {/* User Activity */}
              <section>
                <p className="mb-2.5 text-xs font-semibold text-[#344054]">User Activity</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "activeLast30Days", label: "Active Last 30 Days" },
                    { key: "inactiveUsers", label: "Inactive Users" },
                    { key: "cartAbandoners", label: "Cart Abandoners" },
                    { key: "newRegistrations", label: "New Registrations" },
                  ].map(({ key, label }) => (
                    <CheckPill key={key} label={label} checked={userActivity.includes(key)} onToggle={() => toggle(setUserActivity, key)} />
                  ))}
                </div>
              </section>

              {/* AI Suggested Audiences */}
              <section className="rounded-xl border border-[#e5e7eb] bg-[#fefce8] p-4">
                <div className="mb-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faBolt} className="text-sm text-[#f59e0b]" />
                    <p className="text-xs font-semibold text-[#344054]">AI Suggested Audiences</p>
                  </div>
                  <button type="button" className="text-xs font-medium text-[#008f45] hover:underline">
                    View All
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {AI_AUDIENCES.map((sug) => (
                    <button
                      key={sug.id}
                      type="button"
                      onClick={() => applyAiSuggestion(sug)}
                      className="rounded-full border border-[#d0d5dd] bg-white px-3 py-1.5 text-xs font-medium text-[#344054] hover:border-[#008f45] hover:bg-[#f0fbf5] hover:text-[#006638] transition-colors"
                    >
                      {sug.label}
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#f0f2f5] px-6 py-4">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 text-sm font-medium text-[#667085] hover:text-[#344054]"
          >
            <FontAwesomeIcon icon={faArrowsRotate} className="text-xs" />
            Reset Filters
          </button>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="h-9 rounded-md border border-[#d0d5dd] px-4 text-sm font-medium text-[#344054] hover:bg-[#f9fafb]">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="h-9 rounded-md bg-[#006638] px-4 text-sm font-semibold text-white hover:bg-[#005530]"
            >
              Apply Audience
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Notifications = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [previewTab, setPreviewTab] = useState(0);
  const [notificationType, setNotificationType] = useState("Promotion");
  const [selectedChannels, setSelectedChannels] = useState(new Set(["push", "in-app"]));
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [ctaLink, setCtaLink] = useState("");
  const [schedule, setSchedule] = useState("now");
  const [campaignStats, setCampaignStats] = useState(null);

  useEffect(() => {
    apiClient
      .get("/message/campaign/stats")
      .then((res) => setCampaignStats(res.data))
      .catch(() => {});
  }, []);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [frequency, setFrequency] = useState("weekly");
  const [bannerPreview, setBannerPreview] = useState(null);
  const [sending, setSending] = useState(false);
  const [audience, setAudience] = useState({ all: true });

  // Email design fields
  const [emailCategoryLabel, setEmailCategoryLabel] = useState("");
  const [emailHeroImageUrl, setEmailHeroImageUrl] = useState("");
  const [emailFeatures, setEmailFeatures] = useState([
    { icon: "seedling", title: "", description: "" },
    { icon: "calendar", title: "", description: "" },
    { icon: "shield", title: "", description: "" },
  ]);
  const [emailShowAyo, setEmailShowAyo] = useState(false);

  const updateEmailFeature = (index, updated) =>
    setEmailFeatures((prev) => prev.map((f, i) => (i === index ? updated : f)));
  const [audienceEstimate, setAudienceEstimate] = useState(0);
  const [audienceModalOpen, setAudienceModalOpen] = useState(false);

  const audienceLabel = (() => {
    if (audience.all) return "All Users";
    const parts = [];
    const btLabels = { farmer: "Farmers", frozen_food: "Frozen Food", others: "Others" };
    if (audience.businessTypes?.length) parts.push(audience.businessTypes.map((t) => btLabels[t] ?? t).join(", "));
    if (audience.creditStatus?.length) parts.push(audience.creditStatus.map((c) => c.replace(/([A-Z])/g, " $1").trim()).join(", "));
    if (audience.productInterest?.length) parts.push(audience.productInterest.map((p) => p.replace(/([A-Z])/g, " $1").trim()).join(", "));
    return parts.join(" · ") || "Custom Audience";
  })();
  const audienceLocation = audience.states?.join(", ") || "All Locations";

  const fileInputRef = useRef();

  const toggleChannel = (id) => {
    setSelectedChannels((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBannerChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setBannerPreview(URL.createObjectURL(file));
  };

  const removeBanner = () => {
    setBannerPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveDraft = () => toast.success("Notification saved as draft.");
  const handleSendTest = () => toast.info("Test notification sent to your account.");

  const CATEGORY_MAP = {
    Promotion: "promotional",
    Announcement: "announcement",
    Reminder: "reminder",
    "Order Update": "transactional",
    "System Alert": "announcement",
  };

  const handleSubmit = async () => {
    if (!title.trim()) return toast.error("Please enter a notification title.");
    if (!message.trim()) return toast.error("Please enter a notification message.");
    if (selectedChannels.size === 0) return toast.error("Please select at least one channel.");
    if (schedule === "later" && (!scheduledDate || !scheduledTime))
      return toast.error("Please set a date and time for the scheduled notification.");

    const channels = [...selectedChannels].map((ch) =>
      ch === "in-app" ? "in_app" : ch,
    );

    let scheduledAt;
    if (schedule === "later" && scheduledDate && scheduledTime) {
      scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
    }

    const emailContent = selectedChannels.has("email")
      ? generateEmailHtml({
          title: title.trim(),
          message: message.trim(),
          ctaText,
          ctaLink,
          categoryLabel: emailCategoryLabel,
          heroImageUrl: emailHeroImageUrl,
          features: emailFeatures,
          showAyo: emailShowAyo,
        })
      : undefined;

    const payload = {
      title: title.trim(),
      message: message.trim(),
      category: CATEGORY_MAP[notificationType] ?? "announcement",
      channels,
      audience,
      ...(ctaText && { ctaText }),
      ...(ctaLink && { ctaLink }),
      ...(scheduledAt && { scheduledAt }),
      ...(schedule === "recurring" && { frequency: frequency.toLowerCase() }),
      ...(emailContent && { emailContent }),
    };

    try {
      setSending(true);
      await apiClient.post("/message/campaign", payload);
      toast.success(
        schedule === "later"
          ? "Notification scheduled successfully."
          : "Notification sent successfully.",
      );
    } catch (err) {
      toast.error(parseApiError(err).message || "Failed to send notification.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-5 text-[#101828]">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Notification Management</h1>
          <p className="mt-1 text-xs font-medium text-[#667085]">
            Send targeted updates, offers, reminders, and alerts to users.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#667085]">
          <Link to="/" className="hover:text-[#008f45]">Dashboard</Link>
          <FontAwesomeIcon icon={faChevronRight} className="text-[9px]" />
          <Link to="/notifications" className="font-semibold text-[#008f45] hover:underline">Notifications</Link>
          <FontAwesomeIcon icon={faChevronRight} className="text-[9px]" />
          <span>{TABS[activeTab].label}</span>
        </div>
      </div>

      {/* Stats — only on the Create tab */}
      {activeTab === 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard icon={faPaperPlane} label="Total Sent" value={campaignStats ? (campaignStats.totalSent ?? 0).toLocaleString() : "…"} note={null} iconBg="bg-[#dcf8e4]" iconColor="text-[#008f45]" noteColor="text-[#008f45]" />
          <StatCard icon={faCircleCheck} label="Delivered" value={campaignStats ? (campaignStats.totalDelivered ?? 0).toLocaleString() : "…"} note={campaignStats && campaignStats.totalSent > 0 ? `${Math.round((campaignStats.totalDelivered / campaignStats.totalSent) * 100)}% delivery rate` : null} iconBg="bg-[#dcf8e4]" iconColor="text-[#008f45]" noteColor="text-[#008f45]" />
          <StatCard icon={faEye} label="Delivery Rate" value={campaignStats ? `${campaignStats.openRate ?? 0}%` : "…"} note={null} iconBg="bg-[#f1e8ff]" iconColor="text-[#7c3fd3]" noteColor="text-[#008f45]" />
          <StatCard icon={faClock} label="Scheduled" value={campaignStats ? (campaignStats.scheduled ?? 0).toString() : "…"} note="Upcoming campaigns" iconBg="bg-[#fef3c7]" iconColor="text-[#f59e0b]" noteColor="text-[#667085]" />
          <StatCard icon={faCircleXmark} label="Failed" value={campaignStats ? (campaignStats.failed ?? 0).toString() : "…"} note={campaignStats && campaignStats.campaigns > 0 ? `${((campaignStats.failed / campaignStats.campaigns) * 100).toFixed(1)}% failure rate` : null} iconBg="bg-[#fee2e2]" iconColor="text-[#ef3340]" noteColor="text-[#ef3340]" />
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-[#e5e7eb]">
        <div className="flex overflow-x-auto">
          {TABS.map((tab, i) => (
            <button
              key={tab.label}
              type="button"
              onClick={() => setActiveTab(i)}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
                activeTab === i
                  ? "border-[#008f45] text-[#008f45]"
                  : "border-transparent text-[#667085] hover:text-[#344054]"
              }`}
            >
              <FontAwesomeIcon icon={tab.icon} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 0 && (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          {/* ── Left: Form ── */}
          <div className="space-y-4 xl:col-span-7">
            <div className="rounded-lg border border-[#e5e7eb] bg-white p-5 shadow-[0_2px_8px_rgba(16,24,40,0.04)]">
              <div className="space-y-5">

                {/* Step 1 – Type */}
                <Step number="1" title="Notification Type">
                  <div className="relative">
                    <FontAwesomeIcon
                      icon={faBullhorn}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#667085]"
                    />
                    <select
                      value={notificationType}
                      onChange={(e) => setNotificationType(e.target.value)}
                      className="h-10 w-full appearance-none rounded-md border border-[#d0d5dd] bg-white pl-9 pr-3 text-sm text-[#101828] outline-none focus:border-[#008f45] focus:ring-2 focus:ring-[#dff4e5]"
                    >
                      {NOTIFICATION_TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </Step>

                <div className="border-t border-[#f0f2f5]" />

                {/* Step 2 – Audience */}
                <Step number="2" title="Target Audience">
                  <div className="flex items-center justify-between rounded-md border border-[#d0d5dd] bg-[#f9fafb] px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#dcf8e4]">
                        <FontAwesomeIcon icon={faUsers} className="text-xs text-[#008f45]" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#101828]">{audienceLabel}</p>
                        <p className="text-[11px] text-[#667085]">
                          {audienceLocation} —{" "}
                          <span className="font-semibold text-[#008f45]">
                            {audienceEstimate.toLocaleString()} users
                          </span>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAudienceModalOpen(true)}
                      className="grid h-7 w-7 place-items-center rounded-md border border-[#d0d5dd] bg-white text-[#667085] hover:bg-[#f0f2f5]"
                    >
                      <FontAwesomeIcon icon={faPencil} className="text-[10px]" />
                    </button>
                  </div>
                </Step>

                <div className="border-t border-[#f0f2f5]" />

                {/* Step 3 – Channels */}
                <Step number="3" title="Channels">
                  <div className="flex flex-wrap gap-2">
                    {CHANNELS.map((ch) => {
                      const active = selectedChannels.has(ch.id);
                      return (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => toggleChannel(ch.id)}
                          className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-all ${
                            active
                              ? "border-[#008f45] bg-[#f0fbf5] text-[#008f45]"
                              : "border-[#d0d5dd] bg-white text-[#344054] hover:bg-[#f9fafb]"
                          }`}
                        >
                          <FontAwesomeIcon icon={ch.icon} />
                          {ch.label}
                        </button>
                      );
                    })}
                  </div>
                </Step>

                <div className="border-t border-[#f0f2f5]" />

                {/* Step 4 – Message */}
                <Step number="4" title="Message Content">
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-[#344054]">Title</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                          className="h-9 w-full rounded-md border border-[#d0d5dd] px-3 pr-14 text-sm text-[#101828] outline-none focus:border-[#008f45] focus:ring-2 focus:ring-[#dff4e5]"
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#98a2b3]">
                          {title.length}/100
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-[#344054]">Message</label>
                      <div className="relative">
                        <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value.slice(0, 250))}
                          rows={3}
                          className="w-full resize-none rounded-md border border-[#d0d5dd] px-3 py-2 pr-14 text-sm text-[#101828] outline-none focus:border-[#008f45] focus:ring-2 focus:ring-[#dff4e5]"
                        />
                        <span className="pointer-events-none absolute bottom-2.5 right-3 text-[11px] text-[#98a2b3]">
                          {message.length}/250
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-[#344054]">
                        Banner Image{" "}
                        <span className="font-normal text-[#98a2b3]">(Optional)</span>
                      </label>
                      {bannerPreview ? (
                        <div className="relative inline-block">
                          <img
                            src={bannerPreview}
                            alt="Banner preview"
                            className="h-20 w-32 rounded-lg object-cover ring-1 ring-[#e5e7eb]"
                          />
                          <button
                            type="button"
                            onClick={removeBanner}
                            className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-[#ef3340] text-white shadow"
                          >
                            <FontAwesomeIcon icon={faXmark} className="text-[9px]" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex h-16 w-full items-center justify-center gap-2 rounded-md border border-dashed border-[#d0d5dd] bg-[#f9fafb] text-xs text-[#667085] hover:border-[#008f45] hover:text-[#008f45]"
                        >
                          <FontAwesomeIcon icon={faImage} />
                          Click to upload banner image
                        </button>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleBannerChange}
                        className="hidden"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-[#344054]">
                          CTA Text{" "}
                          <span className="font-normal text-[#98a2b3]">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={ctaText}
                          onChange={(e) => setCtaText(e.target.value)}
                          placeholder="e.g. Shop Now"
                          className="h-9 w-full rounded-md border border-[#d0d5dd] px-3 text-sm text-[#101828] outline-none focus:border-[#008f45] focus:ring-2 focus:ring-[#dff4e5]"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-[#344054]">
                          CTA Link{" "}
                          <span className="font-normal text-[#98a2b3]">(Optional)</span>
                        </label>
                        <div className="relative">
                          <input
                            type="url"
                            value={ctaLink}
                            onChange={(e) => setCtaLink(e.target.value)}
                            placeholder="https://"
                            className="h-9 w-full rounded-md border border-[#d0d5dd] px-3 pr-8 text-sm text-[#101828] outline-none focus:border-[#008f45] focus:ring-2 focus:ring-[#dff4e5]"
                          />
                          <FontAwesomeIcon
                            icon={faLink}
                            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[#98a2b3]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Step>

                {/* Email Design – only when email channel is selected */}
                {selectedChannels.has("email") && (
                  <>
                    <div className="border-t border-[#f0f2f5]" />
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#f59e0b]">
                          <FontAwesomeIcon icon={faEnvelope} className="text-[10px] text-white" />
                        </span>
                        <p className="text-sm font-semibold text-[#101828]">Email Design</p>
                        <span className="rounded-full bg-[#fef3c7] px-2 py-0.5 text-[10px] font-medium text-[#b45309]">
                          Email only
                        </span>
                      </div>

                      <div className="space-y-4">
                        {/* Category Badge */}
                        <div>
                          <label className="mb-1 block text-xs font-medium text-[#344054]">
                            Category Badge{" "}
                            <span className="font-normal text-[#98a2b3]">(Optional)</span>
                          </label>
                          <input
                            type="text"
                            value={emailCategoryLabel}
                            onChange={(e) => setEmailCategoryLabel(e.target.value.toUpperCase())}
                            placeholder="e.g. POULTRY HEALTH GUIDE"
                            className="h-9 w-full rounded-md border border-[#d0d5dd] px-3 text-sm uppercase tracking-wide text-[#101828] outline-none focus:border-[#008f45] focus:ring-2 focus:ring-[#dff4e5]"
                          />
                        </div>

                        {/* Hero Image URL */}
                        <div>
                          <label className="mb-1 block text-xs font-medium text-[#344054]">
                            Hero Image URL{" "}
                            <span className="font-normal text-[#98a2b3]">(Optional)</span>
                          </label>
                          <div className="relative">
                            <input
                              type="url"
                              value={emailHeroImageUrl}
                              onChange={(e) => setEmailHeroImageUrl(e.target.value)}
                              placeholder="https://..."
                              className="h-9 w-full rounded-md border border-[#d0d5dd] px-3 pr-8 text-sm text-[#101828] outline-none focus:border-[#008f45] focus:ring-2 focus:ring-[#dff4e5]"
                            />
                            <FontAwesomeIcon
                              icon={faImage}
                              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[#98a2b3]"
                            />
                          </div>
                          {emailHeroImageUrl && (
                            <img
                              src={emailHeroImageUrl}
                              alt=""
                              className="mt-2 h-24 w-full rounded-md object-cover"
                              onError={(e) => { e.target.style.display = "none"; }}
                            />
                          )}
                        </div>

                        {/* Content Highlights */}
                        <div>
                          <div className="mb-2 flex items-center justify-between">
                            <label className="text-xs font-medium text-[#344054]">
                              Content Highlights{" "}
                              <span className="font-normal text-[#98a2b3]">(Optional)</span>
                            </label>
                            <span className="text-[11px] text-[#98a2b3]">Up to 3 items</span>
                          </div>
                          <div className="space-y-2">
                            {emailFeatures.map((feature, index) => (
                              <EmailFeatureItem
                                key={index}
                                index={index}
                                feature={feature}
                                onUpdate={(updated) => updateEmailFeature(index, updated)}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Ayo Section Toggle */}
                        <div className="flex items-center gap-3 rounded-lg border border-[#e5e7eb] p-3">
                          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#dcf8e4] text-base">
                            🤖
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-[#101828]">
                              Include &ldquo;Ask Ayo&rdquo; Section
                            </p>
                            <p className="text-[11px] text-[#667085]">
                              AI assistant prompt at the end of the email
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEmailShowAyo((v) => !v)}
                            className={`relative h-5 w-9 rounded-full transition-colors ${emailShowAyo ? "bg-[#008f45]" : "bg-[#d0d5dd]"}`}
                          >
                            <span
                              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${emailShowAyo ? "translate-x-4" : "translate-x-0.5"}`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="border-t border-[#f0f2f5]" />

                {/* Step 5 – Schedule */}
                <Step number="5" title="Schedule">
                  <div className="flex flex-wrap gap-5">
                    {[
                      { value: "now", label: "Send Now" },
                      { value: "later", label: "Schedule Later" },
                      { value: "recurring", label: "Recurring" },
                    ].map((opt) => (
                      <label key={opt.value} className="flex cursor-pointer items-center gap-2 text-sm text-[#344054]">
                        <input
                          type="radio"
                          name="schedule"
                          value={opt.value}
                          checked={schedule === opt.value}
                          onChange={() => setSchedule(opt.value)}
                          className="accent-[#008f45]"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                  {schedule === "later" && (
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-[#344054]">Date</label>
                        <input
                          type="date"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                          className="h-9 w-full rounded-md border border-[#d0d5dd] px-3 text-sm text-[#101828] outline-none focus:border-[#008f45] focus:ring-2 focus:ring-[#dff4e5]"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-[#344054]">Time</label>
                        <input
                          type="time"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                          className="h-9 w-full rounded-md border border-[#d0d5dd] px-3 text-sm text-[#101828] outline-none focus:border-[#008f45] focus:ring-2 focus:ring-[#dff4e5]"
                        />
                      </div>
                    </div>
                  )}
                  {schedule === "recurring" && (
                    <div className="mt-3">
                      <label className="mb-1 block text-xs font-medium text-[#344054]">Frequency</label>
                      <select
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value)}
                        className="h-9 w-full rounded-md border border-[#d0d5dd] bg-white px-3 text-sm text-[#101828] outline-none focus:border-[#008f45] focus:ring-2 focus:ring-[#dff4e5]"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                  )}
                </Step>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-5 text-sm font-semibold text-[#344054] shadow-sm hover:bg-[#f9fafb]"
              >
                <FontAwesomeIcon icon={faFloppyDisk} />
                Save as Draft
              </button>
              <button
                type="button"
                onClick={handleSendTest}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-[#008f45] bg-white px-5 text-sm font-semibold text-[#008f45] shadow-sm hover:bg-[#f0fbf5]"
              >
                <FontAwesomeIcon icon={faPaperPlane} />
                Send Test
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={sending}
                className="ml-auto inline-flex h-10 items-center gap-2 rounded-md bg-[#008f45] px-6 text-sm font-semibold text-white shadow-[0_8px_16px_rgba(0,143,69,0.18)] hover:bg-[#007a3b] disabled:opacity-60"
              >
                {sending ? "Sending..." : "Next: Review & Confirm"}
                {!sending && <FontAwesomeIcon icon={faArrowRight} />}
              </button>
            </div>
          </div>

          {/* ── Right: Summary + Preview ── */}
          <div className="space-y-4 xl:col-span-5">
            {/* Audience Summary */}
            <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_2px_8px_rgba(16,24,40,0.04)]">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#101828]">Audience Summary</h3>
                <button type="button" className="text-xs font-semibold text-[#008f45] hover:underline">
                  View Audience Details
                </button>
              </div>
              <div className="space-y-2.5">
                {(() => {
                  const btLabels = { farmer: "Farmers", frozen_food: "Frozen Food", others: "Others" };
                  const rolesLabel = audience.businessTypes?.length
                    ? audience.businessTypes.map((t) => btLabels[t] ?? t).join(", ")
                    : "All";
                  const interestLabel = audience.productInterest?.length
                    ? audience.productInterest.map((p) => p.replace(/([A-Z])/g, " $1").trim()).join(", ")
                    : "All";
                  return [
                    { icon: faTag, label: "Target", value: audienceLabel },
                    { icon: faUsers, label: "Users", value: `${audienceEstimate.toLocaleString()} users` },
                    { icon: faShieldHalved, label: "User Roles", value: rolesLabel },
                    { icon: faChartBar, label: "Interest", value: interestLabel },
                  ];
                })().map(({ icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-[#f0fbf5]">
                      <FontAwesomeIcon icon={icon} className="text-[11px] text-[#008f45]" />
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-[#667085]">{label}</p>
                      <p className="text-xs font-semibold text-[#101828]">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_2px_8px_rgba(16,24,40,0.04)]">
              <h3 className="mb-3 text-sm font-semibold text-[#101828]">Preview</h3>
              <div className="mb-3 flex flex-wrap gap-1">
                {PREVIEW_TABS.map((tab, i) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setPreviewTab(i)}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      previewTab === i
                        ? "bg-[#008f45] text-white"
                        : "text-[#667085] hover:bg-[#f0f2f5]"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              {(previewTab === 0 || previewTab === 1) && (
                <PushPreview title={title} message={message} bannerPreview={bannerPreview} />
              )}
              {previewTab === 2 && (
                <WhatsAppPreview title={title} message={message} ctaText={ctaText} ctaLink={ctaLink} />
              )}
              {previewTab === 3 && (
                <EmailPreview
                  title={title}
                  message={message}
                  ctaText={ctaText}
                  categoryLabel={emailCategoryLabel}
                  heroImageUrl={emailHeroImageUrl}
                  features={emailFeatures}
                  showAyo={emailShowAyo}
                />
              )}
            </div>

            {/* Estimated Delivery */}
            <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_2px_8px_rgba(16,24,40,0.04)]">
              <div className="mb-3 flex items-start justify-between">
                <h3 className="text-sm font-semibold text-[#101828]">Estimated Delivery</h3>
                <span className="text-[11px] text-[#667085]">Delivery breakdown by channel</span>
              </div>
              <p className="mb-1 text-[11px] text-[#667085]">
                Your notification will be sent to approximately:
              </p>
              <p className="mb-4 text-xl font-bold text-[#008f45]">
                {audienceEstimate > 0 ? audienceEstimate.toLocaleString() : "—"} users
              </p>
              {selectedChannels.size > 0 && (
                <div className="space-y-2">
                  {[...selectedChannels].map((ch) => {
                    const cfg = CHANNEL_DISPLAY[ch === "in-app" ? "in_app" : ch];
                    if (!cfg) return null;
                    return (
                      <div key={ch} className="flex items-center gap-2">
                        <div className="grid h-6 w-6 shrink-0 place-items-center rounded-md" style={{ background: cfg.bg }}>
                          <FontAwesomeIcon icon={cfg.icon} className="text-[10px]" style={{ color: cfg.color }} />
                        </div>
                        <span className="text-xs font-medium text-[#344054]">{cfg.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Important */}
            <div className="flex items-start gap-3 rounded-lg border border-[#fde68a] bg-[#fffbeb] p-3">
              <FontAwesomeIcon
                icon={faTriangleExclamation}
                className="mt-0.5 shrink-0 text-sm text-[#f59e0b]"
              />
              <div>
                <p className="text-xs font-semibold text-[#92400e]">Important</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-[#92400e]/80">
                  Please review your message and audience before sending. This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Review & Confirm */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={sending}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#008f45] text-sm font-semibold text-white shadow-[0_8px_16px_rgba(0,143,69,0.18)] hover:bg-[#007a3b] disabled:opacity-60"
            >
              <FontAwesomeIcon icon={faCircleCheck} />
              {sending ? "Sending..." : "Review & Confirm"}
            </button>
          </div>
        </div>
      )}

      <EditAudienceModal
        isOpen={audienceModalOpen}
        initial={audience}
        onApply={(newAudience, reach) => { setAudience(newAudience); setAudienceEstimate(reach); }}
        onClose={() => setAudienceModalOpen(false)}
      />

      {activeTab === 1 && <ScheduledTab onScheduleNew={() => setActiveTab(0)} />}

      {activeTab === 2 && <SentHistoryTab />}

      {activeTab > 2 && (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-[#e5e7eb] bg-white shadow-[0_2px_8px_rgba(16,24,40,0.04)]">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-[#f0f2f5]">
            <FontAwesomeIcon icon={TABS[activeTab].icon} className="text-lg text-[#98a2b3]" />
          </div>
          <p className="mt-3 text-sm font-semibold text-[#344054]">{TABS[activeTab].label}</p>
          <p className="mt-1 text-xs text-[#98a2b3]">This section is coming soon.</p>
        </div>
      )}
    </div>
  );
};

export default Notifications;
