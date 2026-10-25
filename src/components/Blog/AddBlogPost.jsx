import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faCalendarDays,
  faCircleCheck,
  faImage,
  faMagnifyingGlass,
  faPaperPlane,
  faPlus,
  faTag,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import DescriptionEditor from "../Products/ProductDescriptionEditor";
import { ShopContext } from "../../context/ShopContext";
import { toast } from "react-toastify";
import { useDropzone } from "react-dropzone";
import { ACTIONS, RESOURCES } from "../../constants/permissions";
import { apiClient } from "../../lib/apiClient";
import { IMAGE_MIME_TYPES, validateImageFiles } from "../../lib/uploadValidation";
import { usePermission } from "../Hooks/usePermission";

const TITLE_LIMIT = 120;

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft", hint: "Save and come back later" },
  { value: "scheduled", label: "Scheduled", hint: "Publish at a specific date and time" },
  { value: "published", label: "Published", hint: "Live on the blog" },
];

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const pad = (value) => String(value).padStart(2, "0");
const toLocalInput = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const timeAgo = (from, now) => {
  const seconds = Math.max(0, Math.round((now - from) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
};

const stripHtml = (html = "") => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const Card = ({ icon, title, children }) => (
  <section className="rounded-2xl border border-[#eaecf0] bg-white p-5 shadow-[0_4px_16px_rgba(16,24,40,0.04)]">
    <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#101828]">
      {icon && <FontAwesomeIcon icon={icon} className="text-[#344054]" />}
      {title}
    </h2>
    {children}
  </section>
);

const AddBlogPost = ({ post }) => {
  const isEditing = Boolean(post && post.id);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagList, setTagList] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [status, setStatus] = useState("draft");
  const [scheduleValue, setScheduleValue] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [autosaveError, setAutosaveError] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const savedSnapshot = useRef(null);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploading, setUploading] = useState(false);
  const [coverImage, setCoverImage] = useState("");
  const [processing, setProcessing] = useState(false);
  const { socket, navigate } = useContext(ShopContext);
  const { hasPermission, isAdmin } = usePermission();
  const canPublish = isAdmin || hasPermission(RESOURCES.BLOG_POSTS, ACTIONS.PUBLISH);

  const onDrop = useCallback(async (acceptedFiles) => {
    const validationError = validateImageFiles(acceptedFiles, { min: 1, max: 1 });
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const file = acceptedFiles[0];
    setUploadProgress({});
    setUploading(true);

    const formData = new FormData();
    formData.append("files", file);
    formData.append("purpose", "other");

    try {
      const response = await apiClient.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const uploaded = response.data.uploads[0];
      if (uploaded?.publicUrl) setCoverImage(uploaded.publicUrl);
    } catch (error) {
      toast.error(error.message);
      setUploadProgress({});
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [], "image/png": [], "image/webp": [] },
    maxFiles: 1,
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });

  const addTags = (raw) => {
    const incoming = raw.split(",").map((tag) => tag.trim()).filter(Boolean);
    if (incoming.length === 0) return;
    setTagList((current) => {
      const next = [...current];
      incoming.forEach((tag) => {
        if (!next.some((existing) => existing.toLowerCase() === tag.toLowerCase())) next.push(tag);
      });
      return next;
    });
    setTagInput("");
  };

  const handleTagKeyDown = (event) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTags(tagInput);
    } else if (event.key === "Backspace" && !tagInput) {
      setTagList((current) => current.slice(0, -1));
    }
  };

  // target: "draft" | "scheduled" | "published"
  const submit = async (target) => {
    if (!title.trim() || !stripHtml(content)) {
      toast.error("Please fill in all required fields.");
      return;
    }

    let scheduledAt = null;
    if (target === "scheduled") {
      const when = new Date(scheduleValue);
      if (!scheduleValue || Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) {
        toast.error("Choose a publish date and time in the future.");
        return;
      }
      scheduledAt = when.toISOString();
    }

    setStatus(target);
    setProcessing(true);
    let slug = post?.slug;
    try {
      const blogPostData = {
        title: title.trim(),
        content,
        tags: tagList,
        ...(coverImage ? { coverImage } : {}),
      };

      if (isEditing) {
        await apiClient.put(`/posts/${post.slug}`, blogPostData);
      } else {
        const response = await apiClient.post("/posts", blogPostData);
        slug = response.data?.slug ?? response.data?.post?.slug ?? response.data?.data?.slug;
      }

      const wasPublished = Boolean(post?.published);
      const wasScheduled = post?.status === "scheduled";
      if (target === "scheduled") {
        if (!slug) throw new Error("Saved, but the post link was not returned, so it could not be scheduled.");
        try {
          await apiClient.patch(`/posts/${slug}/schedule`, { scheduledAt });
        } catch (scheduleError) {
          toast.error(`Saved, but it could not be scheduled: ${scheduleError.message}`);
          if (!isEditing) navigate(`/blogs/${slug}/edit`);
          return;
        }
      } else if (target === "published" && !wasPublished) {
        if (!slug) throw new Error("Saved, but the post link was not returned, so it could not be published.");
        try {
          await apiClient.patch(`/posts/${slug}/publish`);
        } catch (publishError) {
          toast.error(`Saved, but it could not be published: ${publishError.message}`);
          if (!isEditing && slug) navigate(`/blogs/${slug}/edit`);
          return;
        }
      } else if (target === "draft" && wasPublished) {
        try {
          await apiClient.patch(`/posts/${slug}/unpublish`);
        } catch (unpublishError) {
          toast.error(`Saved, but it could not be unpublished: ${unpublishError.message}`);
          return;
        }
      } else if (target === "draft" && wasScheduled) {
        try {
          await apiClient.patch(`/posts/${slug}/unschedule`);
        } catch (unscheduleError) {
          toast.error(`Saved, but the schedule could not be removed: ${unscheduleError.message}`);
          return;
        }
      }

      toast.success(
        target === "scheduled"
          ? "Blog post scheduled!"
          : target === "published" && !wasPublished
          ? "Blog post published!"
          : isEditing
            ? "Blog post updated successfully!"
            : "Draft saved successfully!",
      );
      navigate("/blogs");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    if (!socket) return undefined;

    const handleUploadProgress = (data) => {
      const { name, percentage } = data;
      setUploadProgress((prevProgress) => ({ ...prevProgress, [name]: percentage }));
    };

    socket.on("uploadProgress", handleUploadProgress);
    return () => {
      socket.off("uploadProgress", handleUploadProgress);
    };
  }, [socket]);

  useEffect(() => {
    if (post && post.id) {
      setTitle(post.title || "");
      setContent(post.content || "");
      setTagList(Array.isArray(post.tags) ? post.tags.filter(Boolean) : []);
      setCoverImage(typeof post.coverImage === "string" ? post.coverImage : "");
      setStatus(post.published ? "published" : post.status === "scheduled" ? "scheduled" : "draft");
      setScheduleValue(post.scheduledAt ? toLocalInput(post.scheduledAt) : "");
      setLastSavedAt(post.updatedAt ? new Date(post.updatedAt).getTime() : null);
      savedSnapshot.current = JSON.stringify({
        title: (post.title || "").trim(),
        content: post.content || "",
        tags: Array.isArray(post.tags) ? post.tags.filter(Boolean) : [],
        coverImage: typeof post.coverImage === "string" ? post.coverImage : "",
      });
    }
  }, [post]);

  // Autosave edits to an existing unpublished post. New posts are not created
  // until the user saves, and published posts are never changed silently.
  const alreadyPublished = Boolean(post?.published);
  useEffect(() => {
    if (!isEditing || alreadyPublished || processing || savedSnapshot.current === null) return undefined;
    const snapshot = JSON.stringify({ title: title.trim(), content, tags: tagList, coverImage });
    if (snapshot === savedSnapshot.current || !title.trim() || !stripHtml(content)) return undefined;

    const timer = setTimeout(async () => {
      try {
        const response = await apiClient.put(`/posts/${post.slug}`, {
          title: title.trim(),
          content,
          tags: tagList,
          ...(coverImage ? { coverImage } : {}),
        });
        savedSnapshot.current = snapshot;
        setAutosaveError("");
        setLastSavedAt(response.data?.updatedAt ? new Date(response.data.updatedAt).getTime() : Date.now());
      } catch (error) {
        setAutosaveError(error.message || "Autosave failed");
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, [title, content, tagList, coverImage, isEditing, alreadyPublished, processing, post?.slug]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  const seo = useMemo(() => {
    const slug = post?.slug || slugify(title) || "your-post";
    const description = stripHtml(content);
    return {
      title: title.trim() || "Your post title",
      url: `agrofount.com/blog/${slug}`,
      description: description ? (description.length > 160 ? `${description.slice(0, 157)}...` : description) : "Your post summary will appear here.",
    };
  }, [title, content, post?.slug]);

  const busy = processing || uploading;
  const spinner = <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />;

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <button type="button" onClick={() => navigate("/blogs")} aria-label="Back to blog posts" className="flex h-9 w-9 items-center justify-center rounded-lg text-[#344054] hover:bg-[#f2f4f7]">
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <h1 className="text-xl font-bold text-[#101828]">{isEditing ? "Edit Blog Post" : "Create Blog Post"}</h1>
      </div>

      <form onSubmit={(event) => { event.preventDefault(); submit(status); }} className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-[#eaecf0] bg-white p-5 shadow-[0_4px_16px_rgba(16,24,40,0.04)]">
            <label htmlFor="title" className="block text-sm font-semibold text-[#101828]">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              placeholder="Enter blog title"
              value={title}
              maxLength={TITLE_LIMIT}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-2 w-full rounded-xl border border-[#d0d5dd] px-3 py-2.5 text-[13px] text-[#101828] outline-none focus:border-[#008f45] focus:ring-2 focus:ring-[#008f45]/10"
              required
            />
            <p className="mt-1 text-right text-xs text-[#667085]">{title.length}/{TITLE_LIMIT}</p>

            <p className="mt-3 text-sm font-semibold text-[#101828]">
              Content <span className="text-red-500">*</span>
            </p>
            <div className="mt-2">
              <DescriptionEditor description={content} setDescription={setContent} />
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <Card title="Publishing Status">
            <fieldset disabled={!canPublish} className="space-y-3">
              <legend className="sr-only">Publishing status</legend>
              {STATUS_OPTIONS.filter((option) => !(alreadyPublished && option.value === "scheduled")).map((option) => (
                <label key={option.value} className={`flex items-start gap-3 ${canPublish ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}>
                  <input type="radio" name="status" value={option.value} checked={status === option.value} onChange={() => setStatus(option.value)} className="mt-1 h-4 w-4 accent-[#008f45]" />
                  <span>
                    <span className="block text-[13px] font-semibold text-[#101828]">{option.label}</span>
                    <span className="block text-xs text-[#667085]">{option.hint}</span>
                  </span>
                </label>
              ))}
            </fieldset>
            {status === "scheduled" && canPublish && !alreadyPublished && (
              <label className="mt-4 block text-xs font-semibold text-[#344054]">
                <span className="flex items-center gap-2"><FontAwesomeIcon icon={faCalendarDays} />Publish date and time</span>
                <input type="datetime-local" value={scheduleValue} min={toLocalInput(now)} onChange={(event) => setScheduleValue(event.target.value)} className="mt-2 w-full rounded-lg border border-[#d0d5dd] px-3 py-2 text-[13px] font-normal text-[#101828] outline-none focus:border-[#008f45]" />
                <span className="mt-1 block text-[11px] font-normal text-[#98a2b3]">Goes live within about a minute of this time, in your local timezone.</span>
              </label>
            )}
            {!canPublish && <p className="mt-3 text-xs text-[#667085]">You do not have permission to publish posts.</p>}
            {alreadyPublished && status === "draft" && <p className="mt-3 text-xs text-[#b54708]">Saving will take this post off the public blog.</p>}
          </Card>

          <Card icon={faTag} title="Tags">
            <div className="flex flex-wrap gap-2">
              {tagList.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-2 rounded-full bg-[#e3f6ea] px-3 py-1 text-xs font-medium text-[#1f6b3b]">
                  {tag}
                  <button type="button" aria-label={`Remove tag ${tag}`} onClick={() => setTagList((current) => current.filter((existing) => existing !== tag))} className="text-[10px] hover:text-red-600"><FontAwesomeIcon icon={faXmark} /></button>
                </span>
              ))}
            </div>
            <label className="mt-3 flex items-center gap-2 rounded-lg border border-[#d0d5dd] px-3 py-2 focus-within:border-[#008f45]">
              <FontAwesomeIcon icon={faPlus} className="text-xs text-[#667085]" />
              <input
                type="text"
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={() => addTags(tagInput)}
                placeholder="Add tag"
                aria-label="Add tag"
                className="w-full bg-transparent text-xs outline-none placeholder:text-[#98a2b3]"
              />
            </label>
            <p className="mt-1 text-[11px] text-[#98a2b3]">Press Enter or comma to add.</p>
          </Card>

          <Card icon={faImage} title="Cover Image">
            <div {...getRootProps()} className={`flex items-center gap-4 rounded-xl ${isDragActive ? "bg-[#e3f6ea]" : ""}`}>
              <input {...getInputProps()} accept={IMAGE_MIME_TYPES.join(",")} />
              {coverImage ? (
                <img src={coverImage} alt="Cover preview" className="h-24 w-28 shrink-0 rounded-lg object-cover" />
              ) : (
                <span className="flex h-24 w-28 shrink-0 items-center justify-center rounded-lg bg-[#f2f4f7] text-xl text-[#98a2b3]"><FontAwesomeIcon icon={faImage} /></span>
              )}
              <div>
                <p className="text-xs font-semibold text-[#101828]">Cover image</p>
                <p className="mt-0.5 text-[11px] text-[#667085]">{isDragActive ? "Drop the image here" : "JPG, PNG or WebP"}</p>
                <button type="button" onClick={open} disabled={uploading} className="mt-2 inline-flex items-center gap-2 rounded-full border border-[#d0d5dd] px-4 py-1.5 text-xs font-semibold text-[#344054] hover:bg-[#f9fafb] disabled:cursor-wait disabled:opacity-60">
                  {uploading && spinner}
                  {coverImage ? "Change image" : "Upload image"}
                </button>
              </div>
            </div>
            {Object.keys(uploadProgress).map((fileName) => (
              <div key={fileName} className="mt-3 h-1 w-full rounded bg-[#eaecf0]">
                <div className="h-1 rounded bg-[#008f45]" style={{ width: `${uploadProgress[fileName]}%` }} />
              </div>
            ))}
          </Card>

          <Card icon={faMagnifyingGlass} title="SEO Preview">
            <div className="rounded-xl bg-[#f9fafb] p-4">
              <p className="text-[13px] font-semibold leading-snug text-[#1a56db]">{seo.title}</p>
              <p className="mt-1 break-all text-[11px] text-[#008f45]">{seo.url}</p>
              <p className="mt-1 text-xs leading-relaxed text-[#667085]">{seo.description}</p>
            </div>
            {!isEditing && <p className="mt-2 text-[11px] text-[#98a2b3]">The final link is created when the post is saved.</p>}
          </Card>
        </aside>

        <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center justify-end gap-3 border-t border-[#eaecf0] bg-white/95 px-4 py-3 backdrop-blur lg:col-span-2">
          {isEditing && !alreadyPublished && (
            <p className={`mr-auto flex items-center gap-2 text-xs ${autosaveError ? "text-red-700" : "text-[#667085]"}`} role="status">
              {autosaveError ? `Autosave failed: ${autosaveError}` : lastSavedAt ? <><FontAwesomeIcon icon={faCircleCheck} className="text-[#008f45]" />Draft saved {timeAgo(lastSavedAt, now)}</> : null}
            </p>
          )}
          {alreadyPublished ? (
            <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-[#008f45] px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-[#007a3b] disabled:cursor-not-allowed disabled:opacity-60">
              {processing && spinner}
              {processing ? "Saving…" : "Save changes"}
            </button>
          ) : (
            <>
              <button type="button" disabled={busy} onClick={() => submit("draft")} className="rounded-lg border border-[#008f45] px-5 py-2.5 text-[13px] font-semibold text-[#008f45] hover:bg-[#e3f6ea] disabled:cursor-not-allowed disabled:opacity-60">
                {processing ? "Saving…" : "Save Draft"}
              </button>
              {canPublish && (
                <button type="button" disabled={busy} onClick={() => submit(status === "scheduled" ? "scheduled" : "published")} className="inline-flex items-center gap-2 rounded-lg bg-[#008f45] px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-[#007a3b] disabled:cursor-not-allowed disabled:opacity-60">
                  {processing ? spinner : <FontAwesomeIcon icon={status === "scheduled" ? faCalendarDays : faPaperPlane} />}
                  {status === "scheduled" ? "Schedule" : "Publish"}
                </button>
              )}
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default AddBlogPost;
