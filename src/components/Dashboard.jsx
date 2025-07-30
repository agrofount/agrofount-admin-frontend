import { useContext, useEffect, useState } from "react";
import { assets } from "../assets/assets";
import DashboardOrderList from "./DashboardOrderList";
import DashboardReviewList from "./DashboardReviewList";
import DashboardTopCustomers from "./DashboardTopCustomers";
import DashboardTopProductSales from "./DashboardTopProductSales";
import DashboardTopSalesByState from "./DashboardTopSales";
import IncomeChart from "./IncomeChart";
import SalesChart from "./SalesChart";
import VisitorChart from "./VisitorChart";
import { ShopContext } from "../context/ShopContext";
import DashboardTargetChart from "./DashboardTargetChart";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/16/solid";
import axios from "axios";
import qs from "qs";

const periods = [
  {
    id: 4,
    name: "August 2025",
    startDate: "2025-08-01",
    endDate: "2025-08-31",
  },
  {
    id: 3,
    name: "July 2025",
    startDate: "2025-07-01",
    endDate: "2025-07-31",
  },

  {
    id: 2,
    name: "June 2025",
    startDate: "2025-06-01",
    endDate: "2025-06-30",
  },

  {
    id: 1,
    name: "May 2025",
    startDate: "2025-05-01",
    endDate: "2025-05-31",
  },
  {
    id: 0,
    name: "All 2025",
    startDate: "2025-01-01",
    endDate: "2025-12-31",
  },
];
export const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const { currency } = useContext(ShopContext);
  const [selectedDate, setSelectedDate] = useState(periods[periods.length - 1]);
  const [isLoading, setIsLoading] = useState(false);
  const { token, backend_url, navigate } = useContext(ShopContext);

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      const response = await axios.get(`${backend_url}/order`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          "filter.createdAt": [
            `$gte:${selectedDate.startDate}`,
            `$lte:${selectedDate.endDate}`,
          ],
        },
        paramsSerializer: (params) =>
          qs.stringify(params, { arrayFormat: "repeat" }),
      });

      if (response.status === 200) {
        setOrders(response.data.data || []);
      }
      setIsLoading(false);
    };
    fetchOrders();
  }, [backend_url, token, selectedDate]);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      const response = await axios.get(`${backend_url}/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          "filter.createdAt": [
            `$gte:${selectedDate.startDate}`,
            `$lte:${selectedDate.endDate}`,
          ],
        },
        paramsSerializer: (params) =>
          qs.stringify(params, { arrayFormat: "repeat" }),
      });

      if (response.status === 200) setUsers(response.data || []);
      setIsLoading(false);
    };

    fetchUsers();
  }, [backend_url, token, selectedDate]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);
  return (
    <div>
      <div className="flex flex-col items-center px-6 bg-white border-b border-gray-200 flex-shrink-0 rounded-[12px] shadow-[0px_0px_10px_0px_#EDEDED] py-3 mb-4">
        <div className="flex flex-row justify-between items-center w-full">
          <p className="text-black font-roboto text-2xl font-bold leading-normal">
            Dashboard
          </p>
          <Listbox value={selectedDate} onChange={setSelectedDate}>
            <div className="relative">
              <ListboxButton className="grid w-full bg-[#f86767] rounded-full font-normal sm:font-semibold cursor-default grid-cols-1 py-1.5 pr-2 pl-3 text-left text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
                <span className="col-start-1 row-start-1 flex items-center gap-3 sm:px-6">
                  <p>Report Period: </p>
                  <span className="block truncate">{selectedDate.name}</span>
                </span>
                <ChevronUpDownIcon
                  aria-hidden="true"
                  className="col-start-1 row-start-1 size-5 self-center justify-self-end text-gray-500 sm:size-4"
                />
              </ListboxButton>

              <ListboxOptions
                transition
                className="absolute z-10 mt-1 max-h-56 w-full border border-gray-200 overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-hidden data-leave:transition data-leave:duration-100 data-leave:ease-in data-closed:data-leave:opacity-0 sm:text-sm"
              >
                {periods.map((period) => (
                  <ListboxOption
                    key={period.id}
                    value={period}
                    className="group relative cursor-default py-2 pr-9 pl-3 text-gray-900 select-none data-focus:bg-indigo-600 data-focus:text-white data-focus:outline-hidden"
                    onClick={() => {
                      setSelectedDate(period);
                      setTotalSales(0); // Reset total sales when changing period
                    }}
                  >
                    <div className="flex items-center">
                      <span className="ml-3 block truncate font-normal group-data-selected:font-semibold">
                        {period.name}
                      </span>
                    </div>

                    {selectedDate.name == period.name ? (
                      <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600 group-not-data-selected:hidden group-data-focus:text-white">
                        <CheckIcon aria-hidden="true" className="size-5" />
                      </span>
                    ) : null}
                  </ListboxOption>
                ))}
              </ListboxOptions>
            </div>
          </Listbox>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <DashboardTargetChart />
        <SalesChart orders={orders} />
        <IncomeChart orders={orders} />
        <VisitorChart users={users} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-8">
        <div className="flex flex-col items-center px-4 bg-white border-b border-gray-200 h-[584px] overflow-y-scroll flex-shrink-0 rounded-[12px] shadow-[0px_0px_10px_0px_#EDEDED] py-3 md:col-span-1">
          <div className="flex justify-between items-center w-full">
            <p className="text-black font-roboto text-2xl font-bold leading-normal">
              New Comments
            </p>
            <img src={assets.action_icon} alt="" />
          </div>

          <DashboardReviewList />
        </div>

        <div className="flex flex-col items-center px-4 bg-white border-b border-gray-200 h-[584px] flex-shrink-0 rounded-[12px] shadow-[0px_0px_10px_0px_#EDEDED] py-3 md:col-span-3">
          <div className="flex justify-between items-center w-full">
            <p className="text-black font-roboto text-2xl font-bold leading-normal">
              Recent Orders
            </p>
          </div>

          <DashboardOrderList orders={orders} isLoading={isLoading} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-8 gap-6 mt-8">
        <div className="flex flex-col items-center px-6 bg-white border-b border-gray-200 h-[484px] overflow-y-scroll flex-shrink-0 rounded-[12px] shadow-[0px_0px_10px_0px_#EDEDED] py-3 md:col-span-2">
          <div className="flex justify-start items-center w-full mb-3">
            <p className="text-black text-2xl font-bold leading-normal">
              Top Customers
            </p>
          </div>

          <div className="flex flex-row justify-between gap-2 w-full">
            <p className="text-[#4A4A4A] text-base font-semibold leading-normal capitalize">
              Name
            </p>
            <p className="text-[#4A4A4A] text-base font-semibold leading-normal capitalize">
              Total Money
            </p>
          </div>

          <DashboardTopCustomers orders={orders} />
        </div>

        <div className="flex flex-col items-center px-6 bg-white border-b border-gray-200 h-[484px] overflow-y-scroll flex-shrink-0 rounded-[12px] shadow-[0px_0px_10px_0px_#EDEDED] py-3 md:col-span-3">
          <div className="flex justify-start items-center w-full mb-3">
            <p className="text-black text-2xl font-bold leading-normal">
              Top States By Sales
            </p>
          </div>

          <div className="flex flex-row justify-start gap-2 w-full">
            <p className="text-[#4A4A4A] text-base font-semibold leading-normal capitalize">
              {new Intl.NumberFormat("en-NG", {
                style: "currency",
                currency,
              }).format(totalSales)}
            </p>
            <div className="flex flex-row justify-start text-[#61BF75] text-xs py-2">
              <p>1.56%</p>
              <img src={assets.bull_icon} className="w-5 h-3 mx-2" alt="" />
            </div>
            <p className="text-xs text-[#4A4A4A] py-1">since last weekend</p>
          </div>

          <DashboardTopSalesByState
            setTotalSales={setTotalSales}
            orders={orders}
          />
        </div>

        <div className="flex flex-col items-center px-6 bg-white border-b border-gray-200 h-[484px] overflow-y-scroll flex-shrink-0 rounded-[12px] shadow-[0px_0px_10px_0px_#EDEDED] py-3 md:col-span-3">
          <div className="flex justify-start items-center w-full mb-1">
            <p className="text-black text-2xl font-bold leading-normal">
              Top Products
            </p>
          </div>

          <DashboardTopProductSales orders={orders} />
        </div>
      </div>
    </div>
  );
};
