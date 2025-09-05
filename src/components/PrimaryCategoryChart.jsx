import { useEffect, useState } from "react";
import Chart from "react-apexcharts";

const PrimaryCategoryChart = ({ orders }) => {
  const [chartData, setChartData] = useState({
    series: [],
    categories: [],
  });

  useEffect(() => {
    if (orders && orders.length > 0) {
      // Calculate sales by primary category
      const categorySales = {};
      let totalSales = 0;

      orders.forEach((order) => {
        // Check if order has items
        if (order.items && order.items.length > 0) {
          //   console.log("these are the order items: ", order.items);
          order.items.forEach((item) => {
            // Check if item has productLocations
            if (item) {
              // Check if productLocation has product with primaryCategory
              if (item.product) {
                console.log("these are the order items: ", item);
                const category = item.product.primaryCategory;
                // Use item price and quantity to calculate sales
                const itemTotal = (item.price || 0) * (item.quantity || 1);

                if (!categorySales[category]) {
                  categorySales[category] = 0;
                }
                categorySales[category] += itemTotal;
                totalSales += itemTotal;
              }
            }
          });
        }
      });

      // Convert to percentages and prepare data for chart
      const categories = Object.keys(categorySales);
      const seriesData = categories.map((category) =>
        parseFloat(((categorySales[category] / totalSales) * 100).toFixed(2))
      );

      setChartData({
        series: [{ name: "Sales Percentage", data: seriesData }],
        categories: categories,
      });
    }
  }, [orders]);

  const chartOptions = {
    chart: {
      type: "bar",
      height: 350,
      toolbar: {
        show: false,
      },
      fontFamily: "Inter, sans-serif",
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        horizontal: false,
        columnWidth: "55%",
      },
    },
    dataLabels: {
      enabled: true,
      formatter: function (val) {
        return val.toFixed(1) + "%";
      },
      offsetY: -20,
      style: {
        fontSize: "12px",
        fontWeight: 500,
        colors: ["#1F2937"],
      },
    },
    xaxis: {
      categories: chartData.categories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        style: {
          colors: "#374151",
          fontSize: "14px",
          fontWeight: 500,
          fontFamily: "Inter, sans-serif",
        },
      },
    },
    yaxis: {
      title: {
        text: "Percentage of Total Sales",
        style: {
          color: "#374151",
          fontSize: "14px",
          fontWeight: 500,
          fontFamily: "Inter, sans-serif",
        },
      },
      labels: {
        formatter: function (val) {
          return val.toFixed(0) + "%";
        },
        style: {
          colors: "#6B7280",
          fontSize: "12px",
          fontFamily: "Inter, sans-serif",
        },
      },
    },
    fill: {
      opacity: 1,
      colors: [
        "#3B82F6",
        "#10B981",
        "#F59E0B",
        "#EF4444",
        "#8B5CF6",
        "#06B6D4",
        "#F97316",
        "#6366F1",
      ],
    },
    tooltip: {
      style: {
        fontFamily: "Inter, sans-serif",
      },
      y: {
        formatter: function (val) {
          return val.toFixed(1) + "% of total sales";
        },
      },
    },
    grid: {
      borderColor: "#E5E7EB",
      strokeDashArray: 4,
      row: {
        colors: ["#F9FAFB", "transparent"],
        opacity: 0.5,
      },
    },
    responsive: [
      {
        breakpoint: 1000,
        options: {
          plotOptions: {
            bar: {
              columnWidth: "70%",
            },
          },
          dataLabels: {
            enabled: false,
          },
        },
      },
    ],
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-6 w-full">
      <h2 className="text-gray-800 text-xl font-semibold mb-6 font-sans">
        Sales by Product Category
      </h2>

      <div className="w-full overflow-x-auto">
        {chartData.series.length > 0 ? (
          <Chart
            options={chartOptions}
            series={chartData.series}
            type="bar"
            height={350}
            className="min-w-[300px]"
          />
        ) : (
          <div className="h-[350px] flex items-center justify-center text-gray-500 italic">
            <p>No category data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrimaryCategoryChart;
