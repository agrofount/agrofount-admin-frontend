import {
  faArrowLeft,
  faBoxOpen,
  faBriefcase,
  faCheck,
  faChevronRight,
  faCircleInfo,
  faCircleXmark,
  faClipboardList,
  faCommentDots,
  faCopy,
  faDownload,
  faEnvelope,
  faFileLines,
  faLocationDot,
  faPhone,
  faPhoneVolume,
  faTimeline,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  fetchSellerInterest,
  formatSellerInterestDateTime,
  sellerInterestStatusLabels,
  updateSellerInterestNotes,
  updateSellerInterestStatus,
} from "./sellerInterestData";

const statusBadgeTone = {
  New: "bg-[#dcf8e6] text-[#008f45]",
  Contacted: "bg-[#e5f1ff] text-[#1677d2]",
  Approved: "bg-[#dcf8e6] text-[#008f45]",
  Rejected: "bg-[#ffe4e4] text-[#ef3340]",
};

const STATUS_BANNER = {
  new: {
    text: "This submission is new and has not been contacted yet.",
    tone: "border-[#f5d98b] bg-[#fef8e7] text-[#92610a]",
    icon: "text-[#d97706]",
  },
  contacted: {
    text: "The seller has been contacted. Awaiting a decision.",
    tone: "border-[#bfe0ff] bg-[#eaf4ff] text-[#1677d2]",
    icon: "text-[#1677d2]",
  },
  approved: {
    text: "This seller application has been approved.",
    tone: "border-[#bfe8cf] bg-[#eafaf0] text-[#008f45]",
    icon: "text-[#008f45]",
  },
  rejected: {
    text: "This seller application was rejected.",
    tone: "border-[#f8c9cc] bg-[#fff1f2] text-[#ef3340]",
    icon: "text-[#ef3340]",
  },
};

const NEXT_STEP = {
  new: "Review and contact the seller",
  contacted: "Decide to approve or reject the application",
  approved: "Coordinate onboarding with the seller",
  rejected: "No further action required",
};

const TIMELINE_META = {
  contacted: {
    label: "Marked as Contacted",
    description: "Admin reached out to the seller.",
    dot: "bg-[#1677d2]",
  },
  approved: {
    label: "Application Approved",
    description: "Seller application was approved.",
    dot: "bg-[#008f45]",
  },
  rejected: {
    label: "Application Rejected",
    description: "Seller application was rejected.",
    dot: "bg-[#ef3340]",
  },
};

const buildTimeline = (interest) => {
  const events = [
    {
      key: "received",
      label: "Submission Received",
      description: "Seller submitted their interest form.",
      date: interest.createdAt,
      dot: "bg-[#008f45]",
    },
  ];
  const statusEvent = TIMELINE_META[interest.status];
  if (statusEvent) {
    events.push({
      key: "status",
      label: statusEvent.label,
      description: statusEvent.description,
      date: interest.updatedAt,
      dot: statusEvent.dot,
    });
  }
  return events;
};

const buildSummaryText = (interest) =>
  [
    `Seller Interest Submission`,
    `Submission ID: ${interest.id}`,
    ``,
    `Contact Name: ${interest.contactName}`,
    `Email: ${interest.email}`,
    `Phone: ${interest.phone}`,
    `Location: ${interest.location}`,
    ``,
    `Business Name: ${interest.businessName || "N/A"}`,
    `Business Type: ${interest.businessType || "N/A"}`,
    ``,
    `Product: ${interest.productName}`,
    `Category: ${interest.productCategory}`,
    `Quantity Available: ${interest.quantityAvailable} ${interest.unit}`,
    `Price per Unit: ${interest.pricePerUnit != null ? `₦${Number(interest.pricePerUnit).toLocaleString()}` : "Not provided"}`,
    `Description: ${interest.productDescription}`,
    ``,
    `Message from Seller: ${interest.additionalNotes || "None"}`,
    ``,
    `Status: ${sellerInterestStatusLabels[interest.status] || interest.status}`,
    `Submitted On: ${formatSellerInterestDateTime(interest.createdAt)}`,
    `Last Updated: ${formatSellerInterestDateTime(interest.updatedAt)}`,
  ].join("\n");

