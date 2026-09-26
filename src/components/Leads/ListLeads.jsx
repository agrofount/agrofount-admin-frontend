import {
  faArrowRight,
  faBullseye,
  faCalendarDays,
  faChevronLeft,
  faChevronRight,
  faCircleCheck,
  faCircleXmark,
  faCloudArrowUp,
  faComment,
  faDownload,
  faEllipsisVertical,
  faEnvelope,
  faFilter,
  faHashtag,
  faLocationDot,
  faMagnifyingGlass,
  faMars,
  faPhone,
  faRotateLeft,
  faTimes,
  faTrophy,
  faUser,
  faUsers,
  faVenus,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { apiClient } from "../../lib/apiClient";
import { TableRowsSkeleton } from "../common/LoadingStates";

const STATUS_META = {
  new:       { label: "New",       bg: "#dbeafe", text: "#1d4ed8" },
  contacted: { label: "Contacted", bg: "#fef3c7", text: "#d97706" },
  qualified: { label: "Qualified", bg: "#ede9fe", text: "#7c3aed" },
  converted: { label: "Converted", bg: "#dcf8e4", text: "#008f45" },
  rejected:  { label: "Rejected",  bg: "#ffe4e6", text: "#dc2626" },
};

const STATUS_TRANSITIONS = {
  new:       ["contacted", "qualified", "converted", "rejected"],
  contacted: ["qualified", "converted", "rejected"],
  qualified: ["converted", "rejected"],
  converted: [],
  rejected:  ["new", "contacted"],
};

const STATUS_LABELS = {
  contacted: "Mark Contacted",
  qualified: "Mark Qualified",
  converted: "Mark Converted",
  rejected:  "Reject",
  new:       "Reopen as New",
};

const LEAD_SOURCE_OPTIONS = [
  { key: "all", label: "All Sources" },
  { key: "meta", label: "Meta Ads" },
  { key: "manual", label: "Manual" },
  { key: "website", label: "Website" },
  { key: "other", label: "Other" },
];

const LEAD_SMS_TOKENS = [
  { token: "name", label: "Name" },
  { token: "phone", label: "Phone" },
  { token: "insights", label: "Insights" },
  { token: "statedInterest", label: "Interest" },
  { token: "campaignName", label: "Campaign" },
  { token: "sourceLeadId", label: "Source ID" },
];

const DEFAULT_LEAD_SMS_MESSAGE =
  "Hi {{name}}, thanks for your interest in {{insights}} on tiktok. Shop here: https://www.agrofount.com/shop or WhatsApp us: 09019170273.";

const formatDate = (val) => {
  if (!val) return ["—", ""];
  const d = new Date(val);
  return [
    new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(d),
    new Intl.DateTimeFormat("en-US",  { hour: "2-digit", minute: "2-digit" }).format(d),
  ];
};

const getInitials = (name = "") =>
  name.split(/\s+/).slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase() || "?";

const valueOrDash = (value) => value || "—";

const StatCard = ({ label, value, icon, bg, color, sub }) => (
  <div className="rounded-xl border border-[#e5e7eb] bg-white px-4 py-4 shadow-[0_4px_16px_rgba(16,24,40,0.04)]">
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full" style={{ background: bg }}>
        <FontAwesomeIcon icon={icon} style={{ color }} className="text-sm" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-[#667085]">{label}</p>
        <p className="mt-0.5 text-xl font-bold text-[#101828]">{value}</p>
        {sub && <p className="mt-0.5 text-[10px] text-[#667085]">{sub}</p>}
      </div>
    </div>
  </div>
);

const NotifyModal = ({ lead, onClose, onSent }) => {
  const [channel, setChannel] = useState("sms");
  const [message, setMessage] = useState(DEFAULT_LEAD_SMS_MESSAGE);
  const [subject, setSubject] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) { toast.error("Message is required"); return; }
    if (channel === "email" && !subject.trim()) { toast.error("Subject is required for email"); return; }
    try {
      setSending(true);
      await apiClient.post(`/leads/${lead.id}/notify`, { channel, message, subject: subject || undefined });
      toast.success(`${channel === "sms" ? "SMS" : "Email"} sent to ${lead.name}`);
      onSent();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[#101828]">Notify {lead.name}</h3>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-md text-[#667085] hover:bg-[#f3f4f6]">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          {["sms", "email"].map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => setChannel(ch)}
              className={`flex-1 rounded-md border py-2 text-xs font-semibold transition ${channel === ch ? "border-[#008f45] bg-[#f0fdf4] text-[#008f45]" : "border-[#e5e7eb] text-[#667085]"}`}
            >
              <FontAwesomeIcon icon={ch === "sms" ? faComment : faEnvelope} className="mr-2" />
              {ch.toUpperCase()}
            </button>
          ))}
        </div>

        {channel === "email" && (
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject"
            className="mb-3 h-9 w-full rounded-md border border-[#d0d5dd] px-3 text-xs outline-none focus:border-[#008f45]"
          />
        )}

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={DEFAULT_LEAD_SMS_MESSAGE}
          rows={4}
          className="w-full resize-none rounded-md border border-[#d0d5dd] p-3 text-xs outline-none focus:border-[#008f45]"
        />

        <div className="mt-4 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="h-9 rounded-md border border-[#d0d5dd] px-4 text-xs font-semibold text-[#344054]">Cancel</button>
          <button
            type="button"
            onClick={handleSend}
            disabled={sending}
            className="h-9 rounded-md bg-[#008f45] px-5 text-xs font-semibold text-white disabled:opacity-60"
          >
            {sending ? "Sending…" : `Send ${channel.toUpperCase()}`}
          </button>
        </div>
      </div>
    </>
  );
};

