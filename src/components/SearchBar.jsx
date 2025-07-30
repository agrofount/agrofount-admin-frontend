import { useContext, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/assets";
import { toast } from "react-toastify";

const SearchBar = () => {
  const [search, setSearch] = useState("");
  const [processing, setProcessing] = useState(false);

  const { navigate, getProductData } = useContext(ShopContext);

  const handleSearch = async () => {
    try {
      setProcessing(true);
      getProductData("", search);
      navigate("/shop");
      setSearch("");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="hidden md:block text-center">
      <div className="inline-flex items-center justify-between border border-gray-400 pl-2 w-full rounded-full">
        <div className="flex items-center">
          <img src={assets.search_icon} className="mr-2" />
          <input
            value={search}
            className="flex-1 outline-none bg-inherit text-sm ml-2 w-full sm:w-[200px] md:w-[300px] lg:w-[400px] text-[#6E6E6E] font-light "
            type="text"
            placeholder="Search here"
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            className="bg-[#61bf75] text-white px-4 py-2 sm:px-6 md:px-8 lg:px-10 rounded-r-full leading-normal cursor-pointer"
            onClick={handleSearch}
          >
            {processing ? (
              <div className="flex items-center space-x-2">
                <div
                  className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-white"
                  role="status"
                >
                  <span className="sr-only">Processing...</span>
                </div>
              </div>
            ) : (
              "Search"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
