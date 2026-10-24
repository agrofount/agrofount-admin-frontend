import { faArrowLeft, faChevronLeft, faChevronRight, faClock, faCommentDots, faCube, faEllipsisVertical, faEnvelope, faEye, faMagnifyingGlass, faMinus, faPhone, faPlus, faShoppingCart, faSliders, faTrashCan, faUser, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ShopContext } from "../../context/ShopContext";
import { toast } from "react-toastify";
import { ACTIONS, RESOURCES } from "../../constants/permissions";
import { apiClient } from "../../lib/apiClient";
import { usePermission } from "../Hooks/usePermission";
import ModalComponent from "../modals/ModalComponent";

const PAGE_SIZE = 25;

const getListPayload = (responseData) => {
  const payload = responseData?.cart ?? responseData?.data ?? responseData;
  const carts = payload?.items ?? [];
  return {
    carts: Array.isArray(carts) ? carts : [],
    nextCursor: payload?.nextCursor ?? null,
  };
};

const getCartPayload = (responseData) =>
  responseData?.cart ?? responseData?.data ?? responseData;

const customerName = (user) =>
  [user?.firstname, user?.lastname].filter(Boolean).join(" ") || user?.username || "Unknown customer";

const formatExpiry = (seconds, active) => {
  if (!active) return "Inactive";
  if (seconds == null || !Number.isFinite(Number(seconds))) return "Not provided";
  const remaining = Math.max(0, Number(seconds));
  if (!remaining) return "Expired";
  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  if (days) return `${days}d ${hours}h`;
  if (hours) return `${hours}h ${minutes}m`;
  return `${Math.max(1, minutes)}m`;
};

// Cart items come keyed by productLocationId, then by unit of measure.
const flattenCartItems = (items) =>
  Object.entries(items && typeof items === "object" && !Array.isArray(items) ? items : {}).flatMap(([productLocationId, units]) =>
    Object.entries(units || {}).map(([unit, line]) => ({ ...line, productLocationId, unit })));

const getProduct = (item) => item?.productLocation?.product || {};

const getProductName = (item) => getProduct(item).name || "Product";

const getQuantity = (item) => Number(item?.quantity ?? 0);

const toNumber = (value) => (value != null && Number.isFinite(Number(value)) ? Number(value) : null);

const getUnitPrice = (item) => toNumber(item?.actualUnitPrice ?? item?.platformPrice);

const getLineTotal = (item) => toNumber(item?.total) ?? (getUnitPrice(item) == null ? null : getUnitPrice(item) * getQuantity(item));

