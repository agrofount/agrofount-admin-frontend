import {
  faBriefcase,
  faChevronDown,
  faEllipsisVertical,
  faFileLines,
  faPlus,
  faUserCheck,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { assets } from "../../assets/assets";
import {
  applicationStatusLabels,
  fetchCareerApplications,
  fetchCareerJobs,
  fetchCareerStats,
  normalizeApplication,
  normalizeJob,
} from "./careerData";

const Badge = ({ children, tone = "green" }) => {
  const tones = {
    green: "bg-[#dcf8e6] text-[#008f45]",
    blue: "bg-[#e5f1ff] text-[#1677d2]",
    purple: "bg-[#efe6ff] text-[#7c3fd3]",
    orange: "bg-[#fff0df] text-[#f97316]",
    red: "bg-[#ffe4e4] text-[#ef3340]",
    gray: "bg-[#f2f4f7] text-[#667085]",
  };

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
};

const Card = ({ children, className = "" }) => (
  <section className={`rounded-lg border border-[#e5e7eb] bg-white shadow-[0_8px_24px_rgba(16,24,40,0.04)] ${className}`}>
    {children}
  </section>
);

const CareersOverview = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);

  const loadCareers = useCallback(async () => {
    try {
      setLoading(true);
      const [statsData, jobsData, applicationsData] = await Promise.all([
        fetchCareerStats(),
        fetchCareerJobs({ page: 1, limit: 8, sortBy: "createdAt:DESC" }),
        fetchCareerApplications({ page: 1, limit: 4, sortBy: "submittedAt:DESC" }),
      ]);

      setStats(statsData);
      setJobs((jobsData.data || []).map((job) => normalizeJob(job, statsData.applicationsByJob || [])));
      setApplications((applicationsData.data || []).map(normalizeApplication));
    } catch (error) {
      toast.error(error.message || "Unable to load careers data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCareers();
  }, [loadCareers]);

  const statusTone = {
    Published: "green",
    Draft: "gray",
    Closed: "red",
    Archived: "gray",
    New: "green",
    "In Review": "blue",
    Shortlisted: "purple",
    Interviewed: "orange",
    Hired: "green",
    Rejected: "red",
  };

  const derivedStats = [
    {
      label: "Active Jobs",
      value: stats.publishedJobs || 0,
      detail: `${stats.totalJobs || 0} total jobs`,
      icon: faBriefcase,
      iconClass: "bg-[#e7f7ed] text-[#008f45]",
      detailClass: "text-[#008f45]",
    },
    {
      label: "Applications",
      value: stats.totalApplications || 0,
      detail: `${stats.newApplications || 0} new applications`,
      icon: faFileLines,
      iconClass: "bg-[#eaf4ff] text-[#2188e5]",
      detailClass: "text-[#008f45]",
    },
    {
      label: "Open Positions",
      value: stats.publishedJobs || 0,
      detail: `${stats.closedJobs || 0} closed jobs`,
      icon: faUsers,
      iconClass: "bg-[#f1e8ff] text-[#7c3fd3]",
      detailClass: "text-[#f97316]",
    },
    {
      label: "Hired This Month",
      value: stats.hiredApplications || 0,
      detail: `${stats.shortlistedApplications || 0} shortlisted`,
      icon: faUserCheck,
      iconClass: "bg-[#fff1df] text-[#f97316]",
      detailClass: "text-[#008f45]",
    },
  ];

  const applicationSegments = useMemo(() => {
    const total = Number(stats.totalApplications || 0);
    const values = [
      ["new", stats.newApplications || 0, "#40b965"],
      ["shortlisted", stats.shortlistedApplications || 0, "#8b5cf6"],
      ["hired", stats.hiredApplications || 0, "#008f45"],
    ];

    return values.map(([key, count, color]) => ({
      label: applicationStatusLabels[key],
      value: `${count} (${total ? Math.round((count / total) * 1000) / 10 : 0}%)`,
      color,
    }));
  }, [stats]);

  const locations = useMemo(() => {
    const counts = jobs.reduce((acc, job) => {
      acc[job.location] = (acc[job.location] || 0) + job.applications;
      return acc;
    }, {});
    const total = Object.values(counts).reduce((sum, value) => sum + value, 0);

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([location, count]) => ({
        location,
        value: `${count} (${total ? Math.round((count / total) * 1000) / 10 : 0}%)`,
        width: `${total ? Math.max(8, Math.round((count / total) * 100)) : 8}%`,
      }));
  }, [jobs]);

  return (
    <div className="space-y-5 text-[#101828]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Careers Overview</h1>
          <p className="mt-1 text-xs font-medium text-[#667085]">
            Manage job openings and track recruitment progress.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/careers/create")}
          className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-md bg-[#008f45] px-5 text-sm font-semibold text-white shadow-[0_8px_16px_rgba(0,143,69,0.18)]"
        >
          <FontAwesomeIcon icon={faPlus} />
          Create New Job
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {derivedStats.map((stat) => (
          <Card key={stat.label} className="flex items-center gap-5 p-5">
            <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-full text-xl ${stat.iconClass}`}>
              <FontAwesomeIcon icon={stat.icon} />
            </div>
            <div>
              <p className="text-sm font-medium text-[#344054]">{stat.label}</p>
              <p className="mt-1 text-3xl font-semibold tracking-normal">{loading ? "..." : stat.value}</p>
              <p className={`mt-2 text-xs font-semibold ${stat.detailClass}`}>{stat.detail}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Job Openings</h2>
            <button onClick={() => navigate("/careers/jobs")} className="text-xs font-semibold text-[#008f45]">View all jobs</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-xs">
              <thead className="bg-[#f8fafc] uppercase text-[#667085]">
                <tr>
                  {["Job Title", "Department", "Type", "Location", "Applications", "Posted", "Status", ""].map((heading) => (
                    <th key={heading} className="px-3 py-3 font-semibold">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="border-b border-[#eef2f6] last:border-0">
                    <td className="px-3 py-3 font-semibold">{job.title}</td>
                    <td className="px-3 py-3">{job.department}</td>
                    <td className="px-3 py-3">
                      <Badge tone={job.type === "Contract" ? "blue" : "green"}>{job.type}</Badge>
                    </td>
                    <td className="px-3 py-3">{job.location}</td>
                    <td className="px-3 py-3">{job.applications}</td>
                    <td className="px-3 py-3">{job.posted.replace("Posted on ", "")}</td>
                    <td className="px-3 py-3">
                      <Badge tone={statusTone[job.status]}>{job.status}</Badge>
                    </td>
                    <td className="px-3 py-3 text-right text-[#667085]">
                      <FontAwesomeIcon icon={faEllipsisVertical} />
                    </td>
                  </tr>
                ))}
                {!loading && jobs.length === 0 && (
                  <tr>
                    <td colSpan="8" className="px-3 py-10 text-center text-sm text-[#667085]">
                      No job openings found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-semibold">Applications Overview</h2>
              <button className="flex items-center gap-2 text-xs font-semibold">
                Current <FontAwesomeIcon icon={faChevronDown} className="text-[10px]" />
              </button>
            </div>
            <div className="grid items-center gap-5 sm:grid-cols-[150px_1fr] xl:grid-cols-1 2xl:grid-cols-[150px_1fr]">
              <div className="relative mx-auto grid h-36 w-36 place-items-center rounded-full bg-[conic-gradient(#40b965_0_45%,#8b5cf6_45%_75%,#008f45_75%_100%)]">
                <div className="grid h-24 w-24 place-items-center rounded-full bg-white text-center">
                  <div>
                    <p className="text-2xl font-semibold">{stats.totalApplications || 0}</p>
                    <p className="text-xs text-[#667085]">Total</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {applicationSegments.map((segment) => (
                  <div key={segment.label} className="grid grid-cols-[1fr_auto] items-center gap-3 text-xs">
                    <p className="flex items-center gap-3 text-[#344054]">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
                      {segment.label}
                    </p>
                    <p className="font-medium">{segment.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-semibold">Top Job Locations</h2>
            </div>
            <div className="space-y-4">
              {locations.map((item) => (
                <div key={item.location}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <p className="font-semibold">{item.location}</p>
                    <p className="text-[#344054]">{item.value}</p>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#edf1f5]">
                    <div className="h-1.5 rounded-full bg-[#159947]" style={{ width: item.width }} />
                  </div>
                </div>
              ))}
              {!loading && locations.length === 0 && (
                <p className="text-sm text-[#667085]">No location data available.</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Card className="p-5 xl:max-w-[calc(100%-396px)]">
        <h2 className="mb-4 text-base font-semibold">Recent Applications</h2>
        <div className="divide-y divide-[#eef2f6]">
          {applications.map((application) => (
            <div key={application.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 py-3 text-xs">
              <div className="flex items-center gap-3">
                <img src={assets.profile_picture} alt="" className="h-10 w-10 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-semibold">{application.name}</p>
                  <p className="text-[#667085]">{application.role}</p>
                </div>
              </div>
              <Badge tone={statusTone[application.status]}>{application.status}</Badge>
              <div className="flex items-center gap-8">
                <p className="hidden text-[#344054] sm:block">{application.date}</p>
                <button className="h-8 rounded-md border border-[#d0d5dd] px-5 font-semibold">View</button>
              </div>
            </div>
          ))}
          {!loading && applications.length === 0 && (
            <p className="py-8 text-center text-sm text-[#667085]">No applications found.</p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default CareersOverview;
