import React, { useState } from "react";

const AlertModal = ({
  isOpen,
  onClose,
  type = "alert",
  title = "",
  message = "",
  onConfirm,
  confirmText = "OK",
  cancelText = "Cancel",
  defaultValue = "",
  inputPlaceholder = "",
}) => {
  const [inputValue, setInputValue] = useState(defaultValue);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (type === "prompt") {
      onConfirm(inputValue);
    } else {
      onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-md shadow-lg w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="border-b px-4 py-3">
          <h3 className="text-lg font-medium">{title}</h3>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-700 mb-4">{message}</p>

          {/* Input field for prompt */}
          {type === "prompt" && (
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={inputPlaceholder}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFBA39] mb-4"
              autoFocus
            />
          )}

          {/* Buttons */}
          <div
            className={`flex ${
              type !== "alert" ? "justify-between" : "justify-end"
            } mt-4`}
          >
            {type !== "alert" && (
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-[#FFBA39]"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
