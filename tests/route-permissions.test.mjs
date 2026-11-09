import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// Routes that every signed-in admin may open.
const OPEN_ROUTES = new Set(["/", "/help-center"]);

test("every admin route has a permission rule or is explicitly open", () => {
  const app = readFileSync("src/App.jsx", "utf8");
  const rules = readFileSync(
    "src/components/routes/routePermissions.js",
    "utf8",
  );

  const routes = [...app.matchAll(/path:\s*"([^"]+)"/g)].map((m) => m[1]);
  const mapped = new Set(
    [...rules.matchAll(/^\s*"(\/[^"]*)":/gm)].map((m) => m[1]),
  );

  const unguarded = routes.filter((r) => !mapped.has(r) && !OPEN_ROUTES.has(r));
  assert.deepEqual(unguarded, [], `Routes without a permission rule: ${unguarded}`);
});
