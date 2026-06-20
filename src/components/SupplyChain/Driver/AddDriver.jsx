import { useForm } from "react-hook-form";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { toast } from "react-toastify";
import { useState } from "react";
import { apiClient } from "../../../lib/apiClient";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faCamera,
  faChevronDown,
  faCircleCheck,
  faFloppyDisk,
  faIdCard,
  faPlus,
  faTruck,
  faUser,
  faUsers,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

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

const VEHICLE_TYPES = ["Toyota Hilux", "Mitsubishi L200", "Isuzu D-Max", "Nissan Navara", "Delivery Van", "Truck"];

const fieldClassName =
  "h-11 w-full rounded-md border border-[#d0d5dd] bg-white px-3 text-sm font-medium text-[#101828] outline-none transition placeholder:text-[#98a2b3] focus:border-[#008f45] focus:ring-2 focus:ring-[#008f45]/10";

const labelClassName = "mb-2 block text-xs font-semibold text-[#101828]";

const RequiredMark = () => <span className="text-[#ef3340]"> *</span>;

const SectionTitle = ({ icon, children }) => (
  <div className="mb-5 flex items-center gap-3">
    <FontAwesomeIcon icon={icon} className="text-[#00a85a]" />
    <h3 className="text-sm font-semibold text-[#344054]">{children}</h3>
  </div>
);

const normalizePhoneNumber = (phone) => {
  const cleaned = String(phone || "").replace(/\s+/g, "");
  if (!cleaned) return "";
  if (cleaned.startsWith("+")) return cleaned;
  const withoutLeadingZero = cleaned.replace(/^0+/, "");
  return `+234${withoutLeadingZero}`;
};

