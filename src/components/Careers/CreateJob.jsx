import {
  faBold,
  faCalendarDays,
  faChevronDown,
  faChevronRight,
  faEye,
  faImage,
  faInfinity,
  faInfo,
  faItalic,
  faLink,
  faList,
  faListOl,
  faPaperPlane,
  faRotateLeft,
  faUnderline,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ACTIONS, RESOURCES } from "../../constants/permissions";
import { usePermission } from "../Hooks/usePermission";
import { apiClient } from "../../lib/apiClient";
import { LoadingButtonContent } from "../common/LoadingStates";
import { fetchCareerJob } from "./careerData";

const departments = ["Sales", "Operations", "Finance", "Marketing", "Customer Service", "Human Resources"];
const locations = ["Ibadan, Oyo", "Lagos, Lagos", "Abeokuta, Ogun", "Remote"];
const workModes = [
  ["onsite", "On-site"],
  ["hybrid", "Hybrid"],
  ["remote", "Remote"],
  ["field", "Field"],
];
const employmentTypes = [
  ["full_time", "Full-time"],
  ["part_time", "Part-time"],
  ["contract", "Contract"],
  ["internship", "Internship"],
  ["field", "Field"],
];
const experienceLevels = ["Entry level", "Mid level", "Senior level", "Lead"];

const splitList = (value) =>
  String(value || "")
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

const joinList = (value) => (Array.isArray(value) ? value.join("\n") : value || "");

const parseRequirementFields = (requirements = []) => {
  const result = { education: "", experience: "", skills: "" };
  const skills = [];

  requirements.forEach((item) => {
    const value = String(item || "");
    if (/^education:/i.test(value)) {
      result.education = value.replace(/^education:\s*/i, "");
    } else if (/^experience:/i.test(value)) {
      result.experience = value.replace(/^experience:\s*/i, "");
    } else if (/^skill:/i.test(value)) {
      skills.push(value.replace(/^skill:\s*/i, ""));
    } else {
      skills.push(value);
    }
  });

  result.skills = skills.join(", ");
  return result;
};

const parseSalaryRange = (salaryRange = "") => {
  const matches = String(salaryRange).match(/[\d,]+/g) || [];
  return {
    salaryMin: matches[0] || "",
    salaryMax: matches[1] || "",
  };
};

const toDateInputValue = (value) => {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
};

const FieldLabel = ({ children, required = false }) => (
  <label className="mb-2 block text-xs font-semibold text-[#101828]">
    {children} {required && <span className="text-[#ef3340]">*</span>}
  </label>
);

const TextInput = ({ className = "", ...props }) => (
  <input
    {...props}
    className={`h-10 w-full rounded-md border border-[#d0d5dd] bg-white px-3 text-xs text-[#101828] outline-none placeholder:text-[#98a2b3] focus:border-[#008f45] ${className}`}
  />
);

