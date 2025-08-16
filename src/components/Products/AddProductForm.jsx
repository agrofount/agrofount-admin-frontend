import {
  Field,
  Label,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { assets } from "../../assets/assets";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/16/solid";
import clsx from "clsx";
import { useCallback, useContext, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { toast } from "react-toastify";
import { ShopContext } from "../../context/ShopContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import DescriptionEditor from "./ProductDescriptionEditor";

const brands = [
  { id: "chikun", name: "Chikun" },
  { id: "ultima", name: "Ultima" },
  { id: "olam", name: "Olam" },
  { id: "live feeds", name: "Live feeds" },
  { id: "new hope", name: "New Hope" },
  { id: "Zartech", name: "Zartech" },
  { id: "CHI", name: "CHI" },
  { id: "Agrited", name: "Agrited" },
  { id: "Fidan", name: "Fidan" },
  { id: "Yammfy", name: "Yammfy" },
  { id: "AMO", name: "AMO" },
  { id: "Valentine", name: "Valentine" },
  { id: "Sayed", name: "Sayed" },
  { id: "Cascada", name: "Cascada" },
];

const AddProductForm = ({ setShowProductForm }) => {
  const [categories, setCategories] = useState({});
  const [primaryCategories, setPrimaryCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [selectedPrimaryCategory, setSelectedPrimaryCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState(brands[1]);
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [processing, setProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState([]);
  const [images, setImages] = useState([]);

  const { backend_url, token, socket } = useContext(ShopContext);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get(
        `${backend_url}/product/livestock-feed-categories`
      );
      if (response.data) {
        setCategories(response.data.livestock);
        setPrimaryCategories(response.data.primaryCategories);
        setSelectedCategory(Object.keys(response.data.livestock)[0]);
      }
    } catch (error) {
      console.log("error", error);
      toast.error(error.response?.data?.message || error.message);
    }
  }, [backend_url]);

  const onDrop = useCallback((acceptedFiles) => {
    // Handle the dropped files
    console.log(acceptedFiles);
    if (acceptedFiles.length < 3) {
      toast.error("You need to add at least 3 images");
      return;
    }
    setUploadProgress({});
    setUploading(true);

    // Create a FormData object
    const formData = new FormData();
    acceptedFiles.forEach((file) => {
      formData.append("files", file);
    });
    formData.append("clientId", socket.id);

    // Send the files using Axios
    axios
      .post(`${backend_url}/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => {
        console.log("Files uploaded successfully:", response.data);
        setFiles(
          acceptedFiles.map((file) =>
            Object.assign(file, {
              preview: URL.createObjectURL(file),
            })
          )
        );
        setImages(response.data.images);
        setUploading(false);
      })
      .catch((error) => {
        console.error("Error uploading files:", error);
        setUploadProgress({});
        setUploading(false);
      });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [],
    },
  });

  const handleProductForm = async () => {
    const payload = {
      name: productName,
      description,
      category: selectedCategory,
      subCategory: selectedSubCategory,
      brand: selectedBrand.name,
      images: images,
      primaryCategory: selectedPrimaryCategory,
    };

    try {
      setProcessing(true);
      const response = await axios.post(`${backend_url}/product`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 201) {
        setShowProductForm(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    const sub = Array.isArray(categories[selectedCategory])
      ? categories[selectedCategory]
      : [];

    setSubCategories(sub);
    setSelectedSubCategory(sub[0]);
  }, [selectedCategory]);

  useEffect(() => {
    return () => {
      files?.forEach((file) => URL.revokeObjectURL(file.preview));
    };
  }, [files]);

  useEffect(() => {
    fetchCategories();
    socket.on("uploadProgress", (data) => {
      const { name, percentage } = data;
      setUploadProgress((prevProgress) => ({
        ...prevProgress,
        [name]: percentage,
      }));
    });

    return () => {
      socket.off("uploadProgress");
    };
  }, [fetchCategories, socket]);

  return (
    <div>
      <div>
        <div className="flex flex-row justify-between items-center">
          <p className="text-[15px] font-bold leading-normal tracking-[0.3px] text-black">
            Upload images
          </p>
          <div
            className="flex flex-row gap-2 text-[15px] font-bold leading-normal tracking-[0.3px] text-black cursor-pointer"
            onClick={() => setShowProductForm(false)}
          >
            <p className="">
              <FontAwesomeIcon
                icon={faArrowLeft}
                size="5rem"
                className="py-1"
              />
            </p>
            Back
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-3">
          {files && files.length > 0
            ? files.map((file) => (
                <div
                  key={file.name}
                  className="border border-gray-500 rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer"
                >
                  <img src={file.preview} alt="Upload Icon" className="" />
                </div>
              ))
            : [...Array(3)].map((_, index) => (
                <div
                  key={index}
                  className="border border-gray-500 rounded-lg p-3 flex flex-col items-center justify-center"
                >
                  <img
                    src={assets.image_placeholder}
                    alt="Upload Icon"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}

          <div
            {...getRootProps()}
            className="border border-gray-500 rounded-lg p-3 flex flex-col items-center justify-center hover:border-[#61BF75] cursor-pointer "
          >
            <input {...getInputProps()} />
            {uploading ? (
              <div
                className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite"
                role="status"
              >
                <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                  Loading...
                </span>
              </div>
            ) : (
              <img src={assets.upload_icon} alt="Upload Icon" />
            )}
            {isDragActive ? (
              <p className="text-sm text-gray-500 leading-1 py-2">
                Drop the files here ...
              </p>
            ) : (
              <p className="text-sm text-gray-500 leading-1 py-2">
                Drop your images here or click to browse
              </p>
            )}
            <div className="progress-bar w-full">
              {Object.keys(uploadProgress).map((fileName) => (
                <div
                  key={fileName}
                  className="h-1 w-full bg-neutral-200 dark:bg-neutral-600 mb-6"
                >
                  <div
                    className="h-1 bg-[#61BF75]"
                    style={{
                      width: `${uploadProgress[fileName]}%`,
                    }}
                  >
                    <p className="text-xs py-2">{uploadProgress[fileName]}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-500 py-2">
          You need to add at least 3 images. Pay attention to the quality of the
          pictures you add, comply with the background color standards. Pictures
          must be in certain dimensions. Notice that the product shows all the
          details
        </p>
      </div>
      <div>
        <p className="text-[15px] font-bold leading-normal tracking-[0.3px] text-black">
          Product name <span className="text-red-600">*</span>
        </p>
        <input
          type="text"
          placeholder="Enter product name"
          value={productName}
          className="w-full border border-gray-500 rounded-full p-3 mt-2 text-sm text-gray-500 focus:outline-[#61BF75]"
          maxLength={100}
          onChange={(e) => setProductName(e.target.value)}
        />
        <span className="text-xs text-[#ADADAD] px-4">
          Do not exceed 100 characters when entering the product name.
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-3">
        <div className="col-span-2">
          <Field>
            <Label className="text-[15px] font-bold leading-normal tracking-[0.3px] text-black">
              Primary Category <span className="text-red-600">*</span>
            </Label>
            <select
              value={selectedPrimaryCategory}
              onChange={(e) => setSelectedPrimaryCategory(e.target.value)}
              className="block w-full border border-gray-500 rounded-full bg-white py-3 pr-8 pl-3 text-gray-500 focus:outline-[#61BF75] text-sm appearance-none"
            >
              {primaryCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <ChevronDownIcon
              className="pointer-events-none absolute top-10 right-3 size-4 fill-gray-500"
              aria-hidden="true"
            />
          </Field>
        </div>
        <div>
          <Field>
            <Label className="text-[15px] font-bold leading-normal tracking-[0.3px] text-black">
              Category <span className="text-red-600">*</span>
            </Label>
          </Field>
          <Listbox value={selectedCategory} onChange={setSelectedCategory}>
            <ListboxButton
              className={clsx(
                "relative block w-full border border-gray-500 rounded-full bg-white/5 py-3 pr-8 pl-3 text-left text-gray-500 focus:outline-[#61BF75] text-sm",
                "data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-[#61BF75]"
              )}
            >
              {selectedCategory}
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
              {Object.keys(categories).map((category) => (
                <ListboxOption
                  key={category}
                  value={category}
                  className="group flex cursor-default items-center gap-2 rounded-lg py-1.5 px-3 select-none data-[focus]:bg-white/10"
                >
                  <CheckIcon className="invisible size-4 fill-white group-data-[selected]:visible" />
                  <div className="text-sm text-gray-500">{category}</div>
                </ListboxOption>
              ))}
            </ListboxOptions>
          </Listbox>
        </div>

        <div>
          <Field>
            <Label className="text-[15px] font-bold leading-normal tracking-[0.3px] text-black">
              Sub Category <span className="text-red-600">*</span>
            </Label>
            <Listbox
              value={selectedSubCategory}
              onChange={setSelectedSubCategory}
            >
              <ListboxButton
                className={clsx(
                  "relative block w-full border border-gray-500 rounded-full bg-white/5 py-3 pr-8 pl-3 text-left text-gray-500 focus:outline-[#61BF75] text-sm",
                  "data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-[#61BF75]"
                )}
              >
                {selectedSubCategory}
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
                {subCategories.map((subCategory) => (
                  <ListboxOption
                    key={subCategory}
                    value={subCategory}
                    className="group flex cursor-default items-center gap-2 rounded-lg py-1.5 px-3 select-none data-[focus]:bg-white/10"
                  >
                    <CheckIcon className="invisible size-4 fill-white group-data-[selected]:visible" />
                    <div className="text-sm text-gray-500">{subCategory}</div>
                  </ListboxOption>
                ))}
              </ListboxOptions>
            </Listbox>
          </Field>
        </div>

        <div className="col-span-2">
          <Field>
            <Label className="text-[15px] font-bold leading-normal tracking-[0.3px] text-black">
              Brand <span className="text-red-600">*</span>
            </Label>
            <Listbox value={selectedBrand} onChange={setSelectedBrand}>
              <ListboxButton
                className={clsx(
                  "relative block w-full border border-gray-500 rounded-full bg-white/5 py-3 pr-8 pl-3 text-left text-gray-500 focus:outline-[#61BF75] text-sm",
                  "data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-[#61BF75]"
                )}
              >
                {selectedBrand.name}
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
                {brands.map((brand) => (
                  <ListboxOption
                    key={brand.name}
                    value={brand}
                    className="group flex cursor-default items-center gap-2 rounded-lg py-1.5 px-3 select-none data-[focus]:bg-white/10"
                  >
                    <CheckIcon className="invisible size-4 fill-white group-data-[selected]:visible" />
                    <div className="text-sm text-gray-500">{brand.name}</div>
                  </ListboxOption>
                ))}
              </ListboxOptions>
            </Listbox>
          </Field>
        </div>
      </div>

      <div className="mt-3">
        <p className="text-[15px] font-bold leading-normal tracking-[0.3px] text-black">
          Description <span className="text-red-600">*</span>
        </p>
        {/* <Field>
          <Textarea
            className={clsx(
              "w-full border border-gray-500 rounded-lg p-3 mt-2  bg-white/5 py-1.5 px-3 text-sm/6 text-gray-500",
              "focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-white/25"
            )}
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field> */}
        <DescriptionEditor
          description={description}
          setDescription={setDescription}
        />
      </div>

      <div className="flex flex-row justify-center mt-3 items-center">
        <button
          className="w-1/2  py-3 bg-[#61BF75] text-white rounded-full"
          onClick={() => handleProductForm()}
        >
          {processing ? (
            <div className="flex items-center space-x-2">
              <div
                className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-white"
                role="status"
              >
                <span className="sr-only">Processing...</span>
              </div>
              <span className="text-surface text-white">Processing...</span>
            </div>
          ) : (
            "Add product"
          )}
        </button>
      </div>
    </div>
  );
};

export default AddProductForm;
