import { useState } from "react";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { assets } from "../../assets/assets";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { ExclamationTriangleIcon } from "@heroicons/react/16/solid";
import { apiClient } from "../../lib/apiClient";
import { ACTIONS, RESOURCES } from "../../constants/permissions";
import { usePermission } from "../Hooks/usePermission";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCopy,
  faCalendar,
  faClock,
} from "@fortawesome/free-solid-svg-icons";

// `published` and `isActive` are separate flags: a draft is not published,
// an inactive post is published but switched off.
const getPostStatus = (item) => {
  const status = item.status?.toLowerCase();
  if (status === "draft" || status === "scheduled") return status;
  if (item.published === false) return "draft";
  return item.isActive ? "published" : "inactive";
};

const STATUS_CONFIG = {
  published: {
    dot: "bg-green-500",
    badge: "bg-green-50 text-green-700 border border-green-200",
    statusText: "text-green-700",
    label: "Published",
  },
  scheduled: {
    dot: "bg-blue-500",
    badge: "bg-blue-50 text-blue-700 border border-blue-200",
    statusText: "text-blue-700",
    label: "Scheduled",
  },
  draft: {
    dot: "bg-amber-400",
    badge: "bg-amber-50 text-amber-700 border border-amber-200",
    statusText: "text-amber-600",
    label: "Draft",
  },
  inactive: {
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-600 border border-red-200",
    statusText: "text-red-600",
    label: "Inactive",
  },
};

