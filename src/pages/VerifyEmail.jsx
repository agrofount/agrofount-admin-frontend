import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

const VerifyEmail = () => {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { backend_url, setToken, token } = useContext(ShopContext);

  const getTokenFromUrl = () => {
    const params = new URLSearchParams(location.search);
    return params.get("token");
  };

  const verificationToken = getTokenFromUrl();

  const handleVerifyEmail = async () => {
    try {
      const response = await axios.get(
        `${backend_url}/admin/verify-email?token=${verificationToken}`
      );

      if (response.data.success) {
        setIsVerified(true);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while verifying your email.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleVerifyEmail();
  }, []);

  useEffect(() => {
    if (token) {
      localStorage.removeItem("token");
      setToken("");
    }
  }, [token, setToken]);

  if (isLoading) {
    return (
      <div className="flex flex-col text-center w-[90%] sm:max-w-96 m-auto my-20 gap-4 text-sm">
        Loading...
      </div>
    );
  }

  return (
    <div className="w-screen min-h-screen flex items-center justify-center bg-gray-200 px-4 sm:px-6 lg:px-8">
      <div className="relative py-3 w-full sm:w-1/4 sm:mx-auto">
        <div>
          {isVerified ? (
            <div className="text-center">
              <p className="mb-3">Email verified successfully.</p>
              <Link
                to="/login"
                className="bg-[#61BF75] text-white p-2 rounded-md mt-4"
              >
                Login
              </Link>
              .
            </div>
          ) : (
            "Email verification failed."
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
