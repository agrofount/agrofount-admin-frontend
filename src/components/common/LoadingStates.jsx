import {
  faCheck,
  faExclamation,
  faFilePdf,
  faFileWord,
  faImage,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { assets } from "../../assets/assets";

export const SkeletonBlock = ({ className = "" }) => (
  <div className={`animate-pulse rounded-md bg-gradient-to-r from-[#eef0f2] via-[#e1e4e8] to-[#f4f5f7] bg-[length:200%_100%] ${className}`} />
);

export const LoadingSpinner = ({ className = "h-4 w-4" }) => (
  <span className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`} />
);

export const LoadingButtonContent = ({ label = "Saving..." }) => (
  <span className="inline-flex items-center justify-center gap-2">
    <LoadingSpinner />
    {label}
  </span>
);

export const FullPageAppLoader = ({ title = "Loading Agrofount Admin...", subtitle = "Preparing your workspace" }) => (
  <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f7fbf6] px-4">
    <div className="pointer-events-none absolute -bottom-16 -left-10 h-80 w-80 rounded-full bg-[#dff4e5]" />
    <div className="pointer-events-none absolute -bottom-12 right-12 h-48 w-48 rotate-45 rounded-[45%] bg-[#e5f5e9]" />
    <div className="relative text-center">
      <img src={assets.agrofount_logo} alt="Agrofount" className="mx-auto mb-8 w-44" />
      <LoadingSpinner className="mx-auto mb-5 h-11 w-11 border-[3px] text-[#008f45]" />
      <p className="text-lg font-semibold text-[#101828]">{title}</p>
      <p className="mt-3 text-sm text-[#667085]">{subtitle}</p>
    </div>
  </div>
);

const SkeletonSidebar = () => (
  <aside className="hidden w-[260px] shrink-0 bg-gradient-to-b from-[#006638] via-[#006235] to-[#004e2b] px-4 py-6 text-white md:block">
    <img src={assets.agrofount_logo} alt="Agrofount" className="mb-8 w-32" />
    <div className="space-y-5">
      {["MAIN", "INVENTORY & OPERATIONS", "CAREER"].map((section, sectionIndex) => (
        <div key={section}>
          <p className="mb-3 text-[10px] font-semibold text-white/80">{section}</p>
          <div className="space-y-2">
            {Array.from({ length: sectionIndex === 0 ? 6 : 4 }).map((_, index) => (
              <div key={index} className={`flex h-8 items-center gap-3 rounded-md px-3 ${sectionIndex === 0 && index === 0 ? "bg-white/15" : ""}`}>
                <SkeletonBlock className="h-4 w-4 bg-white/25" />
                <SkeletonBlock className="h-3 flex-1 bg-white/20" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
    <div className="mt-8 rounded-md border border-white/20 p-4">
      <SkeletonBlock className="mb-2 h-4 w-24 bg-white/25" />
      <SkeletonBlock className="h-3 w-32 bg-white/20" />
    </div>
  </aside>
);

export const TableRowsSkeleton = ({ rows = 7, columns = 8 }) => (
  <>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <tr key={rowIndex} className="border-b border-[#eef2f6] last:border-0">
        {Array.from({ length: columns }).map((__, columnIndex) => (
          <td key={columnIndex} className="px-4 py-4">
            <SkeletonBlock className={`${columnIndex === 0 ? "h-4 w-4 rounded" : columnIndex === 1 ? "h-4 w-36" : "h-4 w-24"}`} />
          </td>
        ))}
      </tr>
    ))}
  </>
);

export const PageSkeletonLoader = ({ variant = "table" }) => (
  <div className="space-y-5">
    <div className="flex items-center justify-between">
      <div>
        <SkeletonBlock className="mb-3 h-7 w-48" />
        <SkeletonBlock className="h-4 w-72" />
      </div>
      <SkeletonBlock className="h-10 w-36" />
    </div>

    {variant === "form" ? (
      <FormSkeletonLoader />
    ) : (
      <>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-lg border border-[#e5e7eb] bg-white p-4">
              <div className="flex items-center gap-4">
                <SkeletonBlock className="h-11 w-11 rounded-full" />
                <div className="flex-1 space-y-2">
                  <SkeletonBlock className="h-3 w-24" />
                  <SkeletonBlock className="h-5 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-[#e5e7eb] bg-white p-4">
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <SkeletonBlock className="h-10 w-72" />
            <SkeletonBlock className="h-10 w-40" />
            <SkeletonBlock className="ml-auto h-10 w-36" />
          </div>
          <table className="w-full text-left">
            <tbody>
              <TableRowsSkeleton />
            </tbody>
          </table>
        </div>
      </>
    )}
  </div>
);

export const AdminPageSkeleton = ({ label = "Loading page..." }) => (
  <div className="min-h-screen bg-[#f7f8fb]">
    <div className="flex">
      <SkeletonSidebar />
      <main className="min-w-0 flex-1">
        <div className="flex h-[72px] items-center justify-between border-b border-gray-200 bg-white px-6">
          <SkeletonBlock className="h-10 w-full max-w-xl rounded-full" />
          <div className="ml-4 hidden items-center gap-4 sm:flex">
            <SkeletonBlock className="h-9 w-9 rounded-full" />
            <SkeletonBlock className="h-9 w-9 rounded-full" />
            <SkeletonBlock className="h-10 w-40 rounded-full" />
          </div>
        </div>
        <div className="p-6">
          <div className="mb-3 flex items-center gap-2 text-xs font-medium text-[#008f45]">
            <LoadingSpinner className="h-3 w-3" />
            {label}
          </div>
          <PageSkeletonLoader />
        </div>
      </main>
    </div>
  </div>
);

export const FormSkeletonLoader = () => (
  <div className="rounded-lg border border-[#e5e7eb] bg-white p-5">
    <div className="grid gap-5 md:grid-cols-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index}>
          <SkeletonBlock className="mb-2 h-4 w-28" />
          <SkeletonBlock className="h-10 w-full" />
        </div>
      ))}
    </div>
    <SkeletonBlock className="mt-5 h-4 w-32" />
    <SkeletonBlock className="mt-3 h-32 w-full" />
    <div className="mt-5 flex justify-end gap-3">
      <SkeletonBlock className="h-10 w-36" />
      <SkeletonBlock className="h-10 w-44 bg-[#ccebd8]" />
    </div>
  </div>
);

const uploadIcons = {
  pdf: faFilePdf,
  doc: faFileWord,
  docx: faFileWord,
  image: faImage,
};

export const UploadLoadingList = ({ uploads = [] }) => (
  <div className="space-y-3">
    {uploads.map((upload) => {
      const statusColor =
        upload.status === "failed" ? "text-[#ef3340]" : upload.status === "complete" ? "text-[#008f45]" : "text-[#344054]";
      return (
        <div key={upload.name} className="flex items-center gap-4 rounded-lg border border-[#e5e7eb] bg-white p-3">
          <div className="grid h-10 w-10 place-items-center rounded bg-[#f2f4f7] text-[#ef3340]">
            <FontAwesomeIcon icon={uploadIcons[upload.type] || uploadIcons.image} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[#101828]">{upload.name}</p>
            <p className={`mt-1 text-xs ${statusColor}`}>{upload.meta}</p>
          </div>
          {upload.status === "uploading" && (
            <>
              <div className="h-1.5 w-40 rounded-full bg-[#eef2f6]">
                <div className="h-1.5 rounded-full bg-[#008f45]" style={{ width: `${upload.progress || 0}%` }} />
              </div>
              <span className="w-9 text-xs text-[#667085]">{upload.progress || 0}%</span>
              <FontAwesomeIcon icon={faXmark} className="text-[#667085]" />
            </>
          )}
          {upload.status === "complete" && (
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[#008f45] text-white">
              <FontAwesomeIcon icon={faCheck} />
            </span>
          )}
          {upload.status === "failed" && (
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[#ef3340] text-white">
              <FontAwesomeIcon icon={faExclamation} />
            </span>
          )}
        </div>
      );
    })}
  </div>
);
