import axios, { HttpStatusCode } from "axios";
import { useCallback, useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";

const DashboardTargetChart = () => {
  const [result, setResult] = useState({
    target: 0,
    totalSales: 0,
    percentageCompletion: "0%",
    message: "",
  });

  const { backend_url, token } = useContext(ShopContext);

  const fetchTargetResult = useCallback(async () => {
    try {
      const response = await axios.get(`${backend_url}/order/monthly-target`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status == HttpStatusCode.Ok) {
        console.log("successfully fetch target result.");
        setResult(response.data);
      }
    } catch (error) {
      console.error("an error occured: ", error);
    }
  }, [backend_url, token]);

  useEffect(() => {
    fetchTargetResult();
  }, [fetchTargetResult]);

  return (
    <div className="flex items-center px-4 bg-white border-b border-gray-200 h-[200px] flex-shrink-0 rounded-[12px] bg-gradient-to-b from-[#61BF75] to-[#296D34] shadow-[0px_0px_10px_0px_#EDEDED]">
      <div className="flex flex-row  justify-between items-center gap-2">
        <div className="flex flex-col w-[63%]">
          <p className="text-white text-xl font-semibold leading-5 mb-3">
            {result.message}
          </p>
          <p className="text-white text-sm font-normal mb-3">
            You have competed {result.percentageCompletion} of your target of{" "}
            <b>
              ₦{" "}
              {result.target >= 1_000_000_000
                ? `${(result.target / 1_000_000_000).toFixed(1)}B`
                : result.target >= 1_000_000
                ? `${(result.target / 1_000_000).toFixed(1)}M`
                : result.target >= 1_000
                ? `${(result.target / 1_000).toFixed(1)}K`
                : new Intl.NumberFormat("en-NG").format(result.target)}
            </b>
          </p>
          <p className="text-white text-sm font-normal">View details</p>
        </div>
        <div className="flex items-center justify-center w-28 h-28 bg-white rounded-full animate-fast-pulse-scale">
          <div className="flex items-center justify-center w-24 h-24 bg-[#F96767] rounded-full">
            <p className="text-white font-semibold">
              {result.percentageCompletion}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTargetChart;
