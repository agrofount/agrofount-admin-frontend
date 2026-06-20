import { useCallback, useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShopContext } from "../../context/ShopContext";
import TableSkeleton from "../skeleton/TableSkeleton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faTable,
  faXmark,
  faSort,
  faFileLines,
  faPaperPlane,
  faClock,
  faCalendarDays,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import BlogPostItemTable from "./BlogPostItemTable";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { assets } from "../../assets/assets";
import { apiClient } from "../../lib/apiClient";

export const ListPost = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [blogPosts, setBlogPosts] = useState({ data: [], meta: {} });
  const [pageLimit, setPageLimit] = useState(10);
  const [searchValue, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemDeleted, setItemDeleted] = useState(false);
  const [showTip, setShowTip] = useState(true);
  const [stats, setStats] = useState({
    total: null,
    published: null,
    draft: null,
    lastPublished: null,
  });

  const { token, navigate } = useContext(ShopContext);

  const fetchPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get("/posts", {
        params: { page: currentPage, limit: pageLimit, search: searchValue },
      });
      if (response.status === 200) setBlogPosts(response.data);
    } catch (error) {
      console.error("an error occurred: ", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageLimit, searchValue]);

  const fetchStats = useCallback(async () => {
    const [totalRes, publishedRes, draftRes] = await Promise.allSettled([
      apiClient.get("/posts", { params: { limit: 1 } }),
      apiClient.get("/posts", { params: { limit: 1, status: "published" } }),
      apiClient.get("/posts", { params: { limit: 1, status: "draft" } }),
    ]);

    const total =
      totalRes.status === "fulfilled"
        ? totalRes.value.data?.meta?.totalItems
        : null;
    const published =
      publishedRes.status === "fulfilled"
        ? publishedRes.value.data?.meta?.totalItems
        : null;
    const draft =
      draftRes.status === "fulfilled"
        ? draftRes.value.data?.meta?.totalItems
        : null;

    let lastPublished = null;
    if (publishedRes.status === "fulfilled") {
      const firstPost = publishedRes.value.data?.data?.[0];
      if (firstPost?.createdAt) lastPublished = new Date(firstPost.createdAt);
    }

    setStats({ total, published, draft, lastPublished });
  }, []);

  const handlePageChange = (page) => setCurrentPage(page);

  useEffect(() => {
    fetchPosts();
    setItemDeleted(false);
  }, [fetchPosts, itemDeleted]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (!token) navigate("/login");
  }, [navigate, token]);

  const formatStatDate = (date) => {
    if (!date) return "--";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const statCards = [
    {
      icon: faFileLines,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      label: "Total Posts",
      value: stats.total ?? "--",
      sub: "All blog posts",
      subColor: "text-green-600",
    },
    {
      icon: faPaperPlane,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-500",
      label: "Published",
      value: stats.published ?? "--",
      sub: "Active and visible",
      subColor: "text-blue-500",
    },
    {
      icon: faClock,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-500",
      label: "Drafts",
      value: stats.draft ?? "--",
      sub: "Not published",
      subColor: "text-amber-500",
    },
    {
      icon: faCalendarDays,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-500",
      label: "Last Published",
      value: formatStatDate(stats.lastPublished),
      sub: "Most recent post",
      subColor: "text-purple-500",
    },
  ];

  let tableContent;
  if (isLoading) {
    tableContent = <TableSkeleton />;
  } else if (blogPosts.data.length < 1) {
    tableContent = (
      <tbody>
        <tr>
          <td colSpan="6">
            <div className="flex justify-center items-center h-[300px] w-full">
              <div className="flex flex-col items-center gap-3">
                <FontAwesomeIcon
                  icon={faTable}
                  size="2xl"
                  className="text-gray-300"
                />
                <p className="text-[#ADADAD] text-sm">No blog posts yet</p>
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    );
  } else {
    tableContent = (
      <tbody>
        {blogPosts.data.map((item, index) => (
          <BlogPostItemTable
            item={item}
            key={index}
            setItemDeleted={setItemDeleted}
          />
        ))}
      </tbody>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-row justify-between items-start gap-5 mb-5">
        <div>
          <p className="text-black text-[25px] font-bold leading-normal tracking-[0.5px]">
            Blog Post List
          </p>
          <p className="text-gray-500 text-sm mt-1">
            Manage your blog posts, publish content and engage your audience.
          </p>
        </div>
        <div className="flex flex-row items-center gap-2 mt-2 shrink-0">
          <Link to="/">
            <p className="text-[#6E6E6E] text-[13px]">Dashboard</p>
          </Link>
          <FontAwesomeIcon icon={faChevronRight} className="h-3 text-[#6E6E6E]" />
          <Link to="/blogs">
            <p className="text-[#6E6E6E] text-[13px]">Blog</p>
          </Link>
          <FontAwesomeIcon icon={faChevronRight} className="h-3 text-[#6E6E6E]" />
          <p className="text-[#6E6E6E] text-[13px]">Blog Post List</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {statCards.map((card, i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow-[0px_0px_10px_0px_#EDEDED] p-4 flex flex-row items-center gap-4"
          >
            <div
              className={`${card.iconBg} rounded-xl flex items-center justify-center w-14 h-14 shrink-0`}
            >
              <FontAwesomeIcon
                icon={card.icon}
                className={`${card.iconColor} text-xl`}
              />
            </div>
            <div>
              <p className="text-gray-500 text-sm">{card.label}</p>
              <p className="text-gray-900 text-2xl font-bold leading-tight">
                {card.value}
              </p>
              <p className={`text-xs font-medium ${card.subColor}`}>
                {card.sub}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-[12px] shadow-[0px_0px_10px_0px_#EDEDED] p-4">
        {/* Tip Banner */}
        {showTip && (
          <div className="flex flex-row justify-between items-center bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 mb-4">
            <div className="flex flex-row items-center gap-2">
              <img src={assets.tip_icon} alt="" className="w-5 h-5 shrink-0" />
              <p className="text-gray-600 text-sm">
                <span className="font-semibold">Tip:</span> Search by City ID.
                Each post is provided with a unique ID, which you can rely on to
                find the exact product you need.
              </p>
            </div>
            <button
              onClick={() => setShowTip(false)}
              className="text-gray-400 hover:text-gray-600 cursor-pointer ml-4 shrink-0"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        )}

        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 items-center py-3">
          <div className="flex flex-row items-center gap-2 flex-wrap">
            <p className="text-sm text-gray-500">Show</p>
            <Menu>
              <MenuButton className="flex flex-row items-center gap-2 border border-gray-300 cursor-pointer py-1.5 px-3 rounded-md">
                <p className="text-sm">{pageLimit}</p>
                <img src={assets.dropdown_icon} alt="" />
              </MenuButton>
              <MenuItems
                anchor="bottom"
                className="bg-white shadow-lg rounded-md py-2 px-4 z-10"
              >
                {[10, 20, 30, 40, 50].map((n) => (
                  <MenuItem
                    key={n}
                    onClick={() => setPageLimit(n)}
                    className="cursor-pointer"
                  >
                    <p className="text-sm text-center text-gray-500 py-2">
                      {n}
                    </p>
                  </MenuItem>
                ))}
              </MenuItems>
            </Menu>
            <p className="text-sm text-gray-500">entries</p>
            <div className="flex items-center rounded-full bg-white pl-3 border border-gray-300 has-[input:focus-within]:border-green-500">
              <input
                type="text"
                placeholder="Search blog posts..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="block py-1.5 pr-2 pl-1 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none w-48"
              />
              <div className="px-3">
                <img src={assets.search_icon} className="size-4" alt="" />
              </div>
            </div>
          </div>

          <Link
            to="/blogs/add"
            className="flex flex-row gap-2 items-center bg-[#1a4731] text-white px-5 py-2.5 rounded-full hover:bg-[#163d29] transition-colors whitespace-nowrap"
          >
            <FontAwesomeIcon icon={faPlus} className="text-sm" />
            <p className="text-sm font-semibold">Add new post</p>
          </Link>
        </div>

        {/* Table */}
        <table className="w-full divide-y divide-gray-200 overflow-x-auto">
          <thead className="bg-gray-50">
            <tr>
              {[
                { label: "Post ID", sortable: false },
                { label: "Title", sortable: true },
                { label: "Content", sortable: true },
                { label: "Created At", sortable: true },
                { label: "Status", sortable: true },
                { label: "Actions", sortable: false },
              ].map(({ label, sortable }) => (
                <th
                  key={label}
                  className="px-3 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  <div className="flex items-center gap-1">
                    {label}
                    {sortable && (
                      <FontAwesomeIcon
                        icon={faSort}
                        className="text-gray-400 text-[10px]"
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          {tableContent}
        </table>

        {/* Pagination */}
        {blogPosts.meta && (
          <div className="flex flex-row justify-between items-center mt-5 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              {blogPosts.meta.totalItems
                ? `Showing 1 to ${Math.min(
                    pageLimit * Number(blogPosts.meta.currentPage),
                    Number(blogPosts.meta.totalItems)
                  )} of ${blogPosts.meta.totalItems} entries`
                : "Showing 0 entries"}
            </p>

            <div className="flex flex-row items-center gap-1">
              <button
                className={`flex items-center justify-center w-8 h-8 rounded-full border text-sm ${
                  Number(blogPosts.meta.currentPage) === 1
                    ? "border-gray-200 text-gray-300 cursor-not-allowed"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
                onClick={() =>
                  handlePageChange(Number(blogPosts.meta.currentPage) - 1)
                }
                disabled={Number(blogPosts.meta.currentPage) === 1}
              >
                <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
              </button>

              {[...Array(blogPosts.meta.totalPages)].map((_, index) => (
                <button
                  key={index}
                  className={`w-8 h-8 rounded-full border text-sm font-medium ${
                    Number(blogPosts.meta.currentPage) === index + 1
                      ? "bg-[#1a4731] text-white border-[#1a4731]"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                  }`}
                  onClick={() => handlePageChange(index + 1)}
                >
                  {index + 1}
                </button>
              ))}

              <button
                className={`flex items-center justify-center w-8 h-8 rounded-full border text-sm ${
                  Number(blogPosts.meta.currentPage) ===
                  blogPosts.meta.totalPages
                    ? "border-gray-200 text-gray-300 cursor-not-allowed"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
                onClick={() =>
                  handlePageChange(Number(blogPosts.meta.currentPage) + 1)
                }
                disabled={
                  Number(blogPosts.meta.currentPage) ===
                  blogPosts.meta.totalPages
                }
              >
                <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
