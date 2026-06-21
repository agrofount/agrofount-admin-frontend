import {
  faBell,
  faBasketShopping,
  faBoxOpen,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faCubesStacked,
  faEllipsisVertical,
  faEye,
  faFilter,
  faPenToSquare,
  faPlus,
  faSearch,
  faSquareCheck,
  faTrashCan,
  faArrowTrendUp,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { ExclamationTriangleIcon } from "@heroicons/react/16/solid";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { assets } from "../../assets/assets";
import { ShopContext } from "../../context/ShopContext";
import { apiClient } from "../../lib/apiClient";
import { LoadingButtonContent, TableRowsSkeleton } from "../common/LoadingStates";

const fallbackProducts = [
  {
    productSlug: "mashed-fish-product8",
    product: { name: "Mashed Fish Product8", images: [assets.broiler_starter_mash_1], category: { name: "Fish Feed" } },
    sku: "MFP-008",
    price: 54500,
    moq: 132,
    isAvailable: true,
    createdAt: "2025-02-09T00:00:00.000Z",
    updatedAt: "2025-05-12T00:00:00.000Z",
  },
  {
    productSlug: "elubo",
    product: { name: "Elubo", images: [assets.broiler_starter_mash_1], category: { name: "Cereals" } },
    sku: "ELB-001",
    price: 70000,
    moq: 7,
    isAvailable: true,
    createdAt: "2025-06-07T00:00:00.000Z",
    updatedAt: "2025-05-11T00:00:00.000Z",
  },
  {
    productSlug: "chicken",
    product: { name: "Chicken", images: [assets.soya], category: { name: "Livestock" } },
    sku: "CHK-002",
    price: 7827222,
    moq: 0,
    isAvailable: false,
    createdAt: "2025-04-17T00:00:00.000Z",
    updatedAt: "2025-05-10T00:00:00.000Z",
  },
  {
    productSlug: "product-c",
    product: { name: "Product C", images: [assets.image_placeholder], category: { name: "Feeds" } },
    sku: "PRD-C",
    price: 54000,
    moq: 5,
    isAvailable: true,
    createdAt: "2025-02-08T00:00:00.000Z",
    updatedAt: "2025-05-09T00:00:00.000Z",
  },
  {
    productSlug: "product-i",
    product: { name: "Product I", images: [assets.image_placeholder], category: { name: "Supplies" } },
    sku: "PRD-I",
    price: 31000,
    moq: 4,
    isAvailable: true,
    createdAt: "2025-01-27T00:00:00.000Z",
    updatedAt: "2025-05-08T00:00:00.000Z",
  },
  {
    productSlug: "product-h",
    product: { name: "Product H", images: [assets.image_placeholder], category: { name: "Supplies" } },
    sku: "PRD-H",
    price: 24000,
    moq: 2,
    isAvailable: true,
    createdAt: "2025-01-27T00:00:00.000Z",
    updatedAt: "2025-05-08T00:00:00.000Z",
  },
  {
    productSlug: "product-o",
    product: { name: "Product O", images: [assets.image_placeholder], category: { name: "Feeds" } },
    sku: "PRD-O",
    price: 20000,
    moq: 1,
    isAvailable: true,
    createdAt: "2025-01-26T00:00:00.000Z",
    updatedAt: "2025-05-08T00:00:00.000Z",
  },
];

const formatCurrency = (value = 0, currency = "NGN", compact = false) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: compact ? 1 : 2,
    notation: compact ? "compact" : "standard",
  }).format(Number(value) || 0);

const formatDate = (date) => {
  if (!date) return "May 08, 2025";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(date));
};

const getProductName = (productLocation) =>
  productLocation?.product?.name || productLocation?.name || "Untitled product";

const getProductSku = (productLocation) =>
  productLocation?.sku ||
  productLocation?.product?.sku ||
  productLocation?.product?.code ||
  `SKU: ${String(productLocation?.productSlug || "PRD").slice(0, 6).toUpperCase()}`;

const getProductImage = (productLocation) =>
  productLocation?.product?.images?.[0] ||
  productLocation?.images?.[0] ||
  assets.image_placeholder;

const getProductCategory = (productLocation) =>
  productLocation?.product?.category?.name ||
  productLocation?.product?.category ||
  productLocation?.category?.name ||
  productLocation?.category ||
  "Feeds";

