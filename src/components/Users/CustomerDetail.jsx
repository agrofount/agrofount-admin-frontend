import {
  faArrowLeft,
  faBagShopping,
  faCalendarDays,
  faCheck,
  faCoins,
  faCopy,
  faEnvelope,
  faLocationDot,
  faMars,
  faPhone,
  faShieldHalved,
  faUserGroup,
  faVenus,
  faWallet,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ACTIONS, RESOURCES } from "../../constants/permissions";
import { apiClient } from "../../lib/apiClient";
import { usePermission } from "../Hooks/usePermission";
import { PageSkeletonLoader } from "../common/LoadingStates";
import {
  formatJoinedDate,
  formatNaira,
  formatPhoneForWhatsApp,
  getDisplayName,
  getDisplayPhone,
  getInitials,
  getLocation,
  orderStatusStyles,
} from "./customerUtils";
import UnverifiedPhoneTag from "./UnverifiedPhoneTag";

const dateOnly = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-NG", { dateStyle: "medium" })
    : "—";

const Card = ({ title, action, children, className = "" }) => (
  <section
    className={`rounded-xl border border-[#e5e7eb] bg-white shadow-[0_4px_16px_rgba(16,24,40,0.04)] ${className}`}
  >
    {(title || action) && (
      <div className="flex items-center justify-between gap-3 border-b border-[#f2f4f7] px-5 py-3.5">
        <h2 className="text-sm font-semibold text-[#101828]">{title}</h2>
        {action}
      </div>
    )}
    <div className="p-5">{children}</div>
  </section>
);

const StatCard = ({ label, value, sub, icon, bg, color }) => (
  <div className="flex items-center gap-3 rounded-xl border border-[#e5e7eb] bg-white px-4 py-4 shadow-[0_4px_16px_rgba(16,24,40,0.04)]">
    <div
      className="grid h-11 w-11 shrink-0 place-items-center rounded-full"
      style={{ background: bg }}
    >
      <FontAwesomeIcon icon={icon} style={{ color }} />
    </div>
    <div className="min-w-0">
      <p className="text-[11px] font-semibold text-[#667085]">{label}</p>
      <p className="truncate text-xl font-bold text-[#101828]">{value}</p>
      {sub && <p className="truncate text-[11px] text-[#98a2b3]">{sub}</p>}
    </div>
  </div>
);

const Field = ({ label, children }) => (
  <div>
    <p className="text-[11px] text-[#667085]">{label}</p>
    <div className="mt-0.5 text-sm font-medium text-[#101828] break-words">
      {children || "—"}
    </div>
  </div>
);

const REWARD_STYLES = {
  active: "bg-[#dcf8e4] text-[#008f45]",
  redeemed: "bg-[#e7f0ff] text-[#1f7ae0]",
  expired: "bg-[#eef2f6] text-[#667085]",
  disabled: "bg-[#ffe4e6] text-[#ef3340]",
};

const EmptyNote = ({ children }) => (
  <p className="rounded-lg border border-dashed border-[#e5e7eb] px-4 py-6 text-center text-sm text-[#667085]">
    {children}
  </p>
);

const CopyButton = ({ value }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1.5 rounded-md border border-[#e5e7eb] px-2.5 py-1 text-xs font-semibold text-[#344054] hover:bg-[#f9fafb]"
    >
      <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
      {copied ? "Copied" : "Copy"}
    </button>
  );
};