const OutlineButton = ({ icon, label, onClick, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-4 text-sm font-semibold text-[#101828] hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-50"
  >
    <FontAwesomeIcon icon={icon} />
    {label}
  </button>
);

const SolidButton = ({ icon, label, tone = "primary", onClick, disabled }) => {
  const classes =
    tone === "danger"
      ? "border-[#ef3340] bg-white text-[#ef3340] hover:bg-[#fff1f2]"
      : "border-[#008f45] bg-[#008f45] text-white hover:bg-[#00753a]";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${classes}`}
    >
      <FontAwesomeIcon icon={icon} />
      {label}
    </button>
  );
};

const SectionCard = ({ icon, iconBg, iconColor, title, children }) => (
  <section className="rounded-lg border border-[#e5e7eb] bg-white p-5 shadow-[0_2px_8px_rgba(16,24,40,0.04)]">
    <div className="mb-5 flex items-center gap-2.5">
      <span className={`grid h-8 w-8 place-items-center rounded-md ${iconBg}`}>
        <FontAwesomeIcon icon={icon} className={`text-sm ${iconColor}`} />
      </span>
      <h2 className="text-sm font-semibold text-[#101828]">{title}</h2>
    </div>
    {children}
  </section>
);

const Field = ({ label, value, children }) => (
  <div>
    <p className="text-xs font-medium text-[#667085]">{label}</p>
    {children || <p className="mt-1 text-sm font-semibold text-[#101828]">{value ?? "-"}</p>}
  </div>
);

const SellerInterestDetail = () => {
  const { interestId } = useParams();
  const navigate = useNavigate();
  const [interest, setInterest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const loadInterest = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchSellerInterest(interestId);
      setInterest(data);
      setNotes(data.internalNotes || "");
    } catch (error) {
      toast.error(error.message || "Unable to load seller interest submission.");
      navigate("/seller-interests");
    } finally {
      setLoading(false);
    }
  }, [interestId, navigate]);

  useEffect(() => {
    loadInterest();
  }, [loadInterest]);

  const handleStatusChange = async (status) => {
    setUpdating(true);
    try {
      await updateSellerInterestStatus(interestId, status);
      toast.success("Submission updated.");
      await loadInterest();
    } catch (error) {
      toast.error(error.message || "Unable to update submission.");
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await updateSellerInterestNotes(interestId, notes);
      toast.success("Note saved.");
    } catch (error) {
      toast.error(error.message || "Unable to save note.");
    } finally {
      setSavingNotes(false);
    }
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(interest.id);
      toast.success("Submission ID copied.");
    } catch {
      toast.error("Unable to copy submission ID.");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([buildSummaryText(interest)], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `seller-interest-${interest.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const timeline = useMemo(() => (interest ? buildTimeline(interest) : []), [interest]);

  if (loading) {
    return (
      <div className="rounded-lg border border-[#e5e7eb] bg-white p-8 text-sm text-[#667085]">
        Loading seller interest submission...
      </div>
    );
  }

  if (!interest) return null;

  const statusLabel = sellerInterestStatusLabels[interest.status] || interest.status;
  const banner = STATUS_BANNER[interest.status] || STATUS_BANNER.new;
  const canReject = interest.status === "new" || interest.status === "contacted";

  return (
    <div className="space-y-5 text-[#101828]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-[#667085]">
            <Link to="/" className="hover:text-[#008f45]">Dashboard</Link>
            <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
            <Link to="/seller-interests" className="hover:text-[#008f45]">Seller Interests</Link>
            <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
            <span className="font-semibold text-[#008f45]">{interest.contactName}</span>
          </div>
          <h1 className="mt-2 text-xl font-semibold">Seller Interest Details</h1>
          <p className="mt-1 text-xs font-medium text-[#667085]">
            Review the submitted information and follow up.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <OutlineButton icon={faArrowLeft} label="Back to List" onClick={() => navigate("/seller-interests")} />
          <OutlineButton icon={faDownload} label="Download" onClick={handleDownload} />
          {interest.status === "new" && (
            <SolidButton
              icon={faPhoneVolume}
              label="Mark as Contacted"
              disabled={updating}
              onClick={() => handleStatusChange("contacted")}
            />
          )}
          {interest.status === "contacted" && (
            <SolidButton
              icon={faCheck}
              label="Approve"
              disabled={updating}
              onClick={() => handleStatusChange("approved")}
            />
          )}
          {canReject && (
            <SolidButton
              icon={faCircleXmark}
              label="Reject"
              tone="danger"
              disabled={updating}
              onClick={() => handleStatusChange("rejected")}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.35fr_1fr]">
        <div className="space-y-5">
          <section className="rounded-lg border border-[#bfe8cf] bg-[#f0fbf5] p-5">
            <div className="flex flex-wrap items-start gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#dcf8e6] text-[#008f45]">
                <FontAwesomeIcon icon={faUser} className="text-xl" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-[#101828]">{interest.contactName}</h2>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeTone[statusLabel] || statusBadgeTone.New}`}>
                    {statusLabel}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[#475467]">Interested in becoming a seller on Agrofount</p>
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#344054]">
                  <span><FontAwesomeIcon icon={faEnvelope} className="mr-2 text-[#667085]" />{interest.email}</span>
                  <span><FontAwesomeIcon icon={faPhone} className="mr-2 text-[#667085]" />{interest.phone}</span>
                  <span><FontAwesomeIcon icon={faLocationDot} className="mr-2 text-[#667085]" />{interest.location}</span>
                </div>
              </div>
            </div>
          </section>

          <SectionCard icon={faBriefcase} iconBg="bg-[#eafaf0]" iconColor="text-[#008f45]" title="Business Information">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Business Name" value={interest.businessName || "-"} />
              <Field label="Product of Interest" value={interest.productName || "-"} />
              <Field label="Business Type" value={interest.businessType || "-"} />
              <Field label="Years in Business" value="-" />
              <Field label="Website" value="-" />
            </div>
          </SectionCard>

          <SectionCard icon={faBoxOpen} iconBg="bg-[#fef3e6]" iconColor="text-[#d97706]" title="Product Details">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Category" value={interest.productCategory || "-"} />
              <Field label="Quantity Available" value={`${interest.quantityAvailable} ${interest.unit}`} />
              <Field
                label="Price per Unit"
                value={interest.pricePerUnit != null ? `₦${Number(interest.pricePerUnit).toLocaleString()}` : "Not provided"}
              />
            </div>
            <div className="mt-5">
              <Field label="Description" value={interest.productDescription || "-"} />
            </div>
            {interest.samples?.length > 0 && (
              <div className="mt-5">
                <p className="text-xs font-medium text-[#667085]">Sample Photos</p>
                <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {interest.samples.map((sample) => (
                    <a
                      key={sample.id}
                      href={sample.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block overflow-hidden rounded-lg border border-[#e5e7eb]"
                    >
                      <img src={sample.url} alt="Product sample" className="h-28 w-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>

          <SectionCard icon={faFileLines} iconBg="bg-[#eaf4ff]" iconColor="text-[#1677d2]" title="Submission Information">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Submission ID">
                <div className="mt-1 flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-[#101828]">{interest.id}</p>
                  <button type="button" onClick={handleCopyId} className="text-[#667085] hover:text-[#008f45]">
                    <FontAwesomeIcon icon={faCopy} className="text-xs" />
                  </button>
                </div>
              </Field>
              <Field label="Submitted On" value={formatSellerInterestDateTime(interest.createdAt)} />
              <Field label="Source" value="Become a Seller Form (Website)" />
              <Field label="Status">
                <span className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeTone[statusLabel] || statusBadgeTone.New}`}>
                  {statusLabel}
                </span>
              </Field>
              <Field label="Last Updated" value={formatSellerInterestDateTime(interest.updatedAt)} />
            </div>
          </SectionCard>

          <SectionCard icon={faCommentDots} iconBg="bg-[#f2ecff]" iconColor="text-[#6b3fd4]" title="Message from Seller">
            <div className="rounded-md border border-[#eef2f6] bg-[#f9fafb] p-4 text-sm leading-relaxed text-[#344054]">
              {interest.additionalNotes || "No message was provided with this submission."}
            </div>
          </SectionCard>
        </div>

        <aside className="space-y-5">
          <SectionCard icon={faCircleInfo} iconBg="bg-[#eaf4ff]" iconColor="text-[#1677d2]" title="Status Overview">
            <div className={`flex items-start gap-3 rounded-md border p-4 text-sm ${banner.tone}`}>
              <FontAwesomeIcon icon={faCircleInfo} className={`mt-0.5 ${banner.icon}`} />
              <p>{banner.text}</p>
            </div>
            <div className="mt-5 space-y-4">
              <Field label="Current Status">
                <span className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeTone[statusLabel] || statusBadgeTone.New}`}>
                  {statusLabel}
                </span>
              </Field>
              <Field label="Next Step" value={NEXT_STEP[interest.status] || "-"} />
              <Field label="Assigned To" value="-" />
            </div>
          </SectionCard>

          <SectionCard icon={faTimeline} iconBg="bg-[#eafaf0]" iconColor="text-[#008f45]" title="Activity Timeline">
            <div className="space-y-5">
              {timeline.map((event) => (
                <div key={event.key} className="flex gap-3">
                  <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${event.dot}`} />
                  <div>
                    <p className="text-sm font-semibold text-[#101828]">{event.label}</p>
                    <p className="text-xs text-[#667085]">{event.description}</p>
                    <p className="mt-1 text-xs text-[#98a2b3]">{formatSellerInterestDateTime(event.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard icon={faClipboardList} iconBg="bg-[#f2ecff]" iconColor="text-[#6b3fd4]" title="Internal Notes">
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Add a note about this submission..."
              rows={4}
              className="w-full rounded-md border border-[#d0d5dd] p-3 text-sm text-[#101828] outline-none placeholder:text-[#98a2b3] focus:border-[#008f45]"
            />
            <button
              type="button"
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="mt-3 inline-flex h-9 items-center gap-2 rounded-md bg-[#dcf8e6] px-4 text-sm font-semibold text-[#008f45] hover:bg-[#c7f0d8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faFileLines} />
              {savingNotes ? "Saving..." : "Save Note"}
            </button>
          </SectionCard>
        </aside>
      </div>
    </div>
  );
};

export default SellerInterestDetail;
