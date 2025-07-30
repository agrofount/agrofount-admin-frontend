const ModalComponent = ({ isModalOpen, onClose, children }) => {
  if (!isModalOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-2">
        <p
          className="text-gray-600 w-full text-right text-2xl cursor-pointer"
          onClick={onClose}
        >
          &times;
        </p>
        {children}
      </div>
    </div>
  );
};

export default ModalComponent;
