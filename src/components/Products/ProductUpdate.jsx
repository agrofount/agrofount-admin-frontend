import { useCallback, useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ShopContext } from "../../context/ShopContext";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faCheckCircle,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { assets, uoms } from "../../assets/assets";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/16/solid";
import {
  Field,
  Label,
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

const ProductUpdate = () => {
  const { slug } = useParams();
  const { country_id } = useContext(ShopContext);
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

  const handleAddVTP = (index) => {
    const newUomSections = [...uomSections];
    const currentVtp = newUomSections[index].vtp;

    // Optional: Prevent adding too many VTP entries
    if (currentVtp.length >= 3) {
      toast.warn("Maximum 3 volume tiers per UOM");
      return;
    }

    // Optional: Validate current VTP before adding a new one
    const lastVtp = currentVtp[currentVtp.length - 1];
    if (!lastVtp.minVolume || !lastVtp.maxVolume || !lastVtp.price) {
      toast.warn("Please fill the current volume tier before adding a new one");
      return;
    }

    // Add new VTP entry with default values
    currentVtp.push({
      minVolume: Number(lastVtp.maxVolume) + 1, // Auto-increment from last max
      maxVolume: "",
      price: "",
      discount: "",
    });

    setUomSections(newUomSections);
  };

  const handleRemoveVTP = (uomIndex, vtpIndex) => {
    const newUomSections = [...uomSections];
    const currentVtp = newUomSections[uomIndex].vtp;

    // Prevent removing the last VTP entry
    if (currentVtp.length <= 1) {
      toast.warn("At least one volume tier is required");
      return;
    }
    newUomSections[uomIndex].vtp = currentVtp.filter(
      (_, index) => index !== vtpIndex
    );
    setUomSections(newUomSections);
  };

  const handleUomChange = (index, selectedUom) => {
    setUomSections((prevSections) =>
      prevSections.map((section, i) =>
        i === index ? { ...section, unit: selectedUom.name } : section
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
      const cleanUom = (uomSections || productLocationData.uom).map((uom) =>
        Object.fromEntries(Object.entries(uom).filter(([k]) => k !== "id")),
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
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(480px,0.98fr)]">
        <div>
          <UpdateProductForm productLocationData={productLocationData} />
        </div>
        <div className="flex flex-col gap-4">
          <Card title="Pricing & Availability">
            {productLocationUpdated ? (
              <div className="flex flex-col items-center gap-2 py-8">
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  size="2x"
                  className="text-[#008f45]"
                />
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
              <div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <FieldLabel required>Price</FieldLabel>
                    <div className="mt-2">
                      <div className="flex h-10 items-center rounded-md border border-[#d0d5dd] bg-white pl-3 focus-within:border-[#008f45]">
                        <div className="shrink-0 select-none text-xs text-[#667085]">
                          ₦
                        </div>
                        <input
                          id="price"
                          name="price"
                          type="number"
                          placeholder="0.00"
                          min="0"
                          max="10000000"
                          value={price ?? productLocationData.price}
                          onChange={(e) => Number(setPrice(e.target.value))}
                          className="block min-w-0 grow px-2 text-xs text-[#101828] outline-none placeholder:text-[#98a2b3]"
                        />
                        <div className="grid shrink-0 grid-cols-1">
                          <select
                            id="currency"
                            name="currency"
                            aria-label="Currency"
                            className="col-start-1 row-start-1 h-8 appearance-none rounded-md bg-white py-1 pr-7 pl-3 text-xs text-[#667085] outline-none"
                          >
                            <option>NGN</option>
                            <option>GHS</option>
                            <option>CFA</option>
                          </select>
                          <ChevronDownIcon
                            aria-hidden="true"
                            className="pointer-events-none col-start-1 row-start-1 mr-2 size-4 self-center justify-self-end text-[#667085]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <FieldLabel required>Location</FieldLabel>
                      <Listbox
                        value={selectedLocation}
                        onChange={setSelectedLocation}
                      >
                        <ListboxButton
                          className={clsx(
                            selectButtonClass,
                            "data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-[#61BF75]"
                          )}
                        >
                          {selectedLocation?.name ??
                            productLocationData.state?.name ??
                            "Select location"}
                          <ChevronDownIcon
                            className="group pointer-events-none absolute top-2.5 right-2.5 size-4 fill-gray-500"
                            aria-hidden="true"
                          />
                        </ListboxButton>
                        <ListboxOptions
                          anchor="bottom"
                          transition
                          className={clsx(
                            "w-[var(--button-width)] rounded-xl border border-white/5 bg-white p-1 [--anchor-gap:var(--spacing-1)] focus:outline-[#61BF75]",
                            "transition duration-100 ease-in data-[leave]:data-[closed]:opacity-0"
                          )}
                        >
                          {locations.map((location) => (
                            <ListboxOption
                              key={location.name}
                              value={location}
                              className="group flex cursor-default items-center gap-2 rounded-lg py-1.5 px-3 select-none data-[focus]:bg-white/10"
                            >
                              <CheckIcon className="invisible size-4 fill-white group-data-[selected]:visible" />
                              <div className="text-sm text-gray-500">
                                {location.name}
                              </div>
                            </ListboxOption>
                          ))}
                        </ListboxOptions>
                      </Listbox>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
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
                  </div>
                  <div>
                    <FieldLabel>Available Dates</FieldLabel>
                    <input
                      type="date"
                      onChange={handleAddDate}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="flex flex-row gap-2 mt-3">
                  {availableDates.map((date, index) => (
                    <div
                      key={index}
                      className="mb-2 flex items-center justify-between rounded-md border border-[#d0d5dd] px-3 py-2"
                    >
                      <span className="text-xs text-[#344054]">{date}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDate(date)}
                        className="ml-3 cursor-pointer text-xs text-[#ef3340]"
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>

                <div>
                  <h2 className="mt-4 text-sm font-semibold text-[#101828]">Unit of Measurement</h2>
                  {uomSections?.map((section, index) => (
                    <div key={section.id || index} className="mt-3 rounded-md border border-[#e5e7eb] p-3">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
                        <div>
                          <Field>
                            <Label className="mb-2 block text-xs font-semibold text-[#101828]">
                              Unit <span className="text-red-600">*</span>
                            </Label>

                            <Listbox
                              value={section.unit}
                              onChange={(selectedUom) =>
                                handleUomChange(index, selectedUom)
                              }
                            >
                              <ListboxButton
                                className={clsx(
                                  selectButtonClass,
                                  "data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-[#61BF75]"
                                )}
                              >
                                {section.unit}
                                <ChevronDownIcon
                                  className="group pointer-events-none absolute top-2.5 right-2.5 size-4 fill-gray-500"
                                  aria-hidden="true"
                                />
                              </ListboxButton>
                              <ListboxOptions
                                anchor="bottom"
                                transition
                                className={clsx(
                                  "w-[var(--button-width)] rounded-xl border border-white/5 bg-white p-1 [--anchor-gap:var(--spacing-1)] focus:outline-[#61BF75]",
                                  "transition duration-100 ease-in data-[leave]:data-[closed]:opacity-0"
                                )}
                              >
                                {uoms.map((uom) => (
                                  <ListboxOption
                                    key={uom.name}
                                    value={uom}
                                    className="group flex cursor-default items-center gap-2 rounded-lg py-1.5 px-3 text-xs select-none data-[focus]:bg-[#f8fafc]"
                                  >
                                    <CheckIcon className="invisible size-4 fill-white group-data-[selected]:visible" />
                                    <div className="text-xs text-[#344054]">
                                      {uom.name}
                                    </div>
                                  </ListboxOption>
                                ))}
                              </ListboxOptions>
                            </Listbox>
                          </Field>
                        </div>
                        <div>
                          <Field>
                            <Label className="mb-2 block text-xs font-semibold text-[#101828]">
                              Vendor Price
                            </Label>
                            <input
                              type="number"
                              min={0}
                              onKeyDown={handleKeyDown}
                              placeholder="5000"
                              value={section.vendorPrice}
                              onChange={(e) =>
                                handleInputChange(
                                  index,
                                  "vendorPrice",
                                  e.target.value
                                )
                              }
                              className={inputClass}
                            />
                          </Field>
                        </div>

                        <div>
                          <Field>
                            <Label className="mb-2 block text-xs font-semibold text-[#101828]">
                              Platform Price
                            </Label>
                            <input
                              type="number"
                              min={0}
                              onKeyDown={handleKeyDown}
                              placeholder="5000"
                              value={section.platformPrice}
                              onChange={(e) =>
                                handleInputChange(
                                  index,
                                  "platformPrice",
                                  e.target.value
                                )
                              }
                              className={inputClass}
                            />
                          </Field>
                        </div>
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => removeUomSection(index)}
                            className="h-10 rounded-md border border-[#fecdd3] px-3 text-xs font-semibold text-[#ef3340] hover:bg-[#fff1f2]"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      {section.error && (
                        <p className="text-red-500 text-xs text-center mt-1">
                          {section.error}
                        </p>
                      )}

                      <div className="mt-3 space-y-3">
                        {section.vtp.map((vtp, vtpIndex) => (
                          <div
                            key={vtpIndex}
                            className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-end gap-3"
                          >
                            <button
                              type="button"
                              className="grid h-9 w-9 place-items-center rounded-md border border-[#008f45] text-[#008f45]"
                              onClick={() => handleAddVTP(index)}
                            >
                              +
                            </button>
                            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                              <div>
                                <Field>
                                  <Label className="mb-2 block text-xs font-semibold text-[#101828]">
                                    Min Volume
                                  </Label>
                                  <input
                                    type="number"
                                    min={0}
                                    onKeyDown={handleKeyDown}
                                    placeholder="1"
                                    value={vtp.minVolume}
                                    onChange={(e) =>
                                      handleVtpChange(
                                        index,
                                        vtpIndex,
                                        "minVolume",
                                        e.target.value
                                      )
                                    }
                                    className={inputClass}
                                  />
                                </Field>
                              </div>

                              <div>
                                <Field>
                                  <Label className="mb-2 block text-xs font-semibold text-[#101828]">
                                    Max Volume
                                  </Label>
                                  <input
                                    type="number"
                                    min={0}
                                    onKeyDown={handleKeyDown}
                                    placeholder="10"
                                    value={vtp.maxVolume}
                                    onChange={(e) =>
                                      handleVtpChange(
                                        index,
                                        vtpIndex,
                                        "maxVolume",
                                        e.target.value
                                      )
                                    }
                                    className={inputClass}
                                  />
                                </Field>
                              </div>

                              <div>
                                <Field>
                                  <Label className="mb-2 block text-xs font-semibold text-[#101828]">
                                    Price
                                  </Label>
                                  <input
                                    type="number"
                                    min={0}
                                    onKeyDown={handleKeyDown}
                                    value={vtp.price}
                                    readOnly
                                    className={`${inputClass} bg-[#f8fafc]`}
                                  />
                                </Field>
                              </div>

                              <div>
                                <Field>
                                  <Label className="mb-2 block text-xs font-semibold text-[#101828]">
                                    Discount
                                  </Label>
                                  <input
                                    type="number"
                                    min={0}
                                    max={3}
                                    onKeyDown={handleKeyDown}
                                    placeholder="2"
                                    value={vtp.discount}
                                    onChange={(e) =>
                                      handleVtpChange(
                                        index,
                                        vtpIndex,
                                        "discount",
                                        e.target.value
                                      )
                                    }
                                    className={inputClass}
                                  />
                                </Field>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="grid h-9 w-9 place-items-center rounded-md border border-[#fecdd3] text-[#ef3340]"
                              onClick={() => handleRemoveVTP(index, vtpIndex)}
                            >
                              x
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    className="flex h-10 w-full items-center justify-center rounded-md border border-[#008f45] text-xs font-semibold text-[#008f45]"
                    onClick={addUomSection}
                  >
                    <span className="px-2 [&_img]:h-3 [&_img]:w-3">
                      <img src={assets.add_icon} alt="" />
                    </span>
                    Add UOM
                  </button>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    className="inline-flex h-10 min-w-48 items-center justify-center rounded-md bg-[#008f45] px-5 text-xs font-semibold text-white shadow-sm hover:bg-[#007a3b] disabled:cursor-not-allowed disabled:opacity-70"
                    onClick={() => handleUpdateProductLocation()}
                    disabled={processing}
                  >
                    {processing ? <LoadingButtonContent label="Updating..." /> : "Update Product Location"}
                  </button>
                </div>
              </div>
            )}
          </Card>
          <SEOForm productLocationData={productLocationData} />
        </div>
      </div>
      )}
    </div>
  );
};

export default ProductUpdate;
