import {
  faArchive,
  faArrowLeft,
  faBriefcase,
  faCalendarDays,
  faCheck,
  faChevronRight,
  faClipboard,
  faClock,
  faCopy,
  faEyeSlash,
  faFileLines,
  faLocationDot,
  faPen,
  faShareNodes,
  faTrashCan,
  faUserCheck,
  faUserGroup,
  faUserTie,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { assets } from "../../assets/assets";
import {
  employmentTypeLabels,
  fetchCareerJob,
  fetchCareerJobApplications,
  formatCareerDate,
  jobStatusLabels,
  updateCareerJobStatus,
  workModeLabels,
} from "./careerData";

const statusTone = {
  Published: "bg-[#dcf8e6] text-[#008f45]",
  Draft: "bg-[#f2f4f7] text-[#667085]",
  Closed: "bg-[#ffe4e4] text-[#ef3340]",
  Archived: "bg-[#eef2f6] text-[#667085]",
};

const metricTones = {
  green: "bg-[#e4f7eb] text-[#008f45]",
  blue: "bg-[#e8f2ff] text-[#1b8ef2]",
  orange: "bg-[#fff0df] text-[#f97316]",
  purple: "bg-[#f0e7ff] text-[#8b3ff0]",
};

const formatDateTime = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  return `${formatCareerDate(value)}, ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};

const daysUntil = (value) => {
  if (!value) return "";
  const diff = Math.ceil((new Date(value).getTime() - Date.now()) / 86_400_000);
  if (diff < 0) return "closed";
  if (diff === 0) return "today";
  return `in ${diff} day${diff === 1 ? "" : "s"}`;
};

const toList = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return String(value)
    .split(/\n|;/)
    .map((item) => item.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
};

const MetricCard = ({ label, value, detail, icon, tone }) => (
  <section className="flex items-center gap-5 rounded-lg border border-[#e5e7eb] bg-white p-5 shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
    <div className={`grid h-14 w-14 place-items-center rounded-full text-xl ${metricTones[tone]}`}>
      <FontAwesomeIcon icon={icon} />
    </div>
    <div>
      <p className="text-sm font-medium text-[#344054]">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-normal text-[#101828]">
        {value}
      </p>
      <p className={`mt-2 text-xs font-semibold ${tone === "orange" ? "text-[#f97316]" : tone === "purple" ? "text-[#8b3ff0]" : "text-[#008f45]"}`}>
        {detail}
      </p>
    </div>
  </section>
);

const DetailItem = ({ icon, label, value, children }) => (
  <div className="grid grid-cols-[24px_1fr] gap-4">
    <FontAwesomeIcon icon={icon} className="mt-1 text-[#667085]" />
    <div>
      <p className="text-sm font-semibold text-[#344054]">{label}</p>
      {children || <p className="mt-1 text-sm leading-5 text-[#475467]">{value || "N/A"}</p>}
    </div>
  </div>
);

const BulletList = ({ items }) => (
  <ul className="mt-4 space-y-3">
    {items.map((item) => (
      <li key={item} className="flex gap-3 text-sm leading-6 text-[#101828]">
        <span className="mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full border border-[#008f45] text-[9px] text-[#008f45]">
          <FontAwesomeIcon icon={faCheck} />
        </span>
        {item}
      </li>
    ))}
  </ul>
);

const ActionButton = ({ icon, label, tone = "neutral", onClick }) => {
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
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-md border bg-white px-4 text-sm font-semibold ${classes}`}
    >
      <FontAwesomeIcon icon={icon} />
      {label}
    </button>
  );
};