const DriverForm = ({ setDriverAdded }) => {
  const [driverModalOpen, setDriverModalOpen] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      vehicleNumber: "",
      vehicleModel: "",
      licenseNumber: "",
      licenseExpiryDate: "",
      vehicleType: "",
      isAvailable: true,
      mainLocation: "",
      baseLocation: "",
      notes: "",
    },
  });

  const isAvailable = watch("isAvailable");
  const notes = watch("notes") || "";

  const closeModal = () => {
    setDriverModalOpen(false);
    reset();
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        name: data.name,
        phone: normalizePhoneNumber(data.phone),
        licenseNumber: data.licenseNumber || undefined,
        vehicleType: data.vehicleType || undefined,
        isAvailable: Boolean(data.isAvailable),
        mainLocation: data.mainLocation || undefined,
      };
      await apiClient.post("/supply-chain/driver", payload);
      toast.success("Driver created successfully");
      setDriverModalOpen(false);
      setDriverAdded(true);
      reset();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <>
      <button
        type="button"
        className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#008f45] px-5 text-sm font-semibold text-white shadow-[0_8px_16px_rgba(0,143,69,0.18)] transition hover:bg-[#00783a]"
        onClick={() => setDriverModalOpen(true)}
      >
        <FontAwesomeIcon icon={faPlus} className="text-xs" />
        Add Driver
        <FontAwesomeIcon icon={faChevronDown} className="text-[10px]" />
      </button>
      <Dialog
        open={driverModalOpen}
        onClose={closeModal}
        className="relative z-50"
      >
        <DialogBackdrop className="fixed inset-0 bg-[#101828]/60 backdrop-blur-[1px]" />
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-8">
          <DialogPanel className="w-full max-w-[680px] overflow-hidden rounded-xl bg-white shadow-[0_24px_80px_rgba(16,24,40,0.28)]">
            <div className="flex items-start justify-between border-b border-[#e5e7eb] px-8 py-7">
              <div className="flex items-center gap-5">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-[#dcf8e6] text-xl text-[#008f45]">
                  <FontAwesomeIcon icon={faUsers} />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-semibold tracking-normal text-[#101828]">
                    Add New Driver
                  </DialogTitle>
                  <p className="mt-2 text-sm font-medium text-[#667085]">
                    Create a new driver profile and assign details.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#d0d5dd] text-[#344054] transition hover:bg-[#f2f4f7]"
                aria-label="Close add driver modal"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="max-h-[calc(100vh-170px)] overflow-y-auto px-8 py-7"
            >
              <section className="border-b border-[#e5e7eb] pb-8">
                <SectionTitle icon={faUser}>Personal Information</SectionTitle>
                <div className="grid gap-6 md:grid-cols-[142px_1fr]">
                  <div className="flex h-[166px] flex-col items-center justify-center rounded-lg border border-dashed border-[#cbd5e1] bg-[#fbfcfd] p-3 text-center">
                    <div className="relative mb-3 grid h-24 w-24 place-items-center rounded-xl bg-[#dcf8e6] text-5xl text-[#00a85a]">
                      <FontAwesomeIcon icon={faUser} />
                      <span className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border-4 border-white bg-[#dcf8e6] text-xs text-[#008f45]">
                        <FontAwesomeIcon icon={faCamera} />
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-[#101828]">Upload Photo</p>
                    <p className="mt-1 text-[11px] font-medium text-[#667085]">JPG, PNG (Max 2MB)</p>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className={labelClassName}>Full Name<RequiredMark /></label>
                      <input
                        type="text"
                        {...register("name", { required: "Full name is required" })}
                        className={fieldClassName}
                        placeholder="Enter driver full name"
                      />
                      {errors.name && <p className="mt-1 text-xs text-[#ef3340]">{errors.name.message}</p>}
                    </div>

                    <div>
                      <label className={labelClassName}>Phone Number<RequiredMark /></label>
                      <div className="flex h-11 rounded-md border border-[#d0d5dd] bg-white focus-within:border-[#008f45] focus-within:ring-2 focus-within:ring-[#008f45]/10">
                        <div className="flex items-center gap-2 border-r border-[#e5e7eb] px-3 text-sm font-semibold text-[#101828]">
                          <span className="h-4 w-1 rounded-sm bg-[#008f45]" />
                          +234
                          <FontAwesomeIcon icon={faChevronDown} className="text-[10px] text-[#667085]" />
                        </div>
                        <input
                          type="tel"
                          {...register("phone", { required: "Phone number is required" })}
                          className="min-w-0 flex-1 rounded-r-md px-3 text-sm font-medium outline-none placeholder:text-[#98a2b3]"
                          placeholder="Enter phone number"
                        />
                      </div>
                      {errors.phone && <p className="mt-1 text-xs text-[#ef3340]">{errors.phone.message}</p>}
                    </div>

                    <div>
                      <label className={labelClassName}>Email <span className="font-medium text-[#667085]">(Optional)</span></label>
                      <input
                        type="email"
                        {...register("email")}
                        className={fieldClassName}
                        placeholder="Enter email address"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="border-b border-[#e5e7eb] py-8">
                <SectionTitle icon={faIdCard}>License & Location</SectionTitle>
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className={labelClassName}>License Number<RequiredMark /></label>
                    <input
                      type="text"
                      {...register("licenseNumber", { required: "License number is required" })}
                      className={fieldClassName}
                      placeholder="Enter license number"
                    />
                    {errors.licenseNumber && <p className="mt-1 text-xs text-[#ef3340]">{errors.licenseNumber.message}</p>}
                  </div>

                  <div>
                    <label className={labelClassName}>License Expiry Date</label>
                    <div className="relative">
                      <input
                        type="text"
                        {...register("licenseExpiryDate")}
                        className={`${fieldClassName} pr-10`}
                        placeholder="Select expiry date"
                      />
                      <FontAwesomeIcon icon={faCalendarDays} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#667085]" />
                    </div>
                  </div>

                  <div>
                    <label className={labelClassName}>Main Location<RequiredMark /></label>
                    <div className="relative">
                      <select
                        {...register("mainLocation", { required: "Main location is required" })}
                        className={`${fieldClassName} appearance-none pr-10`}
                        defaultValue=""
                      >
                        <option value="" disabled>Select state</option>
                        {NIGERIAN_STATES.map((state) => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                      <FontAwesomeIcon icon={faChevronDown} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-[#667085]" />
                    </div>
                    {errors.mainLocation && <p className="mt-1 text-xs text-[#ef3340]">{errors.mainLocation.message}</p>}
                  </div>

                  <div>
                    <label className={labelClassName}>Base Location <span className="font-medium text-[#667085]">(Optional)</span></label>
                    <div className="relative">
                      <select {...register("baseLocation")} className={`${fieldClassName} appearance-none pr-10`} defaultValue="">
                        <option value="" disabled>Select LGA / City</option>
                        <option value="Ibadan">Ibadan</option>
                        <option value="Lagos Mainland">Lagos Mainland</option>
                        <option value="Abeokuta">Abeokuta</option>
                        <option value="Kaduna North">Kaduna North</option>
                      </select>
                      <FontAwesomeIcon icon={faChevronDown} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-[#667085]" />
                    </div>
                  </div>
                </div>
              </section>

              <section className="pt-8">
                <SectionTitle icon={faTruck}>Vehicle Details</SectionTitle>
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className={labelClassName}>Vehicle Type<RequiredMark /></label>
                    <div className="relative">
                      <select
                        {...register("vehicleType", { required: "Vehicle type is required" })}
                        className={`${fieldClassName} appearance-none pr-10`}
                        defaultValue=""
                      >
                        <option value="" disabled>Select vehicle type</option>
                        {VEHICLE_TYPES.map((vehicle) => (
                          <option key={vehicle} value={vehicle}>{vehicle}</option>
                        ))}
                      </select>
                      <FontAwesomeIcon icon={faChevronDown} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-[#667085]" />
                    </div>
                    {errors.vehicleType && <p className="mt-1 text-xs text-[#ef3340]">{errors.vehicleType.message}</p>}
                  </div>

                  <div>
                    <label className={labelClassName}>Vehicle Plate Number<RequiredMark /></label>
                    <input
                      type="text"
                      {...register("vehicleNumber", { required: "Vehicle plate number is required" })}
                      className={fieldClassName}
                      placeholder="e.g. LAG 123 XY"
                    />
                    {errors.vehicleNumber && <p className="mt-1 text-xs text-[#ef3340]">{errors.vehicleNumber.message}</p>}
                  </div>

                  <div>
                    <label className={labelClassName}>Vehicle Model <span className="font-medium text-[#667085]">(Optional)</span></label>
                    <input
                      type="text"
                      {...register("vehicleModel")}
                      className={fieldClassName}
                      placeholder="e.g. Toyota Hilux"
                    />
                  </div>

                  <div>
                    <label className={labelClassName}>Year <span className="font-medium text-[#667085]">(Optional)</span></label>
                    <input
                      type="text"
                      {...register("year")}
                      className={fieldClassName}
                      placeholder="e.g. 2021"
                    />
                  </div>

                  <div>
                    <label className={labelClassName}>Availability<RequiredMark /></label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setValue("isAvailable", true, { shouldDirty: true })}
                        className={`flex h-12 items-center justify-center gap-2 rounded-md border text-sm font-semibold transition ${
                          isAvailable
                            ? "border-[#b7e8c7] bg-[#dcf8e6] text-[#008f45]"
                            : "border-[#d0d5dd] bg-white text-[#344054]"
                        }`}
                      >
                        <span className={`grid h-5 w-5 place-items-center rounded-full border ${isAvailable ? "border-[#008f45] bg-[#008f45] text-white" : "border-[#98a2b3]"}`}>
                          {isAvailable && <FontAwesomeIcon icon={faCircleCheck} className="text-[10px]" />}
                        </span>
                        Available
                      </button>
                      <button
                        type="button"
                        onClick={() => setValue("isAvailable", false, { shouldDirty: true })}
                        className={`flex h-12 items-center justify-center gap-2 rounded-md border text-sm font-semibold transition ${
                          !isAvailable
                            ? "border-[#fed7aa] bg-[#fff7ed] text-[#ea580c]"
                            : "border-[#d0d5dd] bg-white text-[#344054]"
                        }`}
                      >
                        <span className={`h-5 w-5 rounded-full border ${!isAvailable ? "border-[#ea580c] bg-[#ea580c]" : "border-[#98a2b3]"}`} />
                        Not Available
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className={labelClassName}>Notes <span className="font-medium text-[#667085]">(Optional)</span></label>
                    <div className="relative">
                      <textarea
                        {...register("notes", { maxLength: 250 })}
                        rows={4}
                        className="min-h-[92px] w-full resize-none rounded-md border border-[#d0d5dd] bg-white px-3 py-3 text-sm font-medium text-[#101828] outline-none transition placeholder:text-[#98a2b3] focus:border-[#008f45] focus:ring-2 focus:ring-[#008f45]/10"
                        placeholder="Any additional information about the driver..."
                      />
                      <span className="absolute bottom-2 right-3 text-[11px] font-medium text-[#667085]">{notes.length}/250</span>
                    </div>
                  </div>
                </div>
              </section>

              <div className="mt-8 grid gap-4 border-t border-[#e5e7eb] pt-7 md:grid-cols-2">
                <button
                  type="button"
                  className="h-12 rounded-md border border-[#d0d5dd] bg-white text-sm font-semibold text-[#101828] transition hover:bg-[#f9fafb]"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#008f45] text-sm font-semibold text-white shadow-[0_8px_16px_rgba(0,143,69,0.18)] transition hover:bg-[#00783a] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSubmitting}
                >
                  <FontAwesomeIcon icon={faFloppyDisk} />
                  {isSubmitting ? "Adding Driver..." : "Add Driver"}
                </button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
};

export default DriverForm;
