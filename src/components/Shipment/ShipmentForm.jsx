import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import axios from "axios";
import { toast } from "react-toastify";
import { useContext, useEffect, useState } from "react";
import { ShopContext } from "../../context/ShopContext";

const ShipmentForm = ({ orderData }) => {
  const [shipmentModalOpen, setShipmentModalOpen] = useState(false);
  const [shipmentProcessing, setShipmentProcessing] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const { backend_url, token } = useContext(ShopContext);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    defaultValues: {
      driverId: "",
      carrierNumber: "",
      estimatedDeliveryDate:
        orderData &&
        new Date(
          new Date(orderData.createdAt).setDate(
            new Date(orderData.createdAt).getDate() + 1
          )
        )
          .toISOString()
          .slice(0, 10),
      route: "",
      cost: "",
      deliveredAt: "",
    },
  });

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const res = await axios.get(`${backend_url}/supply-chain/drivers`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { filter: { available: true }, limit: 1000, page: 1 },
        });

        setDrivers(res.data?.data || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch drivers");
      }
    };
    fetchDrivers();
  }, [backend_url, token]);

  const onSubmit = async (data) => {
    try {
      setShipmentProcessing(true);
      const payload = {
        orderId: orderData.id,
        driverId: data.driverId || undefined,
        carrierNumber: data.carrierNumber || undefined,
        estimatedDeliveryDate: data.estimatedDeliveryDate || undefined,
        route: data.route || undefined,
        cost: Number(data.cost),
        deliveredAt: data.deliveredAt || undefined,
      };
      await axios.post(`${backend_url}/supply-chain/shipments`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success("Order shipped");
      setShipmentModalOpen(false);
      reset();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setShipmentProcessing(false);
    }
  };

  return (
    <>
      <button
        className="w-full border border-[#6c757d] rounded-lg py-3 my-5 hover:bg-gray-200 hover:border-none"
        onClick={() => setShipmentModalOpen(true)}
        disabled={shipmentProcessing || orderData?.status == "shipped"}
      >
        Ship order
      </button>
      <Dialog
        open={shipmentModalOpen}
        onClose={setShipmentModalOpen}
        className="relative z-50"
      >
        <DialogBackdrop className="fixed inset-0 bg-black/30" />
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <DialogPanel className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
            <DialogTitle className="text-lg font-bold mb-4">
              Create Shipment
            </DialogTitle>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">Driver</label>
                <select
                  {...register("driverId")}
                  className="border rounded px-3 py-2 w-full"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select Driver
                  </option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name}{" "}
                      {driver.vehicleType ? `(${driver.vehicleType})` : ""}
                    </option>
                  ))}
                </select>
                {errors.driverId && (
                  <span className="text-xs text-red-600">
                    {errors.driverId.message}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Carrier Number
                </label>
                <input
                  type="text"
                  {...register("carrierNumber")}
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Carrier Number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Estimated Delivery Date{" "}
                  <span className="text-xs text-red-600">*</span>
                </label>
                <input
                  type="date"
                  {...register("estimatedDeliveryDate")}
                  className="border rounded px-3 py-2 w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Route</label>
                <input
                  type="text"
                  {...register("route")}
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Shipping Route"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cost</label>
                <input
                  type="number"
                  {...register("cost", {
                    required: "Cost is required",
                    min: {
                      value: 0,
                      message: "Cost must be >= 0",
                    },
                  })}
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Shipping Cost"
                  min={0}
                />
                {errors.cost && (
                  <span className="text-xs text-red-600">
                    {errors.cost.message}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Delivered At
                </label>
                <input
                  type="date"
                  {...register("deliveredAt")}
                  className="border rounded px-3 py-2 w-full"
                />
              </div>
              <button
                type="submit"
                className="bg-[#61BF75] text-white py-2 rounded-lg font-semibold mt-2 disabled:opacity-60"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Processing..." : "Submit Shipment"}
              </button>
              <button
                type="button"
                className="bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold mt-2"
                onClick={() => setShipmentModalOpen(false)}
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

export default ShipmentForm;
