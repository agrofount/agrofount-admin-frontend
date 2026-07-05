import {
  faArrowLeft,
  faBoxOpen,
  faBriefcase,
  faCheck,
  faChevronRight,
  faCircleXmark,
  faClock,
  faEnvelope,
  faLocationDot,
  faPhone,
  faPhoneVolume,
  faTag,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  fetchSellerInterest,
  formatSellerInterestDate,
  sellerInterestStatusLabels,
  updateSellerInterestStatus,
} from "./sellerInterestData";

const statusTone = {
  New: "bg-[#dcf8e6] text-[#008f45]",
  Contacted: "bg-[#e5f1ff] text-[#1677d2]",
  Approved: "bg-[#dcf8e6] text-[#008f45]",
  Rejected: "bg-[#ffe4e4] text-[#ef3340]",
};

const DetailItem = ({ icon, label, value, children }) => (
  <div className="grid grid-cols-[24px_1fr] gap-4">
    <FontAwesomeIcon icon={icon} className="mt-1 text-[#667085]" />
    <div>
      <p className="text-sm font-semibold text-[#344054]">{label}</p>
      {children || <p className="mt-1 text-sm leading-5 text-[#475467]">{value || "N/A"}</p>}
    </div>
  </div>
);

const ActionButton = ({ icon, label, tone = "neutral", onClick, disabled }) => {
  const classes =
    tone === "danger"
      ? "border-[#ef3340] text-[#ef3340] hover:bg-[#fff1f2]"
      : tone === "primary"
        ? "border-[#008f45] text-[#008f45] hover:bg-[#effaf3]"
        : "border-[#d0d5dd] text-[#101828] hover:bg-[#f9fafb]";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-md border bg-white px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${classes}`}
    >
      <FontAwesomeIcon icon={icon} />
      {label}
    </button>
  );
};

const SellerInterestDetail = () => {
  const { interestId } = useParams();
  const navigate = useNavigate();
  const [interest, setInterest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const loadInterest = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchSellerInterest(interestId);
      setInterest(data);
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

  if (loading) {
    return (
      <div className="rounded-lg border border-[#e5e7eb] bg-white p-8 text-sm text-[#667085]">
        Loading seller interest submission...
      </div>
    );
  }

  if (!interest) return null;

  const statusLabel = sellerInterestStatusLabels[interest.status] || interest.status;

  return (
    <div className="space-y-5 text-[#101828]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <Link to="/seller-interests" className="inline-flex items-center gap-2 text-sm font-semibold text-[#008f45]">
            <FontAwesomeIcon icon={faArrowLeft} />
            Back to Seller Interests
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-normal">{interest.contactName}</h1>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone[statusLabel] || statusTone.New}`}>
                {statusLabel}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-sm text-[#475467]">
              <span><FontAwesomeIcon icon={faBoxOpen} className="mr-2" />{interest.productName}</span>
              <span><FontAwesomeIcon icon={faLocationDot} className="mr-2" />{interest.location}</span>
              <span><FontAwesomeIcon icon={faClock} className="mr-2" />Submitted {formatSellerInterestDate(interest.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:items-end">
          <div className="flex items-center gap-2 text-sm text-[#667085]">
            <Link to="/" className="hover:text-[#008f45]">Dashboard</Link>
            <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
            <Link to="/seller-interests" className="hover:text-[#008f45]">Seller Interests</Link>
            <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
            <span className="font-semibold text-[#008f45]">View Submission</span>
          </div>
          <div className="flex flex-wrap justify-start gap-3 lg:justify-end">
            <ActionButton icon={faPhoneVolume} label="Mark Contacted" disabled={updating || statusLabel === "Contacted"} onClick={() => handleStatusChange("contacted")} />
            <ActionButton icon={faCheck} label="Approve" tone="primary" disabled={updating || statusLabel === "Approved"} onClick={() => handleStatusChange("approved")} />
            <ActionButton icon={faCircleXmark} label="Reject" tone="danger" disabled={updating || statusLabel === "Rejected"} onClick={() => handleStatusChange("rejected")} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.35fr_1fr]">
        <section className="rounded-lg border border-[#e5e7eb] bg-white p-6 shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
          <h2 className="flex items-center gap-3 text-lg font-semibold">
            <FontAwesomeIcon icon={faBoxOpen} className="text-[#008f45]" />
            Product Details
          </h2>

          <div className="mt-8 space-y-6">
            <DetailItem icon={faTag} label="Product" value={interest.productName} />
            <DetailItem icon={faTag} label="Category" value={interest.productCategory} />
            <DetailItem icon={faBoxOpen} label="Quantity Available" value={`${interest.quantityAvailable} ${interest.unit}`} />
            <DetailItem
              icon={faTag}
              label="Price per Unit"
              value={interest.pricePerUnit != null ? `₦${Number(interest.pricePerUnit).toLocaleString()}` : "Not provided"}
            />
            <DetailItem icon={faBoxOpen} label="Description" value={interest.productDescription} />
            {interest.additionalNotes && (
              <DetailItem icon={faBoxOpen} label="Additional Notes" value={interest.additionalNotes} />
            )}
          </div>

          {interest.samples?.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-semibold">Sample Photos</h3>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {interest.samples.map((sample) => (
                  <a
                    key={sample.id}
                    href={sample.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block overflow-hidden rounded-lg border border-[#e5e7eb]"
                  >
                    <img src={sample.url} alt="Product sample" className="h-32 w-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border border-[#e5e7eb] bg-white p-6 shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
            <h2 className="flex items-center gap-3 text-lg font-semibold">
              <span className="grid h-6 w-6 place-items-center rounded-full border border-[#008f45] text-sm text-[#008f45]">i</span>
              Contact Information
            </h2>
            <div className="mt-8 space-y-6">
              <DetailItem icon={faEnvelope} label="Email" value={interest.email} />
              <DetailItem icon={faPhone} label="Phone" value={interest.phone} />
              <DetailItem icon={faBriefcase} label="Business Name" value={interest.businessName} />
              <DetailItem icon={faBriefcase} label="Business Type" value={interest.businessType} />
              <DetailItem icon={faLocationDot} label="Location" value={interest.location} />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default SellerInterestDetail;