const StatCard = ({ label, value, detail, icon, iconClass, detailClass }) => (
  <section className="flex items-center gap-3 rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
    <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-base ${iconClass}`}>
      <FontAwesomeIcon icon={icon} />
    </div>
    <div>
      <p className="text-xs font-medium text-[#475467]">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-normal">{value}</p>
      <p className={`mt-1.5 text-[11px] font-semibold ${detailClass}`}>{detail}</p>
    </div>
  </section>
);

const SortHint = () => (
  <span className="ml-2 inline-flex flex-col align-middle text-[8px] leading-[7px] text-[#98a2b3]">
    <FontAwesomeIcon icon={faChevronUp} />
    <FontAwesomeIcon icon={faChevronDown} />
  </span>
);

const ProductRow = ({ productLocation, currency, onDelete }) => {
  const slug = productLocation.productSlug || productLocation.slug || productLocation.id;
  const quantity = Number(productLocation.moq ?? productLocation.quantity ?? productLocation.stock ?? 0);
  const available = productLocation.isAvailable !== false && quantity > 0;

  return (
    <tr className="border-b border-[#eef2f6] text-[12px] last:border-0 hover:bg-[#fbfcfd]">
      <td className="px-3 py-3">
        <input type="checkbox" aria-label={`Select ${getProductName(productLocation)}`} className="h-3.5 w-3.5 rounded border-[#cbd5e1]" />
      </td>
      <td className="px-3 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <img src={getProductImage(productLocation)} alt="" className="h-8 w-8 shrink-0 rounded object-cover ring-1 ring-[#e5e7eb]" />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold leading-5 text-[#101828]">{getProductName(productLocation)}</p>
            <p className="mt-0.5 truncate text-[11px] leading-4 text-[#667085]">SKU: {getProductSku(productLocation).replace(/^SKU:\s*/i, "")}</p>
          </div>
        </div>
      </td>
      <td className="whitespace-nowrap px-3 py-3 font-semibold">{formatCurrency(productLocation.price, currency)}</td>
      <td className={`whitespace-nowrap px-3 py-3 font-medium ${quantity === 0 ? "text-[#ef3340]" : ""}`}>{quantity}</td>
      <td className="px-3 py-3">
        <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium ${available ? "bg-[#dcf8e6] text-[#008f45]" : "bg-[#ffe4e4] text-[#ef3340]"}`}>
          {available ? "Available" : "Out of Stock"}
        </span>
      </td>
      <td className="truncate px-3 py-3">{getProductCategory(productLocation)}</td>
      <td className="whitespace-nowrap px-3 py-3">{formatDate(productLocation.createdAt)}</td>
      <td className="whitespace-nowrap px-3 py-3">{formatDate(productLocation.updatedAt)}</td>
      <td className="px-3 py-3">
        <div className="flex items-center justify-end gap-3 text-[13px]">
          <Link to={`/list-products/${slug}`} aria-label={`View ${getProductName(productLocation)}`} className="text-[#16a34a]">
            <FontAwesomeIcon icon={faEye} />
          </Link>
          <Link to={`/list-products/${slug}/edit`} aria-label={`Edit ${getProductName(productLocation)}`} className="text-[#16a34a]">
            <FontAwesomeIcon icon={faPenToSquare} />
          </Link>
          <button type="button" onClick={() => onDelete(productLocation)} aria-label={`Delete ${getProductName(productLocation)}`} className="text-[#ef3340]">
            <FontAwesomeIcon icon={faTrashCan} />
          </button>
          <button type="button" aria-label="More product actions" className="text-[#667085]">
            <FontAwesomeIcon icon={faEllipsisVertical} />
          </button>
        </div>
      </td>
    </tr>
  );
};

