import { useCallback, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileLines,
  faFilePdf,
  faMagnifyingGlass,
  faGaugeHigh,
  faCloudArrowUp,
  faSpinner,
  faCircleCheck,
  faCircleInfo,
  faXmark,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { apiClient } from "../../lib/apiClient";

const SOURCE_TYPES = [
  { value: "farming", label: "Farming knowledge" },
  { value: "agrofount", label: "Agrofount product/guide" },
  { value: "market", label: "Market & pricing" },
];

const PDF_MAX_BYTES = 30 * 1024 * 1024;

const TABS = [
  { key: "document", label: "Add Document", icon: faFileLines },
  { key: "pdf", label: "Upload PDF", icon: faFilePdf },
  { key: "search", label: "Test Search", icon: faMagnifyingGlass },
  { key: "usage", label: "Token Usage", icon: faGaugeHigh },
];

const formatNumber = (value) =>
  new Intl.NumberFormat("en-NG").format(Number(value) || 0);

const formatDateTime = (value) => {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const parseTags = (raw) =>
  raw
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

/* ─── Add Document (raw text) ─────────────────────────────────── */
function AddDocumentTab() {
  const [form, setForm] = useState({
    sourceType: "farming",
    title: "",
    body: "",
    tags: "",
    externalId: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const update = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.title.trim().length < 2) {
      toast.error("Title must be at least 2 characters.");
      return;
    }
    if (form.body.trim().length < 20) {
      toast.error("Body must be at least 20 characters.");
      return;
    }
    setSubmitting(true);
    setResult(null);
    try {
      const payload = {
        sourceType: form.sourceType,
        title: form.title.trim(),
        body: form.body.trim(),
        tags: parseTags(form.tags),
      };
      if (form.externalId.trim()) payload.externalId = form.externalId.trim();

      const { data } = await apiClient.post(
        "/admin/ai-knowledge/documents",
        payload
      );
      setResult(data);
      toast.success(`Document ingested into ${data.chunkCount} chunk(s).`);
      setForm({
        sourceType: form.sourceType,
        title: "",
        body: "",
        tags: "",
        externalId: "",
      });
    } catch (err) {
      toast.error(err.message || "Failed to ingest document.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 max-w-3xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Source type
          </label>
          <select
            value={form.sourceType}
            onChange={update("sourceType")}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {SOURCE_TYPES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            External ID <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="text"
            value={form.externalId}
            onChange={update("externalId")}
            maxLength={80}
            placeholder="e.g. ND-001"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <input
          type="text"
          value={form.title}
          onChange={update("title")}
          maxLength={220}
          placeholder="e.g. Newcastle Disease in Broilers"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Body
        </label>
        <textarea
          value={form.body}
          onChange={update("body")}
          rows={10}
          placeholder="Paste the full knowledge content here. Separate paragraphs with blank lines for better chunking."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <p className="text-xs text-gray-400 mt-1">
          {form.body.trim().length} characters
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tags <span className="text-gray-400">(comma separated)</span>
        </label>
        <input
          type="text"
          value={form.tags}
          onChange={update("tags")}
          placeholder="broiler, disease, vaccine"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {result && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
          <FontAwesomeIcon icon={faCircleCheck} />
          <span>
            Ingested as document <code>{result.documentId}</code> in{" "}
            {result.chunkCount} chunk(s).
          </span>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center gap-2 bg-green-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-60"
      >
        {submitting && <FontAwesomeIcon icon={faSpinner} spin />}
        {submitting ? "Ingesting..." : "Ingest Document"}
      </button>
    </form>
  );
}

/* ─── Upload PDF ──────────────────────────────────────────────── */
function UploadPdfTab() {
  const [sourceType, setSourceType] = useState("farming");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);

  const pickFile = (selected) => {
    if (!selected) return;
    const isPdf =
      selected.type === "application/pdf" ||
      selected.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      toast.error("Only PDF files are accepted.");
      return;
    }
    if (selected.size > PDF_MAX_BYTES) {
      toast.error("PDF must be 30 MB or smaller.");
      return;
    }
    setFile(selected);
    setResult(null);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    pickFile(e.dataTransfer.files?.[0]);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please select a PDF file.");
      return;
    }
    setSubmitting(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sourceType", sourceType);
      if (title.trim()) formData.append("title", title.trim());
      const tagList = parseTags(tags);
      if (tagList.length) formData.append("tagsJson", JSON.stringify(tagList));

      const { data } = await apiClient.post(
        "/admin/ai-knowledge/upload-pdf",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 120000,
        }
      );
      setResult(data);
      toast.success(`PDF ingested into ${data.chunkCount} chunk(s).`);
      setFile(null);
      setTitle("");
      setTags("");
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      toast.error(err.message || "Failed to upload PDF.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 max-w-3xl">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl px-6 py-10 cursor-pointer transition ${
          dragging
            ? "border-green-500 bg-green-50"
            : "border-gray-300 bg-gray-50 hover:bg-gray-100"
        }`}
      >
        <FontAwesomeIcon
          icon={file ? faFilePdf : faCloudArrowUp}
          className={`text-3xl ${file ? "text-red-500" : "text-gray-400"}`}
        />
        {file ? (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span className="font-medium">{file.name}</span>
            <span className="text-gray-400">
              ({(file.size / 1024 / 1024).toFixed(1)} MB)
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="text-gray-400 hover:text-red-500"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600 font-medium">
              Drag & drop a PDF here, or click to browse
            </p>
            <p className="text-xs text-gray-400">
              Real-text PDFs only, up to 30 MB. Scanned image PDFs are not
              supported.
            </p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0])}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Source type
          </label>
          <select
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {SOURCE_TYPES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-gray-400">(defaults to filename)</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={220}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tags <span className="text-gray-400">(comma separated)</span>
        </label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="poultry, nutrition, textbook"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {result && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
          <FontAwesomeIcon icon={faCircleCheck} />
          <span>
            Ingested as document <code>{result.documentId}</code> in{" "}
            {result.chunkCount} chunk(s).
          </span>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || !file}
        className="inline-flex items-center gap-2 bg-green-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-60"
      >
        {submitting && <FontAwesomeIcon icon={faSpinner} spin />}
        {submitting ? "Uploading & ingesting..." : "Upload & Ingest PDF"}
      </button>
    </form>
  );
}

/* ─── Test Search ─────────────────────────────────────────────── */
function SearchTab() {
  const [query, setQuery] = useState("");
  const [sourceType, setSourceType] = useState("");
  const [limit, setLimit] = useState(5);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (query.trim().length < 2) {
      toast.error("Enter at least 2 characters to search.");
      return;
    }
    setLoading(true);
    try {
      const params = { query: query.trim(), limit };
      if (sourceType) params.sourceType = sourceType;
      const { data } = await apiClient.get("/admin/ai-knowledge/search", {
        params,
      });
      setResults(data);
    } catch (err) {
      toast.error(err.message || "Search failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="space-y-4 max-w-3xl">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. how do I treat newcastle disease"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <select
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All sources</option>
            {SOURCE_TYPES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {[3, 5, 8, 12].map((n) => (
              <option key={n} value={n}>
                Top {n}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 bg-green-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-60"
          >
            <FontAwesomeIcon icon={loading ? faSpinner : faMagnifyingGlass} spin={loading} />
            Search
          </button>
        </div>
      </form>

      {results && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            {results.results.length} result(s) for{" "}
            <span className="font-medium text-gray-700">
              &ldquo;{results.query}&rdquo;
            </span>
          </p>
          {results.results.length === 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-4 py-6 justify-center">
              <FontAwesomeIcon icon={faCircleInfo} />
              No matching knowledge found. Try ingesting more content.
            </div>
          )}
          {results.results.map((r, i) => (
            <div
              key={r.chunkId}
              className="border border-gray-200 rounded-lg p-4 bg-white"
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                    {i + 1}
                  </span>
                  <span className="text-sm font-semibold text-gray-800">
                    {r.title}
                  </span>
                  <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                    {r.sourceType}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  score {r.score.toFixed(4)}
                </span>
              </div>
              <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-6">
                {r.content}
              </p>
              {r.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {r.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-600"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Token Usage ─────────────────────────────────────────────── */
function TokenUsageTab() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchUsage = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search.trim()) params.search = search.trim();
      if (status) params.status = status;
      const { data } = await apiClient.get(
        "/admin/ai-analytics/user-token-usage",
        { params }
      );
      setRows(data.data || []);
      setMeta(data.meta || null);
    } catch (err) {
      toast.error(err.message || "Failed to load token usage.");
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    const t = setTimeout(fetchUsage, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [fetchUsage, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Search by name, email or phone"
            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">All users</option>
          <option value="active">Trial active</option>
          <option value="exhausted">Trial exhausted</option>
        </select>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Tokens used</th>
              <th className="px-4 py-3 font-medium">Remaining</th>
              <th className="px-4 py-3 font-medium">Usage</th>
              <th className="px-4 py-3 font-medium">Chats</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Last active</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                  <FontAwesomeIcon icon={faSpinner} spin /> Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                  No usage records found.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.userId}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{r.name}</div>
                    <div className="text-xs text-gray-400">
                      {r.email || r.phone || "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {formatNumber(r.tokensUsed)} / {formatNumber(r.tokenLimit)}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {formatNumber(r.tokensRemaining)}
                  </td>
                  <td className="px-4 py-3 w-40">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            r.usagePercent >= 100
                              ? "bg-red-500"
                              : r.usagePercent >= 75
                              ? "bg-amber-400"
                              : "bg-green-500"
                          }`}
                          style={{ width: `${Math.min(100, r.usagePercent)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-10 text-right">
                        {r.usagePercent}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {formatNumber(r.conversations)}
                  </td>
                  <td className="px-4 py-3">
                    {r.trialExhausted ? (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-50 text-red-500 font-semibold border border-red-100">
                        Exhausted
                      </span>
                    ) : (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-50 text-green-600 font-semibold border border-green-100">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {formatDateTime(r.lastActive)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Page {meta.currentPage} of {meta.totalPages} · {meta.totalItems}{" "}
            user(s)
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
              Prev
            </button>
            <button
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex items-center gap-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              Next
              <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Page shell ──────────────────────────────────────────────── */
export default function AyoKnowledgeBase() {
  const [tab, setTab] = useState("document");

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-[25px] font-bold text-gray-900 leading-tight tracking-[0.5px]">
            Ayo Knowledge Base
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Feed Ayo with farming knowledge, test retrieval, and monitor
            per-user trial usage.
          </p>
        </div>
        <Link
          to="/ayo-ai"
          className="text-sm text-green-700 hover:text-green-800 font-medium"
        >
          ← Back to Ayo Analytics
        </Link>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${
              tab === t.key
                ? "border-green-600 text-green-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <FontAwesomeIcon icon={t.icon} className="text-xs" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl shadow-[0_0_10px_#EDEDED] bg-white p-5">
        {tab === "document" && <AddDocumentTab />}
        {tab === "pdf" && <UploadPdfTab />}
        {tab === "search" && <SearchTab />}
        {tab === "usage" && <TokenUsageTab />}
      </div>
    </div>
  );
}
