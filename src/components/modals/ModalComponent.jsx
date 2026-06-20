import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const ModalComponent = ({
  isModalOpen,
  onClose,
  title = "Dialog",
  hideHeader = false,
  panelClassName = "",
  children,
}) => {
  const titleId = useId();
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!isModalOpen) return undefined;

    previousFocusRef.current = document.activeElement;
    const modal = modalRef.current;
    const focusableElements = modal
      ? Array.from(modal.querySelectorAll(focusableSelector))
      : [];

    focusableElements[0]?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus?.();
    };
  }, [isModalOpen, onClose]);

  if (!isModalOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`bg-white rounded-lg p-6 w-full max-w-md mx-2 ${panelClassName}`}
      >
        {!hideHeader && (
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 id={titleId} className="text-lg font-semibold text-gray-800">
              {title}
            </h2>
            <button
              type="button"
              className="text-2xl text-gray-600"
              onClick={onClose}
              aria-label="Close dialog"
            >
              &times;
            </button>
          </div>
        )}
        {hideHeader && <h2 id={titleId} className="sr-only">{title}</h2>}
        {children}
      </div>
    </div>,
    document.body
  );
};

export default ModalComponent;
