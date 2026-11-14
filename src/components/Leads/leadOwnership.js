import { apiClient } from "../../lib/apiClient";

export const OWNER_LOCK_MESSAGE =
  "This lead is owned by another admin. Ask them to release it first.";

export const CUSTOMER_STAGE_META = {
  lead: { label: "Lead", bg: "#f3f4f6", text: "#475467" },
  registered: { label: "Registered", bg: "#dbeafe", text: "#1d4ed8" },
  paying: { label: "Paying", bg: "#dcf8e4", text: "#008f45" },
};

export const getErrorStatus = (err) => err?.status ?? err?.response?.status ?? 0;
export const getErrorMessage = (err, fallback) =>
  err?.response?.data?.message || err?.message || fallback;

// The profile response carries `id`; the decoded-JWT fallback used before the
// profile loads carries `sub`.
export const getUserId = (user) => user?.id ?? user?.sub ?? null;

export const isOwnedByUser = (lead, user) => {
  const userId = getUserId(user);
  return Boolean(lead?.ownerId) && userId !== null && lead.ownerId === userId;
};

// True when the lead is owned by someone else and the viewer is not a super admin.
// While the viewer's id is unknown, nothing is treated as locked: the backend
// still enforces the lock and its 403 message is shown.
export const isLockedForUser = (lead, user, isAdmin) =>
  Boolean(lead?.ownerId) &&
  !isAdmin &&
  getUserId(user) !== null &&
  lead.ownerId !== getUserId(user);

export const claimLead = (id) => apiClient.post(`/leads/${id}/claim`);
export const releaseLead = (id) => apiClient.delete(`/leads/${id}/claim`);
export const bulkClaimLeads = (leadIds) =>
  apiClient.post("/leads/claim", { leadIds });

export const fetchLeadNotes = (id) => apiClient.get(`/leads/${id}/notes`);
export const addLeadNote = (id, body) =>
  apiClient.post(`/leads/${id}/notes`, { body });
export const deleteLeadNote = (id, noteId) =>
  apiClient.delete(`/leads/${id}/notes/${noteId}`);

export const fetchMyPerformance = (params) =>
  apiClient.get("/leads/performance/me", { params });
export const fetchLeaderboard = (params) =>
  apiClient.get("/leads/performance", { params });

export const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};