const BulkSmsModal = ({ filters, totalItems, onClose, onSent }) => {
  const [title, setTitle] = useState("Lead SMS campaign");
  const [message, setMessage] = useState(DEFAULT_LEAD_SMS_MESSAGE);
  const [sending, setSending] = useState(false);
  const textareaRef = useRef(null);

  const insertToken = (token) => {
    const el = textareaRef.current;
    const current = el?.value ?? message;
    const start = el?.selectionStart ?? current.length;
    const end = el?.selectionEnd ?? current.length;
    const next = `${current.slice(0, start)}{{${token}}}${current.slice(end)}`;
    setMessage(next);
    requestAnimationFrame(() => {
      el?.focus();
      const pos = start + token.length + 4;
      el?.setSelectionRange(pos, pos);
    });
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("SMS message is required");
      return;
    }
    try {
      setSending(true);
      await apiClient.post("/leads/bulk-sms", {
        title: title.trim() || "Lead SMS campaign",
        message,
        search: filters.search || undefined,
        statuses: filters.status && filters.status !== "all" ? [filters.status] : undefined,
        sources: filters.source && filters.source !== "all" ? [filters.source] : undefined,
        sourceIds: filters.sourceId ? [filters.sourceId] : undefined,
        campaignNames: filters.campaignName ? [filters.campaignName] : undefined,
        campaignIds: filters.campaignId ? [filters.campaignId] : undefined,
      });
      toast.success("Bulk SMS campaign queued");
      onSent();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Failed to send bulk SMS");
    } finally {
      setSending(false);
    }
  };

  const activeFilters = [
    filters.search && `Search: ${filters.search}`,
    filters.status !== "all" && `Status: ${STATUS_META[filters.status]?.label ?? filters.status}`,
    filters.source !== "all" && `Source: ${LEAD_SOURCE_OPTIONS.find((s) => s.key === filters.source)?.label ?? filters.source}`,
    filters.sourceId && `Source ID: ${filters.sourceId}`,
    filters.campaignName && `Campaign: ${filters.campaignName}`,
    filters.campaignId && `Campaign ID: ${filters.campaignId}`,
  ].filter(Boolean);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#101828]">Send Bulk SMS</h3>
            <p className="mt-1 text-[11px] text-[#667085]">
              Targets the current lead filters{totalItems ? `, currently ${totalItems.toLocaleString()} leads` : ""}. Leads with a previous successful SMS will be skipped automatically; the number sent may be lower.
            </p>
          </div>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-md text-[#667085] hover:bg-[#f3f4f6]">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {activeFilters.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {activeFilters.map((filter) => (
              <span key={filter} className="rounded-full bg-[#f0fdf4] px-2.5 py-1 text-[10px] font-semibold text-[#006638]">
                {filter}
              </span>
            ))}
          </div>
        )}

        <label className="mb-3 block">
          <span className="mb-1 block text-[11px] font-semibold text-[#344054]">Campaign title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-9 w-full rounded-md border border-[#d0d5dd] px-3 text-xs outline-none focus:border-[#008f45]"
          />
        </label>

        <div className="mb-3">
          <p className="mb-2 text-[11px] font-semibold text-[#344054]">Personalization</p>
          <div className="flex flex-wrap gap-1.5">
            {LEAD_SMS_TOKENS.map(({ token, label }) => (
              <button
                key={token}
                type="button"
                onClick={() => insertToken(token)}
                className="rounded-md border border-[#d0d5dd] px-2.5 py-1 text-[11px] font-semibold text-[#344054] hover:border-[#008f45] hover:text-[#008f45]"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={DEFAULT_LEAD_SMS_MESSAGE}
          rows={5}
          className="w-full resize-none rounded-md border border-[#d0d5dd] p-3 text-xs outline-none focus:border-[#008f45]"
        />

        <div className="mt-4 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="h-9 rounded-md border border-[#d0d5dd] px-4 text-xs font-semibold text-[#344054]">Cancel</button>
          <button
            type="button"
            onClick={handleSend}
            disabled={sending}
            className="h-9 rounded-md bg-[#008f45] px-5 text-xs font-semibold text-white disabled:opacity-60"
          >
            {sending ? "Queueing..." : "Queue Bulk SMS"}
          </button>
        </div>
      </div>
    </>
  );
};

const LeadDetailDrawer = ({ lead, onClose, onStatusChange }) => {
  const [updating, setUpdating] = useState(null);
  const [notifyOpen, setNotifyOpen] = useState(false);

  if (!lead) return null;
  const [date, time] = formatDate(lead.createdAt);
  const [srcDate] = formatDate(lead.sourceCreatedAt);
  const gender = lead.gender || "N/A";
  const sm = STATUS_META[lead.status] ?? STATUS_META.new;
  const transitions = STATUS_TRANSITIONS[lead.status] ?? [];

  const doTransition = async (status) => {
    try {
      setUpdating(status);
      await apiClient.patch(`/leads/${lead.id}/status`, { status });
      onStatusChange();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Failed to update");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e5e7eb] px-5 py-4">
          <h2 className="text-sm font-semibold text-[#101828]">Lead Details</h2>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-md text-[#667085] hover:bg-[#f3f4f6]">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex flex-col items-center gap-2 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-5 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-[#dcf8e4] text-xl font-bold text-[#008f45]">
              {getInitials(lead.name)}
            </span>
            <p className="text-sm font-semibold text-[#101828]">{lead.name}</p>
            <span className="rounded-full px-3 py-1 text-[11px] font-semibold" style={{ background: sm.bg, color: sm.text }}>
              {sm.label}
            </span>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#98a2b3]">Contact</p>
            <div className="flex gap-3 rounded-lg border border-[#e5e7eb] px-4 py-3">
              <FontAwesomeIcon icon={faPhone} className="mt-0.5 w-4 shrink-0 text-[#008f45]" />
              <div><p className="text-[10px] text-[#667085]">Phone</p><p className="text-xs font-medium text-[#101828]">{lead.phone}</p></div>
            </div>
            {lead.email && (
              <div className="flex gap-3 rounded-lg border border-[#e5e7eb] px-4 py-3">
                <FontAwesomeIcon icon={faEnvelope} className="mt-0.5 w-4 shrink-0 text-[#008f45]" />
                <div><p className="text-[10px] text-[#667085]">Email</p><p className="text-xs font-medium text-[#101828] break-all">{lead.email}</p></div>
              </div>
            )}
            {lead.state && (
              <div className="flex gap-3 rounded-lg border border-[#e5e7eb] px-4 py-3">
                <FontAwesomeIcon icon={faLocationDot} className="mt-0.5 w-4 shrink-0 text-[#008f45]" />
                <div><p className="text-[10px] text-[#667085]">State</p><p className="text-xs font-medium text-[#101828]">{lead.state}</p></div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#98a2b3]">Profile</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-[#e5e7eb] px-4 py-3">
                <p className="text-[10px] text-[#667085]">Gender</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-[#101828]">
                  <FontAwesomeIcon icon={String(gender).toLowerCase() === "female" ? faVenus : faMars} className={String(gender).toLowerCase() === "female" ? "text-[#ef3f7a]" : "text-[#1f7ae0]"} />
                  {gender}
                </p>
              </div>
              <div className="rounded-lg border border-[#e5e7eb] px-4 py-3">
                <p className="text-[10px] text-[#667085]">Imported</p>
                <p className="mt-1 text-xs font-medium text-[#101828]">{date}</p>
                <p className="text-[10px] text-[#667085]">{time}</p>
              </div>
            </div>
          </div>

          {(lead.campaignName || lead.adName || lead.sourceLeadId || lead.campaignId || lead.formName || lead.sourceCreatedAt) && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#98a2b3]">Campaign</p>
              {lead.campaignName && (
                <div className="rounded-lg border border-[#e5e7eb] px-4 py-3">
                  <p className="text-[10px] text-[#667085]">Campaign</p>
                  <p className="mt-1 text-xs font-medium text-[#101828]">{lead.campaignName}</p>
                </div>
              )}
              {lead.adName && (
                <div className="rounded-lg border border-[#e5e7eb] px-4 py-3">
                  <p className="text-[10px] text-[#667085]">Ad</p>
                  <p className="mt-1 text-xs font-medium text-[#101828]">{lead.adName}</p>
                </div>
              )}
              {lead.sourceCreatedAt && (
                <div className="rounded-lg border border-[#e5e7eb] px-4 py-3">
                  <p className="text-[10px] text-[#667085]">Lead captured</p>
                  <p className="mt-1 text-xs font-medium text-[#101828]">{srcDate}</p>
                </div>
              )}
              {(lead.sourceLeadId || lead.campaignId || lead.formName) && (
                <div className="grid grid-cols-1 gap-2">
                  {lead.sourceLeadId && (
                    <div className="rounded-lg border border-[#e5e7eb] px-4 py-3">
                      <p className="text-[10px] text-[#667085]">Source ID</p>
                      <p className="mt-1 break-all text-xs font-medium text-[#101828]">{lead.sourceLeadId}</p>
                    </div>
                  )}
                  {lead.campaignId && (
                    <div className="rounded-lg border border-[#e5e7eb] px-4 py-3">
                      <p className="text-[10px] text-[#667085]">Campaign ID</p>
                      <p className="mt-1 break-all text-xs font-medium text-[#101828]">{lead.campaignId}</p>
                    </div>
                  )}
                  {lead.formName && (
                    <div className="rounded-lg border border-[#e5e7eb] px-4 py-3">
                      <p className="text-[10px] text-[#667085]">Form</p>
                      <p className="mt-1 text-xs font-medium text-[#101828]">{lead.formName}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {(lead.insights || lead.personalizationVariables) && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#98a2b3]">Insights</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-[#e5e7eb] px-4 py-3">
                  <p className="text-[10px] text-[#667085]">Stated interest</p>
                  <p className="mt-1 text-xs font-medium text-[#101828]">{valueOrDash(lead.insights?.statedInterest)}</p>
                </div>
                <div className="rounded-lg border border-[#e5e7eb] px-4 py-3">
                  <p className="text-[10px] text-[#667085]">New farmer</p>
                  <p className="mt-1 text-xs font-medium text-[#101828]">
                    {lead.insights?.isNewFarmer === true ? "Yes" : lead.insights?.isNewFarmer === false ? "No" : "—"}
                  </p>
                </div>
              </div>
              {lead.personalizationVariables && (
                <div className="rounded-lg border border-[#e5e7eb] px-4 py-3">
                  <p className="text-[10px] text-[#667085]">SMS variables</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {Object.entries(lead.personalizationVariables).map(([key, value]) => (
                      <span key={key} className="rounded-full bg-[#f3f4f6] px-2 py-1 text-[10px] font-semibold text-[#344054]">
                        {key}: {valueOrDash(value)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {lead.customFields && Object.keys(lead.customFields).length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#98a2b3]">Form Answers</p>
              {Object.entries(lead.customFields).map(([question, answer]) => (
                <div key={question} className="rounded-lg border border-[#e5e7eb] px-4 py-3">
                  <p className="text-[10px] text-[#667085]">{question}</p>
                  <p className="mt-1 text-xs font-medium text-[#101828]">{answer}</p>
                </div>
              ))}
            </div>
          )}

          {lead.notes && (
            <div className="rounded-lg border border-[#e5e7eb] px-4 py-3">
              <p className="text-[10px] text-[#667085]">Notes</p>
              <p className="mt-1 text-xs text-[#344054]">{lead.notes}</p>
            </div>
          )}

          {transitions.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#98a2b3]">Move to</p>
              {transitions.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={!!updating}
                  onClick={() => doTransition(s)}
                  className="flex w-full items-center justify-between rounded-lg border border-[#e5e7eb] px-4 py-2.5 text-xs font-semibold text-[#344054] hover:bg-[#f9fafb] disabled:opacity-60"
                >
                  <span>{STATUS_LABELS[s]}</span>
                  {updating === s ? <span className="text-[#667085]">…</span> : <FontAwesomeIcon icon={faArrowRight} className="text-[#667085]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-[#e5e7eb] px-5 py-4 flex gap-2">
          <button
            type="button"
            onClick={() => setNotifyOpen(true)}
            className="flex flex-1 h-9 items-center justify-center gap-2 rounded-md border border-[#008f45] text-xs font-semibold text-[#008f45] hover:bg-[#f0fdf4]"
          >
            <FontAwesomeIcon icon={faComment} />
            Send Message
          </button>
        </div>
      </div>

      {notifyOpen && (
        <NotifyModal lead={lead} onClose={() => setNotifyOpen(false)} onSent={onStatusChange} />
      )}
    </>
  );
};

const PAGE_SIZE_OPTIONS = [20, 50, 100, 250, 500, 1000];

const ListLeads = () => {
  const [leads, setLeads] = useState({ data: [], meta: {} });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [sourceIdFilter, setSourceIdFilter] = useState("");
  const [campaignNameFilter, setCampaignNameFilter] = useState("");
  const [campaignIdFilter, setCampaignIdFilter] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [bulkSmsOpen, setBulkSmsOpen] = useState(false);
  const [detailLead, setDetailLead] = useState(null);
  const [notifyTarget, setNotifyTarget] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const fileInputRef = useRef();
  const searchTimeout = useRef();
  const leadsRequestId = useRef(0);

  const fetchLeads = useCallback(async () => {
    const requestId = ++leadsRequestId.current;
    try {
      setLoading(true);
      const res = await apiClient.get("/leads", {
        params: {
          page,
          limit: pageSize,
          search: search || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          source: sourceFilter !== "all" ? sourceFilter : undefined,
          sourceId: sourceIdFilter.trim() || undefined,
          campaignName: campaignNameFilter.trim() || undefined,
          campaignId: campaignIdFilter.trim() || undefined,
        },
      });
      if (requestId !== leadsRequestId.current) return;
      const lastPage = Math.max(1, Number(res.data.meta?.totalPages ?? 1));
      if (page > lastPage) {
        setPage(lastPage);
        return;
      }
      setLeads(res.data);
    } catch (err) {
      if (requestId !== leadsRequestId.current) return;
      toast.error(err?.response?.data?.message || "Failed to load leads");
    } finally {
      if (requestId === leadsRequestId.current) setLoading(false);
    }
  }, [page, pageSize, search, statusFilter, sourceFilter, sourceIdFilter, campaignNameFilter, campaignIdFilter]);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await apiClient.get("/leads/stats");
      setStats(res.data);
    } catch {
      // stats are non-critical
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(1);
      setSearch(e.target.value);
    }, 400);
  };

  const resetFilters = () => {
    setStatusFilter("all");
    setSourceFilter("all");
    setSourceIdFilter("");
    setCampaignNameFilter("");
    setCampaignIdFilter("");
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const openLeadDetails = async (lead) => {
    setDetailLead(lead);
    try {
      const res = await apiClient.get(`/leads/${lead.id}`);
      setDetailLead(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load lead details");
    }
  };

  const handleFileUpload = async (fileList) => {
    if (!fileList?.length) return;
    const formData = new FormData();
    Array.from(fileList).forEach((f) => formData.append("files", f));
    try {
      setUploading(true);
      const res = await apiClient.post("/leads/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const { inserted, skipped, files: fileResults } = res.data;
      if (fileResults?.length > 1) {
        toast.success(
          `Imported ${inserted} leads across ${fileResults.length} files (${skipped} skipped as duplicates)`
        );
      } else {
        toast.success(`Imported ${inserted} leads (${skipped} skipped as duplicates)`);
      }
      fetchLeads();
      fetchStats();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleStatusChange = async (lead, status) => {
    try {
      setActionLoadingId(lead.id);
      await apiClient.patch(`/leads/${lead.id}/status`, { status });
      toast.success(`Lead marked as ${STATUS_META[status]?.label ?? status}`);
      fetchLeads();
      fetchStats();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (lead) => {
    try {
      setActionLoadingId(lead.id);
      await apiClient.delete(`/leads/${lead.id}`);
      toast.success("Lead removed");
      fetchLeads();
      fetchStats();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete");
    } finally {
      setActionLoadingId(null);
    }
  };

  const exportCSV = () => {
    const rows = leads.data.map((l) => [
      l.name, l.phone, l.email || "", l.gender || "", l.state || "",
      l.status, l.campaignName || "", l.adName || "", l.createdAt,
    ]);
    const header = ["Name", "Phone", "Email", "Gender", "State", "Status", "Campaign", "Ad", "Created"];
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "leads.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.max(1, Number(leads.meta?.totalPages ?? 1));
  const currentPage = Number(leads.meta?.currentPage ?? page);
  const totalItems = Number(leads.meta?.totalItems ?? 0);
  const effectivePageSize = Number(leads.meta?.itemsPerPage ?? pageSize);
  const firstItem = leads.data.length ? (currentPage - 1) * effectivePageSize + 1 : 0;
  const lastItem = leads.data.length ? Math.min(firstItem + leads.data.length - 1, totalItems) : 0;
  const currentFilters = {
    search: search.trim(),
    status: statusFilter,
    source: sourceFilter,
    sourceId: sourceIdFilter.trim(),
    campaignName: campaignNameFilter.trim(),
    campaignId: campaignIdFilter.trim(),
  };
  const activeFilterCount = [
    statusFilter !== "all",
    sourceFilter !== "all",
    sourceIdFilter.trim(),
    campaignNameFilter.trim(),
    campaignIdFilter.trim(),
  ].filter(Boolean).length;

  const statCards = stats ? [
    { label: "Total Leads",    value: stats.total,          icon: faUsers,       bg: "#ede9fe", color: "#7c3aed" },
    { label: "New",            value: stats.new,            icon: faUser,        bg: "#dbeafe", color: "#1d4ed8" },
    { label: "Contacted",      value: stats.contacted,      icon: faPhone,       bg: "#fef3c7", color: "#d97706" },
    { label: "Qualified",      value: stats.qualified,      icon: faBullseye,    bg: "#fce7f3", color: "#be185d" },
    { label: "Converted",      value: stats.converted,      icon: faCircleCheck, bg: "#dcf8e4", color: "#008f45" },
    { label: "Conversion Rate",value: `${stats.conversionRate}%`, icon: faTrophy, bg: "#fef3c7", color: "#b45309", sub: "of all imported leads" },
  ] : [];

  return (
    <div className="space-y-5 text-[#101828]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">Leads</h1>
          <p className="mt-1 text-xs font-medium text-[#667085]">Import, manage and convert ad leads into Agrofount customers</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setBulkSmsOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-[#008f45] bg-white px-4 text-xs font-semibold text-[#008f45] shadow-sm hover:bg-[#f0fdf4]"
          >
            <FontAwesomeIcon icon={faComment} />
            Bulk SMS
          </button>
          <button
            type="button"
            onClick={exportCSV}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-4 text-xs font-semibold text-[#344054] shadow-sm"
          >
            <FontAwesomeIcon icon={faDownload} />
            Export
          </button>
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-[#008f45] px-4 text-xs font-semibold text-white shadow-[0_4px_12px_rgba(0,143,69,0.25)] disabled:opacity-60"
          >
            <FontAwesomeIcon icon={faCloudArrowUp} />
            {uploading ? "Importing…" : "Import CSV / Excel"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            multiple
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
          />
        </div>
      </div>

      {statCards.length > 0 && (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {statCards.map((c) => <StatCard key={c.label} {...c} />)}
        </section>
      )}
      {statsLoading && !stats && (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-[#f3f4f6]" />
          ))}
        </section>
      )}

      <section className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0_4px_16px_rgba(16,24,40,0.04)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {["all", "new", "contacted", "qualified", "converted", "rejected"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`h-7 rounded-full px-3 text-[11px] font-semibold transition ${statusFilter === s ? "bg-[#008f45] text-white" : "border border-[#e5e7eb] text-[#667085] hover:bg-[#f3f4f6]"}`}
              >
                {s === "all" ? "All" : STATUS_META[s]?.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <label className="relative">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#667085]" />
              <input
                value={searchInput}
                onChange={handleSearchChange}
                placeholder="Search name, phone or state…"
                className="h-9 w-56 rounded-md border border-[#d0d5dd] bg-white pl-9 pr-3 text-xs outline-none focus:border-[#008f45]"
              />
            </label>
            <button type="button" onClick={resetFilters} className="inline-flex h-9 items-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-3 text-xs text-[#667085]">
              <FontAwesomeIcon icon={faRotateLeft} />
            </button>
            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-[#006b3a] px-4 text-xs font-semibold text-white"
            >
              <FontAwesomeIcon icon={faFilter} />
              Filter{activeFilterCount ? ` (${activeFilterCount})` : ""}
            </button>
          </div>
        </div>

        {filtersOpen && (
          <div className="mt-4 grid gap-3 rounded-lg border border-[#e5e7eb] bg-[#fbfcfd] p-3 sm:grid-cols-2 lg:grid-cols-4">
            <label>
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[#667085]">Lead Source</span>
              <select
                value={sourceFilter}
                onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
                className="h-9 w-full rounded-md border border-[#d0d5dd] bg-white px-3 text-xs outline-none focus:border-[#008f45]"
              >
                {LEAD_SOURCE_OPTIONS.map((source) => (
                  <option key={source.key} value={source.key}>{source.label}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[#667085]">Source ID</span>
              <div className="relative">
                <FontAwesomeIcon icon={faHashtag} className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-[#98a2b3]" />
                <input
                  value={sourceIdFilter}
                  onChange={(e) => { setSourceIdFilter(e.target.value); setPage(1); }}
                  placeholder="Meta lead ID"
                  className="h-9 w-full rounded-md border border-[#d0d5dd] bg-white pl-8 pr-3 text-xs outline-none focus:border-[#008f45]"
                />
              </div>
            </label>
            <label>
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[#667085]">Campaign Name</span>
              <input
                value={campaignNameFilter}
                onChange={(e) => { setCampaignNameFilter(e.target.value); setPage(1); }}
                placeholder="Campaign name"
                className="h-9 w-full rounded-md border border-[#d0d5dd] bg-white px-3 text-xs outline-none focus:border-[#008f45]"
              />
            </label>
            <label>
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[#667085]">Campaign ID</span>
              <input
                value={campaignIdFilter}
                onChange={(e) => { setCampaignIdFilter(e.target.value); setPage(1); }}
                placeholder="Exact campaign ID"
                className="h-9 w-full rounded-md border border-[#d0d5dd] bg-white px-3 text-xs outline-none focus:border-[#008f45]"
              />
            </label>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => setBulkSmsOpen(true)}
                className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-[#008f45] bg-white px-4 text-xs font-semibold text-[#008f45] hover:bg-[#f0fdf4]"
              >
                <FontAwesomeIcon icon={faComment} />
                SMS Filtered Leads
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <label className="flex items-center gap-2 text-xs text-[#667085]">
            Rows per page
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="h-9 rounded-md border border-[#d0d5dd] bg-white px-3 text-xs outline-none focus:border-[#008f45]"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>{size.toLocaleString()}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border border-[#e5e7eb]">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left">
              <thead className="border-b border-[#e5e7eb] bg-[#fbfcfd]">
                <tr>
                  {["Lead", "Phone", "State", "Gender", "Campaign / Ad", "Status", "SMS Status", "Last SMS Sent", "Imported", "Actions"].map((h) => (
                    <th
                      key={h}
                      className={`whitespace-nowrap px-4 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#667085] ${h === "Actions" ? "sticky right-0 bg-[#fbfcfd] text-right" : ""}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef2f6]">
                {loading ? (
                  <TableRowsSkeleton rows={6} columns={10} />
                ) : leads.data.length === 0 ? (
                  <tr>
                    <td colSpan="10">
                      <div className="flex h-52 flex-col items-center justify-center gap-3">
                        <div className="grid h-12 w-12 place-items-center rounded-full bg-[#f3f4f6]">
                          <FontAwesomeIcon icon={faUsers} className="text-[#98a2b3]" />
                        </div>
                        <p className="text-xs text-[#98a2b3]">No leads found. Import a Meta CSV to get started.</p>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="h-8 rounded-md bg-[#008f45] px-4 text-xs font-semibold text-white"
                        >
                          Import CSV / Excel
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  leads.data.map((lead) => {
                    const sm = STATUS_META[lead.status] ?? STATUS_META.new;
                    const [date, time] = formatDate(lead.createdAt);
                    const [smsDate, smsTime] = formatDate(lead.lastSmsSentAt);
                    const smsSent = lead.smsStatus === "sent";
                    const smsKnown = smsSent || lead.smsStatus === "not_sent";
                    const gender = lead.gender || "N/A";
                    const transitions = STATUS_TRANSITIONS[lead.status] ?? [];
                    return (
                      <tr key={lead.id} className="group hover:bg-[#f9fafb]">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#dcf8e4] text-xs font-bold text-[#008f45]">
                              {getInitials(lead.name)}
                            </span>
                            <div className="min-w-0 max-w-[180px]">
                              <p className="truncate text-xs font-semibold text-[#101828]" title={lead.name}>{lead.name}</p>
                              <p className="truncate text-[10px] text-[#667085]">{lead.source}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-[#475467]">
                            <FontAwesomeIcon icon={faPhone} className="text-[#008f45]" />
                            {lead.phone}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {lead.state ? (
                            <span className="flex max-w-[160px] items-center gap-1.5 text-xs text-[#475467]" title={lead.state}>
                              <FontAwesomeIcon icon={faLocationDot} className="shrink-0 text-[#008f45]" />
                              <span className="truncate">{lead.state}</span>
                            </span>
                          ) : <span className="text-xs text-[#98a2b3]">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-[#475467]">
                            <FontAwesomeIcon
                              icon={String(gender).toLowerCase() === "female" ? faVenus : faMars}
                              className={String(gender).toLowerCase() === "female" ? "text-[#ef3f7a]" : "text-[#1f7ae0]"}
                            />
                            {gender}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="max-w-[180px]">
                            <p className="truncate text-xs text-[#344054]" title={lead.campaignName}>{lead.campaignName || "—"}</p>
                            {lead.adName && <p className="truncate text-[10px] text-[#98a2b3]">{lead.adName}</p>}
                            {lead.campaignId && (
                              <button
                                type="button"
                                title={`Filter by campaign ID ${lead.campaignId}`}
                                onClick={() => { setCampaignIdFilter(lead.campaignId); setFiltersOpen(true); setPage(1); }}
                                className="mt-1 block max-w-full truncate text-[10px] text-[#008f45] underline"
                              >
                                ID: {lead.campaignId}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: sm.bg, color: sm.text }}>
                            {sm.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            title={smsSent ? "Accepted by the SMS provider; delivery is not confirmed." : "No successful SMS send is recorded."}
                            className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${smsSent ? "bg-[#dcf8e4] text-[#008f45]" : "bg-[#f3f4f6] text-[#667085]"}`}
                          >
                            {smsSent ? "Sent" : smsKnown ? "Not sent" : "Unavailable"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-[#475467]">
                          <p>{smsDate}</p>
                          <p className="text-[10px] text-[#667085]">{smsTime}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-1.5 whitespace-nowrap text-xs text-[#475467]">
                            <FontAwesomeIcon icon={faCalendarDays} className="mt-0.5 text-[#667085]" />
                            <div>
                              <p>{date}</p>
                              <p className="text-[10px] text-[#667085]">{time}</p>
                            </div>
                          </div>
                        </td>
                        <td className="sticky right-0 bg-white px-4 py-3 text-right group-hover:bg-[#f9fafb]">
                          <Menu as="div" className="relative inline-block">
                            <MenuButton
                              disabled={actionLoadingId === lead.id}
                              className="grid h-8 w-8 place-items-center rounded-md border border-[#e5e7eb] text-[#667085] hover:bg-[#f8fafc] lg:opacity-0 lg:group-hover:opacity-100 lg:focus:opacity-100 disabled:opacity-40"
                            >
                              <FontAwesomeIcon icon={faEllipsisVertical} />
                            </MenuButton>
                            <MenuItems className="absolute right-0 z-20 mt-1 w-48 rounded-md border border-[#e5e7eb] bg-white py-1 shadow-lg focus:outline-none">
                              <MenuItem>
                                <button type="button" onClick={() => openLeadDetails(lead)} className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#344054] hover:bg-[#f9fafb]">
                                  <FontAwesomeIcon icon={faUser} className="text-[#1f7ae0]" />
                                  View Details
                                </button>
                              </MenuItem>
                              <MenuItem>
                                <button type="button" onClick={() => setNotifyTarget(lead)} className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#344054] hover:bg-[#f9fafb]">
                                  <FontAwesomeIcon icon={faComment} className="text-[#008f45]" />
                                  Send Message
                                </button>
                              </MenuItem>
                              {transitions.length > 0 && <div className="my-1 border-t border-[#f3f4f6]" />}
                              {transitions.map((s) => (
                                <MenuItem key={s}>
                                  <button
                                    type="button"
                                    onClick={() => handleStatusChange(lead, s)}
                                    className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#344054] hover:bg-[#f9fafb]"
                                  >
                                    <FontAwesomeIcon icon={s === "rejected" ? faCircleXmark : faArrowRight} className={s === "rejected" ? "text-[#dc2626]" : "text-[#008f45]"} />
                                    {STATUS_LABELS[s]}
                                  </button>
                                </MenuItem>
                              ))}
                              <div className="my-1 border-t border-[#f3f4f6]" />
                              <MenuItem>
                                <button type="button" onClick={() => handleDelete(lead)} className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#dc2626] hover:bg-[#fff5f5]">
                                  <FontAwesomeIcon icon={faCircleXmark} />
                                  Remove Lead
                                </button>
                              </MenuItem>
                            </MenuItems>
                          </Menu>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#667085]">
            {loading ? "Loading leads…" : `Showing ${firstItem} – ${lastItem} of ${totalItems} leads`}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage(Math.max(1, currentPage - 1))}
              disabled={loading || currentPage <= 1}
              className="grid h-8 w-8 place-items-center rounded-md border border-[#d0d5dd] text-xs text-[#667085] disabled:opacity-40"
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            {(() => {
              const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
              const end = Math.min(totalPages, start + 4);
              return Array.from({ length: end - start + 1 }, (_, i) => start + i).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  disabled={loading}
                  className={`h-8 min-w-8 rounded-md px-2.5 text-xs font-semibold ${currentPage === p ? "bg-[#008f45] text-white" : "border border-[#e5e7eb] text-[#344054]"}`}
                >
                  {p}
                </button>
              ));
            })()}
            <button
              type="button"
              onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
              disabled={loading || currentPage >= totalPages}
              className="grid h-8 w-8 place-items-center rounded-md border border-[#d0d5dd] text-xs text-[#667085] disabled:opacity-40"
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
        </div>
      </section>

      <LeadDetailDrawer
        lead={detailLead}
        onClose={() => setDetailLead(null)}
        onStatusChange={() => { fetchLeads(); fetchStats(); setDetailLead(null); }}
      />

      {notifyTarget && (
        <NotifyModal
          lead={notifyTarget}
          onClose={() => setNotifyTarget(null)}
          onSent={() => { fetchLeads(); fetchStats(); }}
        />
      )}

      {bulkSmsOpen && (
        <BulkSmsModal
          filters={currentFilters}
          totalItems={totalItems}
          onClose={() => setBulkSmsOpen(false)}
          onSent={() => { fetchLeads(); fetchStats(); }}
        />
      )}
    </div>
  );
};

export default ListLeads;
