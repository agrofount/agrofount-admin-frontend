import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import {
  faArrowLeft,
  faBold,
  faCalendarDays,
  faChevronDown,
  faChevronRight,
  faCloudArrowUp,
  faImage,
  faItalic,
  faLink,
  faList,
  faListOl,
  faPlus,
  faRotateLeft,
  faRotateRight,
  faTableCells,
  faTrashCan,
  faUnderline,
  faXmark,
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

const brands = [
  { id: "ultima", name: "Ultima Feeds" },
  { id: "chikun", name: "Chikun" },
  { id: "olam", name: "Olam" },
  { id: "new-hope", name: "New Hope" },
];

const sampleImages = [
  assets.broiler_starter_mash_1,
  assets.soya,
  assets.image_placeholder,
];

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

const AddProducts = () => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [formLoading, setFormLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(brands[0]);
  const [price, setPrice] = useState("5000");
  const [locations, setLocations] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [availableFrom, setAvailableFrom] = useState("2025-12-05");
  const [availableTo, setAvailableTo] = useState("");
  const [moq, setMoq] = useState(5);
  const [currentStock, setCurrentStock] = useState("0");
  const [sku, setSku] = useState("BRL-ST-001");
  const [description, setDescription] = useState(
    "Ultima Broiler Starter Feed is a complete and balanced feed specially formulated for broiler chicks from day-old to 3 weeks. It contains the right combination of proteins, vitamins, and minerals to support strong growth, healthy development, and digestive efficiency."
  );

  const [uomSections, setUomSections] = useState([
    {
      id: 1,
      unit: uoms[0].name,
      vendorPrice: 4500,
      platformPrice: 5000,
      vtp: [{ minVolume: 1, maxVolume: 10, price: 5000, discount: 2 }],
    },
  ]);

  const { country_id, navigate } = useContext(ShopContext);

  const filteredProducts = useMemo(
    () =>
      query === ""
        ? products
        : products.filter((product) =>
            product.name?.toLowerCase().includes(query.toLowerCase())
          ),
    [products, query]
  );

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
      uom: uomSections,
      moq: Number(moq),
      availableDates: availableFrom ? [availableFrom] : [],
    };

    try {
      setProcessing(true);
      const response = await apiClient.post("/product-location", payload);
      if (response.status === 201) {
        toast.success("Product created successfully");
        navigate("/list-products");
      }
    } catch (error) {
      toast.error(error.message || "Failed to create product location");
    } finally {
      setProcessing(false);
    }
  };

  const selectedImages = selectedProduct?.images?.length ? selectedProduct.images.slice(0, 3) : sampleImages;

  return (
    <div className="space-y-4 text-[#101828]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-lg font-semibold">Add Product</h1>
          <p className="mt-1 text-xs font-medium text-[#667085]">
            Create a new product and add all the necessary details.
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

      {formLoading ? (
        <FormSkeletonLoader />
      ) : (
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(480px,0.98fr)]">
        <div className="space-y-4">
          <Card title="Product Images" description="Upload up to 5 high-quality images of your product.">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {selectedImages.map((image, index) => (
                <div key={`${image}-${index}`} className="relative h-24 overflow-hidden rounded-md border border-[#e5e7eb] bg-[#f8fafc]">
                  <img src={image} alt="" className="h-full w-full object-cover" />
                  <button className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-white text-[10px] text-[#667085] shadow-sm">
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                </div>
              ))}
              <button className="flex h-24 flex-col items-center justify-center rounded-md border border-dashed border-[#cbd5e1] bg-white text-center text-[11px] text-[#667085]">
                <FontAwesomeIcon icon={faCloudArrowUp} className="mb-1.5 text-2xl text-[#008f45]" />
                <span className="font-semibold text-[#008f45]">Upload Image</span>
                <span className="mt-1">or drag and drop</span>
                <span>PNG, JPG up to 5MB</span>
              </button>
            </div>
            <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#008f45]">
              <span className="grid h-4 w-4 place-items-center rounded-full border border-[#008f45] text-[10px]">✓</span>
              Minimum 3 images required
            </p>
          </Card>

          <Card title="Basic Information">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <FieldLabel required>Product Name</FieldLabel>
                <Combobox value={selectedProduct} onChange={setSelectedProduct} onClose={() => setQuery("")}>
                  <div className="relative">
                    <ComboboxInput
                      className="h-10 w-full rounded-md border border-[#d0d5dd] bg-white px-3 text-xs outline-none focus:border-[#008f45]"
                      displayValue={(product) => product?.name || ""}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Broiler Starter Feed"
                    />
                    <ComboboxButton className="absolute inset-y-0 right-0 px-4 text-[#667085]">
                      <FontAwesomeIcon icon={faChevronDown} className="text-xs" />
                    </ComboboxButton>
                  </div>
                  <ComboboxOptions anchor="bottom" className="z-20 mt-1 max-h-60 w-[var(--input-width)] overflow-auto rounded-md border border-[#e5e7eb] bg-white p-1 shadow-lg">
                    {filteredProducts.map((product) => (
                      <ComboboxOption key={product.id} value={product} className="group flex cursor-pointer items-center gap-2 rounded px-3 py-1.5 text-xs text-[#344054] data-[focus]:bg-[#f8fafc]">
                        <CheckIcon className="invisible h-4 w-4 fill-[#008f45] group-data-[selected]:visible" />
                        {product.name}
                      </ComboboxOption>
                    ))}
                  </ComboboxOptions>
                </Combobox>
                <p className="mt-2 text-xs text-[#667085]">Do not exceed 100 characters.</p>
              </div>
              <div>
                <FieldLabel required>Brand</FieldLabel>
                <Listbox value={selectedBrand} onChange={setSelectedBrand}>
                  <SelectButton>{selectedBrand?.name}</SelectButton>
                  <SelectOptions>
                    {brands.map((brand) => <SelectOption key={brand.id} value={brand}>{brand.name}</SelectOption>)}
                  </SelectOptions>
                </Listbox>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <FieldLabel required>Primary Category</FieldLabel>
                <TextInput value="Feed" readOnly />
              </div>
              <div>
                <FieldLabel required>Category</FieldLabel>
                <TextInput value={selectedProduct?.category || "Poultry"} readOnly />
              </div>
              <div>
                <FieldLabel required>Sub Category</FieldLabel>
                <TextInput value={selectedProduct?.subCategory || "Broiler"} readOnly />
              </div>
            </div>

            <div className="mt-4">
              <FieldLabel required>Description</FieldLabel>
              <div className="overflow-hidden rounded-md border border-[#d0d5dd]">
                <div className="flex flex-wrap items-center gap-2 border-b border-[#e5e7eb] bg-[#f8fafc] p-2 text-[#344054]">
                  {[faBold, faItalic, faUnderline, faList, faListOl, faLink, faImage, faTableCells].map((icon) => (
                    <button key={icon.iconName} className="grid h-7 w-7 place-items-center rounded border border-[#d0d5dd] bg-white text-xs">
                      <FontAwesomeIcon icon={icon} />
                    </button>
                  ))}
                  <button className="h-7 rounded border border-[#d0d5dd] bg-white px-2 text-xs">Paragraph <FontAwesomeIcon icon={faChevronDown} className="ml-2 text-[10px]" /></button>
                  <button className="grid h-7 w-7 place-items-center rounded border border-[#d0d5dd] bg-white text-xs"><FontAwesomeIcon icon={faRotateLeft} /></button>
                  <button className="grid h-7 w-7 place-items-center rounded border border-[#d0d5dd] bg-white text-xs"><FontAwesomeIcon icon={faRotateRight} /></button>
                </div>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="min-h-28 w-full resize-none p-3 text-xs leading-6 outline-none"
                />
                <p className="border-t border-[#eef2f6] px-4 py-2 text-right text-xs text-[#667085]">Characters: {description.length}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Pricing & Availability">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <FieldLabel required>Price</FieldLabel>
                <div className="flex h-10 overflow-hidden rounded-md border border-[#d0d5dd] bg-white focus-within:border-[#008f45]">
                  <span className="grid place-items-center px-3 text-xs font-semibold text-[#667085]">₦</span>
                  <input value={price} onChange={(event) => setPrice(event.target.value)} onKeyDown={handleKeyDown} className="min-w-0 flex-1 text-xs outline-none" />
                  <span className="flex items-center gap-2 border-l border-[#e5e7eb] px-3 text-xs font-medium text-[#344054]">NGN <FontAwesomeIcon icon={faChevronDown} className="text-[10px]" /></span>
                </div>
              </div>
              <div>
                <FieldLabel required>Location</FieldLabel>
                <Listbox value={selectedLocation} onChange={setSelectedLocation}>
                  <SelectButton placeholder="Select location">{selectedLocation?.name}</SelectButton>
                  <SelectOptions>
                    {locations.map((location) => <SelectOption key={location.id || location.name} value={location}>{location.name}</SelectOption>)}
                  </SelectOptions>
                </Listbox>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <FieldLabel required>Minimum Order Quantity</FieldLabel>
                <TextInput type="number" min={0} value={moq} onKeyDown={handleKeyDown} onChange={(event) => setMoq(event.target.value)} />
              </div>
              <div>
                <FieldLabel required>Available From</FieldLabel>
                <div className="relative">
                  <TextInput type="date" value={availableFrom} onChange={(event) => setAvailableFrom(event.target.value)} className="pr-10" />
                  <FontAwesomeIcon icon={faCalendarDays} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#667085]" />
                </div>
              </div>
              <div>
                <FieldLabel>Available To (Optional)</FieldLabel>
                <div className="relative">
                  <TextInput type="date" value={availableTo} onChange={(event) => setAvailableTo(event.target.value)} className="pr-10" />
                  <FontAwesomeIcon icon={faCalendarDays} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#667085]" />
                </div>
              </div>
            </div>
          </Card>

          <Card title="Unit of Measurement">
            <div className="space-y-3">
              {uomSections.map((section, index) => {
                const tier = section.vtp[0] || {};
                return (
                  <div key={section.id} className="grid grid-cols-2 gap-2.5 md:grid-cols-[0.85fr_1fr_1fr_0.65fr_0.65fr_0.7fr_0.65fr_auto]">
                    <div>
                      <FieldLabel>Unit</FieldLabel>
                      <Listbox value={section.unit} onChange={(uom) => handleUomChange(index, uom)}>
                        <SelectButton>{section.unit}</SelectButton>
                        <SelectOptions>
                          {uoms.map((uom) => <SelectOption key={uom.name} value={uom}>{uom.name}</SelectOption>)}
                        </SelectOptions>
                      </Listbox>
                    </div>
                    <div><FieldLabel>Platform Price (₦)</FieldLabel><TextInput type="number" min={0} value={section.platformPrice} onKeyDown={handleKeyDown} onChange={(e) => handleInputChange(index, "platformPrice", e.target.value)} /></div>
                    <div><FieldLabel>Vendor Price (₦)</FieldLabel><TextInput type="number" min={0} value={section.vendorPrice} onKeyDown={handleKeyDown} onChange={(e) => handleInputChange(index, "vendorPrice", e.target.value)} /></div>
                    <div><FieldLabel>Min Volume</FieldLabel><TextInput type="number" min={0} value={tier.minVolume} onKeyDown={handleKeyDown} onChange={(e) => handleVtpChange(index, 0, "minVolume", e.target.value)} /></div>
                    <div><FieldLabel>Max Volume</FieldLabel><TextInput type="number" min={0} value={tier.maxVolume} onKeyDown={handleKeyDown} onChange={(e) => handleVtpChange(index, 0, "maxVolume", e.target.value)} /></div>
                    <div><FieldLabel>Price (₦)</FieldLabel><TextInput type="number" min={0} value={tier.price} onKeyDown={handleKeyDown} onChange={(e) => handleVtpChange(index, 0, "price", e.target.value)} /></div>
                    <div><FieldLabel>Discount (%)</FieldLabel><TextInput type="number" min={0} value={tier.discount} onKeyDown={handleKeyDown} onChange={(e) => handleVtpChange(index, 0, "discount", e.target.value)} /></div>
                    <button type="button" onClick={() => removeUomSection(index)} className="mt-7 text-sm text-[#ef3340]">
                      <FontAwesomeIcon icon={faTrashCan} />
                    </button>
                  </div>
                );
              })}
            </div>
            <button type="button" onClick={addUomSection} className="mt-4 flex h-9 w-full items-center justify-center gap-2 rounded-md border border-[#20a45b] text-xs font-semibold text-[#008f45]">
              <FontAwesomeIcon icon={faPlus} />
              Add More Unit
            </button>
          </Card>

          <Card title="Stock Information">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div><FieldLabel>Current Stock</FieldLabel><TextInput type="number" min={0} value={currentStock} onChange={(e) => setCurrentStock(e.target.value)} /></div>
              <div><FieldLabel>SKU (Stock Keeping Unit)</FieldLabel><TextInput value={sku} onChange={(e) => setSku(e.target.value)} /></div>
            </div>
          </Card>

          <Card title="Product Location" description="Add locations where this product is available.">
            <button className="flex h-9 w-full items-center justify-center gap-2 rounded-md border border-[#20a45b] text-xs font-semibold text-[#008f45]">
              <FontAwesomeIcon icon={faPlus} />
              Add Product Location
            </button>
          </Card>
        </div>
      </div>
      )}

      {!formLoading && <section className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link to="/list-products" className="inline-flex h-10 items-center justify-center rounded-md border border-[#d0d5dd] px-14 text-xs font-semibold text-[#344054]">
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleCreateProductLocation}
            disabled={processing}
            className="inline-flex h-10 min-w-60 items-center justify-center rounded-md bg-[#008f45] px-6 text-xs font-semibold text-white disabled:opacity-60"
          >
            {processing ? <LoadingButtonContent label="Saving..." /> : "Save & Publish Product"}
          </button>
          <button className="grid h-10 w-10 place-items-center rounded-md bg-[#00813f] text-white">
            <FontAwesomeIcon icon={faChevronDown} />
          </button>
        </div>
      </section>}
    </div>
  );
};

export default AddProducts;
