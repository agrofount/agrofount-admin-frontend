import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import {
  faArrowLeft,
  faCalendarDays,
  faCartShopping,
  faChevronDown,
  faChevronRight,
  faCircleCheck,
  faCircleInfo,
  faClock,
  faFloppyDisk,
  faLocationDot,
  faMagnifyingGlass,
  faMoneyBill,
  faPen,
  faPlus,
  faRotateLeft,
  faSliders,
  faShieldHalved,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CheckIcon } from "@heroicons/react/16/solid";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { assets, uoms } from "../../assets/assets";
import { ShopContext } from "../../context/ShopContext";
import { apiClient } from "../../lib/apiClient";
import { FormSkeletonLoader, LoadingButtonContent } from "../common/LoadingStates";
import AddProductForm from "./AddProductForm";

const FieldLabel = ({ children, required = false }) => (
  <label className="mb-2 block text-xs font-semibold text-[#101828]">
    {children} {required && <span className="text-[#ef3340]">*</span>}
  </label>
);

const Card = ({ title, description, children, className = "" }) => (
  <section className={`rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.04)] ${className}`}>
    <div className="mb-4">
      <h2 className="text-sm font-semibold text-[#101828]">{title}</h2>
      {description && <p className="mt-2 text-xs font-medium text-[#667085]">{description}</p>}
    </div>
    {children}
  </section>
);

const TextInput = ({ className = "", ...props }) => (
  <input
    {...props}
    className={`h-10 w-full rounded-md border border-[#d0d5dd] bg-white px-3 text-xs text-[#101828] outline-none placeholder:text-[#98a2b3] focus:border-[#008f45] ${className}`}
  />
);

const SelectButton = ({ children, placeholder }) => (
  <ListboxButton className="relative h-10 w-full rounded-md border border-[#d0d5dd] bg-white px-3 pr-9 text-left text-xs text-[#101828] outline-none focus:border-[#008f45]">
    {children || <span className="text-[#667085]">{placeholder}</span>}
    <FontAwesomeIcon icon={faChevronDown} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#667085]" />
  </ListboxButton>
);

const SelectOptions = ({ children }) => (
  <ListboxOptions
    anchor="bottom"
    transition
    className="z-20 mt-1 max-h-60 w-[var(--button-width)] overflow-auto rounded-md border border-[#e5e7eb] bg-white p-1 shadow-lg"
  >
    {children}
  </ListboxOptions>
);

const SelectOption = ({ value, children }) => (
  <ListboxOption
    value={value}
    className="group flex cursor-pointer items-center gap-2 rounded px-3 py-1.5 text-xs text-[#344054] data-[focus]:bg-[#f8fafc]"
  >
    <CheckIcon className="invisible h-4 w-4 fill-[#008f45] group-data-[selected]:visible" />
    {children}
  </ListboxOption>
);

const getUnitName = (unit) => {
  if (!unit || typeof unit === "string") return unit || "";
  return unit.name || unit.unit || "";
};

const normalizeUomForPayload = (uom) => ({
  unit: getUnitName(uom.unit),
  vendorPrice: Number(uom.vendorPrice),
  platformPrice: Number(uom.platformPrice),
  ...(uom.moq !== undefined && uom.moq !== ""
    ? { moq: Number(uom.moq) }
    : {}),
  ...(uom.stockQuantity !== undefined && uom.stockQuantity !== ""
    ? { stockQuantity: Number(uom.stockQuantity) }
    : {}),
  ...(Array.isArray(uom.vtp)
    ? {
        vtp: uom.vtp.map((tier) => ({
          minVolume: Number(tier.minVolume),
          maxVolume: Number(tier.maxVolume),
          price: Number(tier.price),
          discount: Number(tier.discount),
        })),
      }
    : {}),
});

