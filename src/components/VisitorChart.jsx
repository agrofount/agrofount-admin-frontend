import { useEffect, useState } from "react";
import { assets } from "../assets/assets";
import Chart from "react-apexcharts";

const VisitorChart = ({ users, isLoading, error }) => {
  const [visitorChart, setVisitorChart] = useState({
    chart: [],
    totalVisitors: 0,
  });

  const generateVisitorChartData = (users) => {
    const visitorsData = Array(7).fill(0);
    let totalVisitors = 0;
    const userList = users?.data || users || [];
    userList.forEach((user) => {
      const dayIndex = new Date(user.createdAt).getDay();
      visitorsData[dayIndex] += 1;
      totalVisitors += 1;
    });
    return {
      chart: [
        {
          name: "visitors-chart",
          data: visitorsData,
          color: "#FFB700",
        },
      ],
      totalVisitors,
    };
  };

  useEffect(() => {
    if (!error && !isLoading) {
      const chartData = generateVisitorChartData(users);
      setVisitorChart(chartData);
    }
  }, [users, isLoading, error]);

  const chartConfig = {
    options: {
      chart: {
        id: "basic-bar",
        stacked: true,
        toolbar: {
          show: false, // Disable the toolbar
        },
        height: 500,
      },
      xaxis: {
        categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "sat", "Sun"],
      },
      yaxis: {
        show: false, // Remove y-axis labels
      },
      dataLabels: {
        enabled: false,
      },
      plotOptions: {
        bar: {
          columnWidth: "30%",
        },
      },
    },
  };

  return (
    <div className="flex items-center px-4 bg-white border-b border-gray-200 h-[200px] flex-shrink-0 rounded-[12px]">
      <div className="flex flex-row  justify-start items-center gap-2">
        <div className="flex flex-col">
          <div className="flex items-center justify-between p-3 rounded-full bg-[#FFB700] w-11 h-11">
            <img src={assets.income_icon} alt="" />
          </div>
          <p className="text-[#6E6E6E] text-sm font-normal mt-2">Users</p>
          {error ? (
            <p className="text-red-500 text-sm mb-2">{error}</p>
          ) : isLoading ? (
            <p className="text-gray-400 text-sm mb-2">Loading...</p>
          ) : (
            <p className="text-black text-2xl font-bold mb-2">
              {visitorChart.totalVisitors >= 1_000_000_000
                ? `${(visitorChart.totalVisitors / 1_000_000_000).toFixed(1)}B`
                : visitorChart.totalVisitors >= 1_000_000
                ? `${(visitorChart.totalVisitors / 1_000_000).toFixed(1)}M`
                : visitorChart.totalVisitors >= 1_000
                ? `${(visitorChart.totalVisitors / 1_000).toFixed(1)}K`
                : new Intl.NumberFormat("en-NG").format(
                    visitorChart.totalVisitors
                  )}
            </p>
          )}
          <div className="flex flex-row justify-start text-[#F96767] text-xs py-2">
            <p>1.56%</p>
            <img src={assets.bear_icon} className="w-5 h-3 mx-2" alt="" />
          </div>
        </div>
        <div className="flex flex-grow items-center w-[55%]">
          {error ? (
            <div className="text-red-500 text-sm">Chart unavailable</div>
          ) : isLoading ? (
            <div className="text-gray-400 text-sm">Loading chart...</div>
          ) : (
            <Chart
              options={chartConfig.options}
              series={visitorChart.chart}
              type="bar"
              className="w-[80%] sm:w-[70%]"
              height="100%"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default VisitorChart;
