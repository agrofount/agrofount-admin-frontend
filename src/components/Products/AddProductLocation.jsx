import {
  faCheckCircle,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { CheckIcon, ChevronDownIcon } from "@heroicons/react/16/solid";
import { Link } from "react-router-dom";
import AddProductForm from "./AddProductForm";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Field,
  Label,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import clsx from "clsx";
import { useCallback, useContext, useEffect, useState } from "react";
import { assets, uoms } from "../../assets/assets";
import axios from "axios";
import { ShopContext } from "../../context/ShopContext";
import { toast } from "react-toastify";

const AddProducts = () => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [price, setPrice] = useState("");
  const [locations, setLocations] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [productLocationCreated, setProductLocationCreated] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [moq, setMoq] = useState(5);

  const [uomSections, setUomSections] = useState([
    {
      id: 1,
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

  const { backend_url, token, country_id } = useContext(ShopContext);

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
    const usedUnits = uomSections.map((section) => section.unit);

    // Find the first available unit that hasn't been used yet
    const availableUnit =
      uoms.find((uom) => !usedUnits.includes(uom.name)) || uoms[0];

    setUomSections([
      ...uomSections,
      {
        id: uomSections.length + 1,
        unit: availableUnit.name,
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
    const newUomSections = [...uomSections];
    newUomSections[index].unit = selectedUom.name;
    console.log("this is the new uom unit:", newUomSections[index].unit);
    setUomSections(newUomSections);
  };

  const handleInputChange = (index, field, value) => {
    const newUomSections = [...uomSections];
    newUomSections[index][field] = Number(value);
    setUomSections(newUomSections);
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

  const filteredProducts =
    query === ""
      ? products
      : products.filter((product) =>
          product.name?.toLowerCase().includes(query.toLowerCase())
        );

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
  }, [backend_url, token, country_id]);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await axios.get(`${backend_url}/product`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(response.data.data);
    } catch (error) {
      console.error("an error occurred: ", error);
    }
  }, [backend_url, token]);

  const handleCreateProductLocation = async () => {
    if (!selectedLocation) {
      toast.error("Please select a location");
      return;
    }
    if (!selectedProduct) {
      toast.error("Please select a product");
      return;
    }
    if (!price || isNaN(Number(price))) {
      toast.error("Please enter a valid price");
      return;
    }

    // Validate UOM sections
    for (const section of uomSections) {
      if (!section.unit) {
        toast.error("Please select a unit for all UOM sections");
        return;
      }
      if (section.vendorPrice >= section.platformPrice) {
        toast.error("Vendor price must be less than platform price");
        return;
      }

      // Validate VTP ranges
      for (const vtp of section.vtp) {
        if (vtp.minVolume >= vtp.maxVolume) {
          toast.error(
            `Invalid volume range (${vtp.minVolume}-${vtp.maxVolume}): 
             Min must be less than Max`
          );
          return;
        }
      }
    }

    setProcessing(true);

    const payload = {
      countryId: country_id,
      stateId: selectedLocation.id,
      productId: selectedProduct.id,
      price: Number(price),
      uom: uomSections,
      moq: Number(moq),
      availableDates,
    };

    try {
      const response = await axios.post(
        `${backend_url}/product-location`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 201) {
        console.log("Product Location created successfully");
        setProductLocationCreated(true);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to create product location");
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchProducts();
      await getLocations();
    };

    fetchData();
  }, [fetchProducts, getLocations]);

  useEffect(() => {
    fetchProducts();
  }, [showProductForm, fetchProducts]);

  return (
    <div>
      <div className="flex flex-row justify-between items-center gap-5">
        <p className="text-black text-[25px] font-bold leading-normal tracking-[0.5px]">
          Add product
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
              Add product
            </p>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="p-3 bg-white rounded-lg shadow-sm">
          {!showProductForm && (
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-4 lg:col-span-3">
                <Combobox
                  value={selectedProduct}
                  onChange={(value) => setSelectedProduct(value)}
                  onClose={() => setQuery("")}
                >
                  <div className="relative">
                    <ComboboxInput
                      className={clsx(
                        "w-full border border-gray-500 rounded-full p-3 mt-2 text-sm text-gray-500 focus:outline-[#61BF75]",
                        "focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-white/25"
                      )}
                      displayValue={(person) => person?.name}
                      onChange={(event) => setQuery(event.target.value)}
                    />
                    <ComboboxButton className="group absolute inset-y-0 right-0 px-2.5">
                      <ChevronDownIcon className="size-4 fill-white/60 group-data-[hover]:fill-white" />
                    </ComboboxButton>
                  </div>

                  <ComboboxOptions
                    anchor="bottom"
                    transition
                    className={clsx(
                      "w-[var(--input-width)] rounded-xl border border-white/5 bg-white p-1 [--anchor-gap:var(--spacing-1)] empty:invisible z-10",
                      "transition duration-100 ease-in data-[leave]:data-[closed]:opacity-0"
                    )}
                  >
                    {filteredProducts.map((product) => (
                      <ComboboxOption
                        key={product.id}
                        value={product}
                        className="group flex cursor-default items-center gap-2 rounded-lg py-1.5 px-3 select-none data-[focus]:bg-white/10"
                      >
                        <CheckIcon className="invisible size-4 fill-gray-500 group-data-[selected]:visible" />
                        <div className="text-sm/6 text-gray-500">
                          {product.name}
                        </div>
                      </ComboboxOption>
                    ))}
                  </ComboboxOptions>
                </Combobox>
              </div>
              <div className="col-span-2 col-start-2 lg:col-span-1 mt-2">
                <button
                  className="w-full flex flex-row justify-center gap-2 py-2.5 border border-[#61BF75] text-black rounded-full cursor-pointer"
                  onClick={() => setShowProductForm(true)}
                >
                  <img src={assets.add_icon} className="mt-1" alt="" />
                  <p>new product</p>
                </button>
              </div>
            </div>
          )}

          {showProductForm && (
            <AddProductForm setShowProductForm={setShowProductForm} />
          )}
        </div>

        <div className="p-3 bg-white rounded-lg shadow-sm">
          {productLocationCreated ? (
            <div className="flex flex-col items-center gap-2 py-10">
              <FontAwesomeIcon
                icon={faCheckCircle}
                size="2x"
                className="text-[#61BF75]"
              />
              <p>Product Location created successfully</p>
              <button
                className="flex flex-row justify-center gap-2 border border-[#61BF75] py-3 rounded-full mt-5 w-1/2"
                onClick={() => setProductLocationCreated(false)}
              >
                <img src={assets.add_icon} alt="add icon" />
                <p className="text-gray-700 text-sm">Add more</p>
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
                        type="text"
                        placeholder="0.00"
                        onChange={(e) => setPrice(e.target.value)}
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
                        {selectedLocation?.name || "Select location"}
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
                <p className="text-[15px] font-bold leading-normal border-b-2 border-b-gray-300 tracking-[0.3px] text-black py-2 ">
                  Unit of Measurement
                </p>
                {uomSections.map((section, index) => (
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
                            onChange={(e) => {
                              const value = Number(e.target.value);
                              if (value >= section.platformPrice) {
                                const newUomSections = [...uomSections];
                                newUomSections[index].error =
                                  "Vendor Price cannot be greater than or equal to Platform Price.";
                                setUomSections(newUomSections);
                              } else {
                                const newUomSections = [...uomSections];
                                newUomSections[index].error = ""; // Clear the error
                                setUomSections(newUomSections);
                                handleInputChange(index, "vendorPrice", value);
                              }
                            }}
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
                  onClick={() => handleCreateProductLocation()}
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
                    "Add product Location"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddProducts;
