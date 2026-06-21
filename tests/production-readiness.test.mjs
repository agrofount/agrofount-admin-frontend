import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";
import { hasPermissionFor, isSuperUser } from "../src/lib/permissions.js";
import { validateImageFiles } from "../src/lib/uploadValidation.js";

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const sourceFiles = async (dir = new URL("../src/", import.meta.url)) => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const url = new URL(entry.name, `${dir.href}/`);
      if (entry.isDirectory()) return sourceFiles(url);
      return /\.(jsx?|mjs)$/.test(entry.name) ? [url] : [];
    })
  );
  return files.flat();
};

test("admin routes are protected by auth and permission guards", async () => {
  const app = await readSource("src/App.jsx");

  assert.match(app, /<Route element=\{<RequireAuth \/>\}>/);
  assert.match(app, /<RequirePermission/);
  assert.match(app, /routePermissions/);
  assert.match(app, /\/access-denied/);
});

test("user deletion uses the user endpoint and requires confirmation", async () => {
  const userRow = await readSource("src/components/Users/UserItemTable.jsx");

  assert.match(userRow, /apiClient\.delete\(`\/user\/\$\{user\.id\}`\)/);
  assert.match(userRow, /Delete User/);
  assert.match(userRow, /canDeleteUser/);
});

test("upload validation rejects unsupported file types and oversized images", () => {
  const badType = new File(["x"], "payload.svg", { type: "image/svg+xml" });
  const tooLarge = new File(["x".repeat(6 * 1024 * 1024)], "big.png", {
    type: "image/png",
  });

  assert.match(validateImageFiles([badType]), /not a supported image/);
  assert.match(validateImageFiles([tooLarge]), /too large/);
});

test("order cancellation is permission-gated and confirmed in a modal", async () => {
  const orderDetail = await readSource("src/components/Orders/OrderDetail.jsx");

  assert.match(orderDetail, /canCancelOrder/);
  assert.match(orderDetail, /setShowCancelModal\(true\)/);
  assert.match(
    orderDetail,
    /apiClient\.patch\(`\/order\/admin\/\$\{orderId\}\/cancel`\)/
  );
});

test("central API client handles auth injection and 401 logout events", async () => {
  const apiClient = await readSource("src/lib/apiClient.js");

  assert.match(apiClient, /config\.headers\.Authorization = `Bearer \$\{token\}`/);
  assert.match(apiClient, /status === 401/);
  assert.match(apiClient, /\/auth\/refresh/);
  assert.match(apiClient, /agrofount:token-refreshed/);
  assert.match(apiClient, /clearAuthStorage\(\)/);
  assert.match(apiClient, /agrofount:unauthorized/);
});

test("auth storage persists rotating refresh tokens", async () => {
  const authStorage = await readSource("src/lib/authStorage.js");

  assert.match(authStorage, /REFRESH_TOKEN_KEY = "refreshToken"/);
  assert.match(authStorage, /getRefreshToken/);
  assert.match(authStorage, /setAuthTokens/);
});

test("MFA setup verify sends only challengeId and code", async () => {
  const login = await readSource("src/pages/Login.jsx");

  assert.match(login, /apiClient\.post\(mfaVerifyPath,\s*\{\s*challengeId:/s);
  assert.match(login, /code: mfaCode/);
  assert.doesNotMatch(login, /trustDevice/);
  assert.match(login, /mfaCode/);
  assert.match(login, /setToken\(responseData\.token, responseData\.refreshToken\)/);
});

test("admin JWT principal claims grant frontend admin access", () => {
  const adminPrincipal = {
    email: "dayo.akinbami@agrofount.com",
    id: "2d34083e-2bbe-49fc-b973-5248bddfe3a2",
    userType: "system",
    principalType: "admin",
  };

  assert.equal(isSuperUser(adminPrincipal), true);
  assert.equal(hasPermissionFor(adminPrincipal, "orders", "read"), true);
});

test("backend admin profile roles grant frontend admin access", () => {
  assert.equal(isSuperUser({ roles: [{ name: "Super_Admin" }] }), true);
  assert.equal(isSuperUser({ role: [{ name: "super admin" }] }), true);
});

test("dashboard widgets use admin endpoints through the shared API client", async () => {
  const dashboard = await readSource("src/components/Dashboard.jsx");
  const targetChart = await readSource("src/components/DashboardTargetChart.jsx");
  const reviews = await readSource("src/components/DashboardReviewList.jsx");

  assert.match(dashboard, /apiClient\.get\("\/order\/admin\/all"/);
  assert.match(dashboard, /apiClient\.get\("\/user"/);
  assert.doesNotMatch(dashboard, /from "axios"/);
  assert.match(targetChart, /apiClient\.get\("\/order\/monthly-target"\)/);
  assert.match(reviews, /apiClient\.get\("\/review"/);
});

test("frontend API calls are centralized through apiClient", async () => {
  const files = await sourceFiles();
  const offenders = [];

  for (const file of files) {
    if (file.pathname.includes("/lib/apiClient.js")) continue;
    const source = await readFile(file, "utf8");
    if (/import axios|axios\./.test(source)) {
      offenders.push(file.pathname);
    }
  }

  assert.deepEqual(offenders, []);
});
