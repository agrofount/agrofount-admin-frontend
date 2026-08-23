import { Link } from "react-router-dom";

const ComingSoonPage = ({ title, description }) => (
  <div className="rounded-lg border border-[#e5e7eb] bg-white p-6 shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
    <p className="text-xs font-semibold uppercase tracking-wide text-[#008f45]">Coming soon</p>
    <h1 className="mt-2 text-xl font-semibold text-[#101828]">{title}</h1>
    <p className="mt-2 max-w-2xl text-sm font-medium text-[#667085]">
      {description || "This section is not available yet."}
    </p>
    <Link
      to="/"
      className="mt-6 inline-flex h-10 items-center justify-center rounded-md border border-[#d0d5dd] px-5 text-xs font-semibold text-[#344054]"
    >
      Back to dashboard
    </Link>
  </div>
);

export default ComingSoonPage;
