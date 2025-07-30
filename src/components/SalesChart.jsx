import { useEffect, useState } from "react";
import { assets } from "../assets/assets";
import Chart from "react-apexcharts";

const SalesChart = ({ orders }) => {
  const [salesChart, setSalesChart] = useState([]);

  const generateSalesChartData = (orders) => {
    const salesData = Array(7).fill(0);
    let totalSales = 0;
    orders?.forEach((order) => {
      if (order.paymentStatus === "completed") {
        const dayIndex = new Date(order.createdAt).getDay();
        salesData[dayIndex] += parseFloat(order.totalPrice);
        totalSales += Number(order.totalPrice);
      }
    });

    return {
      chart: [
        {
          name: "sales-chart",
          data: salesData,
          color: "#F96767",
        },
      ],
      totalSales,
    };
  };

  useEffect(() => {
    const chartData = generateSalesChartData(orders);
    setSalesChart(chartData);
  }, [orders]);

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
          <div className="flex items-center justify-between p-3 rounded-full bg-[#61BF75] w-11 h-11">
            <img src={assets.sales_icon} alt="" />
          </div>
          <p className="text-[#6E6E6E] text-sm font-normal mt-2">Total sales</p>
          <p className="text-black text-xl font-bold mb-2">
            {salesChart.totalSales >= 1_000_000_000
              ? `${(salesChart.totalSales / 1_000_000_000).toFixed(1)}B`
              : salesChart.totalSales >= 1_000_000
              ? `${(salesChart.totalSales / 1_000_000).toFixed(1)}M`
              : salesChart.totalSales >= 1_000
              ? `${(salesChart.totalSales / 1_000).toFixed(1)}K`
              : new Intl.NumberFormat("en-NG").format(salesChart.totalSales)}
          </p>
          <div className="flex flex-row justify-start text-[#61BF75] text-xs py-2">
            <p>1.56%</p>
            <img src={assets.bull_icon} className="w-5 h-3 mx-2" alt="" />
          </div>
        </div>
        <div className="flex flex-grow items-center w-[55%]">
          <Chart
            options={chartConfig.options}
            series={salesChart.chart || []}
            type="bar"
            className="w-[80%] sm:w-[70%]"
            height="100%"
          />
        </div>
      </div>
    </div>
  );
};

export default SalesChart;
