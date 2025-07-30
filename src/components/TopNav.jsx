import { Link } from "react-router-dom";

const TopNav = () => {
  return (
    <div className="flex items-center justify-center gap-3 font-medium bg-[#f86767] text-sm text-white py-2">
      <p className="flex text-[16px] font-normal leading-normal">
        get 35% off for new products
      </p>
      <Link
        to="/shop"
        className="flex font-normal leading-normal text-[16px] text-white px-10 py-2 border rounded-full cursor-pointer"
      >
        shop now
      </Link>
    </div>
  );
};

export default TopNav;
