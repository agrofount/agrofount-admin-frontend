import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Dialog,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import UpdateOrderItem from "./UpdateOrderItem";
import { assets } from "../../assets/assets";
import { useContext, useEffect, useState } from "react";
import { ShopContext } from "../../context/ShopContext";
import axios from "axios";
import qs from "qs";
import { toast } from "react-toastify";

const OrderItems = ({
  orderItems,
  setOrderItems,
  orderId,
  setUpdated,
  orderData,
}) => {
  const [sortBy, setSortBy] = useState("");
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedPrice, setSelectedPrice] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [pendingItems, setPendingItems] = useState([]); // For batch add

  const { currency, backend_url, token } = useContext(ShopContext);

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
      const response = await axios.get(`${backend_url}/product-location`, {
        params,
        paramsSerializer: (params) =>
          qs.stringify(params, { arrayFormat: "repeat" }),
      });
      console.log("search response:", response.data.data);
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
      const response = await axios.post(
        `${backend_url}/order/${orderId}/items`,
        pendingItems,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status === 201) {
        setIsAddItemModalOpen(false);
        setPendingItems([]);
        setSelectedProduct(null);
        setQuantity(1);
        setSelectedPrice(0);
        setUpdated(true);
        toast.success("Items added to order successfully");
      }
    } catch (error) {
      console.error("Error adding items to order:", error);
    }
  };

  const handleAddItem = () => {
    console.log("Adding item...", orderData);
    if (orderData.status !== "pending") {
      toast.error("Cannot add items to a non-pending order");
      return;
    }
    setIsAddItemModalOpen(true);
  };

  useEffect(() => {
    console.log("sorting items");
    const sortedItems = [...orderItems].sort((a, b) => {
      if (a[sortBy] < b[sortBy]) return -1;
      if (a[sortBy] > b[sortBy]) return 1;
      return 0;
    });
    setOrderItems(sortedItems);
  }, [sortBy]);

  return (
    <div className="flex flex-col bg-white rounded-lg p-5">
      <div className="flex flex-row justify-between items-center gap-5 bg-gray-100 p-3 rounded-sm w-full">
        <p className="font-semibold">All Items</p>
        <div className="flex flex-row items-center gap-3">
          <Menu>
            <MenuButton className="flex flex-row items-center gap-2 border border-gray-500 cursor-pointer py-1.5 px-3 rounded-md">
              <p className="text-sm">{sortBy || "SortBy"}</p>
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
            className="flex items-center gap-2 border border-[#61BF75] cursor-pointer py-1.5 px-3 rounded-md"
          >
            <p className="text-sm">Add Item</p>
            <img src={assets.add_icon} alt="" />
          </button>
        </div>
      </div>

      <div className="w-full h-80 overflow-y-scroll overflow-x-auto">
        <table className="w-full divide-y divide-gray-200  pb-20">
          <thead>
            <tr>
              <th
                scope="col"
                className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Product
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Quantity
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Price
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Vendor Price
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orderItems.map((item, index) => (
              <tr key={index}>
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <img
                        className="h-10 w-10 rounded-lg"
                        src={item.product.images[0]}
                        alt=""
                      />
                    </div>
                    <div className="ml-4 max-w-[10rem]">
                      <div className="text-sm font-medium text-gray-900 text-wrap">
                        {item.product.name}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-5 whitespace-nowrap text-sm">
                  {item.quantity}
                </td>
                <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500">
                  {new Intl.NumberFormat("en-NG", {
                    style: "currency",
                    currency,
                  }).format(item.price)}
                </td>
                <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500">
                  {(() => {
                    const matchedUom = item.uom?.find(
                      (uom) => uom.platformPrice === item.price
                    );
                    return matchedUom
                      ? new Intl.NumberFormat("en-NG", {
                          style: "currency",
                          currency,
                        }).format(matchedUom.vendorPrice)
                      : "-";
                  })()}
                </td>
                <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500">
                  <UpdateOrderItem
                    orderId={orderId}
                    orderItem={item}
                    setUpdated={setUpdated}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
