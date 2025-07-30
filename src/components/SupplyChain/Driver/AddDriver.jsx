import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import axios from "axios";
import { toast } from "react-toastify";
import { useContext, useState } from "react";
import { ShopContext } from "../../../context/ShopContext";

const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];

const DriverForm = ({ setDriverAdded }) => {
  const [driverModalOpen, setDriverModalOpen] = useState(false);
  const { backend_url, token } = useContext(ShopContext);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    defaultValues: {
      name: "",
      phone: "",
      vehicleNumber: "",
      licenseNumber: "",
      vehicleType: "",
      available: true,
      mainLocation: "",
    },
  });

  const onSubmit = async (data) => {
    try {
      const payload = {
        name: data.name,
        phone: data.phone || undefined,
        licenseNumber: data.licenseNumber || undefined,
        vehicleType: data.vehicleType || undefined,
        available: data.available,
        mainLocation: data.mainLocation || undefined,
      };
      await axios.post(`${backend_url}/supply-chain/driver`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success("Driver created successfully");
      setDriverModalOpen(false);
      setDriverAdded(true);
      reset();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  return (
    <>
      <button
        className="w-full border border-[#61BF75] rounded-lg py-2 px-3 hover:bg-[#61BF75] hover:text-white hover:border-none"
        onClick={() => setDriverModalOpen(true)}
      >
        Add Driver
      </button>
      <Dialog
        open={driverModalOpen}
        onClose={setDriverModalOpen}
        className="relative z-50"
      >
        <DialogBackdrop className="fixed inset-0 bg-black/30" />
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <DialogPanel className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
            <DialogTitle className="text-lg font-bold mb-4">
              Add Driver
            </DialogTitle>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">
                  Name<span className="text-xs text-red-600">*</span>
                </label>
                <input
                  type="text"
                  {...register("name", { required: "Name is required" })}
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Driver Name"
                />
                {errors.name && (
                  <span className="text-xs text-red-600">
                    {errors.name.message}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Phone <span className="text-xs text-red-600">*</span>
                </label>
                <input
                  type="text"
                  {...register("phone", { required: "Phone is required" })}
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Phone Number"
                />
                {errors.phone && (
                  <span className="text-xs text-red-600">
                    {errors.phone.message}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  License Number <span className="text-xs text-red-600">*</span>
                </label>
                <input
                  type="text"
                  {...register("licenseNumber")}
                  className="border rounded px-3 py-2 w-full"
                  placeholder="License Number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Main Location <span className="text-xs text-red-600">*</span>
                </label>
                <select
                  {...register("mainLocation", {
                    required: "Main Location is required",
                  })}
                  className="border rounded px-3 py-2 w-full"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select State
                  </option>
                  {NIGERIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
                {errors.mainLocation && (
                  <span className="text-xs text-red-600">
                    {errors.mainLocation.message}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Vehicle Type <span className="text-xs text-red-600">*</span>
                </label>
                <input
                  type="text"
                  {...register("vehicleType", {
                    required: "Vehicle Type is required",
                  })}
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Vehicle Type (e.g. Truck)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Available
                </label>
                <input
                  type="checkbox"
                  {...register("available")}
                  className="mr-2"
                  defaultChecked={true}
                />
                <span>Available</span>
              </div>
              <button
                type="submit"
                className="bg-[#61BF75] text-white py-2 rounded-lg font-semibold mt-2 disabled:opacity-60"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Processing..." : "Add Driver"}
              </button>
              <button
                type="button"
                className="bg-[#F96767] text-white py-2 rounded-lg font-semibold mt-2"
                onClick={() => setDriverModalOpen(false)}
              >
                Cancel
              </button>
            </form>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
};

export default DriverForm;
