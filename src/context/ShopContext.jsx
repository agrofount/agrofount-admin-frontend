import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { geocode, RequestType, setKey } from "react-geocode";
import axios from "axios";
import { io } from "socket.io-client";

export const ShopContext = createContext();

const ShopContextProvider = (props) => {
  setKey(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);

  const currency = "NGN";
  const delivery_fee = 10;
  const vat = 7.7;
  const paymentMethods = {
    COD: "cash_on_delivery",
    PAY_NOW: "pay_now",
    PAY_LATER: "pay_later",
  };
  const backend_url = import.meta.env.VITE_BACKEND_URL;
  const web_socket_url = import.meta.env.VITE_WEBSOCKET_URL;
  const country_id = import.meta.env.VITE_COUNTRY_ID;
  const frontend_url = import.meta.env.VITE_FRONTEND_URL;

  const [showSearch, setShowSearch] = useState(false);
  const [cartItems, setCartItems] = useState({});
  const [productLocations, setProductLocations] = useState({
    data: [],
    meta: {},
    links: {},
  });
  const [page, setProductPage] = useState(1);

  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [isCollectionLoading, setIsCollectionLoading] = useState(true);
  const [reviewAdded, setReviewAdded] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const socket = io(web_socket_url);

  socket.on("connect", () => {
    console.log("Connected to WebSocket server");
  });

  socket.on("uploadProgress", (data) => {
    console.log(`Upload progress for ${data.name}: ${data.percentage}%`);
  });

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const navigate = useNavigate();

  const getLocation = async () => {
    // Helper function to get geolocation
    const getCurrentPosition = () => {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          (error) => {
            reject(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      });
    };

    try {
      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;

      // Get formatted address, city, state, country from latitude & longitude.
      const geocodeResponse = await geocode(
        RequestType.LATLNG,
        `${latitude},${longitude}`,
        {
          location_type: "ROOFTOP",
          enable_address_descriptor: true,
        }
      );

      const { results } = geocodeResponse;
      const address = results[0].formatted_address;
      const { city, state, country } = results[0].address_components.reduce(
        (acc, component) => {
          if (component.types.includes("locality"))
            acc.city = component.long_name;
          else if (component.types.includes("administrative_area_level_1"))
            acc.state = component.long_name;
          else if (component.types.includes("country"))
            acc.country = component.long_name;
          return acc;
        },
        { city: null, state: null, country: null }
      );

      console.log(city, state, country);
      console.log(address);
      return { city, state, country, address };
    } catch (error) {
      console.error("Error getting location:", error);

      // Handle specific geolocation errors
      if (error.code) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error("Location access denied by the user.");
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error("Location information is unavailable.");
            break;
          case error.TIMEOUT:
            toast.error("The request to get user location timed out.");
            break;
          default:
            toast.error("An unknown error occurred while fetching location.");
        }
      } else {
        toast.error("Failed to fetch location data.");
      }

      return { city: null, state: null, country: null, address: null };
    }
  };

  const getProductData = async (filter = "", search = "") => {
    try {
      setIsCollectionLoading(true);

      const geocodeResponse = await getLocation();

      const response = await axios.get(`${backend_url}/product-location`, {
        params: {
          page,
          filter,
          search,
          limit: 15,
        },
      });

      if (response.data) {
        setProductLocations(response.data);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setIsCollectionLoading(false);
    }
  };

  const handleTokenExpiry = () => {
    toast.error("Session expired. Please log in again.");
    setToken("");
    localStorage.removeItem("token");
    navigate("/login");
  };

  useEffect(() => {
    getProductData();
  }, [page]);

  useEffect(() => {
    if (token) {
      const decodedToken = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      if (decodedToken.exp < currentTime) {
        // Token has expired
        handleTokenExpiry();
      } else {
        // getCartData(token);
      }
    }
  }, [token]);

  const value = {
    productLocations,
    currency,
    delivery_fee,
    vat,
    showSearch,
    setShowSearch,
    cartItems,
    setCartItems,
    navigate,
    token,
    setToken,
    backend_url,
    web_socket_url,
    frontend_url,
    country_id,
    isCollectionLoading,
    setProductPage,
    paymentMethods,
    setProductLocations,
    getProductData,
    reviewAdded,
    setReviewAdded,
    sidebarVisible,
    toggleSidebar,
    socket,
  };

  return (
    <ShopContext.Provider value={value}>{props.children}</ShopContext.Provider>
  );
};

export default ShopContextProvider;