const initials = (name) =>
  String(name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";

const CartsHeader = ({ detail = false }) => (
  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
    <div className="flex items-center gap-4">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e3f6ea] text-lg text-[#008f45]"><FontAwesomeIcon icon={faShoppingCart} /></span>
      <div>
        <h1 className="text-xl font-bold text-[#101828]">{detail ? "Cart details" : "Carts"}</h1>
        <p className="mt-0.5 text-[13px] text-[#667085]">{detail ? "Review the selected customer’s cart." : "Browse customer carts and their current contents."}</p>
      </div>
    </div>
    <div className="flex items-center gap-2 text-xs text-[#667085]">
      <Link to="/" className="hover:text-[#008f45]">Dashboard</Link>
      <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
      {detail ? <><Link to="/carts" className="hover:text-[#008f45]">Carts</Link><FontAwesomeIcon icon={faChevronRight} className="text-[10px]" /><span className="font-medium text-[#008f45]">Details</span></> : <span className="font-medium text-[#008f45]">Carts</span>}
    </div>
  </div>
);

const StatusBadge = ({ active }) => (
  <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ${active ? "bg-[#e3f6ea] text-[#008f45]" : "bg-[#eef2f6] text-[#667085]"}`}>
    <span className={`h-2 w-2 rounded-full ${active ? "bg-[#008f45]" : "bg-[#98a2b3]"}`} />
    {active ? "Active" : "Inactive"}
  </span>
);

const AddItemModal = ({ isOpen, onClose, onAdd, formatMoney }) => {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [selected, setSelected] = useState(null);
  const [unit, setUnit] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [submitting, setSubmitting] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    if (!isOpen) return undefined;
    setSelected(null);
    setSearch("");
    setQuantity("1");
    setSearchError("");
    return undefined;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || selected) return undefined;
    const current = ++requestId.current;
    const timer = setTimeout(async () => {
      setSearching(true);
      setSearchError("");
      try {
        const response = await apiClient.get("/cart/admin/products", { params: { search: search.trim() || undefined, limit: 20 } });
        if (current === requestId.current) setResults(Array.isArray(response.data?.products) ? response.data.products : []);
      } catch (requestError) {
        if (current === requestId.current) setSearchError(requestError.message || "Could not load products.");
      } finally {
        if (current === requestId.current) setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [isOpen, search, selected]);

  const choose = (product) => {
    const first = product.uom?.[0];
    setSelected(product);
    setUnit(first?.unit || "");
    setQuantity("1");
  };

  const uom = selected?.uom?.find((entry) => entry.unit === unit);
  const quantityNumber = Number(quantity);
  const validQuantity = Number.isInteger(quantityNumber) && quantityNumber >= 1 && quantityNumber <= 1000000;

  const submit = async () => {
    setSubmitting(true);
    try {
      const added = await onAdd({ productLocationId: selected.productLocationId, unit, quantity: quantityNumber });
      if (added) onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalComponent isModalOpen={isOpen} onClose={() => !submitting && onClose()} title="Add item to cart">
      <div className="p-6">
        {!selected ? (
          <>
            <label className="flex items-center gap-2 rounded-xl border border-[#d0d5dd] px-3 py-2 focus-within:border-[#008f45]">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="text-xs text-[#667085]" />
              <input type="search" autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products by name or brand…" aria-label="Search products" className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#98a2b3]" />
            </label>
            <div className="mt-3 max-h-80 overflow-y-auto" aria-live="polite">
              {searching ? <p role="status" className="py-6 text-center text-xs text-[#667085]">Searching…</p> : searchError ? <p role="alert" className="py-6 text-center text-xs text-red-700">{searchError}</p> : results.length === 0 ? <p className="py-6 text-center text-xs text-[#667085]">No available products found.</p> : (
                <ul className="divide-y divide-[#eaecf0]">
                  {results.map((product) => (
                    <li key={product.productLocationId}>
                      <button type="button" onClick={() => choose(product)} className="flex w-full items-center gap-3 px-1 py-3 text-left hover:bg-[#f9fafb]">
                        {product.image ? <img src={product.image} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" /> : <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f2f4f7] text-[#98a2b3]"><FontAwesomeIcon icon={faCube} /></span>}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-semibold text-[#101828]">{product.name}</span>
                          <span className="block truncate text-xs text-[#667085]">{[product.brand, product.state?.name].filter(Boolean).join(" • ") || "—"}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {selected.image ? <img src={selected.image} alt="" className="h-12 w-12 rounded-lg object-cover" /> : <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#f2f4f7] text-[#98a2b3]"><FontAwesomeIcon icon={faCube} /></span>}
              <div className="flex-1"><p className="text-sm font-semibold text-[#101828]">{selected.name}</p><p className="text-xs text-[#667085]">{[selected.brand, selected.state?.name].filter(Boolean).join(" • ")}</p></div>
              <button type="button" onClick={() => setSelected(null)} className="text-xs font-semibold text-[#008f45] hover:underline">Change</button>
            </div>
            <label className="block text-xs font-semibold text-[#344054]">Unit
              <select value={unit} onChange={(event) => { setUnit(event.target.value); setQuantity("1"); }} className="mt-1 w-full rounded-lg border border-[#d0d5dd] px-3 py-2 text-[13px] font-normal text-[#101828]">
                {selected.uom.map((entry) => <option key={entry.unit} value={entry.unit}>{entry.unit} · {formatMoney(entry.platformPrice)}</option>)}
              </select>
            </label>
            <label className="block text-xs font-semibold text-[#344054]">Quantity
              <input type="number" min={1} max={1000000} step={1} value={quantity} onChange={(event) => setQuantity(event.target.value)} className="mt-1 w-full rounded-lg border border-[#d0d5dd] px-3 py-2 text-[13px] font-normal text-[#101828]" />
            </label>
            <p className="text-xs text-[#667085]">
              {uom?.moq ? `Suggested minimum: ${uom.moq} (not enforced). ` : ""}{uom?.availableQuantity != null ? `Available: ${uom.availableQuantity}.` : "Stock level not available."}
              {" "}If this item is already in the cart, the quantity is added to the existing line.
            </p>
            {!validQuantity && <p role="alert" className="text-xs text-red-700">Enter a whole number of at least 1.</p>}
          </div>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" disabled={submitting} onClick={onClose} className="rounded-lg border border-[#d0d5dd] px-4 py-2 text-[13px] font-semibold text-[#344054] hover:bg-[#f9fafb]">Close</button>
          {selected && <button type="button" disabled={submitting || !validQuantity || !unit} onClick={submit} className="rounded-lg bg-[#008f45] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#007a3b] disabled:cursor-not-allowed disabled:opacity-60">{submitting ? "Adding…" : "Add to cart"}</button>}
        </div>
      </div>
    </ModalComponent>
  );
};

const ListCarts = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { currency } = useContext(ShopContext);
  const { hasPermission, isAdmin } = usePermission();
  const canReadUsers = isAdmin || hasPermission(RESOURCES.USERS, ACTIONS.READ);
  const [carts, setCarts] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [busyLine, setBusyLine] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");

  const formatMoney = useCallback((amount) => {
    if (amount == null || !Number.isFinite(Number(amount))) return "Not provided";
    try {
      return new Intl.NumberFormat("en-NG", { style: "currency", currency: currency || "NGN" }).format(Number(amount));
    } catch {
      return `${currency || "NGN"} ${Number(amount).toLocaleString("en-NG")}`;
    }
  }, [currency]);

  const fetchCarts = useCallback(async ({ cursor = 0, append = false } = {}) => {
    setError("");
    append ? setIsLoadingMore(true) : setIsLoading(true);
    try {
      const response = await apiClient.get("/cart/all", { params: { cursor, limit: PAGE_SIZE } });
      const result = getListPayload(response.data);
      setCarts((current) => append ? [...current, ...result.carts] : result.carts);
      setNextCursor(result.nextCursor);
    } catch (requestError) {
      setError(requestError.message || "Could not load carts. Please try again.");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  const fetchCart = useCallback(async () => {
    if (!userId) return;
    setDetailError("");
    setCart(null);
    setDetailLoading(true);
    try {
      const response = await apiClient.get(`/cart/admin/${encodeURIComponent(userId)}`);
      setCart(getCartPayload(response.data));
    } catch (requestError) {
      if (requestError.status === 404) setCart({ userId, active: false, itemCount: 0, expiresInSeconds: 0, items: {} });
      else setDetailError(requestError.message || "Could not load this cart. Please try again.");
    } finally {
      setDetailLoading(false);
    }
  }, [userId]);

  const updateLine = useCallback(async (item, quantity) => {
    const key = `${item.productLocationId}-${item.unit}`;
    setBusyLine(key);
    try {
      const response = await apiClient.put(`/cart/admin/${encodeURIComponent(userId)}`, {
        productLocationId: item.productLocationId,
        unit: item.unit,
        quantity,
      });
      setCart(getCartPayload(response.data));
      toast.success(quantity === 0 ? "Item removed from cart." : "Cart updated.");
    } catch (requestError) {
      toast.error(requestError.message || "Could not update this cart.");
    } finally {
      setBusyLine("");
    }
  }, [userId]);

  const addLine = useCallback(async (line) => {
    try {
      const response = await apiClient.post(`/cart/admin/${encodeURIComponent(userId)}`, line);
      setCart(getCartPayload(response.data));
      toast.success("Item added to cart.");
      return true;
    } catch (requestError) {
      toast.error(requestError.message || "Could not add this item.");
      return false;
    }
  }, [userId]);

  const cancelCart = useCallback(async () => {
    setCancelling(true);
    try {
      await apiClient.delete(`/cart/admin/${encodeURIComponent(userId)}`);
      toast.success("Cart cancelled.");
      setCancelOpen(false);
      navigate("/carts");
    } catch (requestError) {
      toast.error(requestError.message || "Could not cancel this cart.");
    } finally {
      setCancelling(false);
    }
  }, [navigate, userId]);

  const openProfile = useCallback(async () => {
    setProfileOpen(true);
    setProfile(null);
    setProfileError("");
    setProfileLoading(true);
    try {
      const response = await apiClient.get(`/user/${encodeURIComponent(userId)}`);
      const data = response.data;
      setProfile(data?.user ?? data?.data ?? data);
    } catch (requestError) {
      setProfileError(requestError.message || "Could not load the customer profile.");
    } finally {
      setProfileLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) fetchCart();
    else fetchCarts();
  }, [fetchCart, fetchCarts, userId]);

  const filteredCarts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return carts;
    return carts.filter((entry) => {
      const customer = entry.user || {};
      return [customerName(customer), customer.id, customer._id, customer.username, customer.email, customer.phone, entry.userId]
        .some((value) => String(value || "").toLowerCase().includes(query));
    });
  }, [carts, search]);

  if (userId) {
    const detail = cart || {};
    const customer = detail.user || detail.customer || {};
    const items = flattenCartItems(detail.items);
    const name = customerName(customer);
    const itemCount = Number(detail.itemCount ?? items.length);
    const lineTotals = items.map(getLineTotal);
    const subtotal = lineTotals.length && lineTotals.every((value) => value != null) ? lineTotals.reduce((sum, value) => sum + value, 0) : null;
    const cardClass = "rounded-2xl border border-[#eaecf0] bg-white p-5 shadow-[0_4px_16px_rgba(16,24,40,0.04)]";
    return (
      <div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e3f6ea] text-lg text-[#008f45]"><FontAwesomeIcon icon={faShoppingCart} /></span>
            <div>
              <h1 className="text-xl font-bold text-[#101828]">View Cart</h1>
              <p className="mt-0.5 text-[13px] text-[#667085]">Review the items in the customer’s cart.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#667085]">
            <Link to="/" className="hover:text-[#008f45]">Dashboard</Link><FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
            <Link to="/carts" className="hover:text-[#008f45]">Carts</Link><FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
            <span className="font-medium text-[#008f45]">Details</span>
          </div>
        </div>
        {detailLoading ? (
          <div role="status" className="rounded-2xl bg-white p-8 text-center text-sm text-[#667085] shadow-sm">Loading cart details…</div>
        ) : detailError ? (
          <div className="rounded-xl border border-red-200 bg-white p-6 text-sm text-red-700" role="alert">
            <p>{detailError}</p><button type="button" onClick={fetchCart} className="mt-3 rounded-md bg-red-50 px-3 py-2 font-medium hover:bg-red-100">Try again</button>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className={cardClass}>
              <button type="button" onClick={() => navigate("/carts")} className="mb-4 inline-flex items-center gap-2 text-[13px] font-medium text-[#344054] hover:text-[#008f45]">
                <FontAwesomeIcon icon={faArrowLeft} className="text-xs" /> Back to Carts
              </button>
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-[#f9fafb] p-4">
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#c9ead5] text-sm font-semibold text-[#1f6b3b]">{initials(name)}</span>
                  <div>
                    <div className="flex items-center gap-3"><p className="text-sm font-semibold text-[#101828]">{name}</p><StatusBadge active={Boolean(detail.active)} /></div>
                    <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#667085]">
                      {customer.phone && <span className="inline-flex items-center gap-2"><FontAwesomeIcon icon={faPhone} />{customer.phone}</span>}
                      {customer.email && <span className="inline-flex items-center gap-2"><FontAwesomeIcon icon={faEnvelope} />{customer.email}</span>}
                      {customer.username && <span>@{customer.username}</span>}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-[#667085]">Customer ID: <span className="font-semibold text-[#101828]">{detail.userId || customer.id || userId}</span></p>
              </div>

              <div className="mb-3 mt-6 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[#101828]">Cart Items ({itemCount})</h2>
                <button type="button" onClick={() => setAddOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-[#008f45] px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-[#007a3b]"><FontAwesomeIcon icon={faPlus} />Add item</button>
              </div>
              {items.length === 0 ? (
                <div className="rounded-xl bg-[#f9fafb] px-5 py-12 text-center"><FontAwesomeIcon icon={faShoppingCart} className="text-2xl text-[#98a2b3]" /><p className="mt-3 text-sm font-medium text-[#475467]">{detail.active ? "This cart is empty" : "This cart is empty or has expired"}</p><p className="mt-1 text-xs text-[#98a2b3]">Use Add item to put a product in this customer’s cart.</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[660px] text-left">
                    <thead><tr className="bg-[#f2f6fa]">{["Product", "Price", "Quantity", "Total", ""].map((heading, index, all) => <th key={heading} className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#475467] ${index === 0 ? "rounded-l-lg" : ""} ${index === all.length - 1 ? "rounded-r-lg" : ""}`}>{heading}</th>)}</tr></thead>
                    <tbody className="divide-y divide-[#eaecf0]">
                      {items.map((item) => {
                        const product = getProduct(item);
                        const imageUrl = Array.isArray(product.images) ? product.images[0] : null;
                        const unitPrice = getUnitPrice(item);
                        const meta = [product.category?.name || product.category, product.brand?.name || product.brand].filter((value) => typeof value === "string" && value);
                        const busy = busyLine !== "";
                        return <tr key={`${item.productLocationId}-${item.unit}`} className={busyLine === `${item.productLocationId}-${item.unit}` ? "opacity-60" : ""}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {imageUrl ? <img src={imageUrl} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" /> : <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#f2f4f7] text-[#98a2b3]"><FontAwesomeIcon icon={faCube} /></span>}
                              <div><p className="text-[13px] font-semibold text-[#101828]">{getProductName(item)}</p>{meta.length > 0 && <p className="mt-0.5 text-xs text-[#667085]">{meta.join(" • ")}</p>}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3"><p className="text-[13px] font-semibold text-[#101828]">{formatMoney(unitPrice)}</p>{item.priceDetails?.isVolumeDiscount && <p className="mt-0.5 text-xs text-[#008f45]">Volume price</p>}<p className="mt-0.5 text-xs text-[#667085]">per {item.unit}</p></td>
                          <td className="px-4 py-3">
                            <div className="inline-flex items-center rounded-lg border border-[#eaecf0] bg-[#f9fafb]">
                              <button type="button" aria-label="Decrease quantity" disabled={busy || getQuantity(item) <= 1} onClick={() => updateLine(item, getQuantity(item) - 1)} className="px-3 py-1.5 text-xs text-[#344054] hover:text-[#008f45] disabled:cursor-not-allowed disabled:text-[#d0d5dd]"><FontAwesomeIcon icon={faMinus} /></button>
                              <span className="min-w-[40px] text-center text-[13px] font-semibold text-[#101828]" aria-live="polite">{getQuantity(item).toLocaleString("en-NG")}</span>
                              <button type="button" aria-label="Increase quantity" disabled={busy} onClick={() => updateLine(item, getQuantity(item) + 1)} className="px-3 py-1.5 text-xs text-[#344054] hover:text-[#008f45] disabled:cursor-not-allowed disabled:text-[#d0d5dd]"><FontAwesomeIcon icon={faPlus} /></button>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[13px] font-semibold text-[#101828]">{formatMoney(getLineTotal(item))}</td>
                          <td className="px-2 py-3 text-right"><button type="button" aria-label={`Remove ${getProductName(item)}`} disabled={busy} onClick={() => updateLine(item, 0)} className="px-2 text-[#667085] hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"><FontAwesomeIcon icon={faTrashCan} /></button></td>
                        </tr>;
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {itemCount > items.length && <p className="mt-4 text-xs text-[#667085]">{itemCount - items.length} {itemCount - items.length === 1 ? "line is" : "lines are"} not shown because the product is no longer available.</p>}
            </section>

            <aside className="space-y-5">
              <section className={cardClass}>
                <h2 className="text-sm font-semibold text-[#101828]">Order Summary</h2>
                <dl className="mt-4 space-y-3 text-[13px] text-[#667085]">
                  <div className="flex justify-between"><dt>Subtotal ({items.length} {items.length === 1 ? "line" : "lines"})</dt><dd className="font-semibold text-[#101828]">{formatMoney(subtotal)}</dd></div>
                </dl>
                <div className="mt-4 flex items-center justify-between border-t border-[#eaecf0] pt-4"><span className="text-sm font-semibold text-[#101828]">Total</span><span className="text-lg font-bold text-[#008f45]">{formatMoney(subtotal)}</span></div>
                {customer.email && <a href={`mailto:${customer.email}`} className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-[#008f45] px-4 py-2.5 text-[13px] font-semibold text-[#008f45] hover:bg-[#e3f6ea]"><FontAwesomeIcon icon={faCommentDots} />Contact Customer</a>}
              </section>
              <section className={cardClass}>
                <div className="flex items-center justify-between"><h2 className="text-sm font-semibold text-[#101828]">Cart Status</h2><StatusBadge active={Boolean(detail.active)} /></div>
                <div className="mt-4 space-y-3 text-[13px]">
                  <div><p className="font-semibold text-[#344054]">Expires in</p><p className="mt-1 flex items-center gap-2 text-[#667085]"><FontAwesomeIcon icon={faClock} />{formatExpiry(detail.expiresInSeconds, detail.active)}</p></div>
                </div>
              </section>
              <section className={cardClass}>
                <h2 className="text-sm font-semibold text-[#101828]">Actions</h2>
                <div className="mt-4 space-y-3">
                  <button type="button" disabled={itemCount === 0} onClick={() => setCancelOpen(true)} className="flex w-full items-center gap-3 rounded-lg border border-[#d0d5dd] px-4 py-2.5 text-[13px] font-semibold text-[#344054] hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-50"><FontAwesomeIcon icon={faXmark} className="text-red-600" />Cancel Cart</button>
                  {canReadUsers && <button type="button" onClick={openProfile} className="flex w-full items-center gap-3 rounded-lg border border-[#d0d5dd] px-4 py-2.5 text-[13px] font-semibold text-[#344054] hover:bg-[#f9fafb]"><FontAwesomeIcon icon={faUser} className="text-[#344054]" />View Customer Profile</button>}
                </div>
              </section>
            </aside>
          </div>
        )}
        <AddItemModal isOpen={addOpen} onClose={() => setAddOpen(false)} onAdd={addLine} formatMoney={formatMoney} />
        <ModalComponent isModalOpen={cancelOpen} onClose={() => !cancelling && setCancelOpen(false)} title="Cancel this cart?">
          <div className="p-6">
            <p className="text-sm text-[#475467]">This removes all {itemCount} {itemCount === 1 ? "line" : "lines"} from {name}’s cart. The customer will see an empty cart. This cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" disabled={cancelling} onClick={() => setCancelOpen(false)} className="rounded-lg border border-[#d0d5dd] px-4 py-2 text-[13px] font-semibold text-[#344054] hover:bg-[#f9fafb]">Keep cart</button>
              <button type="button" disabled={cancelling} onClick={cancelCart} className="rounded-lg bg-red-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-red-700 disabled:cursor-wait disabled:opacity-60">{cancelling ? "Cancelling…" : "Cancel cart"}</button>
            </div>
          </div>
        </ModalComponent>
        <ModalComponent isModalOpen={profileOpen} onClose={() => setProfileOpen(false)} title="Customer profile">
          <div className="p-6">
            {profileLoading ? <p role="status" className="text-sm text-[#667085]">Loading profile…</p> : profileError ? <p role="alert" className="text-sm text-red-700">{profileError}</p> : profile ? (
              <dl className="space-y-3 text-[13px]">
                {[["Name", customerName(profile)], ["Username", profile.username && `@${profile.username}`], ["Email", profile.email], ["Phone", profile.phone], ["Verified", profile.isVerified == null ? null : profile.isVerified ? "Yes" : "No"], ["Joined", profile.createdAt && !Number.isNaN(new Date(profile.createdAt).getTime()) ? new Date(profile.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" }) : null]]
                  .filter(([, value]) => value)
                  .map(([label, value]) => <div key={label} className="flex justify-between gap-6"><dt className="text-[#667085]">{label}</dt><dd className="text-right font-semibold text-[#101828]">{value}</dd></div>)}
              </dl>
            ) : null}
            <div className="mt-6 flex justify-end"><button type="button" onClick={() => setProfileOpen(false)} className="rounded-lg border border-[#d0d5dd] px-4 py-2 text-[13px] font-semibold text-[#344054] hover:bg-[#f9fafb]">Close</button></div>
          </div>
        </ModalComponent>
      </div>
    );
  }

  return (
    <div>
      <CartsHeader />
      <section className="overflow-hidden rounded-2xl border border-[#eaecf0] bg-white p-5 shadow-[0_4px_16px_rgba(16,24,40,0.04)]">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faShoppingCart} className="text-xl text-[#101828]" />
            <div><h2 className="text-base font-semibold text-[#101828]">Customer carts</h2><p className="mt-0.5 text-xs text-[#667085]">Showing up to {PAGE_SIZE} carts per page</p></div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex min-w-[240px] items-center gap-2 rounded-xl border border-[#d0d5dd] px-3 py-2 focus-within:border-[#008f45] focus-within:ring-2 focus-within:ring-[#008f45]/10">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="text-xs text-[#667085]" />
              <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search loaded carts…" className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#98a2b3]" aria-label="Search carts" />
            </label>
            <button type="button" aria-label="Filters" className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#d0d5dd] text-[#344054] hover:bg-[#f9fafb]"><FontAwesomeIcon icon={faSliders} /></button>
          </div>
        </div>
        {error && <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert"><span>{error}</span><button type="button" onClick={() => fetchCarts()} className="font-semibold underline">Try again</button></div>}
        {isLoading ? (
          <div role="status" className="space-y-3"><p className="text-sm text-[#667085]">Loading carts…</p>{[0, 1, 2, 3].map((row) => <div key={row} className="h-14 animate-pulse rounded-xl bg-[#f2f4f7]" />)}</div>
        ) : filteredCarts.length === 0 ? (
          <div className="px-5 py-14 text-center"><FontAwesomeIcon icon={faShoppingCart} className="text-2xl text-[#98a2b3]" /><p className="mt-3 text-sm font-medium text-[#475467]">{search ? "No matching carts" : "No carts found"}</p><p className="mt-1 text-xs text-[#98a2b3]">{search ? "Try another customer name or contact detail." : "Customer carts will appear here when available."}</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-separate border-spacing-y-2 text-left">
              <thead><tr className="bg-[#f2f4f7]">{["Customer", "Contact", "Status", "Items", "Expiry", "Actions"].map((heading, index, all) => <th key={heading} className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#475467] ${index === 0 ? "rounded-l-xl" : ""} ${index === all.length - 1 ? "rounded-r-xl" : ""}`}>{heading}</th>)}</tr></thead>
              <tbody>
                {filteredCarts.map((entry, index) => {
                  const customer = entry.user || {};
                  const id = entry.userId || customer.id || customer._id;
                  const name = customerName(customer);
                  const cell = "border-y border-[#eaecf0] bg-white px-4 py-3";
                  return <tr key={id || index} className="group">
                    <td className={`${cell} rounded-l-xl border-l`}>
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#c9ead5] text-xs font-semibold text-[#1f6b3b]">{initials(name)}</span>
                        <div><p className="text-sm font-semibold text-[#101828]">{name}</p><p className="text-xs text-[#667085]">{customer.username ? `@${customer.username}` : `ID: ${id || "Not provided"}`}</p></div>
                      </div>
                    </td>
                    <td className={`${cell} text-[13px] text-[#475467]`}>
                      <div className="flex items-center gap-2"><FontAwesomeIcon icon={faEnvelope} className="w-4 text-[#667085]" />{customer.email || "—"}</div>
                      <div className="mt-1.5 flex items-center gap-2"><FontAwesomeIcon icon={faPhone} className="w-4 text-[#667085]" />{customer.phone || "—"}</div>
                    </td>
                    <td className={cell}><StatusBadge active={Boolean(entry.active)} /></td>
                    <td className={`${cell} text-[13px] font-semibold text-[#101828]`}><span className="inline-flex items-center gap-2"><FontAwesomeIcon icon={faCube} className="text-[#667085]" />{Number(entry.itemCount ?? 0).toLocaleString("en-NG")}</span></td>
                    <td className={`${cell} text-[13px] font-semibold text-[#101828]`}><span className="inline-flex items-center gap-2"><FontAwesomeIcon icon={faClock} className="text-[#667085]" />{formatExpiry(entry.expiresInSeconds, entry.active)}</span></td>
                    <td className={`${cell} rounded-r-xl border-r`}>
                      <div className="flex items-center gap-3">
                        {id ? <Link to={`/carts/${encodeURIComponent(id)}`} className="inline-flex items-center gap-2 rounded-lg bg-[#e3f6ea] px-3 py-1.5 text-[13px] font-semibold text-[#008f45] hover:bg-[#d3efdd]"><FontAwesomeIcon icon={faEye} />View cart</Link> : <span className="text-xs text-[#98a2b3]">Unavailable</span>}
                        <button type="button" aria-label="More actions" className="px-2 text-[#344054] hover:text-[#008f45]"><FontAwesomeIcon icon={faEllipsisVertical} /></button>
                      </div>
                    </td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && carts.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-1">
            <p className="text-xs text-[#475467]">{search ? `${filteredCarts.length} matching on loaded pages` : `${carts.length} ${carts.length === 1 ? "cart" : "carts"} loaded`}</p>
            <div className="flex items-center gap-2">
              <button type="button" disabled aria-label="Previous page" className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f2f4f7] text-xs text-[#98a2b3]"><FontAwesomeIcon icon={faChevronLeft} /></button>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#008f45] text-[13px] font-semibold text-white">1</span>
              <button type="button" disabled={nextCursor == null || isLoadingMore} onClick={() => fetchCarts({ cursor: nextCursor, append: true })} aria-label="Load more carts" className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f2f4f7] text-xs text-[#344054] enabled:hover:bg-[#e4e7ec] disabled:cursor-not-allowed disabled:text-[#98a2b3]"><FontAwesomeIcon icon={faChevronRight} /></button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default ListCarts;
