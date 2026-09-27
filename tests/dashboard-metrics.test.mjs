import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDashboardInsights,
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

test("dashboard insights are derived from paid orders and catalog data", () => {
  const orders = [
    {
      id: "paid-1",
      userId: "customer-a",
      user: { username: "Amina" },
      totalPrice: 2500,
      paymentStatus: "completed",
      status: "delivered",
      createdAt: "2026-09-27T10:00:00.000Z",
      address: { state: "Lagos" },
      items: [{ productId: "product-1", name: "Broiler feed", quantity: 2, price: 1000 }],
    },
    {
      id: "unpaid-1",
      userId: "customer-b",
      totalPrice: 9000,
      paymentStatus: "pending",
      status: "confirmed",
      createdAt: "2026-09-27T10:00:00.000Z",
      address: { state: "Oyo" },
      items: [{ productId: "product-2", name: "Medication", quantity: 9, price: 1000 }],
    },
  ];
  const catalog = [{ product: { id: "product-1", name: "Broiler feed", category: { name: "Poultry Feed" }, images: ["feed.png"] } }];

  const insights = buildDashboardInsights(orders, catalog);

  assert.deepEqual(insights.categories, [{ name: "Poultry Feed", revenue: 2000, image: "feed.png", percentage: 100 }]);
  assert.deepEqual(insights.products, [{ name: "Broiler feed", units: 2, revenue: 2000, image: "feed.png" }]);
  assert.deepEqual(insights.customers, [{ id: "customer-a", name: "Amina", purchases: 1, totalSpent: 2500 }]);
  assert.deepEqual(insights.states, [{ name: "Lagos", amount: 2500, percentage: 100 }]);
});
