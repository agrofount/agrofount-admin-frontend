/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { setKey } from "react-geocode";
import { io } from "socket.io-client";
import { apiClient, setupApiAuthHandlers } from "../lib/apiClient";
import {
  clearAuthStorage,
  getAuthToken,
  getRefreshToken,
  setAuthToken,
} from "../lib/authStorage";

export const ShopContext = createContext();

const ShopContextProvider = (props) => {
  setKey(
    import.meta.env.VITE_GOOGLE_MAPS_KEY ||
      import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  );

  const currency = "NGN";
  const delivery_fee = 10;
  const vat = 7.7;
  const paymentMethods = useMemo(
    () => ({
      COD: "cash_on_delivery",
      PAY_NOW: "pay_now",
      PAY_LATER: "pay_later",
    }),
    []
  );
  const backend_url =
    import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL;
  const web_socket_url =
    import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_WEBSOCKET_URL;
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

  const [token, setTokenState] = useState(getAuthToken());
  const [user, setUser] = useState(null); // Add user state
  const [authLoading, setAuthLoading] = useState(Boolean(getAuthToken()));
  const [authInitialized, setAuthInitialized] = useState(!getAuthToken());
  const [isCollectionLoading, setIsCollectionLoading] = useState(true);
  const [reviewAdded, setReviewAdded] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [socket, setSocket] = useState(null);

  const toggleSidebar = useCallback(() => {
    setSidebarVisible((visible) => !visible);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarVisible(false);
  }, []);

  const navigate = useNavigate();

  const setToken = useCallback((nextToken, nextRefreshToken) => {
    setAuthToken(nextToken, nextRefreshToken);
    setTokenState(nextToken || "");
  }, []);

  const getProductData = useCallback(
    async (filter = "", search = "") => {
      try {
        setIsCollectionLoading(true);

        // const geocodeResponse = await getLocation();

        const response = await apiClient.get("/product-location", {
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
        toast.error(error.message);
      } finally {
        setIsCollectionLoading(false);
      }
    },
    [page],
  );

  const handleTokenExpiry = useCallback(() => {
    toast.error("Session expired. Please log in again.");
    clearAuthStorage();
    setTokenState("");
    setUser(null);
    setAuthInitialized(true);
    navigate("/login");
  }, [navigate]);

  // Fetch user profile when token changes
  const fetchUserProfile = useCallback(
    async (fallbackUser = null) => {
      try {
        const response = await apiClient.get("/admin/profile");

        if (response.data) {
          setUser((currentUser) => ({
            ...(fallbackUser || currentUser || {}),
            ...response.data,
          }));
        }
      } catch (error) {
        if (error.status === 401) {
          handleTokenExpiry();
        } else {
          if (fallbackUser) setUser(fallbackUser);
          toast.error(error.message || "Unable to fetch user profile.");
        }
      } finally {
        setAuthLoading(false);
        setAuthInitialized(true);
      }
    },
    [handleTokenExpiry],
  );

  const logout = useCallback(() => {
    clearAuthStorage();
    setTokenState("");
    setUser(null);
    socket?.disconnect();
    navigate("/login");
    toast.success("Logged out successfully");
  }, [navigate, socket]);

  useEffect(() => setupApiAuthHandlers({ onUnauthorized: handleTokenExpiry }), [
    handleTokenExpiry,
  ]);

  useEffect(() => {
    const handleTokenRefreshed = (event) => {
      setTokenState(event.detail?.token || getAuthToken());
    };

    window.addEventListener("agrofount:token-refreshed", handleTokenRefreshed);

    return () => {
      window.removeEventListener(
        "agrofount:token-refreshed",
        handleTokenRefreshed
      );
    };
  }, []);

  useEffect(() => {
    getProductData();
  }, [page, getProductData]);

  useEffect(() => {
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        if (decodedToken.exp < currentTime && !getRefreshToken()) {
          handleTokenExpiry();
        } else {
          setAuthLoading(true);
          setUser((currentUser) => ({
            ...(currentUser || {}),
            ...decodedToken,
          }));
          fetchUserProfile(decodedToken);
        }
      } catch {
        handleTokenExpiry();
      }
    } else {
      setAuthLoading(false);
      setAuthInitialized(true);
      setUser(null);
    }
  }, [token, handleTokenExpiry, fetchUserProfile]);

  useEffect(() => {
    if (!token || !web_socket_url) {
      setSocket((currentSocket) => {
        currentSocket?.disconnect();
        return null;
      });
      return undefined;
    }

    const nextSocket = io(web_socket_url, {
      auth: { token },
      transports: ["websocket"],
    });

    const toastShown = { current: false };
    const handleConnectError = () => {
      if (!toastShown.current) {
        toastShown.current = true;
        toast.error("Realtime connection failed.");
      }
    };

    nextSocket.on("connect_error", handleConnectError);
    nextSocket.on("connect", () => { toastShown.current = false; });
    setSocket(nextSocket);

    return () => {
      nextSocket.off("connect_error", handleConnectError);
      nextSocket.disconnect();
    };
  }, [token, web_socket_url]);

  const value = useMemo(() => ({
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
    closeSidebar,
    socket,
    user,
    logout,
    authLoading,
    authInitialized,
  }), [
    productLocations,
    showSearch,
    cartItems,
    navigate,
    token,
    backend_url,
    web_socket_url,
    frontend_url,
    country_id,
    isCollectionLoading,
    paymentMethods,
    getProductData,
    reviewAdded,
    sidebarVisible,
    socket,
    user,
    logout,
    authLoading,
    authInitialized,
    setToken,
    toggleSidebar,
    closeSidebar,
  ]);

  return (
    <ShopContext.Provider value={value}>{props.children}</ShopContext.Provider>
  );
};

export default ShopContextProvider;
