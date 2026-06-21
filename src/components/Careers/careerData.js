import { apiClient } from "../../lib/apiClient";

export const jobStatusLabels = {
  draft: "Draft",
  published: "Published",
  closed: "Closed",
  archived: "Archived",
};

export const applicationStatusLabels = {
  new: "New",
  reviewing: "In Review",
  shortlisted: "Shortlisted",
  rejected: "Rejected",
  hired: "Hired",
};

export const employmentTypeLabels = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
  remote: "Remote",
  hybrid: "Hybrid",
  field: "Field",
};

export const workModeLabels = {
  onsite: "On-site",
  hybrid: "Hybrid",
  remote: "Remote",
  field: "Field",
};

export const formatCareerDate = (value) => {
  if (!value) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value));
};

export const normalizeJob = (job = {}, applicationsByJob = []) => {
  const applicationCount =
    applicationsByJob.find((item) => item.jobId === job.id)?.applications ??
    job.applicationsCount ??
    job.applicationCount ??
    job.applications?.length ??
    0;

  return {
    ...job,
    title: job.title || "Untitled job",
    posted: `Posted on ${formatCareerDate(job.createdAt)}`,
    department: job.department || "N/A",
    location: job.location || "N/A",
    type: employmentTypeLabels[job.employmentType] || job.employmentType || "N/A",
    mode: workModeLabels[job.workMode] || job.workMode || "N/A",
    applications: Number(applicationCount || 0),
    deadline: formatCareerDate(job.applicationDeadline),
    status: jobStatusLabels[job.status] || job.status || "Draft",
  };
};

export const normalizeApplication = (application = {}) => ({
  ...application,
  name: application.fullName || "Applicant",
  role: application.job?.title || "Job opening",
  status:
    applicationStatusLabels[application.status] || application.status || "New",
  date: formatCareerDate(application.submittedAt),
});

export const buildCareerParams = ({
  page = 1,
  limit = 25,
  search,
  sortBy,
  filters = {},
} = {}) => {
  const params = { page, limit };
  if (search) params.search = search;
  if (sortBy) params.sortBy = sortBy;

  Object.entries(filters).forEach(([key, value]) => {
    if (!value) return;
    params[`filter.${key}`] = `$eq:${value}`;
  });

  return params;
};

export const fetchCareerStats = () =>
  apiClient.get("/admin/careers/stats").then((response) => response.data || {});

export const fetchCareerJobs = (params) =>
  apiClient
    .get("/admin/careers/jobs", { params })
    .then((response) => response.data || { data: [], meta: {} });

export const fetchCareerJob = (jobId) =>
  apiClient
    .get(`/admin/careers/jobs/${jobId}`)
    .then((response) => response.data || {});

export const fetchCareerApplications = (params) =>
  apiClient
    .get("/admin/careers/applications", { params })
    .then((response) => response.data || { data: [], meta: {} });

export const fetchCareerJobApplications = (jobId, params) =>
  apiClient
    .get(`/admin/careers/jobs/${jobId}/applications`, { params })
    .then((response) => response.data || { data: [], meta: {} });

export const updateCareerJobStatus = async (job, action) => {
  const endpoints = {
    publish: "publish",
    unpublish: "unpublish",
    close: "close",
    archive: "archive",
  };

  if (action === "delete") {
    return apiClient.delete(`/admin/careers/jobs/${job.id}`);
  }

  return apiClient.patch(`/admin/careers/jobs/${job.id}/${endpoints[action]}`);
};
