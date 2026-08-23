import { useCallback, useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ShopContext } from "../../context/ShopContext";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faCalendarDays,
  faCartShopping,
  faCheckCircle,
  faChevronRight,
  faClock,
  faFloppyDisk,
  faLocationDot,
  faMoneyBill,
  faPen,
  faShieldHalved,
  faSliders,
} from "@fortawesome/free-solid-svg-icons";
import { assets, uoms } from "../../assets/assets";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/16/solid";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import clsx from "clsx";
import UpdateProductForm from "./UpdateProductForm";
import SEOForm from "./SEOForm";
import { apiClient } from "../../lib/apiClient";
import { FormSkeletonLoader, LoadingButtonContent } from "../common/LoadingStates";

const FieldLabel = ({ children, required = false }) => (
  <label className="mb-2 block text-xs font-semibold text-[#101828]">
    {children} {required && <span className="text-[#ef3340]">*</span>}
  </label>
);

const Card = ({ title, description, children }) => (
  <section className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
    <div className="mb-4">
      <h2 className="text-sm font-semibold text-[#101828]">{title}</h2>
      {description && <p className="mt-2 text-xs font-medium text-[#667085]">{description}</p>}
    </div>
    {children}
  </section>
);

const inputClass =
  "h-10 w-full rounded-md border border-[#d0d5dd] bg-white px-3 text-xs text-[#101828] outline-none placeholder:text-[#98a2b3] focus:border-[#008f45]";

const selectButtonClass =
  "relative block h-10 w-full rounded-md border border-[#d0d5dd] bg-white px-3 pr-8 text-left text-xs text-[#101828] outline-none focus:border-[#008f45]";

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

