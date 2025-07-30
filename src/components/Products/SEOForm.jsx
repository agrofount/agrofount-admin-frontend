import { useCallback, useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ShopContext } from "../../context/ShopContext";
import axios from "axios";
import { useDropzone } from "react-dropzone";
import { assets } from "../../assets/assets";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";

const SEOForm = ({ productLocationData }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [metaTags, setMetaTags] = useState("");
  const [altText, setAltText] = useState("");
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState([]);
  const [images, setImages] = useState("");
  const [processing, setProcessing] = useState(false);
  const { backend_url, socket, token } = useContext(ShopContext);
  const [SEOCreated, setSEOCreated] = useState(false);
  const [slug, setSlug] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    // Handle the dropped files
    console.log(acceptedFiles);
    if (acceptedFiles.length < 1) {
      toast.error("You need to add at least 1 image");
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
        setImages(response.data.images[0]);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setProcessing(true);

      if (!slug) {
        toast.error("Please check product location is available");
        return;
      }

      const data = {
        title,
        description,
        metaTags: metaTags.split(",").map((tag) => tag.trim()),
        altText,
        imgUrl: images || "",
      };
      const response = await axios.post(
        `${backend_url}/product-location/${slug}/seo`,
        data,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("SEO data created successfully:", response.data);
      setSEOCreated(true);
    } catch (error) {
      console.error("Error creating SEO data:", error);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    if (productLocationData) {
      setSlug(productLocationData.productSlug);
      setTitle(productLocationData.seo?.title || "");
      setDescription(productLocationData.seo?.description || "");
      setMetaTags(
        productLocationData.seo?.metaTags
          ? productLocationData.seo.metaTags.join(", ")
          : ""
      );
      setAltText(productLocationData.seo?.altText || "");
      setImages(productLocationData.seo?.imgUrl || "");
      setFiles(
        productLocationData.seo?.imgUrl
          ? [
              {
                name: productLocationData.seo.imgUrl,
                preview: productLocationData.seo.imgUrl,
              },
            ]
          : []
      );
    }
  }, [productLocationData]);

  return (
    <div className="p-3 bg-white rounded-lg shadow-sm">
      {SEOCreated ? (
        <div className="flex flex-col items-center gap-2 py-10">
          <FontAwesomeIcon
            icon={faCheckCircle}
            size="2x"
            className="text-[#61BF75]"
          />
          <p>SEO data created successfully</p>
          <button
            className="flex flex-row justify-center gap-2 border border-[#61BF75] py-3 rounded-full mt-5 w-1/2"
            onClick={() => setSEOCreated(false)}
          >
            <img src={assets.add_icon} alt="add icon" />
            <p className="text-gray-700 text-sm">Back</p>
          </button>
        </div>
      ) : (
        <div className="items-center">
          <h2 className="text-black text-[15px] font-bold leading-normal tracking-[0.5px] text-center">
            SEO Settings
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-3 mt-3">
              <div>
                <label
                  htmlFor="seoTitle"
                  className="text-[15px] font-bold leading-normal tracking-[0.3px] text-black"
                >
                  Title
                </label>
                <input
                  id="seoTitle"
                  type="text"
                  placeholder="Enter SEO title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-gray-500 rounded-full p-3 text-sm text-gray-500 focus:outline-[#61BF75] mt-2"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="seoDescription"
                  className="text-[15px] font-bold leading-normal tracking-[0.3px] text-black"
                >
                  Description
                </label>
                <textarea
                  id="seoDescription"
                  placeholder="Enter SEO description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-gray-500 rounded-lg p-3 text-sm text-gray-500 focus:outline-[#61BF75] mt-2"
                  rows="4"
                  required
                ></textarea>
              </div>

              <div>
                <label
                  htmlFor="placeholderImage"
                  className="text-[15px] font-bold leading-normal tracking-[0.3px] text-black"
                >
                  Placeholder Image
                </label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-3">
                  {files && files.length > 0 ? (
                    files.map((file) => (
                      <div
                        key={file.name}
                        className="border border-gray-500 rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer"
                      >
                        <img
                          src={file.preview}
                          alt="Upload Icon"
                          className=""
                        />
                      </div>
                    ))
                  ) : (
                    <div className="border border-gray-500 rounded-lg p-3 flex flex-col items-center justify-center">
                      <img
                        src={assets.image_placeholder}
                        alt="Upload Icon"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

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
                            <p className="text-xs py-2">
                              {uploadProgress[fileName]}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label
                  htmlFor="metaTags"
                  className="text-[15px] font-bold leading-normal tracking-[0.3px] text-black"
                >
                  Meta Tags
                </label>
                <input
                  id="metaTags"
                  type="text"
                  value={metaTags}
                  onChange={(e) => setMetaTags(e.target.value)}
                  placeholder="Enter meta tags separated by commas"
                  className="w-full border border-gray-500 rounded-full p-3 text-sm text-gray-500 focus:outline-[#61BF75] mt-2"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="altText"
                  className="text-[15px] font-bold leading-normal tracking-[0.3px] text-black"
                >
                  Alt Text
                </label>
                <input
                  id="altText"
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Enter alt text for images"
                  className="w-full border border-gray-500 rounded-full p-3 text-sm text-gray-500 focus:outline-[#61BF75] mt-2"
                  required
                />
              </div>
              <div className="items-center flex justify-center">
                <button
                  type="submit"
                  className="w-1/2  py-3 bg-[#61BF75] text-white rounded-full"
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
                    "Submit"
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default SEOForm;
