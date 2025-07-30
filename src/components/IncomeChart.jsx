import { useContext, useEffect, useState } from "react";
import { assets } from "../assets/assets";
import Chart from "react-apexcharts";
import { ShopContext } from "../context/ShopContext";

const IncomeChart = ({ orders }) => {
  const [incomeChart, setIncomeChart] = useState([]);
  const { token, backend_url } = useContext(ShopContext);

  const generateIncomeChartData = (orders) => {
    const incomeData = Array(7).fill(0);
    let totalIncome = 0;
    orders?.forEach((order) => {
      if (order.paymentStatus === "completed") {
        const dayIndex = new Date(order.createdAt).getDay();
        if (Array.isArray(order.items)) {
          order.items.forEach((item) => {
            // Use item.price as platform price
            const platformPrice = Number(item.price) || 0;
            const quantity = Number(item.quantity) || 0;
            let vendorPrice = 0;
            // Try to find the correct UOM from the product's uom array
            // console.log("checking selected uom for item: ", item);
            if (item.uom && Array.isArray(item.uom)) {
              // Try to match by unit or name
              let selectedUom = null;
              if (item.unit) {
                selectedUom = item.uom.find(
                  (u) => u.unit === item.unit || u.name === item.unit
                );
              } else if (item.uom) {
                selectedUom = item.uom.find(
                  (u) => u.unit === item.uom || u.name === item.uom
                );
              }

              console.log("selectedUom: ", selectedUom);
              if (selectedUom && selectedUom.vendorPrice) {
                vendorPrice = Number(selectedUom.vendorPrice) || 0;
              }
            }
            const income = (platformPrice - vendorPrice) * quantity;
            incomeData[dayIndex] += income;
            totalIncome += income;
          });
        }
      }
    });

    return {
      chart: [
        {
          name: "income-chart",
          data: incomeData,
          color: "#F96767",
        },
      ],
      totalIncome,
    };
  };

  useEffect(() => {
    const incomeChart = generateIncomeChartData(orders);
    setIncomeChart(incomeChart);
  }, [backend_url, token, orders]);

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

  useEffect(() => {
    setIncomeChart([
      {
        name: "sales-chart",
        data: [30, 40, 45, 50, 49, 60, 70],
        color: "#61BF75",
      },
    ]);
  }, []);
  return (
    <div className="flex items-center px-4 bg-white border-b border-gray-200 h-[200px] flex-shrink-0 rounded-[12px]">
      <div className="flex flex-row  justify-start items-center gap-2">
        <div className="flex flex-col">
          <div className="flex items-center justify-between p-3 rounded-full bg-[#F96767] w-11 h-11">
            <img src={assets.income_icon} alt="" />
          </div>
          <p className="text-[#6E6E6E] text-sm font-normal mt-2">
            Total Income
          </p>
          <p className="text-black text-2xl font-bold mb-2">
            {" "}
            {incomeChart.totalIncome >= 1_000_000_000
              ? `${(incomeChart.totalIncome / 1_000_000_000).toFixed(1)}B`
              : incomeChart.totalIncome >= 1_000_000
              ? `${(incomeChart.totalIncome / 1_000_000).toFixed(1)}M`
              : incomeChart.totalIncome >= 1_000
              ? `${(incomeChart.totalIncome / 1_000).toFixed(1)}K`
              : new Intl.NumberFormat("en-NG").format(incomeChart.totalIncome)}
          </p>
          <div className="flex flex-row justify-start text-[#F96767] text-xs py-2">
            <p>1.56%</p>
            <img src={assets.bear_icon} className="w-5 h-3 mx-2" alt="" />
          </div>
        </div>
        <div className="flex flex-grow items-center w-[55%]">
          <Chart
            options={chartConfig.options}
            series={incomeChart}
            type="bar"
            className="w-[80%] sm:w-[70%]"
            height="100%"
          />
        </div>
      </div>
    </div>
  );
};

export default IncomeChart;
