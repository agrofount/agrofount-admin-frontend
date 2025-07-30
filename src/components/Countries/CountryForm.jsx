import { Switch } from "@headlessui/react";
import axios, { HttpStatusCode } from "axios";
import { useCallback, useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ShopContext } from "../../context/ShopContext";
import { useParams } from "react-router-dom";

const CountryForm = () => {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [processing, setProcessing] = useState(false);
  const { countryId } = useParams();
  const [countryData, setCountryData] = useState({});

  const { token, navigate, backend_url } = useContext(ShopContext);

  const [active, setActive] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: name,
      code: code,
      isActive: active,
    };

    try {
      setProcessing(true);
      let response;
      if (!countryId) {
        response = await axios.post(`${backend_url}/country`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.status === HttpStatusCode.Created) {
          toast.success(
            response.data.message || "Country successfully created"
          );
          navigate("/countries");
        }
      } else {
        response = await axios.put(
          `${backend_url}/country/${countryData.id}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === HttpStatusCode.Ok) {
          toast.success(
            response.data.message || "Country successfully Updated"
          );
          navigate("/countries");
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setProcessing(false);
    }
  };

  const fetchCountryData = useCallback(async () => {
    try {
      const response = await axios.get(`${backend_url}/country/${countryId}`);
      if (response.data) {
        setCountryData(response.data);
        setName(response.data.name || "");
        setCode(response.data.code || "");
        setActive(response.data.isActive);
      } else {
        console.log("error", response);
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log("error", error);
      toast.error(error.response?.data?.message || error.message);
    }
  }, [backend_url, token]);

  useEffect(() => {
    const fetchData = async () => {
      await fetchCountryData();
    };
    if (countryId) {
      fetchData();
    }
  }, [fetchCountryData, countryId]);
  return (
    <div className="w-full sm:w-1/3 mx-auto px-2">
      <form onSubmit={handleSubmit} className="py-10">
        <div className="w-full flex flex-col gap-2">
          <label className="font-semibold text-gray-400 ">Name</label>
          <input
            type="text"
            className="border rounded-lg px-3 py-3 mb-5 text-sm w-full outline-none border-gray-500"
            placeholder="Country Name"
            onChange={(e) => setName(e.target.value)}
            value={name !== undefined ? name : countryData.name}
            required
          />
        </div>
        <div className="w-full flex flex-col gap-2">
          <label className="font-semibold text-gray-400 ">Code</label>
          <input
            type="text"
            className="border rounded-lg px-3 py-3 mb-5 text-sm w-full outline-none border-gray-500"
            placeholder="Country Code"
            onChange={(e) => setCode(e.target.value)}
            value={code !== undefined ? code : countryData.code}
            required
          />
        </div>
        <div className="w-full flex flex-col gap-2">
          <label className="font-semibold text-sm text-gray-400 ">Active</label>
          <Switch
            checked={active}
            onChange={setActive}
            className="group relative flex h-7 w-14 cursor-pointer rounded-full bg-white p-1 transition-colors duration-200 ease-in-out focus:outline-none border border-gray-500 data-[focus]:outline-1 data-[focus]:outline-[#61BF75] data-[checked]:bg-[#61BF75]"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none inline-block size-5 translate-x-0 rounded-full bg-[#fb4747] ring-0 shadow-lg transition duration-200 ease-in-out group-data-[checked]:translate-x-7"
            />
          </Switch>
        </div>
        <div className="my-3">
          <button
            type="submit"
            className="py-2 px-8 bg-[#61BF75] hover:bg-[#61BF75] focus:bg-[#61BF75] text-white w-full transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg cursor-pointer select-none"
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
              "Submit"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CountryForm;