const AddProducts = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [showProductForm, setShowProductForm] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [formLoading, setFormLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [price, setPrice] = useState("");
  const [locations, setLocations] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableTo, setAvailableTo] = useState("");
  const [moq, setMoq] = useState("");
  const [uomSections, setUomSections] = useState([
    {
      id: 1,
      unit: uoms[0].name,
      vendorPrice: "",
      platformPrice: "",
      vtp: [{ minVolume: "", maxVolume: "", price: "", discount: "" }],
    },
  ]);

  const { country_id, navigate } = useContext(ShopContext);

  const steps = [
    { id: 1, title: "Select Product", description: "Choose existing or create new" },
    { id: 2, title: "Location & Pricing", description: "Set price and availability" },
    { id: 3, title: "Review & Save", description: "Confirm and publish" },
  ];

  const filteredProducts = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return products;

    return products.filter((product) =>
      [product.name, product.brand, product.sku, product.code]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(cleanQuery))
    );
  }, [products, query]);

  const getLocations = useCallback(async () => {
    try {
      const response = await apiClient.get("/state", {
        params: { "filter.country.id": country_id },
      });
      if (response.status === 200) setLocations(response.data.data || []);
    } catch (error) {
      toast.error(error.message || "Unable to load locations.");
    }
  }, [country_id]);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await apiClient.get("/product");
      const productData = response.data?.data || [];
      setProducts(productData);
      setSelectedProduct((current) => current || productData[0] || null);
    } catch (error) {
      toast.error(error.message || "Unable to load products.");
    }
  }, []);

  useEffect(() => {
    const loadFormOptions = async () => {
      try {
        setFormLoading(true);
        await Promise.all([fetchProducts(), getLocations()]);
      } finally {
        setFormLoading(false);
      }
    };

    loadFormOptions();
  }, [fetchProducts, getLocations]);

  const handleProductCreated = (product) => {
    setSelectedProduct(product || null);
    setShowProductForm(false);
    setCurrentStep(2);
  };

  const handleKeyDown = (event) => {
    if (event.key === "-" || event.key === "e") event.preventDefault();
  };

  const handleInputChange = (index, field, value) => {
    setUomSections((sections) =>
      sections.map((section, sectionIndex) =>
        sectionIndex === index ? { ...section, [field]: Number(value) } : section
      )
    );
  };

  const handleVtpChange = (uomIndex, vtpIndex, field, value) => {
    setUomSections((sections) =>
      sections.map((section, sectionIndex) => {
        if (sectionIndex !== uomIndex) return section;
        const nextVtp = section.vtp.map((vtp, index) => {
          if (index !== vtpIndex) return vtp;
          const next = { ...vtp, [field]: Number(value) };
          if (field === "discount" && section.platformPrice) {
            next.price = section.platformPrice - (section.platformPrice * Number(value)) / 100;
          }
          return next;
        });
        return { ...section, vtp: nextVtp };
      })
    );
  };

  const handleUomChange = (index, selectedUom) => {
    setUomSections((sections) =>
      sections.map((section, sectionIndex) =>
        sectionIndex === index ? { ...section, unit: selectedUom.name } : section
      )
    );
  };

  const addUomSection = () => {
    const usedUnits = uomSections.map((section) => section.unit);
    const availableUnit = uoms.find((uom) => !usedUnits.includes(uom.name)) || uoms[0];
    setUomSections((sections) => [
      ...sections,
      {
        id: Date.now(),
        unit: availableUnit.name,
        vendorPrice: "",
        platformPrice: "",
        vtp: [{ minVolume: "", maxVolume: "", price: "", discount: "" }],
      },
    ]);
  };

  const removeUomSection = (index) => {
    if (uomSections.length === 1) {
      toast.warn("At least one unit is required.");
      return;
    }
    setUomSections((sections) => sections.filter((_, sectionIndex) => sectionIndex !== index));
  };

  const handleCreateProductLocation = async () => {
    if (!selectedProduct) {
      toast.error("Please select a product");
      return;
    }
    if (!selectedLocation) {
      toast.error("Please select a location");
      return;
    }
    if (!price || isNaN(Number(price))) {
      toast.error("Please enter a valid price");
      return;
    }

    for (const section of uomSections) {
      if (!section.unit) {
        toast.error("Please select a unit for all UOM sections");
        return;
      }
      if (Number(section.vendorPrice) >= Number(section.platformPrice)) {
        toast.error("Vendor price must be less than platform price");
        return;
      }
      for (const vtp of section.vtp) {
        if (Number(vtp.minVolume) >= Number(vtp.maxVolume)) {
          toast.error("Minimum volume must be less than maximum volume");
          return;
        }
      }
    }

    const payload = {
      countryId: country_id,
      stateId: selectedLocation.id,
      productId: selectedProduct.id,
      price: Number(price),
      uom: uomSections.map(normalizeUomForPayload),
      moq: Number(moq),
      availableDates: availableFrom ? [availableFrom] : [],
    };

    try {
      setProcessing(true);
      const response = await apiClient.post("/product-location", payload);
      if (response.status === 201) {
        toast.success("Product location created successfully");
        navigate("/list-products");
      }
    } catch (error) {
      toast.error(error.message || "Failed to create product location");
    } finally {
      setProcessing(false);
    }
  };

  const selectedImage = selectedProduct?.images?.[0] || assets.image_placeholder;
  const selectedStatus = selectedProduct?.status || (selectedProduct?.isAvailable === false ? "Inactive" : "Active");
  const canContinueFromProduct = Boolean(selectedProduct);

  const renderStepper = () => (
    <div className="grid gap-3 md:grid-cols-4">
      {steps.map((step, index) => {
        const active = currentStep === step.id;
        const complete = currentStep > step.id;
        return (
          <div key={step.id} className="flex items-center gap-3">
            <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold ${
              active || complete ? "bg-[#008f45] text-white" : "bg-[#e5e7eb] text-[#101828]"
            }`}>
              {complete ? <FontAwesomeIcon icon={faCircleCheck} /> : step.id}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#101828]">{step.title}</p>
              <p className="text-xs font-medium text-[#667085]">{step.description}</p>
            </div>
            {index < steps.length - 1 && <div className="hidden h-px flex-1 bg-[#d0d5dd] md:block" />}
          </div>
        );
      })}
    </div>
  );

  const renderProductSelectionStep = () => (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
      <Card title="1. Select a Product" description="Search for an existing product or create a new one.">
        <div className="relative">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-[#667085]" />
          <TextInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by product name, brand or SKU..."
            className="h-11 rounded-full pl-10"
          />
        </div>

        <p className="mt-5 text-xs font-semibold text-[#101828]">Matching Products</p>
        <div className="mt-3 space-y-2">
          {filteredProducts.length > 0 ? filteredProducts.slice(0, 8).map((product) => {
            const active = selectedProduct?.id === product.id;
            return (
              <button
                key={product.id}
                type="button"
                onClick={() => setSelectedProduct(product)}
                className={`grid w-full grid-cols-[auto_52px_minmax(0,1fr)_auto_auto] items-center gap-3 rounded-md border p-3 text-left transition ${
                  active ? "border-[#20a45b] bg-[#f0fdf4]" : "border-[#e5e7eb] bg-white hover:border-[#b9e7ca]"
                }`}
              >
                <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${active ? "bg-[#008f45] text-white" : "bg-[#eef2f6] text-transparent"}`}>
                  <FontAwesomeIcon icon={faCircleCheck} />
                </span>
                <img src={product.images?.[0] || assets.image_placeholder} alt="" className="h-12 w-12 rounded-md border border-[#e5e7eb] object-cover" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-[#101828]">{product.name || "Untitled product"}</span>
                  <span className="mt-0.5 block truncate text-xs font-medium text-[#667085]">
                    {[product.category, product.brand].filter(Boolean).join(" • ") || "No category"}
                  </span>
                  <span className="mt-0.5 block text-xs text-[#667085]">SKU: {product.sku || product.code || "N/A"}</span>
                </span>
                <span className="rounded-full bg-[#dcfce7] px-2.5 py-1 text-[11px] font-semibold text-[#008f45]">
                  {product.status || (product.isAvailable === false ? "Inactive" : "Active")}
                </span>
                <FontAwesomeIcon icon={faChevronRight} className="text-xs text-[#667085]" />
              </button>
            );
          }) : (
            <div className="rounded-md border border-dashed border-[#d0d5dd] p-6 text-center text-sm font-medium text-[#667085]">
              No products match your search.
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-3 rounded-md border border-[#d0d5dd] bg-[#fbfcfd] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-md border border-[#20a45b] text-[#008f45]">
              <FontAwesomeIcon icon={faPlus} />
            </span>
            <div>
              <p className="text-sm font-semibold text-[#101828]">Can&apos;t find the product you&apos;re looking for?</p>
              <p className="mt-1 text-xs font-medium text-[#667085]">Create a new product first, then return here to set its location, pricing and stock.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowProductForm(true)}
            className="h-10 rounded-md border border-[#20a45b] px-4 text-xs font-semibold text-[#008f45]"
          >
            Create New Product
          </button>
        </div>
      </Card>

      <div className="space-y-4">
        <Card title="Selected Product" description="Review the product you've selected.">
          {selectedProduct ? (
            <div className="overflow-hidden rounded-md border border-[#e5e7eb]">
              <div className="grid h-56 place-items-center bg-white">
                <img src={selectedImage} alt="" className="h-full max-h-52 w-full object-contain" />
              </div>
              <div className="border-t border-[#e5e7eb] p-4">
                <h2 className="text-base font-semibold text-[#101828]">{selectedProduct.name}</h2>
                {[
                  ["Category", selectedProduct.category || selectedProduct.primaryCategory || "N/A"],
                  ["Brand", selectedProduct.brand || "N/A"],
                  ["SKU", selectedProduct.sku || selectedProduct.code || "N/A"],
                  ["Status", selectedStatus],
                ].map(([label, value]) => (
                  <div key={label} className="mt-3 grid grid-cols-2 gap-3 text-xs">
                    <p className="font-semibold text-[#344054]">{label}</p>
                    <p className="font-medium text-[#101828]">
                      {label === "Status" ? (
                        <span className="rounded-full bg-[#dcfce7] px-2.5 py-1 text-[11px] font-semibold text-[#008f45]">{value}</span>
                      ) : value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-[#d0d5dd] p-8 text-center text-sm font-medium text-[#667085]">
              Select a product to preview it here.
            </div>
          )}
        </Card>

        <div className="rounded-md border border-[#b9e7ca] bg-[#f0fdf4] p-4 text-[#006638]">
          <div className="flex gap-3">
            <FontAwesomeIcon icon={faCircleInfo} className="mt-0.5" />
            <div>
              <p className="text-sm font-semibold">Next Step</p>
              <p className="mt-1 text-xs font-medium">Set the location, pricing, availability and other details for this product.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProductSummaryHeader = () => (
    <Card>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <img src={selectedImage} alt="" className="h-20 w-20 rounded-md border border-[#e5e7eb] object-contain" />
          <div>
            <h2 className="text-lg font-semibold text-[#101828]">{selectedProduct?.name || "Selected product"}</h2>
            <p className="mt-1 text-xs font-medium text-[#344054]">
              Brand: {selectedProduct?.brand || "N/A"}
              <span className="mx-2 text-[#98a2b3]">•</span>
              Category: {selectedProduct?.category || selectedProduct?.primaryCategory || "N/A"}
              <span className="mx-2 text-[#98a2b3]">•</span>
              SKU: {selectedProduct?.sku || selectedProduct?.code || "N/A"}
            </p>
            <span className="mt-2 inline-flex rounded-full bg-[#dcfce7] px-2.5 py-1 text-[11px] font-semibold text-[#008f45]">
              {selectedStatus}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#d0d5dd] px-4 text-xs font-semibold text-[#344054]"
        >
          <FontAwesomeIcon icon={faRotateLeft} />
          Change Product
        </button>
      </div>
    </Card>
  );

  const formatAvailability = () => {
    if (!availableFrom && !availableTo) return "—";
    if (availableFrom && availableTo) return `${availableFrom} to ${availableTo}`;
    return availableFrom || availableTo;
  };

  const renderLocationPricingStep = () => (
    <div className="space-y-4">
      {renderProductSummaryHeader()}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card title="2. Location & Pricing" description="Set the location, price, availability and minimum order quantity for this product.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <FieldLabel required>Location</FieldLabel>
              <Listbox value={selectedLocation} onChange={setSelectedLocation}>
                <SelectButton placeholder="Select location">{selectedLocation?.name}</SelectButton>
                <SelectOptions>
                  {locations.map((location) => <SelectOption key={location.id || location.name} value={location}>{location.name}</SelectOption>)}
                </SelectOptions>
              </Listbox>
              <p className="mt-2 text-xs font-medium text-[#667085]">Select the location where this product will be available.</p>
            </div>
            <div>
              <FieldLabel required>Price (₦)</FieldLabel>
              <div className="flex h-10 overflow-hidden rounded-md border border-[#d0d5dd] bg-white focus-within:border-[#008f45]">
                <span className="grid place-items-center px-3 text-xs font-semibold text-[#667085]">₦</span>
                <input
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter price"
                  className="min-w-0 flex-1 text-xs outline-none placeholder:text-[#98a2b3]"
                />
              </div>
              <p className="mt-2 text-xs font-medium text-[#667085]">Selling price for this location.</p>
            </div>
            <div>
              <FieldLabel required>Minimum Order Quantity</FieldLabel>
              <TextInput
                type="number"
                min={0}
                value={moq}
                onKeyDown={handleKeyDown}
                onChange={(event) => setMoq(event.target.value)}
                placeholder="Enter minimum quantity"
              />
              <p className="mt-2 text-xs font-medium text-[#667085]">Minimum quantity a customer can order.</p>
            </div>
            <div className="space-y-4">
              <div>
                <FieldLabel required>Available From</FieldLabel>
                <div className="relative">
                  <TextInput type="date" value={availableFrom} onChange={(event) => setAvailableFrom(event.target.value)} className="pr-10" />
                  <FontAwesomeIcon icon={faCalendarDays} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#667085]" />
                </div>
                <p className="mt-2 text-xs font-medium text-[#667085]">Date from which product is available.</p>
              </div>
              <div>
                <FieldLabel>Available To (Optional)</FieldLabel>
                <div className="relative">
                  <TextInput type="date" value={availableTo} onChange={(event) => setAvailableTo(event.target.value)} className="pr-10" />
                  <FontAwesomeIcon icon={faCalendarDays} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#667085]" />
                </div>
                <p className="mt-2 text-xs font-medium text-[#667085]">Date until which product is available.</p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-md border border-[#e5e7eb] p-3">
            <h3 className="text-sm font-semibold text-[#101828]">Price & Volume Tiers (Optional)</h3>
            <p className="mt-1 text-xs font-medium text-[#667085]">Set different prices based on order volume. Leave empty to use a single price.</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-xs">
                <thead className="bg-[#f8fafc] text-[#101828]">
                  <tr>
                    <th className="px-2 py-2">Unit</th>
                    <th className="px-2 py-2">Min Volume</th>
                    <th className="px-2 py-2">Max Volume</th>
                    <th className="px-2 py-2">Platform Price (₦)</th>
                    <th className="px-2 py-2">Vendor Price (₦)</th>
                    <th className="px-2 py-2">Discount (%)</th>
                    <th className="px-2 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {uomSections.map((section, index) => {
                    const tier = section.vtp[0] || {};
                    return (
                      <tr key={section.id}>
                        <td className="px-2 py-2">
                          <Listbox value={section.unit} onChange={(uom) => handleUomChange(index, uom)}>
                            <SelectButton>{section.unit}</SelectButton>
                            <SelectOptions>
                              {uoms.map((uom) => <SelectOption key={uom.name} value={uom}>{uom.name}</SelectOption>)}
                            </SelectOptions>
                          </Listbox>
                        </td>
                        <td className="px-2 py-2"><TextInput type="number" min={0} value={tier.minVolume} placeholder="1" onKeyDown={handleKeyDown} onChange={(e) => handleVtpChange(index, 0, "minVolume", e.target.value)} /></td>
                        <td className="px-2 py-2"><TextInput type="number" min={0} value={tier.maxVolume} placeholder="49" onKeyDown={handleKeyDown} onChange={(e) => handleVtpChange(index, 0, "maxVolume", e.target.value)} /></td>
                        <td className="px-2 py-2"><TextInput type="number" min={0} value={section.platformPrice} placeholder="e.g. 4500" onKeyDown={handleKeyDown} onChange={(e) => handleInputChange(index, "platformPrice", e.target.value)} /></td>
                        <td className="px-2 py-2"><TextInput type="number" min={0} value={section.vendorPrice} placeholder="e.g. 4200" onKeyDown={handleKeyDown} onChange={(e) => handleInputChange(index, "vendorPrice", e.target.value)} /></td>
                        <td className="px-2 py-2"><TextInput type="number" min={0} value={tier.discount} placeholder="e.g. 5" onKeyDown={handleKeyDown} onChange={(e) => handleVtpChange(index, 0, "discount", e.target.value)} /></td>
                        <td className="px-2 py-2">
                          <button type="button" onClick={() => removeUomSection(index)} className="grid h-9 w-9 place-items-center rounded-md text-[#ef3340] hover:bg-[#fff1f1]">
                            <FontAwesomeIcon icon={faTrashCan} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <button type="button" onClick={addUomSection} className="mt-3 inline-flex h-9 items-center gap-2 rounded-md border border-[#20a45b] px-4 text-xs font-semibold text-[#008f45]">
              <FontAwesomeIcon icon={faPlus} />
              Add Another Tier
            </button>
          </div>
        </Card>

        <Card title="Location Summary" description="Review the details you've entered.">
          <div className="space-y-5 text-xs">
            {[
              [faLocationDot, "Location", selectedLocation?.name || "—"],
              [faMoneyBill, "Price", price ? `₦${Number(price).toLocaleString()}` : "—"],
              [faCartShopping, "Min Order Quantity", moq || "—"],
              [faClock, "Availability", formatAvailability()],
              [faSliders, "Price Tiers", `${uomSections.filter((section) => section.platformPrice || section.vendorPrice || section.vtp?.[0]?.price).length} tier(s) added`],
            ].map(([icon, label, value]) => (
              <div key={label} className="grid grid-cols-[20px_1fr_auto] items-center gap-3">
                <FontAwesomeIcon icon={icon} className="text-[#667085]" />
                <span className="font-semibold text-[#344054]">{label}</span>
                <span className={label === "Price Tiers" ? "font-semibold text-[#1f7ae0]" : "font-medium text-[#101828]"}>{value}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-md border border-[#b9e7ca] bg-[#f0fdf4] p-4 text-[#006638]">
            <div className="flex gap-3">
              <FontAwesomeIcon icon={faCircleInfo} className="mt-0.5" />
              <div>
                <p className="text-sm font-semibold">What&apos;s Next?</p>
                <p className="mt-1 text-xs font-medium">Next, review the selected product, location, pricing and tiers before publishing.</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  const reviewTiers = uomSections.filter((section) => {
    const tier = section.vtp?.[0] || {};
    return section.platformPrice || section.vendorPrice || tier.minVolume || tier.maxVolume || tier.price || tier.discount;
  });

  const renderReviewStep = () => (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <Card title="3. Review & Save" description="Review all details before adding this product to the selected location.">
        <div className="space-y-4">
          <div className="rounded-md border border-[#e5e7eb] p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#101828]">Product Details</h3>
              <button type="button" onClick={() => setCurrentStep(1)} className="inline-flex h-8 items-center gap-2 rounded-md border border-[#d0d5dd] px-3 text-xs font-semibold text-[#344054]">
                <FontAwesomeIcon icon={faPen} />
                Edit
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-[160px_minmax(0,1fr)]">
              <div className="grid h-36 place-items-center rounded-md border border-[#e5e7eb] bg-[#fbfcfd]">
                <img src={selectedImage} alt="" className="h-full max-h-32 w-full object-contain" />
              </div>
              <div className="grid gap-3 text-xs md:grid-cols-2">
                {[
                  ["Product Name", selectedProduct?.name || "—"],
                  ["Brand", selectedProduct?.brand || "—"],
                  ["Category", [selectedProduct?.primaryCategory, selectedProduct?.category, selectedProduct?.subCategory].filter(Boolean).join(" > ") || "—"],
                  ["SKU (Global)", selectedProduct?.sku || selectedProduct?.code || "—"],
                  ["Status", selectedStatus],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="font-semibold text-[#667085]">{label}</p>
                    <p className="mt-1 font-semibold text-[#101828]">
                      {label === "Status" ? (
                        <span className="rounded-full bg-[#dcfce7] px-2.5 py-1 text-[11px] text-[#008f45]">{value}</span>
                      ) : value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-md border border-[#e5e7eb] p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#101828]">Location & Pricing</h3>
              <button type="button" onClick={() => setCurrentStep(2)} className="inline-flex h-8 items-center gap-2 rounded-md border border-[#d0d5dd] px-3 text-xs font-semibold text-[#344054]">
                <FontAwesomeIcon icon={faPen} />
                Edit
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-3 text-xs">
                {[
                  ["Location", selectedLocation?.name || "—"],
                  ["Price", price ? `₦${Number(price).toLocaleString()}` : "—"],
                  ["Minimum Order Quantity", moq || "—"],
                  ["Availability", formatAvailability()],
                ].map(([label, value]) => (
                  <div key={label} className="grid grid-cols-2 gap-3">
                    <p className="font-semibold text-[#667085]">{label}</p>
                    <p className="font-semibold text-[#101828]">{value}</p>
                  </div>
                ))}
              </div>
              <div className="grid gap-2 text-xs">
                <p className="font-semibold text-[#667085]">Price Tiers ({reviewTiers.length})</p>
                {reviewTiers.length > 0 ? reviewTiers.map((section) => {
                  const tier = section.vtp?.[0] || {};
                  const min = tier.minVolume || "—";
                  const max = tier.maxVolume || "No max";
                  const tierPrice = tier.price || section.platformPrice || price;
                  return (
                    <div key={section.id} className="grid grid-cols-2 gap-3 border-b border-[#eef2f6] py-1.5 last:border-0">
                      <p className="font-medium text-[#344054]">{min} - {max} {section.unit}</p>
                      <p className="text-right font-semibold text-[#101828]">{tierPrice ? `₦${Number(tierPrice).toLocaleString()}` : "—"}</p>
                    </div>
                  );
                }) : (
                  <p className="font-medium text-[#667085]">No volume tiers added.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card title="Summary" description="Here's a summary of the product you're adding.">
        <div className="overflow-hidden rounded-md border border-[#e5e7eb]">
          <div className="flex items-center gap-3 p-4">
            <img src={selectedImage} alt="" className="h-16 w-16 rounded-md border border-[#e5e7eb] object-contain" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#101828]">{selectedProduct?.name || "—"}</p>
              <p className="mt-1 truncate text-xs font-medium text-[#667085]">{[selectedProduct?.brand, selectedProduct?.sku || selectedProduct?.code].filter(Boolean).join(" • ") || "—"}</p>
            </div>
            <span className="rounded-full bg-[#dcfce7] px-2.5 py-1 text-[11px] font-semibold text-[#008f45]">{selectedStatus}</span>
          </div>
          <div className="border-t border-[#e5e7eb] p-4">
            <div className="space-y-5 text-xs">
              {[
                [faLocationDot, "Location", selectedLocation?.name || "—"],
                [faMoneyBill, "Price", price ? `₦${Number(price).toLocaleString()}` : "—"],
                [faCartShopping, "Min. Order Quantity", moq || "—"],
                [faClock, "Availability", formatAvailability()],
                [faSliders, "Price Tiers", `${reviewTiers.length} tier(s)`],
              ].map(([icon, label, value]) => (
                <div key={label} className="grid grid-cols-[20px_1fr_auto] items-center gap-3">
                  <FontAwesomeIcon icon={icon} className="text-[#667085]" />
                  <span className="font-semibold text-[#344054]">{label}</span>
                  <span className="font-semibold text-[#101828]">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-md border border-[#b9e7ca] bg-[#f0fdf4] p-4 text-[#006638]">
          <div className="flex gap-3">
            <FontAwesomeIcon icon={faShieldHalved} className="mt-0.5" />
            <div>
              <p className="text-sm font-semibold">Looks good!</p>
              <p className="mt-1 text-xs font-medium">You&apos;re ready to add this product to the location. Click Save & Publish to make it available.</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="space-y-4 text-[#101828]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-lg font-semibold">Add Product</h1>
          <p className="mt-1 text-xs font-medium text-[#667085]">
            Add a product to a specific location with pricing and stock.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <div className="flex items-center gap-2 text-sm text-[#667085]">
            <Link to="/" className="hover:text-[#008f45]">Dashboard</Link>
            <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
            <Link to="/list-products" className="hover:text-[#008f45]">Products</Link>
            <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
            <span>Add Product</span>
          </div>
          <Link to="/list-products" className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-4 text-xs font-semibold text-[#101828] shadow-sm">
            <FontAwesomeIcon icon={faArrowLeft} />
            Back to products
          </Link>
        </div>
      </div>

      {renderStepper()}

      {formLoading ? (
        <FormSkeletonLoader />
      ) : showProductForm ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
          <Card title="Create New Product" description="Add the product details, then continue to location and pricing.">
            <AddProductForm
              onCancel={() => setShowProductForm(false)}
              onProductCreated={handleProductCreated}
            />
          </Card>
          <Card title="Next Step" description="Location and pricing unlock after the product is created.">
            <div className="rounded-md border border-[#b9e7ca] bg-[#f0fdf4] p-4 text-[#006638]">
              <div className="flex gap-3">
                <FontAwesomeIcon icon={faCircleInfo} className="mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">Create the product first</p>
                  <p className="mt-1 text-xs font-medium">Once saved, this page will move you to location, pricing and availability.</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : currentStep === 1 ? (
        renderProductSelectionStep()
      ) : currentStep === 2 ? (
        renderLocationPricingStep()
      ) : (
        renderReviewStep()
      )}

      {!formLoading && <section className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
        <div className={`flex flex-col gap-3 sm:flex-row ${currentStep === 3 && !showProductForm ? "sm:justify-between" : "sm:justify-end"}`}>
          {currentStep === 3 && !showProductForm ? (
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#d0d5dd] px-6 text-xs font-semibold text-[#344054]"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              Back to Location & Pricing
            </button>
          ) : (
            <Link to="/list-products" className="inline-flex h-10 items-center justify-center rounded-md border border-[#d0d5dd] px-14 text-xs font-semibold text-[#344054]">
              Cancel
            </Link>
          )}
          {showProductForm ? (
            <button
              type="button"
              onClick={() => setShowProductForm(false)}
              className="inline-flex h-10 min-w-48 items-center justify-center rounded-md bg-[#008f45] px-6 text-xs font-semibold text-white"
            >
              Back to Product Selection
            </button>
          ) : currentStep < 3 ? (
            <>
            {currentStep === 2 && (
              <button
                type="button"
                className="inline-flex h-10 min-w-40 items-center justify-center gap-2 rounded-md border border-[#d0d5dd] px-5 text-xs font-semibold text-[#344054]"
              >
                <FontAwesomeIcon icon={faFloppyDisk} />
                Save as Draft
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (currentStep === 1 && !canContinueFromProduct) {
                  toast.error("Please select a product");
                  return;
                }
                setCurrentStep((step) => Math.min(3, step + 1));
              }}
              disabled={currentStep === 1 && !canContinueFromProduct}
              className="inline-flex h-10 min-w-64 items-center justify-center gap-2 rounded-md bg-[#008f45] px-6 text-xs font-semibold text-white disabled:opacity-60"
            >
              {currentStep === 1 ? "Continue to Location & Pricing" : "Continue to Review & Save"}
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
            </>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="inline-flex h-10 min-w-40 items-center justify-center gap-2 rounded-md border border-[#d0d5dd] px-5 text-xs font-semibold text-[#344054]"
              >
                <FontAwesomeIcon icon={faFloppyDisk} />
                Save as Draft
              </button>
              <button
                type="button"
                onClick={handleCreateProductLocation}
                disabled={processing || !selectedProduct}
                className="inline-flex h-10 min-w-60 items-center justify-center rounded-md bg-[#008f45] px-6 text-xs font-semibold text-white disabled:opacity-60"
              >
                {processing ? <LoadingButtonContent label="Saving..." /> : "Save & Publish Product"}
              </button>
            </div>
          )}
        </div>
      </section>}
    </div>
  );
};

export default AddProducts;
