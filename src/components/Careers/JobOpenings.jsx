import {
  faArchive,
  faBriefcase,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faCircleXmark,
  faEye,
  faFilterCircleXmark,
  faFolderClosed,
  faPen,
  faPlus,
  faSearch,
  faTrashCan,
  faUserGroup,
  faPaperPlane,
  faFileLines,
  faEllipsis,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  buildCareerParams,
  employmentTypeLabels,
  fetchCareerJobs,
  fetchCareerStats,
  normalizeJob,
  updateCareerJobStatus,
  workModeLabels,
} from "./careerData";

const pageSize = 8;

const filterOptions = {
  department: ["All Departments"],
  status: ["All Statuses", "Published", "Draft", "Closed", "Archived"],
  mode: ["All Work Modes", "On-site", "Hybrid", "Remote", "Field"],
  type: ["All Types", "Full-time", "Part-time", "Contract", "Internship", "Field"],
};

const filters = [
  ["department", "Department"],
  ["status", "Status"],
  ["mode", "Work Mode"],
  ["type", "Employment Type"],
];

const statusValue = {
  Published: "published",
  Draft: "draft",
  Closed: "closed",
  Archived: "archived",
};

const typeValue = Object.fromEntries(
  Object.entries(employmentTypeLabels).map(([value, label]) => [label, value])
);
const modeValue = Object.fromEntries(
  Object.entries(workModeLabels).map(([value, label]) => [label, value])
);

const statusTone = {
  Published: "bg-[#dcf8e6] text-[#008f45]",
  Draft: "bg-[#f2f4f7] text-[#667085]",
  Closed: "bg-[#ffe4e4] text-[#ef3340]",
  Archived: "bg-[#eef2f6] text-[#667085]",
};

const typeTone = {
  "Full-time": "bg-[#dcf8e6] text-[#008f45]",
  "Part-time": "bg-[#dcf8e6] text-[#008f45]",
  Contract: "bg-[#e5f1ff] text-[#1677d2]",
  Internship: "bg-[#fff1df] text-[#f97316]",
  "On-site": "bg-[#dcf8e6] text-[#008f45]",
  Hybrid: "bg-[#e5f1ff] text-[#1677d2]",
  Remote: "bg-[#efe6ff] text-[#7c3fd3]",
  Field: "bg-[#fff1df] text-[#f97316]",
};

const StatCard = ({ label, value, detail, icon, iconClass, detailClass }) => (
  <section className="flex items-center gap-5 rounded-lg border border-[#e5e7eb] bg-white p-5 shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
    <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-full text-2xl ${iconClass}`}>
      <FontAwesomeIcon icon={icon} />
    </div>
    <div>
      <p className="text-sm font-medium text-[#475467]">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-normal">{value}</p>
      <p className={`mt-2 text-xs font-semibold ${detailClass}`}>{detail}</p>
    </div>
  </section>
);

const SortHint = () => (
  <span className="ml-2 inline-flex flex-col align-middle text-[8px] leading-[7px] text-[#98a2b3]">
    <FontAwesomeIcon icon={faChevronUp} />
    <FontAwesomeIcon icon={faChevronDown} />
  </span>
);

const Badge = ({ children }) => (
  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${typeTone[children] || statusTone[children] || "bg-[#f2f4f7] text-[#667085]"}`}>
    {children}
  </span>
);

const ActionMenu = ({ job, onAction }) => (
  <div className="absolute right-0 top-9 z-10 w-48 rounded-md border border-[#eef2f6] bg-white py-2 text-sm shadow-[0_12px_32px_rgba(16,24,40,0.12)]">
    {[
      [faEye, "View Job", "view", "text-[#344054]"],
      [faPen, "Edit Job", "edit", "text-[#344054]"],
      [faUserGroup, "View Applications", "applications", "text-[#344054]"],
      [faFilterCircleXmark, job.status === "Published" ? "Unpublish Job" : "Publish Job", job.status === "Published" ? "unpublish" : "publish", "text-[#ef3340]"],
      [faCircleXmark, "Close Job", "close", "text-[#344054]"],
      [faArchive, "Archive Job", "archive", "text-[#344054]"],
      [faTrashCan, "Delete Job", "delete", "text-[#ef3340] border-t border-[#eef2f6] mt-2 pt-3"],
    ].map(([icon, label, action, className]) => (
      <button key={label} type="button" onClick={() => onAction(action, job)} className={`flex w-full items-center gap-3 px-4 py-2 text-left ${className}`}>
        <FontAwesomeIcon icon={icon} className="w-4" />
        {label}
      </button>
    ))}
  </div>
);

const getPageNumbers = (currentPage, totalPages) => {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
  const pages = new Set([1, totalPages, currentPage]);
  if (currentPage > 2) pages.add(currentPage - 1);
  if (currentPage < totalPages - 1) pages.add(currentPage + 1);
  return [...pages].sort((a, b) => a - b).reduce((acc, pageNumber, index, source) => {
    if (index > 0 && pageNumber - source[index - 1] > 1) acc.push("...");
    acc.push(pageNumber);
    return acc;
  }, []);
};

