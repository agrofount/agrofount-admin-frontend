import {
  faChevronLeft,
  faChevronRight,
  faChevronDown,
  faFilterCircleXmark,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  buildSellerInterestParams,
  fetchSellerInterests,
  normalizeSellerInterest,
} from "./sellerInterestData";

const pageSize = 10;

const statusOptions = ["All Statuses", "New", "Contacted", "Approved", "Rejected"];
const statusValues = {
  New: "new",
  Contacted: "contacted",
  Approved: "approved",
  Rejected: "rejected",
};

const statusTone = {
  New: "bg-[#dcf8e6] text-[#008f45]",
  Contacted: "bg-[#e5f1ff] text-[#1677d2]",
  Approved: "bg-[#dcf8e6] text-[#008f45]",
  Rejected: "bg-[#ffe4e4] text-[#ef3340]",
};

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

const SellerInterestsList = () => {
  const navigate = useNavigate();
  const [interests, setInterests] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [status, setStatus] = useState("All Statuses");
  const searchTimeout = useRef();

  const loadInterests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchSellerInterests(
        buildSellerInterestParams({
          page,
          limit: pageSize,
          search: searchValue,
          sortBy: "createdAt:DESC",
          filters:
            status === "All Statuses" ? {} : { status: statusValues[status] },
        })
      );
      setInterests((response.data || []).map(normalizeSellerInterest));
      setMeta(response.meta || {});
    } catch (error) {
      toast.error(error.message || "Unable to load seller interest submissions.");
    } finally {
      setLoading(false);
    }
  }, [page, searchValue, status]);

  useEffect(() => {
    loadInterests();
  }, [loadInterests]);

  useEffect(
    () => () => {
      clearTimeout(searchTimeout.current);
    },
    []
  );

  const handleSearch = (value) => {
    setSearch(value);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setSearchValue(value);
      setPage(1);
    }, 400);
  };

  const clearFilters = () => {
    setSearch("");
    setSearchValue("");
    setStatus("All Statuses");
    setPage(1);
  };

  const currentPage = Number(meta.currentPage || page || 1);
  const totalPages = Number(meta.totalPages || 1);
  const totalItems = Number(meta.totalItems || interests.length || 0);
  const shownFrom = totalItems ? (currentPage - 1) * pageSize + 1 : 0;
  const shownTo = totalItems ? Math.min(currentPage * pageSize, totalItems) : 0;

  return (
    <div className="space-y-5 text-[#101828]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Seller Interests</h1>
          <p className="mt-1 text-xs font-medium text-[#667085]">
            Review and follow up on &quot;Become a Seller&quot; submissions.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#667085]">
          <Link to="/" className="hover:text-[#008f45]">Dashboard</Link>
          <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
          <span>Seller Interests</span>
        </div>
      </div>

      <section className="rounded-lg border border-[#e5e7eb] bg-white p-5 shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
        <div className="grid gap-4 md:grid-cols-[minmax(260px,1fr)_220px_auto] md:items-end">
          <div className="flex h-10 items-center rounded-md border border-[#d0d5dd] px-4">
            <FontAwesomeIcon icon={faSearch} className="mr-3 text-[#98a2b3]" />
            <input
              value={search}
              onChange={(event) => handleSearch(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#98a2b3]"
              placeholder="Search contact, business, product..."
            />
          </div>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-[#667085]">Status</span>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="h-10 w-full appearance-none rounded-md border border-[#d0d5dd] bg-white px-4 text-sm text-[#101828] outline-none"
            >
              {statusOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <span className="pointer-events-none -mt-6 mr-4 flex justify-end">
              <FontAwesomeIcon icon={faChevronDown} className="text-xs text-[#667085]" />
            </span>
          </label>
          <button type="button" onClick={clearFilters} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#d0d5dd] px-4 text-sm font-semibold text-[#344054]">
            <FontAwesomeIcon icon={faFilterCircleXmark} />
            Clear Filters
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-[#e5e7eb] bg-white shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-xs">
            <thead className="bg-[#f8fafc] uppercase text-[#667085]">
              <tr>
                {["Contact", "Email", "Phone", "Business", "Product", "Location", "Status", "Submitted"].map((heading) => (
                  <th key={heading} className="px-4 py-4 font-semibold">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-sm text-[#667085]">
                    Loading seller interest submissions...
                  </td>
                </tr>
              ) : interests.length ? (
                interests.map((interest) => (
                  <tr
                    key={interest.id}
                    onClick={() => navigate(`/seller-interests/${interest.id}`)}
                    className="cursor-pointer border-b border-[#eef2f6] last:border-0 hover:bg-[#fbfcfd]"
                  >
                    <td className="px-4 py-3 font-semibold">
                      <Link
                        to={`/seller-interests/${interest.id}`}
                        onClick={(event) => event.stopPropagation()}
                        className="hover:text-[#008f45]"
                      >
                        {interest.contactName}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{interest.email}</td>
                    <td className="px-4 py-3">{interest.phone}</td>
                    <td className="px-4 py-3">{interest.businessName || "N/A"}</td>
                    <td className="px-4 py-3">{interest.productName}</td>
                    <td className="px-4 py-3">{interest.location}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusTone[interest.status] || "bg-[#f2f4f7] text-[#667085]"}`}>
                        {interest.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{interest.date}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-sm text-[#667085]">
                    No seller interest submissions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-4 border-t border-[#eef2f6] px-5 py-4 text-sm text-[#667085] md:flex-row md:items-center md:justify-between">
          <p>Showing {shownFrom} to {shownTo} of {totalItems} submissions</p>
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

export default SellerInterestsList;
