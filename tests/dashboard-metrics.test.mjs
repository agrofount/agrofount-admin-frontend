import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateDashboardMetrics,
  isPaidDashboardOrder,
} from "../src/lib/dashboardMetrics.js";

test("dashboard metrics include only paid orders that are not pending or cancelled", () => {
  const metrics = calculateDashboardMetrics([
    { id: "1", userId: "customer-a", totalPrice: "1200", paymentStatus: "completed", status: "confirmed" },
    { id: "2", userId: "customer-a", totalPrice: 800, paymentStatus: "completed", status: "delivered" },
    { id: "3", userId: "customer-b", totalPrice: 500, paymentStatus: "completed", status: "shipped" },
    { id: "4", userId: "customer-c", totalPrice: 900, paymentStatus: "pending", status: "confirmed" },
    { id: "5", userId: "customer-d", totalPrice: 700, paymentStatus: "completed", status: "pending" },
    { id: "6", userId: "customer-e", totalPrice: 600, paymentStatus: "completed", status: "cancelled" },
  ]);

  assert.deepEqual(metrics, {
    totalSales: 2500,
    totalOrders: 3,
    totalCustomers: 2,
    income: 2500,
  });
});

test("customer count uses distinct customer identities and metrics preserve real zeroes", () => {
  const repeatedGuest = {
    paymentStatus: "COMPLETED",
    status: "Delivered",
    phoneNumber: "09019170273",
    totalPrice: 0,
  };

  assert.equal(isPaidDashboardOrder(repeatedGuest), true);
  assert.deepEqual(calculateDashboardMetrics([repeatedGuest, { ...repeatedGuest }]), {
    totalSales: 0,
    totalOrders: 2,
    totalCustomers: 1,
    income: 0,
  });
  assert.deepEqual(calculateDashboardMetrics([]), {
    totalSales: 0,
    totalOrders: 0,
    totalCustomers: 0,
    income: 0,
  });
});