const JobOpenings = () => {
  const navigate = useNavigate();
  const [jobRows, setJobRows] = useState([]);
  const [meta, setMeta] = useState({});
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const searchTimeout = useRef();
  const [selectedFilters, setSelectedFilters] = useState({
    department: "All Departments",
    status: "All Statuses",
    mode: "All Work Modes",
    type: "All Types",
  });

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);
      const filterParams = {};
      if (selectedFilters.status !== "All Statuses") {
        filterParams.status = statusValue[selectedFilters.status];
      }
      if (selectedFilters.department !== "All Departments") {
        filterParams.department = selectedFilters.department;
      }
      if (selectedFilters.mode !== "All Work Modes") {
        filterParams.workMode = modeValue[selectedFilters.mode];
      }
      if (selectedFilters.type !== "All Types") {
        filterParams.employmentType = typeValue[selectedFilters.type];
      }

      const [statsData, jobsData] = await Promise.all([
        fetchCareerStats(),
        fetchCareerJobs(
          buildCareerParams({
            page,
            limit: pageSize,
            search: searchValue,
            sortBy: "createdAt:DESC",
            filters: filterParams,
          })
        ),
      ]);

      setStats(statsData);
      setMeta(jobsData.meta || {});
      setJobRows((jobsData.data || []).map((job) => normalizeJob(job, statsData.applicationsByJob || [])));
    } catch (error) {
      toast.error(error.message || "Unable to load job openings.");
    } finally {
      setLoading(false);
    }
  }, [page, searchValue, selectedFilters]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  useEffect(
    () => () => {
      clearTimeout(searchTimeout.current);
    },
    []
  );

  const dynamicDepartments = useMemo(
    () => ["All Departments", ...new Set(jobRows.map((job) => job.department).filter(Boolean))],
    [jobRows]
  );

  const options = { ...filterOptions, department: dynamicDepartments };
  const totalPages = Number(meta.totalPages || 1);
  const currentPage = Number(meta.currentPage || page || 1);
  const totalItems = Number(meta.totalItems || jobRows.length || 0);
  const shownFrom = totalItems ? (currentPage - 1) * pageSize + 1 : 0;
  const shownTo = totalItems ? Math.min(currentPage * pageSize, totalItems) : 0;

  const statsCards = [
    {
      label: "Total Jobs",
      value: stats.totalJobs || 0,
      detail: `${stats.totalJobs || 0} all time`,
      icon: faBriefcase,
      iconClass: "bg-[#e7f7ed] text-[#008f45]",
      detailClass: "text-[#008f45]",
    },
    {
      label: "Published Jobs",
      value: stats.publishedJobs || 0,
      detail: "currently visible",
      icon: faPaperPlane,
      iconClass: "bg-[#eaf4ff] text-[#1677d2]",
      detailClass: "text-[#008f45]",
    },
    {
      label: "Draft Jobs",
      value: Math.max(Number(stats.totalJobs || 0) - Number(stats.publishedJobs || 0) - Number(stats.closedJobs || 0), 0),
      detail: "not published",
      icon: faFileLines,
      iconClass: "bg-[#fff1df] text-[#f97316]",
      detailClass: "text-[#008f45]",
    },
    {
      label: "Closed Jobs",
      value: stats.closedJobs || 0,
      detail: "closed roles",
      icon: faFolderClosed,
      iconClass: "bg-[#ffe8e8] text-[#ef3340]",
      detailClass: "text-[#ef3340]",
    },
  ];

  const updateFilter = (key, value) => {
    setSelectedFilters((filters) => ({ ...filters, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setSearchValue("");
    setSelectedFilters({
      department: "All Departments",
      status: "All Statuses",
      mode: "All Work Modes",
      type: "All Types",
    });
    setPage(1);
  };

  const handleSearch = (value) => {
    setSearch(value);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setSearchValue(value);
      setPage(1);
    }, 400);
  };

  const handleAction = async (action, job) => {
    setOpenMenuId(null);

    if (action === "applications") {
      navigate("/careers/applications");
      return;
    }

    if (action === "view" || action === "edit") {
      if (action === "view") {
        navigate(`/careers/jobs/${job.id}`);
        return;
      }
      navigate(`/careers/jobs/${job.id}/edit`);
      return;
    }

    try {
      await updateCareerJobStatus(job, action);
      toast.success(`${job.title} updated.`);
      await loadJobs();
    } catch (error) {
      toast.error(error.message || `Unable to ${action} job.`);
    }
  };

  return (
    <div className="space-y-5 text-[#101828]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Job Openings</h1>
          <p className="mt-1 text-xs font-medium text-[#667085]">
            Create, manage, publish, and track all career opportunities.
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:items-end">
          <div className="flex items-center gap-2 text-sm text-[#667085]">
            <Link to="/" className="hover:text-[#008f45]">Dashboard</Link>
            <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
            <Link to="/careers" className="hover:text-[#008f45]">Careers</Link>
            <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
            <span>Job Openings</span>
          </div>
          <button type="button" onClick={() => navigate("/careers/create")} className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-md bg-[#008f45] px-5 text-sm font-semibold text-white shadow-[0_8px_16px_rgba(0,143,69,0.18)]">
            <FontAwesomeIcon icon={faPlus} />
            Create New Job
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statsCards.map((stat) => <StatCard key={stat.label} {...stat} />)}
      </div>

      <section className="rounded-lg border border-[#e5e7eb] bg-white p-5 shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(260px,1.6fr)_repeat(4,minmax(150px,1fr))_auto] xl:items-end">
          <div className="flex h-10 items-center rounded-md border border-[#d0d5dd] px-4">
            <FontAwesomeIcon icon={faSearch} className="mr-3 text-[#98a2b3]" />
            <input value={search} onChange={(event) => handleSearch(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#98a2b3]" placeholder="Search job title, department, location..." />
          </div>
          {filters.map(([key, label]) => (
            <label key={key} className="block">
              <span className="mb-1.5 block text-xs font-medium text-[#667085]">{label}</span>
              <select value={selectedFilters[key]} onChange={(event) => updateFilter(key, event.target.value)} className="flex h-10 w-full appearance-none rounded-md border border-[#d0d5dd] bg-white px-4 text-sm text-[#101828] outline-none">
                {options[key].map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <span className="pointer-events-none -mt-6 mr-4 flex justify-end">
                <FontAwesomeIcon icon={faChevronDown} className="text-xs text-[#667085]" />
              </span>
            </label>
          ))}
          <button type="button" onClick={clearFilters} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#d0d5dd] px-4 text-sm font-semibold text-[#344054]">
            <FontAwesomeIcon icon={faFilterCircleXmark} />
            Clear Filters
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-[#e5e7eb] bg-white shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left text-xs">
            <thead className="bg-[#f8fafc] uppercase text-[#667085]">
              <tr>
                {["Job Title", "Department", "Location", "Type", "Work Mode", "Applications", "Deadline", "Status", "Actions"].map((heading) => (
                  <th key={heading} className="px-4 py-4 font-semibold">
                    {heading}
                    {heading !== "Actions" && <SortHint />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-4 py-12 text-center text-sm text-[#667085]">
                    Loading job openings...
                  </td>
                </tr>
              ) : jobRows.length ? (
                jobRows.map((job) => (
                  <tr key={job.id} className="border-b border-[#eef2f6] last:border-0 hover:bg-[#fbfcfd]">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold">{job.title}</p>
                      <p className="mt-1 text-xs text-[#667085]">{job.posted}</p>
                    </td>
                    <td className="px-4 py-3 font-medium">{job.department}</td>
                    <td className="px-4 py-3 font-medium">{job.location}</td>
                    <td className="px-4 py-3"><Badge>{job.type}</Badge></td>
                    <td className="px-4 py-3"><Badge>{job.mode}</Badge></td>
                    <td className="px-4 py-3 font-medium">{job.applications}</td>
                    <td className="px-4 py-3 font-medium">{job.deadline}</td>
                    <td className="px-4 py-3"><Badge>{job.status}</Badge></td>
                    <td className="relative px-4 py-3">
                      <button onClick={() => setOpenMenuId((current) => current === job.id ? null : job.id)} className={`grid h-8 w-8 place-items-center rounded-md ${openMenuId === job.id ? "bg-[#f2f4f7]" : ""}`} type="button" aria-label={`${job.title} actions`}>
                        <FontAwesomeIcon icon={faEllipsis} />
                      </button>
                      {openMenuId === job.id && <ActionMenu job={job} onAction={handleAction} />}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="px-4 py-12 text-center text-sm text-[#667085]">
                    No job openings match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-4 border-t border-[#eef2f6] px-5 py-4 text-sm text-[#667085] md:flex-row md:items-center md:justify-between">
          <p>
            Showing {shownFrom} to {shownTo} of {totalItems} jobs
          </p>
          <div className="flex items-center gap-2">
            <button type="button" disabled={currentPage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="grid h-9 w-9 place-items-center rounded-md border border-[#d0d5dd] bg-white disabled:cursor-not-allowed disabled:opacity-50">
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            {getPageNumbers(currentPage, totalPages).map((pageNumber, index) =>
              pageNumber === "..." ? (
                <span key={`${pageNumber}-${index}`} className="px-2">...</span>
              ) : (
                <button type="button" onClick={() => setPage(pageNumber)} key={pageNumber} className={`grid h-9 w-9 place-items-center rounded-md text-sm font-semibold ${currentPage === pageNumber ? "bg-[#008f45] text-white" : "bg-white text-[#344054]"}`}>
                  {pageNumber}
                </button>
              )
            )}
            <button type="button" disabled={currentPage === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="inline-flex h-9 items-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-4 text-sm font-semibold text-[#101828] disabled:cursor-not-allowed disabled:opacity-50">
              Next
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default JobOpenings;