const BlogPostItemTable = ({ item, setItemDeleted }) => {
  const [open, setOpen] = useState(false);
  const [post, setPost] = useState(item);
  const [pendingAction, setPendingAction] = useState(null);
  const [saving, setSaving] = useState(false);
  const { hasPermission, isAdmin } = usePermission();
  const canPublish = isAdmin || hasPermission(RESOURCES.BLOG_POSTS, ACTIONS.PUBLISH);

  const status = getPostStatus(post);
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.inactive;

  const handleCopyId = () => {
    navigator.clipboard.writeText(item.id).then(() => {
      toast.success("Post ID copied");
    });
  };

  const runAction = async (action) => {
    setSaving(true);
    try {
      const response =
        action === "activate" ? await apiClient.patch(`/posts/${post.slug}/active`, { isActive: true })
        : action === "deactivate" ? await apiClient.patch(`/posts/${post.slug}/active`, { isActive: false })
        : action === "publish" ? await apiClient.patch(`/posts/${post.slug}/publish`)
        : await apiClient.patch(`/posts/${post.slug}/unpublish`);
      const updated = response.data?.post ?? response.data?.data ?? response.data;
      if (updated && typeof updated === "object" && "isActive" in updated) setPost((current) => ({ ...current, ...updated, comments: current.comments }));
      else setPost((current) => ({
        ...current,
        ...(action === "activate" ? { isActive: true } : action === "deactivate" ? { isActive: false } : action === "publish" ? { published: true } : { published: false }),
      }));
      toast.success(
        { activate: "Post activated", deactivate: "Post deactivated", publish: "Post published", unpublish: "Post unpublished" }[action],
      );
    } catch (error) {
      toast.error(error.message || "Could not update this post.");
    } finally {
      setSaving(false);
      setPendingAction(null);
    }
  };

  const requestAction = (action) => {
    if (action === "deactivate" || action === "unpublish") setPendingAction(action);
    else runAction(action);
  };

  const handleDelete = async () => {
    try {
      await apiClient.delete(`/posts/${item.slug}`);
      setItemDeleted(true);
      toast.success("Post deleted successfully");
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setOpen(false);
    }
  };

  const createdAt = new Date(item.createdAt);
  const formattedDate = createdAt.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
  const formattedTime = createdAt.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const plainContent = item.content.replace(/<[^>]+>/g, "");
  const excerpt =
    plainContent.length > 30
      ? `${plainContent.slice(0, 30)}...`
      : plainContent;

  return (
    <tr className="hover:bg-[#F7F7F7] border-b border-gray-100">
      {/* Post ID */}
      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyId}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
            title="Copy Post ID"
          >
            <FontAwesomeIcon icon={faCopy} className="text-xs" />
          </button>
          <span>{item.id.slice(0, 10)}</span>
        </div>
      </td>

      {/* Title + Status Badge */}
      <td className="px-3 py-4 whitespace-nowrap text-sm">
        <p className="font-semibold text-gray-800">
          {item.title.length > 22
            ? `${item.title.slice(0, 22)}...`
            : item.title}
        </p>
        <span
          className={`inline-block mt-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full ${config.badge}`}
        >
          {config.label}
          {status === "inactive" && " ⚠"}
        </span>
      </td>

      {/* Content */}
      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
        <p className="max-w-[160px] truncate">{excerpt}</p>
      </td>

      {/* Created At */}
      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className="flex items-center gap-1.5 text-xs">
          <FontAwesomeIcon icon={faCalendar} className="text-gray-400" />
          <span>{formattedDate}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
          <FontAwesomeIcon icon={faClock} className="text-gray-300" />
          <span>{formattedTime}</span>
        </div>
      </td>

      {/* Status */}
      <td className="px-3 py-4 whitespace-nowrap text-sm">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full shrink-0 ${config.dot}`} />
          <span className={`text-sm font-medium ${config.statusText}`}>
            {config.label}
          </span>
        </div>
      </td>

      {/* Actions */}
      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className="flex flex-row gap-3 items-center">
          <Link to={`/blogs/${item.slug}/edit`} title="Edit post">
            <img src={assets.edit_icon} alt="Edit" className="w-5 h-5" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen(true)}
            title="Delete post"
            className="cursor-pointer"
          >
            <img src={assets.delete_icon} alt="Delete" className="w-5 h-5" />
          </button>
          {canPublish && (
            <>
              <button
                type="button"
                role="switch"
                aria-checked={Boolean(post.isActive)}
                aria-label={post.isActive ? "Deactivate post" : "Activate post"}
                title={post.isActive ? "Deactivate post" : "Activate post"}
                disabled={saving}
                onClick={() => requestAction(post.isActive ? "deactivate" : "activate")}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:cursor-wait disabled:opacity-60 ${post.isActive ? "bg-green-600" : "bg-gray-300"}`}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${post.isActive ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => requestAction(post.published === false ? "publish" : "unpublish")}
                className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-wait disabled:opacity-60"
              >
                {post.published === false ? (status === "scheduled" ? "Publish now" : "Publish") : "Unpublish"}
              </button>
            </>
          )}
        </div>

        <Dialog open={pendingAction !== null} onClose={() => !saving && setPendingAction(null)} className="relative z-10">
          <DialogBackdrop className="fixed inset-0 bg-gray-500/75" />
          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <DialogPanel className="w-full max-w-md rounded-lg bg-white p-6 text-left shadow-xl">
                <DialogTitle as="h3" className="text-base font-semibold text-gray-900">
                  {pendingAction === "unpublish" ? "Unpublish post" : "Deactivate post"}
                </DialogTitle>
                <p className="mt-2 text-sm text-gray-500">
                  {pendingAction === "unpublish"
                    ? `"${post.title}" will go back to draft and no longer appear on the public blog.`
                    : `"${post.title}" will be marked inactive. You can activate it again at any time.`}
                </p>
                <div className="mt-5 flex justify-end gap-3">
                  <button type="button" data-autofocus disabled={saving} onClick={() => setPendingAction(null)} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-gray-300 ring-inset hover:bg-gray-50">Cancel</button>
                  <button type="button" disabled={saving} onClick={() => runAction(pendingAction)} className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:cursor-wait disabled:opacity-60">{saving ? "Saving…" : pendingAction === "unpublish" ? "Unpublish" : "Deactivate"}</button>
                </div>
              </DialogPanel>
            </div>
          </div>
        </Dialog>

        <Dialog open={open} onClose={setOpen} className="relative z-10">
          <DialogBackdrop
            transition
            className="fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
          />
          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <DialogPanel
                transition
                className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg data-closed:sm:translate-y-0 data-closed:sm:scale-95"
              >
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:size-10">
                      <ExclamationTriangleIcon
                        aria-hidden="true"
                        className="size-6 text-red-600"
                      />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <DialogTitle
                        as="h3"
                        className="text-base font-semibold text-gray-900"
                      >
                        Delete Post
                      </DialogTitle>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Are you sure you want to delete &quot;{item.title}
                          &quot;? This action cannot be undone.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-red-500 sm:ml-3 sm:w-auto"
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    data-autofocus
                    onClick={() => setOpen(false)}
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 shadow-xs ring-gray-300 ring-inset hover:bg-gray-50 sm:mt-0 sm:w-auto"
                  >
                    Cancel
                  </button>
                </div>
              </DialogPanel>
            </div>
          </div>
        </Dialog>
      </td>
    </tr>
  );
};

export default BlogPostItemTable;