const JobDetail = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [applicationsMeta, setApplicationsMeta] = useState({});
  const [loading, setLoading] = useState(true);

  const loadJob = useCallback(async () => {
    try {
      setLoading(true);
      const [jobData, applicationsData] = await Promise.all([
        fetchCareerJob(jobId),
        fetchCareerJobApplications(jobId, { page: 1, limit: 100 }),
      ]);
      setJob(jobData);
      setApplications(applicationsData.data || []);
      setApplicationsMeta(applicationsData.meta || {});
    } catch (error) {
      toast.error(error.message || "Unable to load job detail.");
      navigate("/careers/jobs");
    } finally {
      setLoading(false);
    }
  }, [jobId, navigate]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  const statusLabel = jobStatusLabels[job?.status] || job?.status || "Draft";
  const typeLabel =
    employmentTypeLabels[job?.employmentType] || job?.employmentType || "N/A";
  const modeLabel = workModeLabels[job?.workMode] || job?.workMode || "N/A";
  const totalApplications = Number(
    applicationsMeta.totalItems ||
      job?.applicationsCount ||
      job?.applicationCount ||
      applications.length ||
      0
  );

  const pipeline = useMemo(() => {
    const counts = {
      new: 0,
      reviewing: 0,
      shortlisted: 0,
      interviewed: 0,
      hired: 0,
    };
    applications.forEach((application) => {
      const status = String(application.status || "new").toLowerCase();
      if (status === "interviewed" || status === "interviewing") counts.interviewed += 1;
      else if (counts[status] !== undefined) counts[status] += 1;
    });
    counts.new = totalApplications || counts.new;
    return [
      ["Applied", counts.new, "green"],
      ["Reviewed", counts.reviewing, "blue"],
      ["Shortlisted", counts.shortlisted, "orange"],
      ["Interviewed", counts.interviewed, "purple"],
      ["Hired", counts.hired, "green"],
    ];
  }, [applications, totalApplications]);

  const shortlisted = pipeline.find(([label]) => label === "Shortlisted")?.[1] || 0;
  const interviewed = pipeline.find(([label]) => label === "Interviewed")?.[1] || 0;
  const hired = pipeline.find(([label]) => label === "Hired")?.[1] || 0;
  const percent = (value) =>
    totalApplications ? `${((Number(value) / totalApplications) * 100).toFixed(1)}%` : "0%";

  const publicJobUrl = `${window.location.origin.replace(/\/admin$/, "")}/careers/jobs/${job?.slug || job?.id || ""}`;

  const handleStatusAction = async (action) => {
    try {
      await updateCareerJobStatus(job, action);
      toast.success("Job updated.");
      await loadJob();
    } catch (error) {
      toast.error(error.message || `Unable to ${action} job.`);
    }
  };

  const copyText = async (text, message) => {
    await navigator.clipboard?.writeText(text);
    toast.success(message);
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-[#e5e7eb] bg-white p-8 text-sm text-[#667085]">
        Loading job detail...
      </div>
    );
  }

  if (!job) return null;

  const responsibilities = toList(job.responsibilities);
  const requirements = toList(job.requirements);
  const benefits = toList(job.benefits);

  return (
    <div className="space-y-5 text-[#101828]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <Link to="/careers/jobs" className="inline-flex items-center gap-2 text-sm font-semibold text-[#008f45]">
            <FontAwesomeIcon icon={faArrowLeft} />
            Back to Job Openings
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-normal">{job.title}</h1>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone[statusLabel] || statusTone.Draft}`}>
                {statusLabel}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-sm text-[#475467]">
              <span><FontAwesomeIcon icon={faBriefcase} className="mr-2" />{job.department}</span>
              <span><FontAwesomeIcon icon={faLocationDot} className="mr-2" />{modeLabel}</span>
              <span><FontAwesomeIcon icon={faCalendarDays} className="mr-2" />{typeLabel}</span>
            </div>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-sm text-[#475467]">
              <span><FontAwesomeIcon icon={faCalendarDays} className="mr-2" />Published on {formatCareerDate(job.publishedAt || job.createdAt)}</span>
              <span>Deadline: {formatCareerDate(job.applicationDeadline)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:items-end">
          <div className="flex items-center gap-2 text-sm text-[#667085]">
            <Link to="/" className="hover:text-[#008f45]">Dashboard</Link>
            <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
            <Link to="/careers" className="hover:text-[#008f45]">Careers</Link>
            <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
            <Link to="/careers/jobs" className="hover:text-[#008f45]">Job Openings</Link>
            <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
            <span className="font-semibold text-[#008f45]">View Job</span>
          </div>
          <div className="flex flex-wrap justify-start gap-3 lg:justify-end">
            <ActionButton icon={faPen} label="Edit Job" tone="primary" onClick={() => navigate(`/careers/jobs/${job.id}/edit`)} />
            <ActionButton icon={faCopy} label="Duplicate" onClick={() => toast.info("Duplicate job is not connected yet.")} />
            <ActionButton icon={faEyeSlash} label={statusLabel === "Published" ? "Unpublish" : "Publish"} onClick={() => handleStatusAction(statusLabel === "Published" ? "unpublish" : "publish")} />
            <ActionButton icon={faArchive} label="Archive" onClick={() => handleStatusAction("archive")} />
            <ActionButton icon={faTrashCan} label="Delete" tone="danger" onClick={() => handleStatusAction("delete")} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Applications" value={totalApplications} detail="Total received" icon={faUserGroup} tone="green" />
        <MetricCard label="Shortlisted" value={shortlisted} detail={`${percent(shortlisted)} of applications`} icon={faUserCheck} tone="blue" />
        <MetricCard label="Interviewing" value={interviewed} detail={`${percent(interviewed)} of applications`} icon={faCalendarDays} tone="orange" />
        <MetricCard label="Hired" value={hired} detail={`${percent(hired)} of applications`} icon={faUserTie} tone="purple" />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.35fr_1fr]">
        <section className="rounded-lg border border-[#e5e7eb] bg-white p-6 shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
          <h2 className="flex items-center gap-3 text-lg font-semibold">
            <FontAwesomeIcon icon={faFileLines} className="text-[#008f45]" />
            Job Description
          </h2>

          <div className="mt-8 space-y-8">
            <div>
              <h3 className="text-sm font-semibold">Role Overview</h3>
              <p className="mt-4 text-sm leading-7 text-[#101828]">
                {job.summary || job.description || "No role overview provided."}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Responsibilities</h3>
              <BulletList items={responsibilities.length ? responsibilities : ["No responsibilities provided."]} />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Requirements</h3>
              <BulletList items={requirements.length ? requirements : ["No requirements provided."]} />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Benefits</h3>
              <BulletList items={benefits.length ? benefits : ["No benefits provided."]} />
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border border-[#e5e7eb] bg-white p-6 shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
            <h2 className="flex items-center gap-3 text-lg font-semibold">
              <span className="grid h-6 w-6 place-items-center rounded-full border border-[#008f45] text-sm text-[#008f45]">i</span>
              Job Information
            </h2>
            <div className="mt-8 space-y-6">
              <DetailItem icon={faBriefcase} label="Department" value={job.department} />
              <DetailItem icon={faCalendarDays} label="Employment Type" value={typeLabel} />
              <DetailItem icon={faClipboard} label="Work Mode" value={modeLabel} />
              <DetailItem icon={faLocationDot} label="Location" value={job.location} />
              <DetailItem icon={faBriefcase} label="Salary Range" value={job.salaryRange || "Not specified"} />
              <DetailItem icon={faCalendarDays} label="Application Deadline">
                <p className="mt-1 text-sm leading-5 text-[#475467]">
                  {formatCareerDate(job.applicationDeadline)}
                  {job.applicationDeadline && (
                    <span className="ml-1 font-semibold text-[#008f45]">({daysUntil(job.applicationDeadline)})</span>
                  )}
                </p>
              </DetailItem>
              <DetailItem icon={faBriefcase} label="Status">
                <span className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusTone[statusLabel] || statusTone.Draft}`}>
                  {statusLabel}
                </span>
              </DetailItem>
              <DetailItem icon={faLocationDot} label="Created By">
                <div className="mt-2 flex items-center gap-3">
                  <img src={assets.profile_picture} alt="" className="h-8 w-8 rounded-full object-cover" />
                  <div>
                    <p className="text-sm font-semibold">Akinbami Dayo</p>
                    <p className="text-xs text-[#667085]">Administrator</p>
                  </div>
                </div>
              </DetailItem>
              <DetailItem icon={faClock} label="Last Updated" value={formatDateTime(job.updatedAt)} />
            </div>
          </section>

          <section className="rounded-lg border border-[#e5e7eb] bg-white p-6 shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
            <h2 className="flex items-center gap-3 text-lg font-semibold">
              <FontAwesomeIcon icon={faUserGroup} className="text-[#008f45]" />
              Application Pipeline
            </h2>
            <div className="mt-6 space-y-1">
              {pipeline.map(([label, value, tone]) => (
                <div key={label} className="grid grid-cols-[42px_1fr_auto] items-center gap-4 py-2 text-sm">
                  <span className={`grid h-9 w-9 place-items-center rounded-full text-sm font-semibold ${metricTones[tone]}`}>
                    {value}
                  </span>
                  <span className="font-semibold">{label}</span>
                  <span className="text-[#475467]">{percent(value)}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-[#e5e7eb] bg-white p-6 shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
            <h2 className="flex items-center gap-3 text-lg font-semibold">
              <FontAwesomeIcon icon={faShareNodes} className="text-[#008f45]" />
              Share Job
            </h2>
            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-semibold">Public Job URL</span>
              <div className="flex h-11 items-center rounded-md border border-[#d0d5dd] px-3">
                <input readOnly value={publicJobUrl} className="min-w-0 flex-1 bg-transparent text-xs outline-none" />
                <button type="button" onClick={() => copyText(publicJobUrl, "Job URL copied")} className="text-[#667085]">
                  <FontAwesomeIcon icon={faCopy} />
                </button>
              </div>
            </label>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <ActionButton icon={faPen} label="Copy Link" tone="primary" onClick={() => copyText(publicJobUrl, "Job link copied")} />
              <ActionButton icon={faShareNodes} label="Open Job" onClick={() => window.open(publicJobUrl, "_blank", "noopener,noreferrer")} />
              <ActionButton icon={faShareNodes} label="Share" onClick={() => navigator.share?.({ title: job.title, url: publicJobUrl }) || copyText(publicJobUrl, "Job link copied")} />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default JobDetail;
