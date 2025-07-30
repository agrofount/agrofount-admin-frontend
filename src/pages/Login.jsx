import { useContext, useEffect, useState } from "react";
import { assets } from "../assets/assets";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import { toast } from "react-toastify";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { token, setToken, navigate, backend_url } = useContext(ShopContext);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setProcessing(true);
      const response = await axios.post(`${backend_url}/auth/admin/login`, {
        email,
        password,
      });

      setToken(response.data.token);
      localStorage.setItem("token", response.data.token);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    if (token) {
      navigate("/");
    }
  }, [token, navigate]);

  return (
    <div className="w-screen min-h-screen flex items-center justify-center bg-gray-200 px-4 sm:px-6 lg:px-8">
      <div className="relative py-3 w-full sm:w-3/4 md:w-1/4 sm:mx-auto">
        <form
          className="min-h-96 px-8 py-6 mt-4 text-left bg-white  rounded-xl shadow-lg"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col justify-center items-center h-full select-none">
            <div className="flex flex-col items-center justify-center gap-2 mb-8">
              <a href="https://agrofount.com/" target="_blank">
                <img src={assets.agrofount_logo} className="w-20" />
              </a>
              <p className="m-0 text-[16px] font-semibold text-[#8B8E98]">
                Login to your Account
              </p>
            </div>
            <div className="w-full flex flex-col gap-2">
              <label className="font-semibold text-xs text-gray-400 ">
                Email
              </label>
              <input
                type="email"
                className="border rounded-lg px-3 py-3 mb-5 text-sm w-full outline-none border-gray-500"
                placeholder="Email"
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                required
              />
            </div>
          </div>
          <div className="w-full flex flex-col gap-2">
            <label className="font-semibold text-xs text-gray-400 ">
              Password
            </label>
            <input
              type="password"
              className="border rounded-lg px-3 py-3 mb-5 text-sm w-full outline-none border-gray-500"
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              required
            />
          </div>
          <div className="mt-5">
            <button
              type="submit"
              className="py-2 px-8 bg-[#F96767] hover:bg-[#fb4747] focus:bg-[#fb4747] text-white w-full transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg cursor-pointer select-none"
            >
              {processing ? (
                <div className="flex items-center space-x-2">
                  <div
                    className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-white"
                    role="status"
                  >
                    <span className="sr-only">Processing...</span>
                  </div>
                  <span className="text-surface text-white">Processing...</span>
                </div>
              ) : (
                "Login"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