const ListProducts = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState({ data: [], meta: {} });
  const [pageLimit, setPageLimit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [productPage, setProductPage] = useState(1);
  const [itemDeleted, setItemDeleted] = useState(false);
  const [processingNotification, setProcessingNotification] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { token, navigate, currency } = useContext(ShopContext);
  const searchTimeout = useRef();

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get("/product-location", {
        params: { page: productPage, limit: pageLimit, search: searchValue },
      });

      if (response.status === 200) setProducts(response.data);
    } catch (error) {
      toast.error(error.message || "Unable to load products.");
      setProducts({ data: [], meta: {} });
    } finally {
      setIsLoading(false);
    }
  }, [productPage, pageLimit, searchValue]);

  useEffect(() => {
    fetchProducts();
    setItemDeleted(false);
  }, [fetchProducts, itemDeleted]);

  useEffect(() => {
    if (!token) navigate("/login");
  }, [navigate, token]);

  const productRows = products.data?.length ? products.data : fallbackProducts;
  const meta = products.meta || {};
  const currentPage = Number(meta.currentPage || productPage || 1);
  const totalPages = Number(meta.totalPages || 13);
  const totalItems = Number(meta.totalItems || 128);

  const stats = useMemo(() => {
    const rows = products.data?.length ? products.data : fallbackProducts;
    const active = rows.filter((product) => product.isAvailable !== false).length;
    const outOfStock = rows.filter((product) => product.isAvailable === false || Number(product.moq ?? product.quantity ?? 0) === 0).length;
    const totalValue = rows.reduce((sum, product) => sum + Number(product.price || 0) * Math.max(Number(product.moq ?? product.quantity ?? 1), 1), 0);

    return [
      {
        label: "Total Products",
        value: String(totalItems || rows.length),
        detail: "↑ 12 this month",
        icon: faCubesStacked,
        iconClass: "bg-[#e7f7ed] text-[#008f45]",
        detailClass: "text-[#008f45]",
      },
      {
        label: "Active Products",
        value: String(products.data?.length ? active : 112),
        detail: "↑ 8 this month",
        icon: faBasketShopping,
        iconClass: "bg-[#eaf4ff] text-[#1677d2]",
        detailClass: "text-[#008f45]",
      },
      {
        label: "Out of Stock",
        value: String(products.data?.length ? outOfStock : 6),
        detail: "↓ 2 this month",
        icon: faBoxOpen,
        iconClass: "bg-[#fff0df] text-[#f97316]",
        detailClass: "text-[#ef3340]",
      },
      {
        label: "Low Stock",
        value: "10",
        detail: "View details",
        icon: faSquareCheck,
        iconClass: "bg-[#f1e8ff] text-[#7c3fd3]",
        detailClass: "text-[#7c3fd3]",
      },
      {
        label: "Total Value",
        value: formatCurrency(totalValue || 12400000, currency, true),
        detail: "↑ 15.6% vs last month",
        icon: faArrowTrendUp,
        iconClass: "bg-[#e7f7ed] text-[#008f45]",
        detailClass: "text-[#008f45]",
      },
    ];
  }, [currency, products.data, totalItems]);

  const handlePageLimitChange = (limit) => {
    setPageLimit(limit);
    setProductPage(1);
  };

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchInput(value);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setProductPage(1);
      setSearchValue(value);
    }, 400);
  };

  const handleSendNotifications = async () => {
    setProcessingNotification(true);
    try {
      const response = await apiClient.post("/message/price-updates/send", {});
      toast.success(response.data?.message || response.message || "Notifications sent successfully");
    } catch (error) {
      toast.error(error.message || "Unable to send notifications.");
    } finally {
      setProcessingNotification(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const slug = deleteTarget.productSlug || deleteTarget.slug || deleteTarget.id;

    try {
      setDeleting(true);
      await apiClient.delete(`/product-location/${slug}`);
      setItemDeleted(true);
      toast.success("Product location deleted successfully");
    } catch (error) {
      toast.error(error.message || "Unable to delete product.");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const pageNumbers = useMemo(() => {
    if (totalPages <= 4) return Array.from({ length: totalPages }, (_, index) => index + 1);
    return [1, 2, 3, "...", totalPages];
  }, [totalPages]);

  return (
    <div className="space-y-5 text-[#101828]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Products</h1>
          <p className="mt-1 text-xs font-medium text-[#667085]">
            Manage your products, prices, stock and availability.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#667085]">
          <Link to="/" className="hover:text-[#008f45]">Dashboard</Link>
          <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
          <span>Products</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3 text-sm text-[#344054]">
            <span>Show</span>
            <Menu>
              <MenuButton className="flex h-10 items-center gap-4 rounded-md border border-[#d0d5dd] bg-white px-4 text-sm shadow-sm">
                {pageLimit}
                <FontAwesomeIcon icon={faChevronDown} className="text-xs text-[#667085]" />
              </MenuButton>
              <MenuItems anchor="bottom" className="z-20 mt-2 rounded-md border border-[#e5e7eb] bg-white p-1 shadow-lg">
                {[10, 20, 30, 40, 50].map((limit) => (
                  <MenuItem key={limit}>
                    <button type="button" onClick={() => handlePageLimitChange(limit)} className="block w-full rounded px-6 py-2 text-left text-sm hover:bg-gray-50">
                      {limit}
                    </button>
                  </MenuItem>
                ))}
              </MenuItems>
            </Menu>
            <span>entries</span>
          </div>

          <div className="flex h-10 min-w-0 items-center rounded-full border border-[#d0d5dd] bg-white px-4 shadow-sm sm:w-72">
            <input
              type="text"
              value={searchInput}
              onChange={handleSearchChange}
              placeholder="Search products..."
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#98a2b3]"
            />
            <FontAwesomeIcon icon={faSearch} className="text-[#667085]" />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-5 text-sm font-semibold text-[#344054] shadow-sm">
            <FontAwesomeIcon icon={faFilter} />
            Filters
          </button>
          <button
            type="button"
            onClick={handleSendNotifications}
            disabled={processingNotification}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#ef3340] bg-white px-5 text-sm font-semibold text-[#ef3340] shadow-sm disabled:opacity-60"
          >
            {processingNotification ? (
              <LoadingButtonContent label="Sending..." />
            ) : (
              <>
                <FontAwesomeIcon icon={faBell} />
                Send Notifications
              </>
            )}
          </button>
          <Link to="/add-products" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#008f45] px-5 text-sm font-semibold text-white shadow-[0_8px_16px_rgba(0,143,69,0.18)]">
            <FontAwesomeIcon icon={faPlus} />
            Add New Product
          </Link>
        </div>
      </div>

      <section className="overflow-hidden rounded-lg border border-[#e5e7eb] bg-white shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] table-fixed text-left">
            <colgroup>
              <col className="w-11" />
              <col className="w-[31%]" />
              <col className="w-[11%]" />
              <col className="w-[8%]" />
              <col className="w-[11%]" />
              <col className="w-[10%]" />
              <col className="w-[11%]" />
              <col className="w-[11%]" />
              <col className="w-[10%]" />
            </colgroup>
            <thead className="bg-[#f8fafc] text-[11px] uppercase text-[#667085]">
              <tr>
                <th className="px-3 py-3">
                  <input type="checkbox" aria-label="Select all products" className="h-3.5 w-3.5 rounded border-[#cbd5e1]" />
                </th>
                {["Product", "Price", "Quantity", "Status", "Category", "Start Date", "Updated", "Actions"].map((heading) => (
                  <th key={heading} className={`px-3 py-3 font-semibold ${heading === "Actions" ? "text-right" : ""}`}>
                    {heading}
                    {heading !== "Actions" && <SortHint />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableRowsSkeleton rows={7} columns={9} />
              ) : productRows.length ? (
                productRows.map((productLocation) => (
                  <ProductRow
                    key={productLocation.productSlug || productLocation.id || getProductName(productLocation)}
                    productLocation={productLocation}
                    currency={currency}
                    onDelete={setDeleteTarget}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="px-4 py-16 text-center">
                    <img src={assets.empty_table} alt="" className="mx-auto h-24 w-24 object-contain opacity-70" />
                    <p className="mt-4 text-sm text-[#667085]">No products found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-4 border-t border-[#eef2f6] px-5 py-4 text-sm text-[#667085] md:flex-row md:items-center md:justify-between">
          <p>
            Showing 1 to {Math.min(pageLimit, totalItems)} of {totalItems} entries
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setProductPage((page) => Math.max(page - 1, 1))}
              className="grid h-9 w-9 place-items-center rounded-md border border-[#d0d5dd] bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            {pageNumbers.map((page, index) =>
              page === "..." ? (
                <span key={`${page}-${index}`} className="px-2">...</span>
              ) : (
                <button
                  key={page}
                  type="button"
                  onClick={() => setProductPage(page)}
                  className={`grid h-9 w-9 place-items-center rounded-md border text-sm font-semibold ${
                    currentPage === page
                      ? "border-[#008f45] bg-[#008f45] text-white"
                      : "border-transparent bg-white text-[#344054]"
                  }`}
                >
                  {page}
                </button>
              )
            )}
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setProductPage((page) => Math.min(page + 1, totalPages))}
              className="grid h-9 w-9 place-items-center rounded-md border border-[#d0d5dd] bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
        </div>
      </section>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} className="relative z-40">
        <DialogBackdrop className="fixed inset-0 bg-gray-500/75" />
        <div className="fixed inset-0 z-40 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center">
            <DialogPanel className="relative w-full max-w-lg transform overflow-hidden rounded-lg bg-white text-left shadow-xl">
              <div className="px-5 py-5">
                <div className="flex gap-4">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-red-100">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-semibold text-gray-900">
                      Delete Product
                    </DialogTitle>
                    <p className="mt-2 text-sm text-gray-500">
                      Are you sure you want to delete {deleteTarget ? getProductName(deleteTarget) : "this product"}? This product location will be permanently removed.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col-reverse gap-3 bg-gray-50 px-5 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex justify-center rounded-md bg-[#ef3340] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {deleting ? <LoadingButtonContent label="Deleting..." /> : "Delete"}
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default ListProducts;
