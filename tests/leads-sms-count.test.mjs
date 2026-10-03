import test from "node:test";
import assert from "node:assert/strict";

import { getLeadSmsCount, getLeadSmsRecords } from "../src/components/Leads/leadSmsUtils.js";

test("extracts the number of SMS messages recorded for a lead from the API payload", () => {
  assert.equal(getLeadSmsCount({ smsCount: 3 }), 3);
  assert.equal(getLeadSmsCount({ sms_count: 5 }), 5);
  assert.equal(getLeadSmsCount({ totalSmsSent: "7" }), 7);
});

test("defaults to zero when the lead has no SMS history yet", () => {
  assert.equal(getLeadSmsCount({}), 0);
  assert.equal(getLeadSmsCount(null), 0);
  assert.equal(getLeadSmsCount({ smsCount: undefined }), 0);
});

test("extracts sms history records from the detailed lead payload", () => {
  const records = getLeadSmsRecords({
    smsHistory: [
      { id: "1", channel: "sms", message: "Welcome to Agrofount", status: "sent", sentAt: "2026-10-01T09:00:00Z" },
      { id: "2", channel: "email", message: "Email follow-up", status: "delivered", sentAt: "2026-10-01T10:00:00Z" },
    ],
  });

  assert.equal(records.length, 2);
  assert.equal(records[0].channel, "sms");
  assert.equal(records[0].message, "Welcome to Agrofount");
  assert.equal(records[1].status, "delivered");
});
