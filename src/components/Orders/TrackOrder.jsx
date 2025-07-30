import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ShopContext } from "../../context/ShopContext";
import axios from "axios";
import { toast } from "react-toastify";
import ProductDetailSkeleton from "../skeleton/ProductDetailSkeleton";
import OrderTrackComponent from "./OrderTrackComponent";

const TrackOrder = () => {
  const { orderId } = useParams();
  const { backend_url, token, navigate, frontend_url } =
    useContext(ShopContext);
  const [orderData, setOrderData] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [orderItems, setOrderItems] = useState([]);
  const [currentItem, setCurrentItem] = useState(null);

  const fetchOrderData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${backend_url}/order/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data) {
        setOrderData(response.data);
        setOrderItems(response.data.items);
        setCurrentItem(response.data.items[0]);
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
  }, [orderId, backend_url, token]);

  useEffect(() => {
    fetchOrderData();
  }, [fetchOrderData]);

  console.log("these are he order items: ", orderItems);

  return isLoading ? (
    <ProductDetailSkeleton />
  ) : (
    orderData && (
      <div>
        <div className="flex flex-row justify-between items-center gap-5 mb-3">
          <p className="text-gray-600 text-sm sm:text-[25px] font-normal sm:font-bold leading-normal tracking-[0.5px]">
            Track order
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
            <Link to="/orders">
              <p className="text-[#6E6E6E] font-roboto text-[13px] font-normal leading-normal tracking-[0.26px]">
                Orders
              </p>
            </Link>
            <p>
              <FontAwesomeIcon
                icon={faChevronRight}
                size="sm"
                className="pt-1 h-3 text-[#6E6E6E]"
              />
            </p>
            <p className="text-[#6E6E6E] font-roboto text-[13px] font-normal leading-normal tracking-[0.26px]">
              {orderId}
            </p>
            <p>
              <FontAwesomeIcon
                icon={faChevronRight}
                size="sm"
                className="pt-1 h-3 text-[#6E6E6E]"
              />
            </p>
            <p className="text-[#6E6E6E] font-roboto text-[13px] font-normal leading-normal tracking-[0.26px]">
              Track
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <OrderTrackComponent order={orderData} />

          <div className="flex flex-col gap-4 rounded-md bg-white shadow-md py-5 items-left text-left">
            <div className="flex flex-col md:flex-row justify-start gap-20 w-2/3 mx-auto">
              <div>
                <img
                  src={currentItem.product.images[0]}
                  className="w-80 rounded-md"
                  alt="image"
                />
              </div>
              <div>
                <p className="font-md text-2xl capitalize ">
                  {currentItem.product.name}
                </p>
                <div className="flex flex-col">
                  <div className="overflow-x-auto">
                    <div className="inline-block min-w-full py-2">
                      <div className="overflow-hidden">
                        <table className="min-w-full text-left text-sm font-light text-surface">
                          <tbody>
                            <tr className="">
                              <td className="whitespace-nowrap pr-6 py-2">
                                Order Id
                              </td>
                              <td className="whitespace-nowrap pr-6 py-2 font-medium">
                                {orderData.id}
                              </td>
                            </tr>
                            <tr className="">
                              <td className="whitespace-nowrap pr-6 py-2">
                                Brand
                              </td>
                              <td className="whitespace-nowrap pr-6 py-2 font-medium">
                                {currentItem.product.brand}
                              </td>
                            </tr>
                            <tr className="">
                              <td className="whitespace-nowrap pr-6 py-2">
                                Date
                              </td>
                              <td className="whitespace-nowrap pr-6 py-2 font-medium">
                                {new Date(orderData.createdAt).toDateString()}
                              </td>
                            </tr>

                            <tr className="">
                              <td className="whitespace-nowrap pr-6 py-2">
                                Quantity
                              </td>
                              <td className="whitespace-nowrap pr-6 py-2 font-medium">
                                {currentItem.quantity}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row gap-6 justify-start">
                  <a
                    className="w-full border border-[#61BF75] rounded-lg py-3 my-5 hover:bg-gray-200 hover:border-none text-center"
                    href={`${frontend_url}/product/${currentItem?.id}`}
                    target="_blank"
                  >
                    View Shop
                  </a>

                  <button
                    className="w-full border border-[#61BF75] rounded-lg py-3 my-5 hover:bg-gray-200 hover:border-none"
                    onClick={() =>
                      navigate(`/list-products/${currentItem?.id}`)
                    }
                  >
                    View Product
                  </button>
                </div>
              </div>
            </div>
            <div className="flex flex-row overflow-x-auto justify-center gap-2">
              {orderItems?.map((item, index) => (
                <img
                  onClick={() => setCurrentItem(item)}
                  src={item?.product?.images[0]}
                  className="w-[14%] flex-shrink-0 cursor-pointer border px-0.5 mb-3 border-[#6E6E6E] hover:border-[#d4d3d3] rounded-md"
                  alt=""
                  key={index}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  );
};

export default TrackOrder;