const ProductUpdate = () => {
  const { slug } = useParams();
  const { country_id } = useContext(ShopContext);
  const [currentStep, setCurrentStep] = useState(1);
  const [productLocationData, setProductLocationData] = useState({});
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const [productLocationUpdated, setProductLocationUpdated] = useState(false);
  const [price, setPrice] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [locations, setLocations] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [moq, setMoq] = useState(5);

  const [uomSections, setUomSections] = useState([]);

  const handleKeyDown = (event) => {
    if (event.key === "-" || event.key === "e") {
      event.preventDefault();
    }
  };

  // Function to handle adding a new date
  const handleAddDate = (event) => {
    const selectedDate = event.target.value;
    if (selectedDate && !availableDates.includes(selectedDate)) {
      if (availableDates.length < 4) {
        setAvailableDates((prevDates) => [...prevDates, selectedDate]);
      } else {
        toast.warn("You can only select up to 4 dates.");
      }
    }
  };

  // Function to remove a date
  const handleRemoveDate = (dateToRemove) => {
    setAvailableDates((prevDates) =>
      prevDates.filter((date) => date !== dateToRemove)
    );
  };

  const addUomSection = () => {
    setUomSections([
      ...(uomSections || []),
      {
        id: (uomSections?.length || 0) + 1,
        unit: uoms[0].name,
        vendorPrice: "",
        platformPrice: "",
        vtp: [
          {
            minVolume: "",
            maxVolume: "",
            price: "",
            discount: "",
          },
        ],
      },
    ]);
  };

  const handleUomChange = (index, selectedUom) => {
    setUomSections((prevSections) =>
      prevSections.map((section, i) =>
        i === index ? { ...section, unit: getUnitName(selectedUom) } : section
      )
    );
  };

  const handleInputChange = (index, field, value) => {
    setUomSections((prevSections) =>
      prevSections.map((section, i) =>
        i === index
          ? { ...section, [field]: value ? Number(value) : "" }
          : section
      )
    );
  };

  const handleVtpChange = (uomIndex, vtpIndex, field, value) => {
    const newUomSections = [...uomSections];
    const currentVtp = newUomSections[uomIndex].vtp[vtpIndex];
    const platformPrice = newUomSections[uomIndex].platformPrice;

    currentVtp[field] = Number(value);

    if (
      (field === "discount" || field === "platformPrice") &&
      platformPrice &&
      currentVtp.discount
    ) {
      const discountAmount = (platformPrice * currentVtp.discount) / 100;
      currentVtp.price = platformPrice - discountAmount;
    }

    setUomSections(newUomSections);
  };

  const removeUomSection = (index) => {
    const newUomSections = uomSections.filter((_, i) => i !== index);
    setUomSections(newUomSections);
  };

  const getLocations = useCallback(async () => {
    try {
      const response = await apiClient.get("/state", {
        params: {
          "filter.country.id": country_id,
        },
      });

      if (response.status === 200) {
        setLocations(response.data.data);
      }
    } catch (error) {
      console.error(error);
    }
  }, [country_id]);

  const fetchProductData = useCallback(async () => {
    try {
      const response = await apiClient.get(`/product-location/${slug}`);
      if (response.data) {
        setProductLocationData(response.data);
        setAvailableDates(response.data.availableDates);
        setMoq(response.data.moq);
      } else {
        console.log("error", response);
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log("error", error);
      toast.error(error.message);
    } finally {
      setIsLoading(false); // Set loading to false after fetching
    }
  }, [slug]);

  const handleUpdateProductLocation = async () => {
    try {
      setProcessing(true);
      const cleanUom = (uomSections || productLocationData.uom).map(
        normalizeUomForPayload
      );
      const payload = {
        price: Number(price) || Number(productLocationData?.price),
        uom: cleanUom,
        moq: Number(moq),
        availableDates,
        countryId: country_id,
        stateId: selectedLocation?.id || productLocationData?.location_id,
      };

      await apiClient.put(`/product-location/${slug}`, payload);

      setProductLocationUpdated(true);
      toast.success("Product Location updated successfully");
    } catch (error) {
      console.error("an error occured: ", error);
      toast.error(error.message);
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchProductData();
      await getLocations();
    };

    fetchData();
  }, [fetchProductData, getLocations]);

  useEffect(() => {
    if (productLocationData?.uom) {
      setUomSections(productLocationData.uom);
    }
    if (productLocationData?.price !== undefined) {
      setPrice(productLocationData.price);
    }
  }, [productLocationData]);

  const product = productLocationData?.product || {};
  const selectedImage = product?.images?.[0] || assets.image_placeholder;
  const selectedLocationName = selectedLocation?.name || productLocationData?.state?.name || "—";
  const selectedStatus = product?.status || (product?.isAvailable === false ? "Inactive" : "Active");
  const availabilityLabel = availableDates?.length ? availableDates.join(", ") : "—";
  const reviewTiers = (uomSections || []).filter((section) => {
    const firstTier = section.vtp?.[0] || {};
    return section.platformPrice || section.vendorPrice || firstTier.minVolume || firstTier.maxVolume || firstTier.price || firstTier.discount;
  });
  const steps = [
    { id: 1, title: "Product Details", description: product?.name || "Edit product" },
    { id: 2, title: "Location & Pricing", description: `${selectedLocationName}${price ? `, ₦${Number(price).toLocaleString()}` : ""}` },
    { id: 3, title: "Review & Save", description: "Confirm and update" },
  ];

  const renderStepper = () => (
    <div className="grid gap-3 md:grid-cols-3">
      {steps.map((step, index) => {
        const active = currentStep === step.id;
        const complete = currentStep > step.id;
        return (
          <div key={step.id} className="flex items-center gap-3">
            <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold ${
              active || complete ? "bg-[#008f45] text-white" : "bg-[#e5e7eb] text-[#101828]"
            }`}>
              {complete ? <FontAwesomeIcon icon={faCheckCircle} /> : step.id}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#101828]">{step.title}</p>
              <p className="truncate text-xs font-medium text-[#667085]">{step.description}</p>
            </div>
            {index < steps.length - 1 && <div className="hidden h-px flex-1 bg-[#d0d5dd] md:block" />}
          </div>
        );
      })}
    </div>
  );

  const renderProductSummaryHeader = () => (
    <Card>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <img src={selectedImage} alt="" className="h-20 w-20 rounded-md border border-[#e5e7eb] object-contain" />
          <div>
            <h2 className="text-lg font-semibold text-[#101828]">{product?.name || "Selected product"}</h2>
            <p className="mt-1 text-xs font-medium text-[#344054]">
              Brand: {product?.brand || "N/A"}
              <span className="mx-2 text-[#98a2b3]">•</span>
              Category: {product?.category || product?.primaryCategory || "N/A"}
              <span className="mx-2 text-[#98a2b3]">•</span>
              SKU: {product?.sku || product?.code || "N/A"}
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
          <FontAwesomeIcon icon={faPen} />
          Edit Product
        </button>
      </div>
    </Card>
  );

  const renderProductDetailsStep = () => (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <UpdateProductForm productLocationData={productLocationData} />
      <Card title="Selected Product" description="Review the product being edited.">
        <div className="overflow-hidden rounded-md border border-[#e5e7eb]">
          <div className="grid h-56 place-items-center bg-white">
            <img src={selectedImage} alt="" className="h-full max-h-52 w-full object-contain" />
          </div>
          <div className="border-t border-[#e5e7eb] p-4">
            <h2 className="text-base font-semibold text-[#101828]">{product?.name || "—"}</h2>
            {[
              ["Category", product?.category || product?.primaryCategory || "N/A"],
              ["Brand", product?.brand || "N/A"],
              ["SKU", product?.sku || product?.code || "N/A"],
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
      </Card>
    </div>
  );

  const renderLocationPricingStep = () => (
    <div className="space-y-4">
      {renderProductSummaryHeader()}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card title="2. Location & Pricing" description="Update location, price, availability and minimum order quantity for this product.">
          {productLocationUpdated ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <FontAwesomeIcon icon={faCheckCircle} size="2x" className="text-[#008f45]" />
              <p className="text-sm font-semibold text-[#008f45]">Product location updated successfully</p>
              <button
                type="button"
                className="mt-4 h-10 rounded-md border border-[#d0d5dd] px-5 text-xs font-semibold text-[#101828]"
                onClick={() => setProductLocationUpdated(false)}
              >
                Continue editing
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel required>Location</FieldLabel>
                  <Listbox value={selectedLocation} onChange={setSelectedLocation}>
                    <ListboxButton className={clsx(selectButtonClass, "data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-[#61BF75]")}>
                      {selectedLocationName === "—" ? "Select location" : selectedLocationName}
                      <ChevronDownIcon className="group pointer-events-none absolute top-2.5 right-2.5 size-4 fill-gray-500" aria-hidden="true" />
                    </ListboxButton>
                    <ListboxOptions anchor="bottom" transition className="w-[var(--button-width)] rounded-xl border border-white/5 bg-white p-1 [--anchor-gap:var(--spacing-1)] focus:outline-[#61BF75]">
                      {locations.map((location) => (
                        <ListboxOption key={location.id || location.name} value={location} className="group flex cursor-default items-center gap-2 rounded-lg py-1.5 px-3 select-none data-[focus]:bg-white/10">
                          <CheckIcon className="invisible size-4 fill-white group-data-[selected]:visible" />
                          <div className="text-sm text-gray-500">{location.name}</div>
                        </ListboxOption>
                      ))}
                    </ListboxOptions>
                  </Listbox>
                  <p className="mt-2 text-xs font-medium text-[#667085]">Select the location where this product is available.</p>
                </div>
                <div>
                  <FieldLabel required>Price (₦)</FieldLabel>
                  <div className="flex h-10 items-center rounded-md border border-[#d0d5dd] bg-white pl-3 focus-within:border-[#008f45]">
                    <span className="shrink-0 select-none text-xs text-[#667085]">₦</span>
                    <input
                      id="price"
                      name="price"
                      type="number"
                      placeholder="Enter price"
                      min="0"
                      value={price ?? productLocationData.price}
                      onChange={(e) => setPrice(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="block min-w-0 grow px-2 text-xs text-[#101828] outline-none placeholder:text-[#98a2b3]"
                    />
                  </div>
                  <p className="mt-2 text-xs font-medium text-[#667085]">Selling price for this location.</p>
                </div>
                <div>
                  <FieldLabel required>Minimum Order Quantity</FieldLabel>
                  <input
                    type="number"
                    min={0}
                    onKeyDown={handleKeyDown}
                    placeholder="5"
                    value={moq}
                    onChange={(e) => setMoq(e.target.value)}
                    className={inputClass}
                  />
                  <p className="mt-2 text-xs font-medium text-[#667085]">Minimum quantity a customer can order.</p>
                </div>
                <div>
                  <FieldLabel>Available Dates</FieldLabel>
                  <div className="relative">
                    <input type="date" onChange={handleAddDate} className={`${inputClass} pr-10`} />
                    <FontAwesomeIcon icon={faCalendarDays} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#667085]" />
                  </div>
                  <p className="mt-2 text-xs font-medium text-[#667085]">Add one or more available dates.</p>
                </div>
              </div>

              {availableDates.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {availableDates.map((date, index) => (
                    <div key={`${date}-${index}`} className="flex items-center rounded-md border border-[#d0d5dd] px-3 py-2">
                      <span className="text-xs text-[#344054]">{date}</span>
                      <button type="button" onClick={() => handleRemoveDate(date)} className="ml-3 text-xs text-[#ef3340]">x</button>
                    </div>
                  ))}
                </div>
              )}

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
                        const tier = section.vtp?.[0] || {};
                        return (
                          <tr key={section.id || index}>
                            <td className="px-2 py-2">
                              <Listbox value={section.unit} onChange={(uom) => handleUomChange(index, uom)}>
                                <ListboxButton className={selectButtonClass}>
                                  {getUnitName(section.unit)}
                                  <ChevronDownIcon className="group pointer-events-none absolute top-2.5 right-2.5 size-4 fill-gray-500" aria-hidden="true" />
                                </ListboxButton>
                                <ListboxOptions anchor="bottom" transition className="w-[var(--button-width)] rounded-xl border border-white/5 bg-white p-1 [--anchor-gap:var(--spacing-1)] focus:outline-[#61BF75]">
                                  {uoms.map((uom) => <ListboxOption key={uom.name} value={uom.name} className="group flex cursor-default items-center gap-2 rounded-lg py-1.5 px-3 text-xs select-none data-[focus]:bg-[#f8fafc]">{uom.name}</ListboxOption>)}
                                </ListboxOptions>
                              </Listbox>
                            </td>
                            <td className="px-2 py-2"><input className={inputClass} type="number" min={0} value={tier.minVolume} onKeyDown={handleKeyDown} onChange={(e) => handleVtpChange(index, 0, "minVolume", e.target.value)} /></td>
                            <td className="px-2 py-2"><input className={inputClass} type="number" min={0} value={tier.maxVolume} onKeyDown={handleKeyDown} onChange={(e) => handleVtpChange(index, 0, "maxVolume", e.target.value)} /></td>
                            <td className="px-2 py-2"><input className={inputClass} type="number" min={0} value={section.platformPrice} onKeyDown={handleKeyDown} onChange={(e) => handleInputChange(index, "platformPrice", e.target.value)} /></td>
                            <td className="px-2 py-2"><input className={inputClass} type="number" min={0} value={section.vendorPrice} onKeyDown={handleKeyDown} onChange={(e) => handleInputChange(index, "vendorPrice", e.target.value)} /></td>
                            <td className="px-2 py-2"><input className={inputClass} type="number" min={0} value={tier.discount} onKeyDown={handleKeyDown} onChange={(e) => handleVtpChange(index, 0, "discount", e.target.value)} /></td>
                            <td className="px-2 py-2">
                              <button type="button" onClick={() => removeUomSection(index)} className="grid h-9 w-9 place-items-center rounded-md text-[#ef3340] hover:bg-[#fff1f1]">x</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <button type="button" onClick={addUomSection} className="mt-3 inline-flex h-9 items-center gap-2 rounded-md border border-[#20a45b] px-4 text-xs font-semibold text-[#008f45]">
                  Add Another Tier
                </button>
              </div>
            </>
          )}
        </Card>

        <Card title="Location Summary" description="Review the details you've entered.">
          <div className="space-y-5 text-xs">
            {[
              [faLocationDot, "Location", selectedLocationName],
              [faMoneyBill, "Price", price ? `₦${Number(price).toLocaleString()}` : "—"],
              [faCartShopping, "Min Order Quantity", moq || "—"],
              [faClock, "Availability", availabilityLabel],
              [faSliders, "Price Tiers", `${reviewTiers.length} tier(s) added`],
            ].map(([icon, label, value]) => (
              <div key={label} className="grid grid-cols-[20px_1fr_auto] items-center gap-3">
                <FontAwesomeIcon icon={icon} className="text-[#667085]" />
                <span className="font-semibold text-[#344054]">{label}</span>
                <span className={label === "Price Tiers" ? "font-semibold text-[#1f7ae0]" : "font-medium text-[#101828]"}>{value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <Card title="3. Review & Save" description="Review all details before updating this product location.">
        <div className="space-y-4">
          <div className="rounded-md border border-[#e5e7eb] p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#101828]">Product Details</h3>
              <button type="button" onClick={() => setCurrentStep(1)} className="inline-flex h-8 items-center gap-2 rounded-md border border-[#d0d5dd] px-3 text-xs font-semibold text-[#344054]">
                Edit
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-[160px_minmax(0,1fr)]">
              <div className="grid h-36 place-items-center rounded-md border border-[#e5e7eb] bg-[#fbfcfd]">
                <img src={selectedImage} alt="" className="h-full max-h-32 w-full object-contain" />
              </div>
              <div className="grid gap-3 text-xs md:grid-cols-2">
                {[
                  ["Product Name", product?.name || "—"],
                  ["Brand", product?.brand || "—"],
                  ["Category", [product?.primaryCategory, product?.category, product?.subCategory].filter(Boolean).join(" > ") || "—"],
                  ["SKU (Global)", product?.sku || product?.code || "—"],
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
                Edit
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-3 text-xs">
                {[
                  ["Location", selectedLocationName],
                  ["Price", price ? `₦${Number(price).toLocaleString()}` : "—"],
                  ["Minimum Order Quantity", moq || "—"],
                  ["Availability", availabilityLabel],
                ].map(([label, value]) => (
                  <div key={label} className="grid grid-cols-2 gap-3">
                    <p className="font-semibold text-[#667085]">{label}</p>
                    <p className="font-semibold text-[#101828]">{value}</p>
                  </div>
                ))}
              </div>
              <div className="grid gap-2 text-xs">
                <p className="font-semibold text-[#667085]">Price Tiers ({reviewTiers.length})</p>
                {reviewTiers.length > 0 ? reviewTiers.map((section, index) => {
                  const tier = section.vtp?.[0] || {};
                  const min = tier.minVolume || "—";
                  const max = tier.maxVolume || "No max";
                  const tierPrice = tier.price || section.platformPrice || price;
                  return (
                    <div key={section.id || index} className="grid grid-cols-2 gap-3 border-b border-[#eef2f6] py-1.5 last:border-0">
                      <p className="font-medium text-[#344054]">{min} - {max} {getUnitName(section.unit)}</p>
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

      <Card title="Summary" description="Here's a summary of the product location you're updating.">
        <div className="overflow-hidden rounded-md border border-[#e5e7eb]">
          <div className="flex items-center gap-3 p-4">
            <img src={selectedImage} alt="" className="h-16 w-16 rounded-md border border-[#e5e7eb] object-contain" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#101828]">{product?.name || "—"}</p>
              <p className="mt-1 truncate text-xs font-medium text-[#667085]">{[product?.brand, product?.sku || product?.code].filter(Boolean).join(" • ") || "—"}</p>
            </div>
            <span className="rounded-full bg-[#dcfce7] px-2.5 py-1 text-[11px] font-semibold text-[#008f45]">{selectedStatus}</span>
          </div>
          <div className="border-t border-[#e5e7eb] p-4">
            <div className="space-y-5 text-xs">
              {[
                [faLocationDot, "Location", selectedLocationName],
                [faMoneyBill, "Price", price ? `₦${Number(price).toLocaleString()}` : "—"],
                [faCartShopping, "Min. Order Quantity", moq || "—"],
                [faClock, "Availability", availabilityLabel],
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
              <p className="mt-1 text-xs font-medium">You&apos;re ready to update this product location. Click Save Changes to apply it.</p>
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
          <h1 className="text-lg font-semibold">Update Product</h1>
          <p className="mt-1 text-xs font-medium text-[#667085]">
            Edit product details, pricing, stock, and availability.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <div className="flex items-center gap-2 text-sm text-[#667085]">
            <Link to="/" className="hover:text-[#008f45]">Dashboard</Link>
            <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
            <Link to="/list-products" className="hover:text-[#008f45]">Products</Link>
            <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
            <span>Update Product</span>
          </div>
          <Link to="/list-products" className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-4 text-xs font-semibold text-[#101828] shadow-sm">
            <FontAwesomeIcon icon={faArrowLeft} />
            Back to products
          </Link>
        </div>
      </div>

      {isLoading ? (
        <FormSkeletonLoader />
      ) : (
        <>
          {renderStepper()}

          {currentStep === 1 && renderProductDetailsStep()}
          {currentStep === 2 && renderLocationPricingStep()}
          {currentStep === 3 && renderReviewStep()}

          <section className="flex flex-col gap-3 rounded-lg border border-[#e5e7eb] bg-white p-3 shadow-[0_8px_24px_rgba(16,24,40,0.04)] sm:flex-row sm:items-center sm:justify-between">
            {currentStep === 1 ? (
              <Link
                to="/list-products"
                className="inline-flex h-10 items-center justify-center rounded-md border border-[#d0d5dd] px-5 text-xs font-semibold text-[#101828]"
              >
                Cancel
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentStep((step) => Math.max(1, step - 1))}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#d0d5dd] px-5 text-xs font-semibold text-[#101828]"
              >
                <FontAwesomeIcon icon={faArrowLeft} />
                Back to {currentStep === 2 ? "Product Details" : "Location & Pricing"}
              </button>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {currentStep === 3 && (
                <button
                  type="button"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#d0d5dd] px-5 text-xs font-semibold text-[#344054]"
                >
                  <FontAwesomeIcon icon={faFloppyDisk} />
                  Save as Draft
                </button>
              )}
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep((step) => Math.min(3, step + 1))}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#008f45] px-5 text-xs font-semibold text-white shadow-sm hover:bg-[#007a3b]"
                >
                  Continue to {currentStep === 1 ? "Location & Pricing" : "Review & Save"}
                  <FontAwesomeIcon icon={faChevronRight} />
                </button>
              ) : (
                <button
                  type="button"
                  className="inline-flex h-10 min-w-48 items-center justify-center gap-2 rounded-md bg-[#008f45] px-5 text-xs font-semibold text-white shadow-sm hover:bg-[#007a3b] disabled:cursor-not-allowed disabled:opacity-70"
                  onClick={() => handleUpdateProductLocation()}
                  disabled={processing}
                >
                  {processing ? <LoadingButtonContent label="Saving..." /> : "Save Changes"}
                  {!processing && <FontAwesomeIcon icon={faCheckCircle} />}
                </button>
              )}
            </div>
          </section>

          <SEOForm productLocationData={productLocationData} />
        </>
      )}
    </div>
  );
};

export default ProductUpdate;
