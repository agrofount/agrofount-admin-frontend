import {
  faBasketShopping,
  faCopy,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Dialog,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { assets } from "../../assets/assets";
import { useContext, useEffect, useState } from "react";
import { ShopContext } from "../../context/ShopContext";
import qs from "qs";
import { toast } from "react-toastify";
import { apiClient } from "../../lib/apiClient";

const OrderItems = ({ orderItems, setOrderItems, orderId, setUpdated }) => {
  const [sortBy, setSortBy] = useState("");
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedPrice, setSelectedPrice] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [pendingItems, setPendingItems] = useState([]); // For batch add

  const { currency } = useContext(ShopContext);
  const formatMoney = (value = 0) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
    }).format(Number(value) || 0);

  const getVendorPrice = (item) => {
    const matchedUom = item.uom?.find(
      (uom) => Number(uom.platformPrice) === Number(item.price)
    );
    return matchedUom?.vendorPrice ?? item.vendorPrice ?? 0;
  };

  const itemsTotal = orderItems.reduce(
    (total, item) => total + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );

  const copyOrderItems = async () => {
    const text = orderItems
      .map((item) => {
        const name = item.product?.name || item.name || "Product";
        return `${name} - Qty: ${item.quantity}, Price: ${formatMoney(item.price)}`;
      })
      .join("\n");

    try {
      await navigator.clipboard.writeText(text);
      toast.success("Order items copied");
    } catch {
      toast.error("Could not copy order items");
    }
  };

  // Search products
  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    try {
      const params = {
        search: encodeURIComponent(query),
        limit: 5,
      };
      const response = await apiClient.get("/product-location", {
        params,
        paramsSerializer: (params) =>
          qs.stringify(params, { arrayFormat: "repeat" }),
      });
      setSearchResults(response.data?.data || []);
    } catch (error) {
      console.error("Error searching products:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Select product for adding to order
  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setSearchQuery("");
    setSearchResults([]);

    // Set default price (first available price or 0)
    if (product.uom && product.uom.length > 0) {
      setSelectedPrice(product.uom[0].platformPrice);
    } else {
      setSelectedPrice(0);
    }
  };

  // Add item to pending list
  const handleAddToPending = () => {
    if (!selectedProduct || quantity < 1) return;
    const newItem = {
      id: selectedProduct.id,
      quantity: quantity,
      price: selectedPrice,
      name: selectedProduct.product.name,
    };
    setPendingItems([...pendingItems, newItem]);
    setSelectedProduct(null);
    setQuantity(1);
    setSelectedPrice(0);
  };

  // Submit all pending items to order
  const handleSubmitPendingItems = async () => {
    if (pendingItems.length === 0) return;
    try {
      const response = await apiClient.post(
        `/order/${orderId}/items`,
        pendingItems
      );
      if (response.status === 201) {
        setIsAddItemModalOpen(false);
        setPendingItems([]);
        setSelectedProduct(null);
        setQuantity(1);
        setSelectedPrice(0);
        setUpdated((current) => !current);
        toast.success("Items added to order successfully");
      }
    } catch (error) {
      console.error("Error adding items to order:", error);
    }
  };

  const handleAddItem = () => {
    // if (orderData.status !== "pending") {
    //   toast.error("Cannot add items to a non-pending order");
    //   return;
    // }
    setIsAddItemModalOpen(true);
  };

  useEffect(() => {
    if (!sortBy) return;

    const sortedItems = [...orderItems].sort((a, b) => {
      if (a[sortBy] < b[sortBy]) return -1;
      if (a[sortBy] > b[sortBy]) return 1;
      return 0;
    });

    const hasChanged = sortedItems.some(
      (item, index) => item.id !== orderItems[index]?.id
    );

    if (hasChanged) {
      setOrderItems(sortedItems);
    }
  }, [orderItems, setOrderItems, sortBy]);

  return (
    <div className="flex flex-col rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
      <div className="flex flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[#eaf8ef] text-[#008f45]">
            <FontAwesomeIcon icon={faBasketShopping} className="text-sm" />
          </span>
          <p className="text-sm font-medium text-[#101828]">Order Items</p>
        </div>
        <div className="flex flex-row items-center gap-3">
          <Menu>
            <MenuButton className="flex h-9 flex-row items-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-3 text-[#344054] shadow-sm">
              <p className="text-xs font-medium">{sortBy || "Sort By"}</p>
              <img src={assets.dropdown_icon} alt="" />
            </MenuButton>
            <MenuItems anchor="bottom" className="bg-white py-2 px-4">
              <MenuItem
                onClick={() => setSortBy("name")}
                className="cursor-pointer"
              >
                <p className="text-sm text-left text-gray-500 py-3">Name</p>
              </MenuItem>

              <MenuItem
                onClick={() => setSortBy("quantity")}
                className="cursor-pointer"
              >
                <p className="text-sm text-left text-gray-500  py-3">
                  Quantity
                </p>
              </MenuItem>

              <MenuItem
                onClick={() => setSortBy("price")}
                className="cursor-pointer"
              >
                <p className="text-sm text-left text-gray-500  py-3">Price</p>
              </MenuItem>
            </MenuItems>
          </Menu>

          <button
            onClick={handleAddItem}
            className="flex h-9 items-center gap-2 rounded-md border border-[#b7e6c7] bg-white px-3 text-[#008f45] shadow-sm"
          >
            <p className="text-xs font-medium">Add Item</p>
            <FontAwesomeIcon icon={faPlus} className="text-xs" />
          </button>
        </div>
      </div>

      <div className="mt-4 w-full overflow-x-auto">
        <table className="w-full min-w-[620px] divide-y divide-[#eef2f6]">
          <thead className="bg-[#fbfcfd]">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-[0.04em] text-[#667085]"
              >
                Product
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-[0.04em] text-[#667085]"
              >
                Quantity
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-[0.04em] text-[#667085]"
              >
                Unit Price
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-[0.04em] text-[#667085]"
              >
                Vendor Price
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-[10px] font-medium uppercase tracking-[0.04em] text-[#667085]"
              >
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eef2f6] bg-white">
            {orderItems.map((item, index) => (
              <tr key={index}>
                <td className="px-4 py-5 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      <img
                        className="h-10 w-10 rounded-lg object-cover"
                        src={
                          item.product?.images?.[0] || assets.image_placeholder
                        }
                        alt=""
                      />
                    </div>
                    <div className="ml-4 max-w-[10rem]">
                      <div className="text-xs font-medium leading-5 text-[#111827] text-wrap">
                        {item.product?.name || item.name || "Product"}
                      </div>
                      <span className="mt-1 inline-flex rounded-md bg-[#eef2f6] px-2 py-0.5 text-[10px] font-medium text-[#667085]">
                        SKU: {item.product?.sku || item.sku || item.productSku || "MFP-8"}
                      </span>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-5 whitespace-nowrap text-xs font-medium text-[#111827]">
                  {item.quantity}
                </td>
                <td className="px-4 py-5 whitespace-nowrap text-xs font-medium text-[#344054]">
                  {formatMoney(item.price)}
                </td>
                <td className="px-4 py-5 whitespace-nowrap text-xs font-medium text-[#344054]">
                  {getVendorPrice(item) ? formatMoney(getVendorPrice(item)) : "-"}
                </td>
                <td className="px-4 py-5 text-right text-xs font-medium text-[#101828]">
                  {formatMoney(Number(item.price || 0) * Number(item.quantity || 0))}
                </td>
              </tr>
            ))}
            {orderItems.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-12 text-center text-sm text-[#667085]"
                >
                  No order items found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 border-t border-[#e5e7eb] pt-4">
        <div className="flex items-center justify-between text-sm">
          <p className="font-medium text-[#101828]">Items Total</p>
          <p className="font-medium text-[#101828]">{formatMoney(itemsTotal)}</p>
        </div>
        <button
          type="button"
          onClick={copyOrderItems}
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-md border border-[#b7e6c7] bg-white px-4 text-xs font-medium text-[#008f45] hover:bg-[#f4fbf6]"
        >
          <FontAwesomeIcon icon={faCopy} />
          Copy Order Items
        </button>
        <p className="mt-3 text-xs font-medium text-[#667085]">
          Copy all order items (product, quantity, price)
        </p>
      </div>

      {/* Add Item Modal */}
      <Dialog
        open={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <DialogPanel className="max-w-lg w-full bg-white rounded-xl p-6">
            <DialogTitle className="text-lg font-semibold mb-4">
              Add Item to Order
            </DialogTitle>

            {/* Search Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Product
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Type to search products..."
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#61BF75] focus:border-transparent"
              />
            </div>

            {/* Search Results */}
            {isSearching ? (
              <div className="mb-4 max-h-40 overflow-y-auto border border-gray-200 rounded-md flex flex-col gap-2 p-3">
                {[...Array(3)].map((_, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 animate-pulse"
                  >
                    <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                    <div className="flex flex-col gap-2 w-full">
                      <div className="h-4 bg-gray-200 rounded w-32" />
                      <div className="h-3 bg-gray-100 rounded w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              searchResults.length > 0 && (
                <div className="mb-4 max-h-40 overflow-y-auto border border-gray-200 rounded-md">
                  {searchResults.map((productLocation) => (
                    <div
                      key={productLocation.id}
                      onClick={() => handleSelectProduct(productLocation)}
                      className="p-3 hover:bg-gray-200 cursor-pointer border-b border-gray-100 my-2 "
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={productLocation.product.images[0]}
                          alt={productLocation.product.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div>
                          <p className="text-sm font-medium">
                            {productLocation.product.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {productLocation.category}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Selected Product Details */}
            {selectedProduct && (
              <div className="mb-4 p-4 border border-gray-200 rounded-md bg-gray-50">
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={selectedProduct.product.images[0]}
                    alt={selectedProduct.product.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div>
                    <p className="font-medium">
                      {selectedProduct.product.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedProduct.product.category}
                    </p>
                  </div>
                </div>

                {/* Quantity Input */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") {
                        setQuantity(""); // allow empty string for editing
                      } else {
                        setQuantity(Math.max(1, parseInt(val, 10) || 1));
                      }
                    }}
                    onBlur={() => {
                      if (quantity === "" || isNaN(quantity)) setQuantity(1);
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>

                {/* Price Selection */}
                {selectedProduct.uom && selectedProduct.uom.length > 0 && (
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Price
                    </label>
                    <select
                      value={selectedPrice}
                      onChange={(e) =>
                        setSelectedPrice(parseFloat(e.target.value))
                      }
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      {selectedProduct.uom.map((uom, index) => (
                        <option key={index} value={uom.platformPrice}>
                          {new Intl.NumberFormat("en-NG", {
                            style: "currency",
                            currency,
                          }).format(uom.platformPrice)}{" "}
                          - {uom.unit}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Total Price Preview */}
                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <span className="text-sm font-medium">Total:</span>
                  <span className="font-semibold">
                    {new Intl.NumberFormat("en-NG", {
                      style: "currency",
                      currency,
                    }).format(selectedPrice * quantity)}
                  </span>
                </div>

                {/* Modal Actions */}
                <div className="flex justify-end gap-3 my-4">
                  <button
                    onClick={handleAddToPending}
                    className="px-4 py-2 text-sm bg-[#61BF75] text-white rounded-md hover:bg-[#4fa862]"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* Pending Items Preview */}
            {pendingItems.length > 0 && (
              <div className="mb-4 p-4 border border-gray-200 rounded-md bg-gray-50">
                <p className="font-semibold mb-2">Items to Add:</p>
                <table className="w-full text-sm border border-gray-200 rounded-md">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-2 px-3 text-left">Product</th>
                      <th className="py-2 px-3 text-left">Quantity</th>
                      <th className="py-2 px-3 text-left">Price</th>
                      <th className="py-2 px-3 text-left">Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingItems.map((item, idx) => (
                      <tr key={idx} className="border-t border-gray-100">
                        <td className="py-2 px-3">{item.name}</td>
                        <td className="py-2 px-3">{item.quantity}</td>
                        <td className="py-2 px-3">
                          {new Intl.NumberFormat("en-NG", {
                            style: "currency",
                            currency,
                          }).format(item.price)}
                        </td>
                        <td className="py-2 px-3">
                          <button
                            onClick={() => {
                              setPendingItems(
                                pendingItems.filter((_, i) => i !== idx)
                              );
                            }}
                            className="text-red-500 hover:underline text-xs"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setIsAddItemModalOpen(false);
                  setSelectedProduct(null);
                  setSearchQuery("");
                  setSearchResults([]);
                  setQuantity(1);
                  setPendingItems([]);
                }}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitPendingItems}
                disabled={pendingItems.length === 0}
                className="px-4 py-2 text-sm bg-[#61BF75] text-white rounded-md hover:bg-[#4fa862] disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Submit
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
};

export default OrderItems;
