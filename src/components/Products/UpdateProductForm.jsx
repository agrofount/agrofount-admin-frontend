import { useCallback, useContext, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faCloudArrowUp, faXmark } from "@fortawesome/free-solid-svg-icons";
import { assets } from "../../assets/assets";
import { ShopContext } from "../../context/ShopContext";
import { apiClient } from "../../lib/apiClient";
import { IMAGE_MIME_TYPES, validateImageFiles } from "../../lib/uploadValidation";
import { LoadingButtonContent, UploadLoadingList } from "../common/LoadingStates";
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
  { id: "Others", name: "Others" },
];

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

const TextInput = ({ className = "", ...props }) => (
  <input
    {...props}
    className={`h-10 w-full rounded-md border border-[#d0d5dd] bg-white px-3 text-xs text-[#101828] outline-none placeholder:text-[#98a2b3] focus:border-[#008f45] ${className}`}
  />
);

const SelectInput = ({ children, className = "", ...props }) => (
  <select
    {...props}
    className={`h-10 w-full rounded-md border border-[#d0d5dd] bg-white px-3 text-xs text-[#101828] outline-none focus:border-[#008f45] ${className}`}
  >
    {children}
  </select>
);

const UpdateProductForm = ({ productLocationData }) => {
  const [categories, setCategories] = useState({});
  const [primaryCategories, setPrimaryCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [product, setProduct] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [selectedPrimaryCategory, setSelectedPrimaryCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [processing, setProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState([]);
  const [images, setImages] = useState([]);
  const [showProductForm, setShowProductForm] = useState(true);

  const { socket } = useContext(ShopContext);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await apiClient.get("/product/livestock-feed-categories");
      if (response.data) {
        setCategories(response.data.livestock || {});
        setPrimaryCategories(response.data.primaryCategories || []);
      }
    } catch (error) {
      toast.error(error.message || "Unable to load product categories.");
    }
  }, []);

  const onDrop = useCallback(async (acceptedFiles) => {
    const validationError = validateImageFiles(acceptedFiles, {
      min: 3,
      max: 8,
    });

    if (validationError) {
      toast.error(validationError);
      return;
    }

    setUploadProgress({});
    setUploading(true);

    const formData = new FormData();
    acceptedFiles.forEach((file) => {
      formData.append("files", file);
    });
    formData.append("clientId", socket?.id || "");

    try {
      const response = await apiClient.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setFiles(
        acceptedFiles.map((file) =>
          Object.assign(file, {
            preview: URL.createObjectURL(file),
          })
        )
      );
      setImages(response.data.images || []);
    } catch (error) {
      toast.error(error.message || "Unable to upload images.");
      setUploadProgress({});
    } finally {
      setUploading(false);
    }
  }, [socket?.id]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [],
      "image/png": [],
      "image/webp": [],
    },
    maxFiles: 8,
    multiple: true,
  });

  const uploadItems = files.map((file) => ({
    name: file.name,
    type: file.type?.startsWith("image/") ? "image" : "pdf",
    meta: uploading ? `${Math.round((file.size / 1024 / 1024) * 10) / 10} MB • Uploading...` : `${Math.round((file.size / 1024 / 1024) * 10) / 10} MB • Upload complete`,
    progress: uploadProgress[file.name] || (uploading ? 25 : 100),
    status: uploading ? "uploading" : "complete",
  }));

  const handleProductForm = async () => {
    const payload = {
      name: productName || product.name,
      description: description || product.description,
      primaryCategory: selectedPrimaryCategory || product.primaryCategory,
      category: selectedCategory || product.category,
      subCategory: selectedSubCategory || product.subCategory,
      brand: selectedBrand?.name || product.brand,
      images: images.length > 0 ? images : product.images,
    };

    try {
      setProcessing(true);
      const response = await apiClient.put(`/product/${product?.id}`, payload);

      if (response.status === 200) {
        toast.success("Product updated successfully");
        setShowProductForm(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    const sub = Array.isArray(categories[selectedCategory])
      ? categories[selectedCategory]
      : [];

    setSubCategories(sub);
    if (sub.length && !sub.includes(selectedSubCategory)) {
      setSelectedSubCategory(sub[0]);
    }
  }, [categories, selectedCategory, selectedSubCategory]);

  useEffect(() => {
    return () => {
      files?.forEach((file) => URL.revokeObjectURL(file.preview));
    };
  }, [files]);

  useEffect(() => {
    fetchCategories();
    if (!socket) return undefined;

    const handleUploadProgress = (data) => {
      const { name, percentage } = data;
      setUploadProgress((prevProgress) => ({
        ...prevProgress,
        [name]: percentage,
      }));
    };

    socket.on("uploadProgress", handleUploadProgress);

    return () => {
      socket.off("uploadProgress", handleUploadProgress);
    };
  }, [fetchCategories, socket]);

  useEffect(() => {
    const nextProduct = productLocationData?.product || {};
    setProduct(nextProduct);
    setProductName(nextProduct.name || "");
    setDescription(nextProduct.description || "");
    setSelectedPrimaryCategory(nextProduct.primaryCategory || "");
    setSelectedCategory(nextProduct.category || "");
    setSelectedSubCategory(nextProduct.subCategory || "");
    setSelectedBrand(
      brands.find((brand) => brand.name === nextProduct.brand) ||
        (nextProduct.brand ? { id: nextProduct.brand, name: nextProduct.brand } : "")
    );
  }, [productLocationData]);

  const visibleImages = (
    files.length > 0
      ? files.map((file) => file.preview)
      : product?.images?.length > 0
        ? product.images
        : [assets.image_placeholder, assets.image_placeholder, assets.image_placeholder]
  ).slice(0, 5);

  return showProductForm ? (
    <div className="space-y-4">
      <Card title="Product Images" description="Upload up to 5 high-quality images of your product.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {visibleImages.map((image, index) => (
            <div key={`${image}-${index}`} className="relative h-24 overflow-hidden rounded-md border border-[#e5e7eb] bg-[#f8fafc]">
              <img src={image} alt="" className="h-full w-full object-cover" />
              <button type="button" className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-white text-[10px] text-[#667085] shadow-sm">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
          ))}

          <button
            type="button"
            {...getRootProps()}
            className="flex h-24 flex-col items-center justify-center rounded-md border border-dashed border-[#cbd5e1] bg-white text-center text-[11px] text-[#667085] hover:border-[#008f45]"
          >
            <input {...getInputProps()} accept={IMAGE_MIME_TYPES.join(",")} />
            <FontAwesomeIcon icon={faCloudArrowUp} className="mb-1.5 text-2xl text-[#008f45]" />
            <span className="font-semibold text-[#008f45]">Upload Image</span>
            <span className="mt-1">{isDragActive ? "Drop files here" : "or drag and drop"}</span>
            <span>PNG, JPG up to 5MB</span>
          </button>
        </div>

        {uploadItems.length > 0 && (
          <div className="mt-4">
            <UploadLoadingList uploads={uploadItems} />
          </div>
        )}

        <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#008f45]">
          <span className="grid h-4 w-4 place-items-center rounded-full border border-[#008f45] text-[10px]">✓</span>
          Minimum 3 images required
        </p>
      </Card>

      <Card title="Basic Information">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <FieldLabel required>Product Name</FieldLabel>
            <TextInput
              type="text"
              placeholder="Enter product name"
              value={productName}
              maxLength={100}
              onChange={(event) => setProductName(event.target.value)}
            />
            <span className="mt-2 block text-xs text-[#667085]">Do not exceed 100 characters.</span>
          </div>

          <div>
            <FieldLabel required>Brand</FieldLabel>
            <SelectInput
              value={selectedBrand?.name || ""}
              onChange={(event) =>
                setSelectedBrand(
                  brands.find((brand) => brand.name === event.target.value) ||
                    { id: event.target.value, name: event.target.value }
                )
              }
            >
              <option value="">Select brand</option>
              {brands.map((brand) => (
                <option key={brand.name} value={brand.name}>
                  {brand.name}
                </option>
              ))}
            </SelectInput>
          </div>

          <div>
            <FieldLabel required>Primary Category</FieldLabel>
            <SelectInput
              value={selectedPrimaryCategory}
              onChange={(event) => setSelectedPrimaryCategory(event.target.value)}
            >
              <option value="">Select primary category</option>
              {primaryCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </SelectInput>
          </div>

          <div>
            <FieldLabel required>Category</FieldLabel>
            <SelectInput value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
              <option value="">Select category</option>
              {Object.keys(categories).map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </SelectInput>
          </div>

          <div>
            <FieldLabel required>Sub Category</FieldLabel>
            <SelectInput
              value={selectedSubCategory || ""}
              onChange={(event) => setSelectedSubCategory(event.target.value)}
            >
              <option value="">Select sub category</option>
              {subCategories.map((subCategory) => (
                <option key={subCategory} value={subCategory}>
                  {subCategory}
                </option>
              ))}
            </SelectInput>
          </div>
        </div>

        <div className="mt-4">
          <FieldLabel required>Description</FieldLabel>
          <DescriptionEditor description={description} setDescription={setDescription} />
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="inline-flex h-10 min-w-40 items-center justify-center rounded-md bg-[#008f45] px-5 text-xs font-semibold text-white shadow-sm hover:bg-[#007a3b] disabled:cursor-not-allowed disabled:opacity-70"
            onClick={handleProductForm}
            disabled={processing || uploading}
          >
            {processing ? <LoadingButtonContent label="Updating..." /> : "Update Product"}
          </button>
        </div>
      </Card>
    </div>
  ) : (
    <div className="rounded-lg border border-[#e5e7eb] bg-white p-8 text-center shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
      <FontAwesomeIcon icon={faCircleCheck} size="2xl" className="py-1 text-[#008f45]" />
      <p className="mt-3 text-sm font-semibold text-[#008f45]">Product updated successfully</p>
      <button
        type="button"
        className="mt-5 h-10 rounded-md border border-[#d0d5dd] px-5 text-xs font-semibold text-[#101828]"
        onClick={() => setShowProductForm(true)}
      >
        Continue editing
      </button>
    </div>
  );
};

export default UpdateProductForm;
