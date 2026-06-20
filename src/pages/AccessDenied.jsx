import { Link } from "react-router-dom";

const AccessDenied = () => (
  <div className="flex min-h-96 flex-col items-center justify-center gap-3 p-6 text-center">
    <h1 className="text-xl font-semibold text-gray-800">Access denied</h1>
    <p className="max-w-md text-sm text-gray-500">
      Your account does not have permission to view this page.
    </p>
    <Link
      to="/"
      className="rounded-md bg-[#61BF75] px-4 py-2 text-sm font-semibold text-white"
    >
      Back to dashboard
    </Link>
  </div>
);

export default AccessDenied;