const SelectInput = ({ value, onChange, placeholder, options }) => (
  <div className="relative">
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 w-full appearance-none rounded-md border border-[#d0d5dd] bg-white px-3 pr-9 text-xs text-[#101828] outline-none focus:border-[#008f45]"
    >
      <option value="">{placeholder}</option>
      {options.map((option) => {
        const [optionValue, label] = Array.isArray(option) ? option : [option, option];
        return <option key={optionValue} value={optionValue}>{label}</option>;
      })}
    </select>
    <FontAwesomeIcon icon={faChevronDown} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#667085]" />
  </div>
);

const Card = ({ title, children }) => (
  <section className="rounded-lg border border-[#e5e7eb] bg-white p-5 shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
    <h2 className="mb-5 text-base font-semibold text-[#101828]">{title}</h2>
    {children}
  </section>
);

const Editor = ({ value, onChange, placeholder }) => (
  <div className="overflow-hidden rounded-md border border-[#d0d5dd] bg-white">
    <div className="flex flex-wrap items-center gap-2 border-b border-[#e5e7eb] bg-[#f8fafc] p-2 text-[#344054]">
      {[faBold, faItalic, faUnderline, faList, faListOl, faRotateLeft, faList, faImage, faLink, faInfinity].map((icon, index) => (
        <button key={`${icon.iconName}-${index}`} type="button" className="grid h-7 w-7 place-items-center rounded bg-white text-xs">
          <FontAwesomeIcon icon={icon} />
        </button>
      ))}
    </div>
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="min-h-32 w-full resize-none p-3 text-xs leading-6 outline-none placeholder:text-[#98a2b3]"
    />
  </div>
);

const CreateJob = () => {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const { userPermissions } = usePermission();
  const isEditing = Boolean(jobId);
  const [saving, setSaving] = useState(false);
  const [loadingJob, setLoadingJob] = useState(isEditing);
  const [jobStatus, setJobStatus] = useState("");
  const [form, setForm] = useState({
    title: "",
    department: "",
    location: "",
    workMode: "",
    employmentType: "",
    experienceLevel: "",
    openings: "",
    deadline: "",
    summary: "",
    description: "",
    education: "",
    experience: "",
    skills: "",
    benefits: "",
    salaryMin: "",
    salaryMax: "",
    tags: "",
  });

  const loadJob = useCallback(async () => {
    if (!jobId) return;

    try {
      setLoadingJob(true);
      const job = await fetchCareerJob(jobId);
      const requirementFields = parseRequirementFields(job.requirements || []);
      const salaryFields = parseSalaryRange(job.salaryRange);

      setJobStatus(job.status || "");
      setForm({
        title: job.title || "",
        department: job.department || "",
        location: job.location || "",
        workMode: job.workMode || "",
        employmentType: job.employmentType || "",
        experienceLevel: "",
        openings: "1",
        deadline: toDateInputValue(job.applicationDeadline),
        summary: job.summary || "",
        description: job.description || joinList(job.responsibilities || []),
        education: requirementFields.education,
        experience: requirementFields.experience,
        skills: requirementFields.skills,
        benefits: Array.isArray(job.benefits) ? job.benefits.join(", ") : job.benefits || "",
        salaryMin: salaryFields.salaryMin,
        salaryMax: salaryFields.salaryMax,
        tags: "",
      });
    } catch (error) {
      toast.error(error.message || "Unable to load job opening.");
      navigate("/careers/jobs");
    } finally {
      setLoadingJob(false);
    }
  }, [jobId, navigate]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const buildPayload = () => {
    const requirements = [
      form.education && `Education: ${form.education}`,
      form.experience && `Experience: ${form.experience}`,
      ...splitList(form.skills).map((skill) => `Skill: ${skill}`),
    ].filter(Boolean);

    const responsibilities = splitList(form.description);
    const salaryRange =
      form.salaryMin || form.salaryMax
        ? `NGN ${form.salaryMin || "0"} - ${form.salaryMax || "0"} monthly`
        : undefined;

    return {
      title: form.title,
      department: form.department,
      location: form.location,
      employmentType: form.employmentType,
      workMode: form.workMode,
      summary: form.summary,
      description: form.description,
      responsibilities: responsibilities.length ? responsibilities : [form.summary],
      requirements,
      benefits: splitList(form.benefits),
      salaryRange,
      applicationDeadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
    };
  };

  const validate = () => {
    const required = [
      ["title", "Job title"],
      ["department", "Department"],
      ["location", "Location"],
      ["workMode", "Work mode"],
      ["employmentType", "Employment type"],
      ["openings", "Number of openings"],
      ["summary", "Job summary"],
      ["description", "Job description"],
      ["education", "Education"],
      ["experience", "Experience"],
      ["skills", "Skills"],
    ];

    for (const [field, label] of required) {
      if (!String(form[field] || "").trim()) {
        toast.error(`${label} is required.`);
        return false;
      }
    }

    if (form.summary.length < 10) {
      toast.error("Job summary must be at least 10 characters.");
      return false;
    }

    if (form.description.length < 20) {
      toast.error("Job description must be at least 20 characters.");
      return false;
    }

    return true;
  };

  const saveJob = async ({ publish = false } = {}) => {
    if (!validate()) return;

    const hasRoleGrant = (action) =>
      userPermissions.some(
        (permission) =>
          permission.resource === RESOURCES.CAREERS &&
          (permission.actions.includes(action) ||
            permission.actions.includes(ACTIONS.MANAGE))
      );
    const canCreateCareer = hasRoleGrant(ACTIONS.CREATE);
    const canUpdateCareer = hasRoleGrant(ACTIONS.UPDATE);
    const canPublishCareer = hasRoleGrant(ACTIONS.PUBLISH);

    if (!isEditing && !canCreateCareer) {
      toast.error("Your admin role needs the create_careers permission to create job openings.");
      return;
    }

    if (isEditing && !canUpdateCareer) {
      toast.error("Your admin role needs the update_careers permission to edit job openings.");
      return;
    }

    if (publish && !canPublishCareer) {
      toast.error("Your admin role needs the publish_careers permission to publish job openings.");
      return;
    }

    try {
      setSaving(true);
      const response = isEditing
        ? await apiClient.patch(`/admin/careers/jobs/${jobId}`, buildPayload())
        : await apiClient.post("/admin/careers/jobs", buildPayload());
      const savedJob = response.data;

      if (publish && savedJob.status !== "published") {
        await apiClient.patch(`/admin/careers/jobs/${savedJob.id}/publish`);
        toast.success(isEditing ? "Job opening updated and published." : "Job opening published successfully.");
      } else {
        toast.success(isEditing ? "Job opening updated successfully." : "Job opening saved as draft.");
      }

      navigate(isEditing ? `/careers/jobs/${savedJob.id}` : "/careers/jobs");
    } catch (error) {
      const message = error.response?.status === 403 || error.status === 403
        ? publish
          ? `Access denied by backend. Your admin role must include ${isEditing ? "update_careers" : "create_careers"} and publish_careers.`
          : `Access denied by backend. Your admin role must include ${isEditing ? "update_careers" : "create_careers"}.`
        : error.message || "Unable to save job opening.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const previewJob = () => {
    if (!validate()) return;
    if (isEditing) {
      navigate(`/careers/jobs/${jobId}`);
      return;
    }
    toast.info("Save this job first to preview the detail page.");
  };

  if (loadingJob) {
    return (
      <div className="rounded-lg border border-[#e5e7eb] bg-white p-8 text-sm text-[#667085]">
        Loading job opening...
      </div>
    );
  }

  return (
    <div className="space-y-5 text-[#101828]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            {isEditing ? "Edit Job Opening" : "Create Job Opening"}
          </h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#667085]">
          <Link to="/" className="hover:text-[#008f45]">Dashboard</Link>
          <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
          <Link to="/careers" className="hover:text-[#008f45]">Careers</Link>
          <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
          <Link to="/careers/jobs" className="hover:text-[#008f45]">Job Openings</Link>
          <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
          <span>{isEditing ? "Edit Job" : "Create Job"}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-md border border-[#b9e7ca] bg-[#effaf3] px-4 py-3 text-sm text-[#101828]">
        <span className="grid h-5 w-5 place-items-center rounded-full border border-[#008f45] text-xs text-[#008f45]">
          <FontAwesomeIcon icon={faInfo} />
        </span>
        Fill in the details below to {isEditing ? "update this" : "create a new"} job opening. Fields marked with <span className="text-[#ef3340]">*</span> are required.
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.92fr)]">
        <Card title="Job Information">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <FieldLabel required>Job Title</FieldLabel>
              <TextInput value={form.title} onChange={(e) => updateField("title", e.target.value)} placeholder="e.g. Senior Sales Representative" />
            </div>
            <div>
              <FieldLabel required>Department</FieldLabel>
              <SelectInput value={form.department} onChange={(value) => updateField("department", value)} placeholder="Select department" options={departments} />
            </div>
            <div>
              <FieldLabel required>Location</FieldLabel>
              <SelectInput value={form.location} onChange={(value) => updateField("location", value)} placeholder="Select location" options={locations} />
            </div>
            <div>
              <FieldLabel required>Work Mode</FieldLabel>
              <SelectInput value={form.workMode} onChange={(value) => updateField("workMode", value)} placeholder="Select work mode" options={workModes} />
            </div>
            <div>
              <FieldLabel required>Employment Type</FieldLabel>
              <SelectInput value={form.employmentType} onChange={(value) => updateField("employmentType", value)} placeholder="Select employment type" options={employmentTypes} />
            </div>
            <div>
              <FieldLabel>Experience Level</FieldLabel>
              <SelectInput value={form.experienceLevel} onChange={(value) => updateField("experienceLevel", value)} placeholder="Select experience level" options={experienceLevels} />
            </div>
            <div>
              <FieldLabel required>Number of Openings</FieldLabel>
              <TextInput type="number" min="1" value={form.openings} onChange={(e) => updateField("openings", e.target.value)} placeholder="e.g. 2" />
            </div>
            <div>
              <FieldLabel>Deadline</FieldLabel>
              <div className="relative">
                <TextInput type="date" value={form.deadline} onChange={(e) => updateField("deadline", e.target.value)} className="pr-9" />
                <FontAwesomeIcon icon={faCalendarDays} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#667085]" />
              </div>
            </div>
          </div>

          <div className="mt-5">
            <FieldLabel required>Job Summary</FieldLabel>
            <div className="relative">
              <textarea
                value={form.summary}
                onChange={(e) => updateField("summary", e.target.value.slice(0, 250))}
                placeholder="Write a short summary about the role..."
                className="min-h-20 w-full resize-none rounded-md border border-[#d0d5dd] p-3 text-xs outline-none placeholder:text-[#98a2b3] focus:border-[#008f45]"
              />
              <span className="absolute bottom-3 right-3 text-xs text-[#667085]">{form.summary.length}/250</span>
            </div>
            <p className="mt-2 text-xs text-[#667085]">Briefly describe the role and its purpose.</p>
          </div>

          <div className="mt-5">
            <FieldLabel required>Job Description</FieldLabel>
            <Editor value={form.description} onChange={(value) => updateField("description", value)} placeholder="Describe the role, responsibilities, and expectations in detail..." />
          </div>
        </Card>

        <div className="space-y-5">
          <Card title="Requirements">
            <div className="space-y-5">
              <div>
                <FieldLabel>Education</FieldLabel>
                <TextInput value={form.education} onChange={(e) => updateField("education", e.target.value)} placeholder="e.g. Bachelor's degree in Marketing, Business or related field" />
              </div>
              <div>
                <FieldLabel>Experience</FieldLabel>
                <TextInput value={form.experience} onChange={(e) => updateField("experience", e.target.value)} placeholder="e.g. 3+ years of experience in sales or similar role" />
              </div>
              <div>
                <FieldLabel>Skills</FieldLabel>
                <TextInput value={form.skills} onChange={(e) => updateField("skills", e.target.value)} placeholder="Enter skills separated by commas" />
                <p className="mt-2 text-xs text-[#667085]">e.g. Communication, Negotiation, Customer Service</p>
              </div>
              <div>
                <FieldLabel>Benefits <span className="font-normal text-[#667085]">(Optional)</span></FieldLabel>
                <TextInput value={form.benefits} onChange={(e) => updateField("benefits", e.target.value)} placeholder="e.g. Health insurance, Remote work, Paid time off" />
                <p className="mt-2 text-xs text-[#667085]">Enter benefits separated by commas</p>
              </div>
            </div>
          </Card>

          <Card title="Additional Information">
            <div>
              <FieldLabel>Salary Range <span className="font-normal text-[#667085]">(Optional)</span></FieldLabel>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <label>
                  <span className="mb-2 block text-xs text-[#101828]">Minimum</span>
                  <div className="flex h-10 overflow-hidden rounded-md border border-[#d0d5dd] bg-white">
                    <input value={form.salaryMin} onChange={(e) => updateField("salaryMin", e.target.value)} placeholder="e.g. 200,000" className="min-w-0 flex-1 px-3 text-xs outline-none" />
                    <span className="grid place-items-center border-l border-[#eef2f6] px-3 text-xs text-[#667085]">NGN</span>
                  </div>
                </label>
                <label>
                  <span className="mb-2 block text-xs text-[#101828]">Maximum</span>
                  <div className="flex h-10 overflow-hidden rounded-md border border-[#d0d5dd] bg-white">
                    <input value={form.salaryMax} onChange={(e) => updateField("salaryMax", e.target.value)} placeholder="e.g. 500,000" className="min-w-0 flex-1 px-3 text-xs outline-none" />
                    <span className="grid place-items-center border-l border-[#eef2f6] px-3 text-xs text-[#667085]">NGN</span>
                  </div>
                </label>
              </div>
            </div>
            <div className="mt-5">
              <FieldLabel>Job Tags <span className="font-normal text-[#667085]">(Optional)</span></FieldLabel>
              <TextInput value={form.tags} onChange={(e) => updateField("tags", e.target.value)} placeholder="Add tags and press Enter" />
              <p className="mt-2 text-xs text-[#667085]">e.g. Sales, Full-time, Remote</p>
            </div>
          </Card>
        </div>
      </div>

      <section className="rounded-lg border border-[#e5e7eb] bg-white p-5 shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to={isEditing ? `/careers/jobs/${jobId}` : "/careers/jobs"} className="inline-flex h-10 min-w-40 items-center justify-center rounded-md border border-[#d0d5dd] bg-white px-6 text-sm font-semibold text-[#101828]">
              Cancel
            </Link>
            <button disabled={saving} onClick={() => saveJob({ publish: false })} className="inline-flex h-10 min-w-56 items-center justify-center rounded-md bg-[#008f45] px-6 text-sm font-semibold text-white disabled:opacity-60">
              {saving ? <LoadingButtonContent label="Saving..." /> : isEditing ? "Save Changes" : "Save as Draft"}
            </button>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button onClick={previewJob} className="inline-flex h-10 min-w-40 items-center justify-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-6 text-sm font-semibold text-[#101828]">
              <FontAwesomeIcon icon={faEye} />
              Preview Job
            </button>
            <button disabled={saving} onClick={() => saveJob({ publish: true })} className="inline-flex h-10 min-w-44 items-center justify-center gap-2 rounded-md bg-[#008f45] px-6 text-sm font-semibold text-white disabled:opacity-60">
              <FontAwesomeIcon icon={faPaperPlane} />
              {saving ? <LoadingButtonContent label="Publishing..." /> : jobStatus === "published" ? "Update Published Job" : "Publish Job"}
            </button>
            <button className="grid h-10 w-10 place-items-center rounded-md bg-[#00813f] text-white">
              <FontAwesomeIcon icon={faChevronDown} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CreateJob;
