import { useCallback, useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ShopContext } from "../../context/ShopContext";
import axios from "axios";
import { toast } from "react-toastify";
import { assets } from "../../assets/assets";
import ProductDetailSkeleton from "../skeleton/ProductDetailSkeleton";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEyeSlash,
  faLocationDot,
} from "@fortawesome/free-solid-svg-icons";
import DOMPurify from "dompurify";

const ProductDetail = () => {
  const { slug } = useParams();
  const { currency, backend_url, token } = useContext(ShopContext);
  const [productData, setProductData] = useState(false);
  const [image, setImage] = useState("");
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const [publishing, setPublishing] = useState(false);

  const fetchProductData = useCallback(async () => {
    try {
      const response = await axios.get(
        `${backend_url}/product-location/${slug}`
      );
      if (response.data) {
        setProductData(response.data);
        setImage(response.data.product.images[0]);
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

  const handleOutOfStock = async () => {
    try {
      setPublishing(true);
      const response = await axios.patch(
        `${backend_url}/product-location/${slug}/out-of-stock`,
        null,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status === 200 && response.data) {
        setProductData(response.data);
        toast.success("Product published successfully!");
      } else {
        console.log("error", response);
        toast.error(response.data?.message || "An unexpected error occurred.");
      }
    } catch (error) {
      console.log("error", error);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setPublishing(false); // Set loading to false after fetching
    }
  };

  const handlePublish = async () => {
    try {
      setPublishing(true);
      const response = await axios.patch(
        `${backend_url}/product-location/${slug}/publish`,
        null,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status === 200 && response.data) {
        setProductData(response.data);
        toast.success("Product published successfully!");
      } else {
        console.log("error", response);
        toast.error(response.data?.message || "An unexpected error occurred.");
      }
    } catch (error) {
      console.log("error", error);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setPublishing(false); // Set loading to false after fetching
    }
  };

  useEffect(() => {
    fetchProductData();
  }, [slug, fetchProductData]);
  return isLoading ? (
    <ProductDetailSkeleton />
  ) : (
    productData && (
      <div>
        <div className="">
          <div className="sm:py-10 px-3 transition-opacity ease-in duration-500 opacity-100">
            <div className="flex flex-col sm:flex-row w-full border-b border-b-[#ADADAD] pb-5">
              <div className="flex-1 flex flex-col-reverse gap-3 sm:gap-1 sm:flex-row">
                <div className="flex sm:flex-col overflow-x-auto sm:overflow-y-scroll justify-start gap-2 sm:justify-normal sm:w-[14.7%] w-full">
                  {productData.product.images?.map((url, index) => (
                    <img
                      onClick={() => setImage(url)}
                      src={url}
                      className="w-[24%] sm:w-full flex-shrink-0 cursor-pointer border px-0.5 mb-3 border-[#6E6E6E] rounded-md"
                      alt=""
                      key={index}
                    />
                  ))}
                </div>
                <div className="w-full sm:w-[80%] sm:mx-2">
                  <img src={image} alt="" className=" w-full h-auto" />
                </div>
              </div>

              <div className="flex-1 flex-col">
                <div className="w-full sm:w-[75%]">
                  <div className=" flex flex-row justify-between mt-2 border-b border-b-[#ADADAD] pb-3">
                    <p className="font-medium text-2xl ">
                      {productData.product.name}
                    </p>
                    <div className="flex flex-row gap-2">
                      <button
                        className={`flex flex-row justify-center gap-2 ${
                          productData.isDraft
                            ? "bg-[#F96767] hover:bg-[#ae7979]"
                            : "bg-[#61BF75] hover:bg-[#79ac85]"
                        } text-white rounded-lg py-1.5 px-3`}
                        onClick={handlePublish}
                      >
                        {publishing ? (
                          <div className="flex items-center space-x-2">
                            <div
                              className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-white"
                              role="status"
                            >
                              <span className="sr-only">Processing...</span>
                            </div>
                          </div>
                        ) : (
                          <p className="">
                            <FontAwesomeIcon
                              icon={!productData.isDraft ? faEye : faEyeSlash}
                            />
                          </p>
                        )}

                        {productData.isDraft ? "Publish" : "UnPublish"}
                      </button>
                      <button
                        className={`flex flex-row justify-center gap-2 ${
                          !productData.isAvailable
                            ? "bg-[#F96767] hover:bg-[#ae7979]"
                            : "bg-[#61BF75] hover:bg-[#79ac85]"
                        } text-white rounded-lg py-1.5 px-3`}
                        onClick={handleOutOfStock}
                      >
                        {publishing ? (
                          <div className="flex items-center space-x-2">
                            <div
                              className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-white"
                              role="status"
                            >
                              <span className="sr-only">Processing...</span>
                            </div>
                          </div>
                        ) : (
                          <p className="">
                            <FontAwesomeIcon
                              icon={
                                productData.isAvailable ? faEye : faEyeSlash
                              }
                            />
                          </p>
                        )}

                        {productData.isAvailable
                          ? "Out of Stock"
                          : "Make Available"}
                      </button>
                    </div>
                  </div>

                  <p className="mt-5 font-medium text-xl">
                    {new Intl.NumberFormat("en-NG", {
                      style: "currency",
                      currency,
                    }).format(productData.price)}
                  </p>

                  <div className="flex items-center gap-1 mt-2 border-b border-b-[#ADADAD] pb-3">
                    <img src={assets.star_icon} alt="" className="w-3 5" />
                    <img src={assets.star_icon} alt="" className="w-3 5" />
                    <img src={assets.star_icon} alt="" className="w-3 5" />
                    <img src={assets.star_icon} alt="" className="w-3 5" />
                    <img src={assets.star_icon_2} alt="" className="w-3 5" />
                    <p className="pl-2 text-sm text-[#ADADAD]">
                      4 Customer Reviews
                    </p>
                  </div>

                  <p className="my-2">
                    <FontAwesomeIcon icon={faLocationDot} color="#61BF75" />
                    <span className="px-2 text-sm text-gray-500">
                      {productData.state.name}
                    </span>
                  </p>

                  {/* <p className="mt-5 text-gray-500 md:w-4/5">
                    {productData.product.description.slice(0, 200)}...
                  </p> */}
                  <div
                    className="mt-5 text-gray-500 md:w-4/5"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(
                        productData.product.description.slice(0, 500) +
                          "...see more"
                      ),
                    }}
                    style={{ backgroundColor: "transparent", color: "inherit" }}
                  />

                  <div>
                    <div className="my-2">
                      <p className="font-semibold">Moq</p>
                      <p className="text-white bg-[#61BF75]  w-1/5 text-center rounded-full">
                        {productData.moq}
                      </p>
                    </div>
                    <div className="my-2">
                      <p className="font-semibold">Available Dates</p>
                      <div className="grid grid-cols-4 gap-4">
                        {productData.availableDates.map((date, index) => (
                          <p
                            key={index}
                            className="text-white text-sm text-center bg-[#61BF75] rounded-full py-1.5"
                          >
                            {date}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 py-2">
                    {!productData.isAvailable ? "Not" : ""} Available in Stock
                  </p>

                  <div className="py-2">
                    <TabGroup>
                      <TabList className="flex flex-row gap-3">
                        {productData.uom.map((uom) => (
                          <Tab
                            key={uom.unit}
                            className="bg-white py-1.5 w-1/3 text-center font-normal rounded-full text-gray-500 focus:outline-[#61BF75] data-[selected]:bg-gray-300 data-[hover]:bg-gray-300 data-[selected]:data-[hover]:bg-gray-400 data-[focus]:outline-1 data-[focus]:outline-[#61BF75]"
                          >
                            {uom.unit}
                          </Tab>
                        ))}
                      </TabList>
                      <TabPanels className="mt-3">
                        {productData.uom.map((uom) => (
                          <TabPanel
                            key={uom.name}
                            className="rounded-xl bg-white p-3 w-full sm:w-4/6"
                          >
                            <div className="flex flex-row gap-5">
                              <div className="flex flex-col gap-1">
                                <p className="font-semibold text-sm text-gray-500">
                                  Vendor price
                                </p>
                                <p className="font-normal text-sm">
                                  {new Intl.NumberFormat("en-NG", {
                                    style: "currency",
                                    currency,
                                  }).format(uom.vendorPrice)}
                                </p>
                              </div>
                              <div className="flex flex-col gap-1">
                                <p className="font-semibold text-sm text-gray-500">
                                  Platform price
                                </p>
                                <p className="font-normal text-sm">
                                  {new Intl.NumberFormat("en-NG", {
                                    style: "currency",
                                    currency,
                                  }).format(uom.platformPrice)}
                                </p>
                              </div>
                            </div>

                            <div className="py-2">
                              <a
                                href="#"
                                className="font-semibold text-gray-500"
                              >
                                VTP
                              </a>
                            </div>

                            {uom.vtp.map((vtp, index) => (
                              <ul key={index}>
                                <li className="relative rounded-md text-sm/6 transition hover:bg-white/5">
                                  <ul
                                    className="flex gap-2 text-gray-500"
                                    aria-hidden="true"
                                  >
                                    <li className="flex flex-col">
                                      <p className="font-semibold">Min</p>
                                      <p>{vtp.minVolume}</p>
                                    </li>
                                    <li className="py-3">-</li>
                                    <li className="flex flex-col">
                                      <p className="font-semibold">Max</p>
                                      <p>{vtp.maxVolume}</p>
                                    </li>
                                    <li aria-hidden="true">&middot;</li>
                                    <li className="flex flex-col">
                                      <p className="font-semibold">Price</p>
                                      <p>
                                        {new Intl.NumberFormat("en-NG", {
                                          style: "currency",
                                          currency,
                                        }).format(vtp.price)}
                                      </p>
                                    </li>
                                    <li aria-hidden="true">&middot;</li>
                                    <li className="flex flex-col">
                                      <p className="font-semibold">Discount</p>
                                      <p>{vtp.discount}%</p>
                                    </li>
                                  </ul>
                                </li>
                              </ul>
                            ))}
                          </TabPanel>
                        ))}
                      </TabPanels>
                    </TabGroup>
                  </div>

                  <div className="text-sm  mt-5 py-3 border w-full sm:w-4/6">
                    <div className="flex flex-row items-start gap-5 mt-2">
                      <Link
                        to="/list-products"
                        className="border-2 border-[#F96767] rounded-full py-2 px-3 text-[#F96767] w-1/2 text-center"
                      >
                        Back
                      </Link>
                      <Link
                        to={`/list-products/${slug}/edit`}
                        className="border-2 border-[#61BF75] rounded-full py-2 px-3 text-[#61BF75] w-1/2 text-center"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  );
};

export default ProductDetail;
