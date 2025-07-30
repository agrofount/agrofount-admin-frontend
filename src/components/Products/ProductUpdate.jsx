import axios from "axios";
import { useCallback, useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ShopContext } from "../../context/ShopContext";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
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

const ProductUpdate = () => {
  const { slug } = useParams();
  const { backend_url, token, country_id } = useContext(ShopContext);
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
      const response = await axios.get(`${backend_url}/state`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
  }, [backend_url, token]);

  const fetchProductData = useCallback(async () => {
    try {
      const response = await axios.get(
        `${backend_url}/product-location/${slug}`
      );
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
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setIsLoading(false); // Set loading to false after fetching
    }
  }, [backend_url, slug]);

  const handleUpdateProductLocation = async () => {
    try {
      setProcessing(true);
      const payload = {
        price: Number(price) || Number(productLocationData?.price),
        uom: uomSections || productLocationData.uom,
        moq: Number(moq),
        availableDates,
        countryId: country_id,
        stateId: selectedLocation?.id || productLocationData?.location_id,
      };

      await axios.put(`${backend_url}/product-location/${slug}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setProductLocationUpdated(true);
      toast.success("Product Location updated successfully");
    } catch (error) {
      console.error("an error occured: ", error);
      toast.error(error.response?.data?.message || error.message);
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
    <div>
      <div className="flex flex-row justify-between items-center gap-5">
        <p className="text-black text-[25px] font-bold leading-normal tracking-[0.5px]">
          Update product
        </p>
        <div className="flex flex-row items-center gap-2">
          <Link to="/">
            <p className="text-[#6E6E6E] font-roboto text-[13px] font-normal leading-normal tracking-[0.26px]">
              Dashboard
            </p>
          </Link>
          <p>
            <FontAwesomeIcon
              icon={faChevronRight}
              size="sm"
              className="pt-1 h-3 text-[#6E6E6E]"
            />
          </p>
          <Link to="/product-list">
            <p className="text-[#6E6E6E] font-roboto text-[13px] font-normal leading-normal tracking-[0.26px]">
              Update Product
            </p>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="p-3 bg-white rounded-lg shadow-sm">
          <UpdateProductForm
            productLocationData={productLocationData}
            isLoading={isLoading}
          />
        </div>
        <div className="flex flex-col gap-3">
          <div className="p-3 bg-white rounded-lg shadow-sm">
            {productLocationUpdated ? (
              <div className="flex flex-col items-center gap-2 py-10">
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  size="2x"
                  className="text-[#61BF75]"
                />
                <p>Product Location Updated successfully</p>
                <button
                  className="flex flex-row justify-center gap-2 border bg-[#f86767] py-3 rounded-full mt-5 w-1/3 text-white"
                  onClick={() => setProductLocationUpdated(false)}
                >
                  <p className="text-sm">Back</p>
                </button>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-3">
                  <div>
                    <label
                      htmlFor="price"
                      className="text-[15px] font-bold leading-normal tracking-[0.3px] text-black"
                    >
                      Price
                    </label>
                    <div className="mt-2">
                      <div className="flex items-center w-full border border-gray-500 rounded-full bg-white pl-3 outline-1 -outline-offset-1 outline-gray-300 has-[input:focus-within]:outline-2 has-[input:focus-within]:-outline-offset-2 has-[input:focus-within]:outline-[#61BF75] p-1.5">
                        <div className="shrink-0 text-base text-gray-500 select-none sm:text-sm/6">
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
                          className="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
                        />
                        <div className="grid shrink-0 grid-cols-1 focus-within:relative">
                          <select
                            id="currency"
                            name="currency"
                            aria-label="Currency"
                            className="col-start-1 row-start-1 w-full appearance-none rounded-md py-1.5 pr-7 pl-3 text-base text-gray-500 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                          >
                            <option>NGN</option>
                            <option>GHS</option>
                            <option>CFA</option>
                          </select>
                          <ChevronDownIcon
                            aria-hidden="true"
                            className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Field>
                      <Label className="text-[15px] font-bold leading-normal tracking-[0.3px] text-black">
                        Location <span className="text-red-600">*</span>
                      </Label>
                      <Listbox
                        value={selectedLocation}
                        onChange={setSelectedLocation}
                      >
                        <ListboxButton
                          className={clsx(
                            "relative block w-full border border-gray-500 rounded-full bg-white/5 py-3 pr-8 pl-3 text-left text-gray-500 focus:outline-[#61BF75] text-sm mt-2",
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
                    </Field>
                  </div>
                </div>

                <div className="flex flex-row gap-5 justify-start items-center">
                  <div>
                    <p className="text-[15px] font-bold leading-normal tracking-[0.3px] text-black mt-4">
                      Minimum Order Quantity
                    </p>
                    <input
                      type="number"
                      min={0}
                      onKeyDown={handleKeyDown}
                      placeholder="5"
                      value={moq}
                      onChange={(e) => setMoq(e.target.value)}
                      className="w-full border border-gray-500 rounded-full p-3 text-sm text-gray-500 focus:outline-[#61BF75]"
                    />
                  </div>
                  <div>
                    <p className="text-[15px] font-bold leading-normal tracking-[0.3px] text-black mt-4">
                      Available dates
                    </p>
                    <input
                      type="date"
                      onChange={handleAddDate}
                      className="w-full border border-gray-500 rounded-full p-3 text-sm text-gray-500 focus:outline-[#61BF75]"
                    />
                  </div>
                </div>

                <div className="flex flex-row gap-2 mt-3">
                  {availableDates.map((date, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between border border-gray-300 rounded-full px-3 py-2 mb-2"
                    >
                      <span className="text-sm text-gray-700">{date}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDate(date)}
                        className="text-red-500 ml-3 cursor-pointer"
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="text-[15px] font-bold leading-normal tracking-[0.3px] text-black mt-4">
                    Unit of Measurement
                  </p>
                  {uomSections?.map((section, index) => (
                    <>
                      <div className="grid grid-cols-8 gap-6" key={section.id}>
                        <div className="mt-3 col-span-2">
                          <Field>
                            <Label className="text-sm/6 font-medium text-black">
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
                                  "relative block w-full border border-gray-500 rounded-full bg-white/5 py-3 pr-8 pl-3 text-left text-gray-500 focus:outline-[#61BF75] text-sm",
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
                                    className="group flex cursor-default items-center gap-2 rounded-lg py-1.5 px-3 select-none data-[focus]:bg-white/10"
                                  >
                                    <CheckIcon className="invisible size-4 fill-white group-data-[selected]:visible" />
                                    <div className="text-sm text-gray-500">
                                      {uom.name}
                                    </div>
                                  </ListboxOption>
                                ))}
                              </ListboxOptions>
                            </Listbox>
                          </Field>
                        </div>
                        <div className="mt-3 col-span-2">
                          <Field>
                            <Label className="text-sm/6 font-medium text-black">
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
                              className="w-full border border-gray-500 rounded-full p-3 text-sm text-gray-500 focus:outline-[#61BF75]"
                            />
                          </Field>
                        </div>

                        <div className="mt-3 col-span-2">
                          <Field>
                            <Label className="text-sm/6 font-medium text-black">
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
                              className="w-full border border-gray-500 rounded-full p-3 text-sm text-gray-500 focus:outline-[#61BF75]"
                            />
                          </Field>
                        </div>
                        <div className="mt-10">
                          <button
                            type="button"
                            onClick={() => removeUomSection(index)}
                            className="border border-red-800 rounded-full py-1 px-3 text-red-600 hover:text-red-800"
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

                      <div className="w-4/5">
                        {section.vtp.map((vtp, vtpIndex) => (
                          <div
                            key={vtpIndex}
                            className="flex flex-row justify-between items-center gap-3 mt-3"
                          >
                            <div
                              className="border border-[#61BF75] w-9 h-9 py-1 text-center  rounded-full"
                              onClick={() => handleAddVTP(index)}
                            >
                              +
                            </div>
                            <div className="grid grid-cols-8 gap-1 mt-3">
                              <div className="col-span-4">
                                <Field>
                                  <Label className="text-sm/6 font-medium text-black">
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
                                    className="w-full border border-gray-500 rounded-full p-3 text-sm text-gray-500 bg-gray-100 focus:outline-[#61BF75]"
                                  />
                                </Field>
                              </div>

                              <div className="col-span-4">
                                <Field>
                                  <Label className="text-sm/6 font-medium text-black">
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
                                    className="w-full border border-gray-500 rounded-full p-3 text-sm text-gray-500 bg-gray-100 focus:outline-[#61BF75]"
                                  />
                                </Field>
                              </div>

                              <div className="col-span-4">
                                <Field>
                                  <Label className="text-sm/6 font-medium text-black">
                                    Price
                                  </Label>
                                  <input
                                    type="number"
                                    min={0}
                                    onKeyDown={handleKeyDown}
                                    value={vtp.price}
                                    readOnly
                                    className="w-full border border-gray-500 rounded-full p-3 text-sm text-gray-500 bg-gray-100"
                                  />
                                </Field>
                              </div>

                              <div className="col-span-4">
                                <Field>
                                  <Label className="text-sm/6 font-medium text-black">
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
                                    className="w-full border border-gray-500 rounded-full p-3 text-sm text-gray-500 bg-gray-100 focus:outline-[#61BF75]"
                                  />
                                </Field>
                              </div>
                            </div>
                            <div
                              className="p-2 border border-[#e63946] w-9 h-9 py-1 text-center rounded-full"
                              onClick={() => handleRemoveVTP(index, vtpIndex)}
                            >
                              x{" "}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ))}
                </div>

                <div className="mt-9">
                  <button
                    type="button"
                    className="flex items-center justify-center w-full h-11 border border-[#61BF75] text-black rounded-full"
                    onClick={addUomSection}
                  >
                    <span className="px-2">
                      <img src={assets.add_icon} alt="" />
                    </span>
                    Add UOM
                  </button>
                </div>

                <div className="flex flex-row justify-center mt-3 items-center">
                  <button
                    className="w-1/2  py-3 bg-[#61BF75] text-white rounded-full"
                    onClick={() => handleUpdateProductLocation()}
                  >
                    {processing ? (
                      <div className="flex items-center space-x-2">
                        <div
                          className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-white"
                          role="status"
                        >
                          <span className="sr-only">Processing...</span>
                        </div>
                        <span className="text-surface text-white">
                          Processing...
                        </span>
                      </div>
                    ) : (
                      "Update product Location"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
          <SEOForm productLocationData={productLocationData} />
        </div>
      </div>
    </div>
  );
};

export default ProductUpdate;
