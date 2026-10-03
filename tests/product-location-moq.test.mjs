import test from "node:test";
import assert from "node:assert/strict";

import {
  getProductLocationMoq,
  attachMoqToUom,
} from "../src/lib/productLocation.js";

test("reads MOQ from either top-level or nested UOM values", () => {
  assert.equal(getProductLocationMoq({ moq: 12 }), 12);
  assert.equal(getProductLocationMoq({ uom: [{ moq: 7 }] }), 7);
  assert.equal(getProductLocationMoq({ uom: [{ moq: "9" }] }), 9);
});

test("copies the active MOQ into each UOM entry for persistence", () => {
  const withMoq = attachMoqToUom(
    [
      { unit: "Bag", vendorPrice: 10, platformPrice: 12 },
      { unit: "Crate", vendorPrice: 20, platformPrice: 25 },
    ],
    3,
  );

  assert.deepEqual(
    withMoq.map((section) => section.moq),
    [3, 3],
  );
});
