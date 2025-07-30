import { Field, Label, Select, Switch } from "@headlessui/react";
import axios, { HttpStatusCode } from "axios";
import { useCallback, useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ShopContext } from "../../context/ShopContext";
import { useParams } from "react-router-dom";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import clsx from "clsx";

const CityForm = () => {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [processing, setProcessing] = useState(false);
  const [cityData, setCityData] = useState({});
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState(null);
  const { cityId } = useParams();
  const queryParams = new URLSearchParams(location.search);
  const countryId = queryParams.get("countryId");
  const stateId = queryParams.get("stateId");

  const { token, navigate, backend_url } = useContext(ShopContext);

  const [active, setActive] = useState(false);

  const handleSelectState = (e) => {
    setSelectedState(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: name,
      code: code,
      stateId: selectedState,
      isActive: active,
    };

    try {
      setProcessing(true);
      let response;
      if (!cityId) {
        response = await axios.post(`${backend_url}/city`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === HttpStatusCode.Created) {
          toast.success(response.data.message || "City successfully created");
          navigate(
            `/cities/?stateName=${response.data.state.name}&stateId=${response.data.state.id}&countryId=${response.data.state.country.id}`
          );
        }
      } else {
        response = await axios.put(
          `${backend_url}/city/${cityData.id}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === HttpStatusCode.Ok) {
          toast.success(response.data.message || "City successfully Updated");
          navigate(
            `/cities/?StateName=${response.data.state.name}&stateId=${response.data.state.id}&countryId=${response.data.state.country.id}`
          );
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setProcessing(false);
    }
  };

  const fetchCityData = useCallback(async () => {
    try {
      const response = await axios.get(`${backend_url}/city/${cityId}`);
      if (response.data) {
        setCityData(response.data);
        setName(response.data.name || "");
        setCode(response.data.code || "");
        setSelectedState(response.data.state.id || "");
        setActive(response.data.isActive);
      } else {
        console.log("error", response);
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log("error", error);
      toast.error(error.response?.data?.message || error.message);
    }
  }, [backend_url, cityId]);

  const fetchStates = useCallback(async () => {
    try {
      const response = await axios.get(`${backend_url}/state`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          "filter.country.id": countryId,
        },
      });
      if (response.status === HttpStatusCode.Ok) {
        setStates(response.data.data);
        if (!stateId && response.data.data.length > 0) {
          setSelectedState(response.data.data[0].id);
        }

        if (stateId) {
          setSelectedState(stateId);
        }
      }
    } catch (error) {
      console.log("error", error);
      toast.error(error.response?.data?.message || error.message);
    }
  }, [backend_url, countryId]);

  useEffect(() => {
    const fetchData = async () => {
      await fetchCityData();
    };

    if (cityId) {
      fetchData();
    }
  }, [fetchCityData, cityId]);

  useEffect(() => {
    fetchStates();
  }, [fetchStates]);

  return (
    <div className="w-full sm:w-2/3 md:w-1/3 mx-auto px-2">
      <form onSubmit={handleSubmit} className="py-10">
        <div className="w-full flex flex-col gap-2">
          <label className="font-semibold text-gray-400 ">Name</label>
          <input
            type="text"
            className="border rounded-lg px-3 py-3 mb-5 text-sm w-full outline-none border-gray-500"
            placeholder="City Name"
            onChange={(e) => setName(e.target.value)}
            value={name !== undefined ? name : cityData.name}
            required
          />
        </div>
        <div className="w-full flex flex-col gap-2">
          <label className="font-semibold text-gray-400 ">Code</label>
          <input
            type="text"
            className="border rounded-lg px-3 py-3 mb-5 text-sm w-full outline-none border-gray-500"
            placeholder="City Code"
            onChange={(e) => setCode(e.target.value)}
            value={code !== undefined ? code : cityData.code}
            required
          />
        </div>
        <div className="w-full max-w-md">
          <Field>
            <Label className="font-semibold text-gray-400">Select State</Label>

            <div className="relative">
              <Select
                className={clsx(
                  "block w-full rounded-lg border border-1 py-3 border-gray-500 bg-white px-3 text-sm text-gray-500 mb-5",
                  "focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-white/25",
                  // Make the text of each option black on Windows
                  "*:text-black"
                )}
                value={selectedState}
                onChange={handleSelectState}
              >
                {states.map((state) => (
                  <option value={state.id} key={state.name}>
                    {state.name}
                  </option>
                ))}
              </Select>
              <ChevronDownIcon
                className="group pointer-events-none absolute top-2.5 right-2.5 size-4 fill-white/60"
                aria-hidden="true"
              />
            </div>
          </Field>
        </div>
        <div className="w-full flex flex-col gap-2">
          <label className="font-semibold text-sm text-gray-400 ">
            Is Active
          </label>
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

export default CityForm;
