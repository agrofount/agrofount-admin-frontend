const TOKEN_KEY = "token";
const REFRESH_TOKEN_KEY = "refreshToken";

let memoryToken = localStorage.getItem(TOKEN_KEY) || "";
let memoryRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY) || "";

export const getAuthToken = () => memoryToken;
export const getRefreshToken = () => memoryRefreshToken;

export const setAuthTokens = ({ token, refreshToken } = {}) => {
  memoryToken = token || "";
  memoryRefreshToken = refreshToken || "";

  if (memoryToken) {
    localStorage.setItem(TOKEN_KEY, memoryToken);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }

  if (memoryRefreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, memoryRefreshToken);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
};

export const setAuthToken = (token, refreshToken = getRefreshToken()) => {
  setAuthTokens({ token, refreshToken });
};

export const clearAuthStorage = () => {
  memoryToken = "";
  memoryRefreshToken = "";
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem("user");
};
