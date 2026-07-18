import { useState } from "react";
import ModalComponent from "../modals/ModalComponent";

const TestSendModal = ({ isOpen, onClose, onSend }) => {
  const [contactType, setContactType] = useState("email");
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);

  const handleClose = () => {
    if (sending) return;
    setValue("");
    onClose();
  };

  const handleSend = async () => {
    if (!value.trim()) return;
    setSending(true);
    try {
      await onSend(
        contactType === "email"
          ? { email: value.trim() }
          : { phone: value.trim() },
      );
      setValue("");
      onClose();
    } finally {
      setSending(false);
    }
  };

  return (
    <ModalComponent
      isModalOpen={isOpen}
      onClose={handleClose}
      title="Send Test Message"
      panelClassName="max-w-md w-full"
    >
      <div className="space-y-4">
        <p className="text-xs text-[#667085]">
          Sends this notification&rsquo;s current content to a single email or phone number, so you can check it before sending to the real audience.
        </p>

        <div className="flex gap-2">
          {[
            { value: "email", label: "Email" },
            { value: "phone", label: "Phone" },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setContactType(opt.value);
                setValue("");
              }}
              className={`h-9 flex-1 rounded-md border text-sm font-medium ${
                contactType === opt.value
                  ? "border-[#008f45] bg-[#f0fbf5] text-[#008f45]"
                  : "border-[#d0d5dd] bg-white text-[#344054] hover:bg-[#f9fafb]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <input
          type={contactType === "email" ? "email" : "tel"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={contactType === "email" ? "you@example.com" : "+2348012345678"}
          className="h-10 w-full rounded-md border border-[#d0d5dd] px-3 text-sm text-[#101828] outline-none focus:border-[#008f45] focus:ring-2 focus:ring-[#dff4e5]"
          autoFocus
        />

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={handleClose}
            disabled={sending}
            className="h-9 rounded-md border border-[#d0d5dd] bg-white px-4 text-sm font-medium text-[#344054] hover:bg-[#f9fafb] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !value.trim()}
            className="h-9 rounded-md bg-[#008f45] px-4 text-sm font-semibold text-white hover:bg-[#007a3b] disabled:opacity-60"
          >
            {sending ? "Sending..." : "Send Test"}
          </button>
        </div>
      </div>
    </ModalComponent>
  );
};

export default TestSendModal;
