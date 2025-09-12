import React, { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import ModalComponent from "../modals/ModalComponent";
import { ShopContext } from "../../context/ShopContext";
import axios from "axios";
import { toast } from "react-toastify";

const UpdateOrderItem = ({ orderId, orderItem, setUpdated }) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [processing, setProcessing] = React.useState(false);
  const { backend_url, token } = useContext(ShopContext);
  const [oldVendorPrice, setOldVendorPrice] = useState(
    orderItem?.uom.find((uom) => uom.platformPrice === orderItem.price)
      ?.vendorPrice || 0
  );
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      vendorPrice: "",
    },
  });

  useEffect(() => {
    // Set the form value when orderItem changes or modal opens
    console.log("orderItem", orderItem);
    const currentVendorPrice = orderItem?.uom.find(
      (uom) => uom.platformPrice === orderItem.price
    )?.vendorPrice;
    if (orderItem && isModalOpen) {
      setValue("vendorPrice", currentVendorPrice);
    }
  }, [orderItem, isModalOpen, setValue]);

  const onSubmit = async (data) => {
    setProcessing(true);
    try {
      const payload = {
        newVendorPrice: Number(data.vendorPrice),
        uomId: orderItem?.uom.find((uom) => uom.unit === orderItem.unit)?.id,
      };

      const response = await axios.patch(
        `${backend_url}/order/${orderId}/items/${orderItem.id}`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status == 200) {
        toast.success("Vendor price updated successfully");
        setProcessing(false);
        setIsModalOpen(false);
        setUpdated(true);
        reset();
      }
    } catch (error) {
      console.error("Error updating vendor price:", error);
      // Optionally, display an error message to the user
      toast.error("Failed to update vendor price. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    reset();
  };

  return (
    <div>
      <button
        className="px-4 py-2 bg-[#61BF75] text-white rounded hover:bg-[#61BF75] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#61BF75]"
        onClick={() => setIsModalOpen(true)}
      >
        Update
      </button>

      <ModalComponent isModalOpen={isModalOpen} onClose={handleClose}>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mb-2 text-center">
            Update Vendor Price
          </h3>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Vendor Price (
                <span className="text-gray-400">
                  Current:{" "}
                  {new Intl.NumberFormat("en-NG", {
                    style: "currency",
                    currency: "NGN",
                  }).format(oldVendorPrice)}
                </span>
                )
              </label>
              <input
                type="number"
                {...register("vendorPrice", {
                  required: "Vendor price is required",
                  min: {
                    value: 0,
                    message: "Price must be a positive number",
                  },
                })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#61BF75] focus:border-[#61BF75]"
                placeholder="Enter vendor price"
              />
              {errors.vendorPrice && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.vendorPrice.message}
                </p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Please enter the updated vendor price for the item.
              </p>
              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={processing}
                  className="mt-4 px-4 py-2 bg-[#61BF75] text-white rounded hover:bg-[#61BF75] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#61BF75] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? (
                    <div className="flex items-center space-x-2">
                      <div
                        className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-white"
                        role="status"
                      >
                        <span className="sr-only">Processing...</span>
                      </div>
                      <span className="text-surface text-white">
                        Processing...
                      </span>
                    </div>
                  ) : (
                    "Submit"
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </ModalComponent>
    </div>
  );
};

export default UpdateOrderItem;