const CustomerDetail = () => {
  const { userId } = useParams();
  const { hasPermission, isAdmin } = usePermission();
  const canReadOrders = isAdmin || hasPermission(RESOURCES.ORDERS, ACTIONS.READ);

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [referrals, setReferrals] = useState(null);
  const [referralsError, setReferralsError] = useState("");

  const [orders, setOrders] = useState([]);
  const [orderTotal, setOrderTotal] = useState(0);
  const [ordersError, setOrdersError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.get(`/user/${userId}`);
      setCustomer(response.data);
    } catch (requestError) {
      setError(requestError.message || "Could not load this customer.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    setReferrals(null);
    setReferralsError("");
    apiClient
      .get(`/user/${userId}/referrals`)
      .then((response) => {
        if (!cancelled) setReferrals(response.data);
      })
      .catch((requestError) => {
        if (!cancelled) {
          setReferralsError(
            requestError.status === 404
              ? "Referral data is not available yet."
              : requestError.message || "Could not load referral data.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!canReadOrders) return undefined;
    let cancelled = false;
    setOrdersError("");
    apiClient
      .get("/order/admin/all", {
        params: {
          "filter.userId": `$eq:${userId}`,
          page: 1,
          limit: 10,
          sortBy: "createdAt:DESC",
        },
      })
      .then((response) => {
        if (cancelled) return;
        setOrders(Array.isArray(response.data?.data) ? response.data.data : []);
        setOrderTotal(Number(response.data?.meta?.totalItems ?? 0));
      })
      .catch((requestError) => {
        if (!cancelled) {
          setOrdersError(requestError.message || "Could not load order history.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [userId, canReadOrders]);

  if (loading) return <PageSkeletonLoader />;

  if (error || !customer) {
    return (
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-8 text-center">
        <p className="text-sm text-[#ef3340]">{error || "Customer not found."}</p>
        <div className="mt-4 flex justify-center gap-3">
          <button
            type="button"
            onClick={load}
            className="rounded-md bg-[#008f45] px-4 py-2 text-xs font-semibold text-white"
          >
            Try again
          </button>
          <Link
            to="/users"
            className="rounded-md border border-[#e5e7eb] px-4 py-2 text-xs font-semibold text-[#344054]"
          >
            Back to customers
          </Link>
        </div>
      </div>
    );
  }

  const name = getDisplayName(customer);
  const phone = getDisplayPhone(customer);
  const [joinedDate, joinedTime] = formatJoinedDate(customer.createdAt);
  const gender = customer.gender || "";
  const isFemale = String(gender).toLowerCase() === "female";
  const referralCode = referrals?.referralCode ?? customer.referralCode;
  const referredBy = referrals?.referredBy ?? null;
  const earnings = referrals?.earnings;
  const orderCount = customer.orderCount ?? orderTotal;
  const referralList = referrals?.referrals ?? [];

  return (
    <div className="space-y-5">
      <Link
        to="/users"
        className="inline-flex items-center gap-2 text-xs font-semibold text-[#667085] hover:text-[#008f45]"
      >
        <FontAwesomeIcon icon={faArrowLeft} />
        Back to customers
      </Link>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-[0_4px_16px_rgba(16,24,40,0.04)]">
        <div className="flex items-center gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-[#dcf8e4] text-xl font-bold text-[#008f45]">
            {getInitials(name)}
          </span>
          <div>
            <h1 className="text-2xl font-bold text-[#101828]">{name}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ${
                  customer.isVerified
                    ? "bg-[#dcf8e4] text-[#008f45]"
                    : "bg-[#ffe4e6] text-[#ef3340]"
                }`}
              >
                <FontAwesomeIcon icon={faShieldHalved} className="text-[10px]" />
                {customer.isVerified ? "Verified" : "Not Verified"}
              </span>
              {customer.businessType && (
                <span className="rounded-full bg-[#f2f4f7] px-3 py-1 text-[11px] font-semibold capitalize text-[#475467]">
                  {customer.businessType}
                </span>
              )}
              <span className="text-xs text-[#667085]">
                Joined {joinedDate} {joinedTime && `at ${joinedTime}`}
              </span>
            </div>
          </div>
        </div>
        {phone.number && (
          <a
            href={`https://wa.me/${formatPhoneForWhatsApp(phone.number)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#e5e7eb] px-4 text-sm font-semibold text-[#008f45] hover:bg-[#f6fef9]"
          >
            <FontAwesomeIcon icon={faPhone} />
            Message on WhatsApp
          </a>
        )}
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Orders"
          value={orderCount ?? "—"}
          sub={customer.lastOrderAt ? `Last: ${dateOnly(customer.lastOrderAt)}` : undefined}
          icon={faBagShopping}
          bg="#dbeafe"
          color="#2e7cf6"
        />
        <StatCard
          label="Total spent"
          value={customer.totalSpent != null ? formatNaira(customer.totalSpent) : "—"}
          sub={
            customer.walletBalance != null
              ? `Wallet: ${formatNaira(customer.walletBalance)}`
              : undefined
          }
          icon={faWallet}
          bg="#ffedd5"
          color="#f79009"
        />
        <StatCard
          label="Customers referred"
          value={referrals ? (referrals.referredCount ?? referralList.length) : "—"}
          sub={
            referrals
              ? `${referralList.filter((r) => r.hasPaidOrder).length} paid an order`
              : undefined
          }
          icon={faUserGroup}
          bg="#ede9fe"
          color="#7a5af8"
        />
        <StatCard
          label="Referral earnings"
          value={earnings ? formatNaira(earnings.totalEarned) : "—"}
          sub={earnings ? `${formatNaira(earnings.available)} available` : undefined}
          icon={faCoins}
          bg="#d1fadf"
          color="#12b76a"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <Card title="Referrals">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <p className="text-[11px] text-[#667085]">Referral code</p>
                {referralCode ? (
                  <div className="mt-1 flex items-center gap-3">
                    <span className="rounded-lg bg-[#f6fef9] px-3 py-1.5 font-mono text-base font-bold tracking-wider text-[#008f45]">
                      {referralCode}
                    </span>
                    <CopyButton value={referralCode} />
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-[#667085]">No code yet</p>
                )}
              </div>
              <div>
                <p className="text-[11px] text-[#667085]">Referred by</p>
                {referredBy ? (
                  <Link
                    to={`/users/${referredBy.id}`}
                    className="mt-1 block text-sm font-semibold text-[#008f45] hover:underline"
                  >
                    {referredBy.username || referredBy.email}
                  </Link>
                ) : customer.referredBy && !referrals ? (
                  <Link
                    to={`/users/${customer.referredBy}`}
                    className="mt-1 block text-sm font-semibold text-[#008f45] hover:underline"
                  >
                    View referrer
                  </Link>
                ) : (
                  <p className="mt-1 text-sm text-[#667085]">Signed up without a referral</p>
                )}
              </div>
            </div>

            {earnings && (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ["Total earned", earnings.totalEarned],
                  ["Available", earnings.available],
                  ["Redeemed", earnings.redeemed],
                  ["Expired", earnings.expired],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-[#e5e7eb] px-3 py-2.5">
                    <p className="text-[11px] text-[#667085]">{label}</p>
                    <p className="mt-0.5 text-sm font-semibold text-[#101828]">
                      {formatNaira(value)}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-3 text-[11px] text-[#98a2b3]">
              Referral rewards are issued as vouchers: 0.7% of the referred customer&apos;s first
              paid order, up to ₦10,000.
            </p>

            <div className="mt-5">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#98a2b3]">
                Referred customers{referrals ? ` (${referrals.referredCount ?? referralList.length})` : ""}
              </p>
              {referralsError ? (
                <EmptyNote>{referralsError}</EmptyNote>
              ) : !referrals ? (
                <p role="status" className="text-xs text-[#667085]">Loading referrals…</p>
              ) : referralList.length === 0 ? (
                <EmptyNote>This customer has not referred anyone yet.</EmptyNote>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-[#e5e7eb]">
                  <table className="w-full text-left">
                    <thead className="bg-[#fafafa] text-[11px] uppercase tracking-wider text-[#667085]">
                      <tr>
                        <th className="px-4 py-2.5 font-semibold">Customer</th>
                        <th className="px-4 py-2.5 font-semibold">Joined</th>
                        <th className="px-4 py-2.5 font-semibold">First order</th>
                        <th className="px-4 py-2.5 font-semibold">Reward</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f2f4f7] text-sm">
                      {referralList.map((r) => (
                        <tr key={r.id}>
                          <td className="px-4 py-2.5">
                            <Link
                              to={`/users/${r.id}`}
                              className="font-semibold text-[#101828] hover:text-[#008f45] hover:underline"
                            >
                              {r.username || r.email}
                            </Link>
                            {r.email && r.username && (
                              <p className="text-[11px] text-[#667085]">{r.email}</p>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-[#475467]">{dateOnly(r.joinedAt)}</td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                r.hasPaidOrder
                                  ? "bg-[#dcf8e4] text-[#008f45]"
                                  : "bg-[#f2f4f7] text-[#667085]"
                              }`}
                            >
                              {r.hasPaidOrder ? "Paid" : "Not yet"}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            {r.rewardAmount != null ? (
                              <span className="inline-flex items-center gap-2">
                                <span className="font-semibold text-[#101828]">
                                  {formatNaira(r.rewardAmount)}
                                </span>
                                {r.rewardStatus && (
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                                      REWARD_STYLES[r.rewardStatus] || REWARD_STYLES.expired
                                    }`}
                                  >
                                    {r.rewardStatus}
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="text-[#98a2b3]">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>

          {canReadOrders && (
            <Card
              title={`Order history${orderTotal ? ` (${orderTotal})` : ""}`}
              action={
                orderTotal > 0 && (
                  <Link
                    to={`/orders?userId=${encodeURIComponent(userId)}`}
                    className="text-xs font-semibold text-[#008f45] hover:underline"
                  >
                    View all orders
                  </Link>
                )
              }
            >
              {ordersError ? (
                <EmptyNote>{ordersError}</EmptyNote>
              ) : orders.length === 0 ? (
                <EmptyNote>This customer has no orders yet.</EmptyNote>
              ) : (
                <ul className="divide-y divide-[#f2f4f7] rounded-lg border border-[#e5e7eb]">
                  {orders.map((order) => (
                    <li key={order.id}>
                      <Link
                        to={`/orders/${order.id}`}
                        className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-[#f9fafb]"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-[#101828]">
                            {order.code || order.id}
                          </span>
                          <span className="block text-xs text-[#667085]">
                            {dateOnly(order.createdAt)}
                          </span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="block text-sm font-semibold text-[#101828]">
                            {formatNaira(order.totalPrice)}
                          </span>
                          <span
                            className={`mt-0.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                              orderStatusStyles[order.status] || "bg-[#eef2f6] text-[#667085]"
                            }`}
                          >
                            {order.status || "pending"}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card title="Contact">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <FontAwesomeIcon icon={faEnvelope} className="mt-1 w-4 text-[#008f45]" />
                <Field label="Email">{customer.email}</Field>
              </div>
              <div className="flex items-start gap-3">
                <FontAwesomeIcon icon={faPhone} className="mt-1 w-4 text-[#008f45]" />
                <Field label="Phone">
                  <span className="flex flex-wrap items-center gap-2">
                    {phone.number || "—"}
                    {phone.unverified && <UnverifiedPhoneTag />}
                  </span>
                </Field>
              </div>
              <div className="flex items-start gap-3">
                <FontAwesomeIcon icon={faLocationDot} className="mt-1 w-4 text-[#008f45]" />
                <Field label="Location">
                  {[customer.city?.name || customer.city, getLocation(customer), customer.country]
                    .filter((v, i, arr) => v && v !== "N/A" && arr.indexOf(v) === i)
                    .join(", ")}
                </Field>
              </div>
              {customer.postcode && <Field label="Postcode">{customer.postcode}</Field>}
            </div>
          </Card>

          <Card title="Profile">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Gender">
                {gender ? (
                  <span className="inline-flex items-center gap-1.5 capitalize">
                    <FontAwesomeIcon
                      icon={isFemale ? faVenus : faMars}
                      className={isFemale ? "text-[#ef3f7a]" : "text-[#1f7ae0]"}
                    />
                    {gender}
                  </span>
                ) : null}
              </Field>
              <Field label="Business type">
                <span className="capitalize">{customer.businessType}</span>
              </Field>
              <Field label="Joined">
                <span className="inline-flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faCalendarDays} className="text-[#98a2b3]" />
                  {joinedDate}
                </span>
              </Field>
              <Field label="Last updated">{dateOnly(customer.updatedAt)}</Field>
            </div>
          </Card>

          <Card title="Account">
            <div className="space-y-4">
              <Field label="Customer ID">
                <span className="font-mono text-xs text-[#475467]">{customer.id}</span>
              </Field>
              <Field label="Verification">
                {customer.isVerified ? "Verified" : "Not verified"}
              </Field>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;
