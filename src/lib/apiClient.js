import axios from "axios";
import { jwtDecode } from "jwt-decode";
import {
  clearAuthStorage,
  getAuthToken,
  getRefreshToken,
  setAuthTokens,
} from "./authStorage";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL || "";

const REQUEST_TIMEOUT_MS = Number(
  import.meta.env.VITE_API_TIMEOUT_MS || 15000
);

const SAFE_RETRY_METHODS = new Set(["get"]);
const TOKEN_REFRESH_SKEW_SECONDS = Number(
  import.meta.env.VITE_TOKEN_REFRESH_SKEW_SECONDS || 2
);
const AUTH_ENDPOINTS = new Set([
  "/auth/admin/login",
  "/auth/admin/mfa/verify",
  "/auth/refresh",
]);

let refreshPromise = null;

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export const parseApiError = (error) => {
  if (axios.isCancel(error)) {
    return new ApiError("Request cancelled", 0, null);
  }

  const status = error.response?.status || 0;
  const data = error.response?.data;
  const message =
    data?.message ||
    data?.error ||
    error.message ||
    "An unexpected network error occurred.";

  return new ApiError(message, status, data);
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
});

const getRequestPath = (url = "") => {
  try {
    return new URL(url, API_BASE_URL || window.location.origin).pathname;
  } catch {
    return url;
  }
};

const isAuthEndpoint = (url) => AUTH_ENDPOINTS.has(getRequestPath(url));

const shouldRefreshToken = (token) => {
  if (!token || !getRefreshToken()) return false;

  try {
    const decoded = jwtDecode(token);
    if (!decoded?.exp) return false;
    return decoded.exp <= Date.now() / 1000 + TOKEN_REFRESH_SKEW_SECONDS;
  } catch {
    return false;
  }
};

const refreshSession = async () => {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    throw new ApiError("Session expired. Please log in again.", 401, null);
  }

  if (!refreshPromise) {
    refreshPromise = axios
      .post(
        `${API_BASE_URL}/auth/refresh`,
        { refreshToken },
        { timeout: REQUEST_TIMEOUT_MS }
      )
      .then((response) => {
        const nextToken = response.data?.token;
        const nextRefreshToken = response.data?.refreshToken;

        if (!nextToken || !nextRefreshToken) {
          throw new ApiError("Session refresh failed.", 401, response.data);
        }

        setAuthTokens({ token: nextToken, refreshToken: nextRefreshToken });
        window.dispatchEvent(
          new CustomEvent("agrofount:token-refreshed", {
            detail: { token: nextToken },
          })
        );
        return nextToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

apiClient.interceptors.request.use(async (config) => {
  let token = getAuthToken();

  if (!isAuthEndpoint(config.url) && shouldRefreshToken(token)) {
    try {
      token = await refreshSession();
    } catch {
      clearAuthStorage();
      window.dispatchEvent(new CustomEvent("agrofount:unauthorized"));
      throw new ApiError("Session expired. Please log in again.", 401, null);
    }
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config || {};
    const status = error.response?.status;
    const method = (config.method || "get").toLowerCase();

    if (
      !config.__retried &&
      !status &&
      SAFE_RETRY_METHODS.has(method) &&
      !config.signal?.aborted
    ) {
      config.__retried = true;
      return apiClient(config);
    }

    if (
      status === 401 &&
      !config.__authRetried &&
      !isAuthEndpoint(config.url)
    ) {
      try {
        const nextToken = await refreshSession();
        config.__authRetried = true;
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${nextToken}`;
        return apiClient(config);
      } catch {
        clearAuthStorage();
        window.dispatchEvent(new CustomEvent("agrofount:unauthorized"));
      }
    } else if (status === 401 && getRequestPath(config.url) === "/auth/refresh") {
      clearAuthStorage();
      window.dispatchEvent(new CustomEvent("agrofount:unauthorized"));
    }

    throw parseApiError(error);
  }
);

export const setupApiAuthHandlers = ({ onUnauthorized }) => {
  const handler = () => onUnauthorized?.();
  window.addEventListener("agrofount:unauthorized", handler);

  return () => window.removeEventListener("agrofount:unauthorized", handler);
};

export const createAbortController = () => new AbortController();
