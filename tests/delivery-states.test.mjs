import test from "node:test";
import assert from "node:assert/strict";
import { loadDeliveryStates } from "../src/components/LogisticsPricing/loadDeliveryStates.js";

test("delivery destinations paginate countries and fetch states with the required country filter", async () => {
  const calls = [];
  const client = { get: async (endpoint, { params }) => {
    calls.push({ endpoint, params });
    if (endpoint === "/country") return { data: { data: [{ id: `country-${params.page}`, name: `Country ${params.page}` }], meta: { totalPages: 2 } } };
    assert.ok(params["filter.country.id"], "state requests must specify country");
    const firstCountry = params["filter.country.id"] === "country-1";
    return { data: { data: [{ id: `${params["filter.country.id"]}-${params.page}`, name: firstCountry ? (params.page === 1 ? "Zamfara" : "Abia") : "Lagos" }], meta: { totalPages: firstCountry ? 2 : 1 } } };
  } };
  const states = await loadDeliveryStates(client);
  assert.deepEqual(states.map((state) => state.name), ["Abia", "Lagos", "Zamfara"]);
  assert.equal(states[0].country.id, "country-1");
  assert.equal(calls.filter((call) => call.endpoint === "/state").length, 3);
});

test("delivery destinations surface request failures instead of returning an incomplete list", async () => {
  const client = { get: async (endpoint) => {
    if (endpoint === "/country") return { data: { data: [{ id: "country-1" }] } };
    throw new Error("State lookup unavailable");
  } };
  await assert.rejects(loadDeliveryStates(client), /State lookup unavailable/);
});

test("Nigeria destinations cover 36 states and FCT and reuse existing backend IDs", async () => {
  const { nigeriaDestinations } = await import("../src/components/LogisticsPricing/nigeriaStates.js");
  const destinations = nigeriaDestinations([
    { id: "lagos-id", name: "Lagos State", country: { code: "NG" } },
    { id: "fct-id", name: "Federal Capital Territory", country: { name: "Nigeria" } },
    { id: "foreign-id", name: "Abia", country: { name: "Other" } },
  ]);
  assert.equal(destinations.length, 37);
  assert.equal(new Set(destinations.map((state) => state.id)).size, 37);
  assert.equal(destinations.find((state) => state.name === "Lagos").id, "lagos-id");
  assert.equal(destinations.find((state) => state.name === "FCT (Abuja)").id, "fct-id");
  assert.equal(destinations.find((state) => state.name === "Abia").needsSetup, true);
});
