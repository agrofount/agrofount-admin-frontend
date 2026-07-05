import { apiClient } from "../../lib/apiClient";

export const sellerInterestStatusLabels = {
  new: "New",
  contacted: "Contacted",
  approved: "Approved",
  rejected: "Rejected",
};

export const formatSellerInterestDate = (value) => {
  if (!value) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value));
};

export const normalizeSellerInterest = (interest = {}) => ({
  ...interest,
  status: sellerInterestStatusLabels[interest.status] || interest.status || "New",
  date: formatSellerInterestDate(interest.createdAt),
});

export const buildSellerInterestParams = ({
  page = 1,
  limit = 25,
  search,
  sortBy,
  filters = {},
} = {}) => {
  const params = { page, limit };
  if (search) params.search = search;
  if (sortBy) params.sortBy = sortBy;

  Object.entries(filters).forEach(([key, value]) => {
    if (!value) return;
    params[`filter.${key}`] = `$eq:${value}`;
  });

  return params;
};

export const fetchSellerInterests = (params) =>
  apiClient
    .get("/product-location/seller-interests", { params })
    .then((response) => response.data || { data: [], meta: {} });

export const fetchSellerInterest = (id) =>
  apiClient
    .get(`/product-location/seller-interests/${id}`)
    .then((response) => response.data || {});

export const updateSellerInterestStatus = (id, status) =>
  apiClient.patch(`/product-location/seller-interests/${id}/status`, {
    status,
  });
