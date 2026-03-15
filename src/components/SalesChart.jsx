import { useEffect, useState } from "react";
import { assets } from "../assets/assets";
import Chart from "react-apexcharts";

const SalesChart = ({ orders, isLoading, error }) => {
  const [docChart, setDocChart] = useState({ chart: [], totalDOC: 0 });

  const generateDOCChartData = (orders) => {
    const weekData = [0, 0, 0, 0, 0]; // up to 5 weeks
    let totalDOC = 0;

    orders?.forEach((order) => {
      if (order.paymentStatus === "completed") {
        const orderDate = new Date(order.createdAt);

        const weekOfMonth = Math.ceil(orderDate.getDate() / 7) - 1;

        let orderDOC = 0;

        order.items?.forEach((item) => {
          orderDOC +=
            item.unit == "Carton" ? Number(item.quantity || 0) * 50 : 0;
        });

        weekData[weekOfMonth] += orderDOC;
        totalDOC += orderDOC;
      }
    });

    console.log("Generated DOC Chart Data:", { weekData, totalDOC });

    return {
      chart: [
        {
          name: "DOC Sold",
          data: weekData,
        },
      ],
      totalDOC,
    };
  };

  useEffect(() => {
    if (!error && !isLoading) {
      const chartData = generateDOCChartData(orders);
      setDocChart(chartData);
    }
  }, [orders, isLoading, error]);

  const chartConfig = {
    options: {
      chart: {
        id: "doc-area-chart",
        toolbar: { show: false },
        height: 500,
      },

      xaxis: {
        categories: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"],
      },

      stroke: {
        curve: "smooth",
        width: 3,
      },

      markers: {
        size: 4,
      },

      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.4,
          opacityTo: 0.05,
          stops: [0, 100],
        },
      },

      colors: ["#61BF75"],

      dataLabels: {
        enabled: false,
      },

      yaxis: {
        title: {
          text: "DOC Sold",
        },
      },

      tooltip: {
        y: {
          formatter: (val) => `${val} chicks`,
        },
      },

      grid: {
        borderColor: "#f1f1f1",
      },
    },
  };

  return (
    <div className="flex items-center px-4 bg-white border-b border-gray-200 h-[200px] flex-shrink-0 rounded-[12px]">
      <div className="flex flex-row justify-start items-center gap-2">
        <div className="flex flex-col">
          <div className="flex items-center justify-between p-3 rounded-full bg-[#61BF75] w-11 h-11">
            <img src={assets.sales_icon} alt="" />
          </div>

          <p className="text-[#6E6E6E] text-sm font-normal mt-2">DOC</p>

          {error ? (
            <p className="text-red-500 text-sm mb-2">{error}</p>
          ) : isLoading ? (
            <p className="text-gray-400 text-sm mb-2">Loading...</p>
          ) : (
            <p className="text-black text-xl font-bold mb-2">
              {new Intl.NumberFormat("en-NG").format(docChart.totalDOC)}
            </p>
          )}

          <div className="flex flex-row justify-start text-[#61BF75] text-xs py-2">
            <p>1.56%</p>
            <img src={assets.bull_icon} className="w-5 h-3 mx-2" alt="" />
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
              series={docChart.chart}
              type="area"
              className="w-[80%] sm:w-[70%]"
              height="100%"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesChart;
