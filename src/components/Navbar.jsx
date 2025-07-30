import SearchBar from "./SearchBar";
import { assets } from "../assets/assets";
import axios from "axios";
import { toast } from "react-toastify";
import { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBarsStaggered } from "@fortawesome/free-solid-svg-icons";

function Navbar() {
  const [profileData, setProfileData] = useState({});
  const { token, backend_url, navigate, setToken, toggleSidebar } =
    useContext(ShopContext);

  const handleLogout = () => {
    navigate("/");
    localStorage.removeItem("token");
    setToken("");
  };

  const fetchProfile = async () => {
    try {
      if (!token) return;

      const response = await axios.get(`${backend_url}/admin/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        setProfileData(response.data);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);
  return (
    <div className="flex items-center justify-between h-20 bg-white border-b border-gray-200 px-10 py-3">
      <div className="flex items-center pr-4">
        <div onClick={toggleSidebar} className="block md:hidden">
          <FontAwesomeIcon
            icon={faBarsStaggered}
            size="2x"
            className="py-4 pr-4 cursor-pointer"
          />
        </div>
        <SearchBar />
      </div>
      {/* <!-- notification --> */}
      <div className="flex items-center space-x-4 mr-4">
        <a href="#" className="bg-[#EEEEEE] rounded-full p-2">
          <img src={assets.notification_icon} alt="" />
        </a>
        {/* <!-- parametre --> */}
        <a href="#" className="bg-[#EEEEEE] rounded-full p-2">
          <img src={assets.message_icon} alt="" />
        </a>
        <Popover>
          <PopoverButton className="flex flex-row gap-2 items-center cursor-pointer">
            <div className="rounded-full">
              <img
                src={assets.profile_picture}
                className="rounded-full"
                alt=""
              />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold">
                {profileData.username ||
                  `${profileData.lastname} ${profileData.firstname}`}
              </p>
              {/* <p className="text-xs">{profileData.roles[0].name || "Admin"}</p> */}
            </div>
          </PopoverButton>
          <PopoverPanel
            transition
            anchor="bottom"
            className="divide-y divide-white/5 rounded-xl bg-white text-sm/6 transition duration-200 ease-in-out [--anchor-gap:var(--spacing-5)] data-[closed]:-translate-y-1 data-[closed]:opacity-0"
          >
            <div className="p-3">
              <a
                href="#"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={handleLogout}
              >
                Logout
              </a>
            </div>
          </PopoverPanel>
        </Popover>
      </div>
    </div>
  );
}

export default Navbar;
