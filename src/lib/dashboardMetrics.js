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

const customerName = (order) =>
  order?.user?.username ||
  [order?.user?.firstname, order?.user?.lastname].filter(Boolean).join(" ") ||
  order?.fullName ||
  order?.user?.email ||
  order?.email ||
  order?.phoneNumber ||
  "Guest customer";

const catalogMap = (catalog) => {
  const map = new Map();
  catalog.forEach((location) => {
    const product = location?.product ?? location;
    [location?.id, location?.productSlug, product?.id, product?.slug, product?.name]
      .filter(Boolean)
      .forEach((key) => map.set(String(key).toLowerCase(), location));
  });
  return map;
};

const itemDetails = (item = {}, catalog = new Map()) => {
  const matchKeys = [item.productId, item.id, item.productSlug, item.productName, item.name];
  const location = matchKeys
    .filter(Boolean)
    .map((key) => catalog.get(String(key).toLowerCase()))
    .find(Boolean);
  const product = location?.product ?? location ?? item.product ?? {};
  return {
    key: String(item.productId ?? product.id ?? item.id ?? item.productName ?? item.name ?? "product"),
    name: String(item.productName ?? product.name ?? item.name ?? "Product"),
    category: String(item.category?.name ?? item.category ?? product.category?.name ?? product.category ?? "Uncategorized"),
    image: item.images?.[0] ?? product.images?.[0] ?? item.image ?? null,
    quantity: Number(item.quantity ?? 0),
    price: Number(item.price ?? item.unitPrice ?? 0),
  };
};

const percentageChange = (current, previous) => {
  if (!previous) return current ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
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

export const buildDashboardInsights = (orders = [], catalog = []) => {
  const paidOrders = orders.filter(isPaidDashboardOrder);
  const productsByKey = catalogMap(catalog);
  const categoryMap = new Map();
  const productMap = new Map();
  const customerMap = new Map();
  const stateMap = new Map();
  const dailyMap = new Map();

  paidOrders.forEach((order) => {
    const amount = Number(order.totalPrice ?? order.total ?? 0);
    const identity = customerKey(order);
    if (identity) {
      const current = customerMap.get(identity) ?? {
        id: identity,
        name: customerName(order),
        purchases: 0,
        totalSpent: 0,
      };
      current.purchases += 1;
      current.totalSpent += amount;
      customerMap.set(identity, current);
    }

    const state = String(order?.address?.state ?? order?.deliveryAddress?.state ?? "Unknown").trim() || "Unknown";
    stateMap.set(state, (stateMap.get(state) ?? 0) + amount);

    const createdAt = new Date(order.createdAt);
    if (!Number.isNaN(createdAt.getTime())) {
      const day = createdAt.toISOString().slice(0, 10);
      const bucket = dailyMap.get(day) ?? { sales: 0, orders: 0, customers: new Set() };
      bucket.sales += amount;
      bucket.orders += 1;
      if (identity) bucket.customers.add(identity);
      dailyMap.set(day, bucket);
    }

    const items = Array.isArray(order.items) ? order.items : [];
    items.forEach((rawItem) => {
      const item = itemDetails(rawItem, productsByKey);
      const revenue = item.price * item.quantity;
      const category = categoryMap.get(item.category) ?? { name: item.category, revenue: 0, image: item.image };
      category.revenue += revenue;
      if (!category.image && item.image) category.image = item.image;
      categoryMap.set(item.category, category);

      const product = productMap.get(item.key) ?? { name: item.name, units: 0, revenue: 0, image: item.image };
      product.units += item.quantity;
      product.revenue += revenue;
      if (!product.image && item.image) product.image = item.image;
      productMap.set(item.key, product);
    });
  });

  const totalItemRevenue = [...categoryMap.values()].reduce((sum, item) => sum + item.revenue, 0);
  const categories = [...categoryMap.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 3)
    .map((item) => ({ ...item, percentage: totalItemRevenue ? Number(((item.revenue / totalItemRevenue) * 100).toFixed(1)) : 0 }));
  const products = [...productMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  const customers = [...customerMap.values()].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);
  const totalStateSales = [...stateMap.values()].reduce((sum, amount) => sum + amount, 0);
  const states = [...stateMap.entries()]
    .map(([name, amount]) => ({ name, amount, percentage: totalStateSales ? Number(((amount / totalStateSales) * 100).toFixed(1)) : 0 }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const daily = [...dailyMap.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-14);
  const cumulativeCustomers = new Set();
  const sparkline = {
    sales: daily.map(([, value]) => value.sales),
    orders: daily.map(([, value]) => value.orders),
    customers: daily.map(([, value]) => {
      value.customers.forEach((id) => cumulativeCustomers.add(id));
      return cumulativeCustomers.size;
    }),
    income: daily.map(([, value]) => value.sales),
  };
  Object.keys(sparkline).forEach((key) => {
    if (!sparkline[key].length) sparkline[key] = [0];
  });

  const datedOrders = paidOrders
    .map((order) => new Date(order.createdAt))
    .filter((date) => !Number.isNaN(date.getTime()));
  const anchor = datedOrders.length
    ? new Date(Math.max(...datedOrders.map((date) => date.getTime())))
    : new Date();
  anchor.setHours(23, 59, 59, 999);
  const currentStart = new Date(anchor);
  currentStart.setDate(anchor.getDate() - 6);
  currentStart.setHours(0, 0, 0, 0);
  const previousStart = new Date(currentStart);
  previousStart.setDate(previousStart.getDate() - 7);
  const periods = { current: [], previous: [] };
  paidOrders.forEach((order) => {
    const createdAt = new Date(order.createdAt);
    if (Number.isNaN(createdAt.getTime()) || createdAt < previousStart) return;
    periods[createdAt >= currentStart ? "current" : "previous"].push(order);
  });
  const periodValue = (list, type) => {
    if (type === "customers") return new Set(list.map(customerKey).filter(Boolean)).size;
    if (type === "orders") return list.length;
    return list.reduce((sum, order) => sum + Number(order.totalPrice ?? order.total ?? 0), 0);
  };
  const changes = Object.fromEntries(
    ["sales", "orders", "customers", "income"].map((type) => [
      type,
      percentageChange(periodValue(periods.current, type), periodValue(periods.previous, type)),
    ]),
  );

  return { paidOrders, categories, products, customers, states, sparkline, changes, totalStateSales };
};
