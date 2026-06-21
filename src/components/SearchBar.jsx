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
      navigate("/list-products");
      setSearch("");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="hidden w-full max-w-[620px] md:block">
      <div className="flex h-10 items-center rounded-full border border-gray-200 bg-white px-4 shadow-sm">
        <div className="flex w-full items-center">
          <img src={assets.search_icon} className="mr-3 h-4 w-4 opacity-60" alt="" />
          <input
            value={search}
            className="min-w-0 flex-1 bg-transparent text-xs font-medium text-[#667085] outline-none placeholder:text-[#8a94a6]"
            type="text"
            placeholder="Search for products, orders, customers..."
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleSearch();
            }}
          />
          <button
            className="sr-only"
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
