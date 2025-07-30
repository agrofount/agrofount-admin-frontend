import { useContext, useEffect, useState } from "react";
import { assets } from "../assets/assets";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import ReviewListSkeleton from "./skeleton/ReviewListSkeleton";

const DashboardReviewList = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [reviews, setReviews] = useState({ data: [], links: {}, meta: {} });
  const { token, backend_url } = useContext(ShopContext);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${backend_url}/review`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          page: 1,
          limit: 10,
        },
      });

      setReviews(response.data);
    } catch (error) {
      console.error("an error occured: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  return (
    <div className="flex flex-col gap-4 mt-4 overflow-y-scroll w-full">
      {isLoading ? (
        <ReviewListSkeleton />
      ) : reviews.data.length < 1 ? (
        <div className="flex flex-col items-center justify-center h-[300px]">
          <img src={assets.empty_inbox} alt="No Reviews yet" />
          <p className="text-[#ADADAD] text-sm mt-5">No Reviews yet</p>
        </div>
      ) : (
        reviews.data.map((review, index) => (
          <div className="flex items-center justify-between" key={index}>
            <div className="flex items-start gap-2">
              <img src={assets.review_avatar} className="w-8 h-8" alt="" />
              <div className="flex flex-col">
                <p className="text-[#4A4A4A] text-base font-semibold leading-normal capitalize">
                  {review.user.username || "Anonymous"}
                </p>
                <div className="flex items-center gap-1  pb-1">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <img
                      key={index}
                      src={index < 4 ? assets.star_icon : assets.star_icon_2}
                      alt=""
                      className="w-3 5"
                    />
                  ))}
                </div>

                <p className="text-[#6E6E6E] text-sm font-normal max-w-xs">
                  {review.comment}
                </p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default DashboardReviewList;
