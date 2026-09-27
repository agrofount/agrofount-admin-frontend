const normalize = (value) => String(value ?? "").trim().toLowerCase();

export const isPaidDashboardOrder = (order) => {
  const paymentStatus = normalize(order?.paymentStatus);
  const orderStatus = normalize(order?.status);

  return paymentStatus === "completed" && !["pending", "cancelled"].includes(orderStatus);
};

const customerKey = (order) => {
  const candidates = [
    order?.userId,
    order?.user?.id,
    order?.user?.email,
    order?.email,
    order?.phoneNumber,
  ];

  const value = candidates.find((candidate) => String(candidate ?? "").trim());
  return value ? normalize(value) : null;
};

export const calculateDashboardMetrics = (orders = []) => {
  const paidOrders = orders.filter(isPaidDashboardOrder);
  const totalSales = paidOrders.reduce(
    (sum, order) => sum + Number(order.totalPrice ?? order.total ?? 0),
    0,
  );
  const customers = new Set(paidOrders.map(customerKey).filter(Boolean));

  return {
    totalSales,
    totalOrders: paidOrders.length,
    totalCustomers: customers.size,
    income: totalSales,
  };
};
