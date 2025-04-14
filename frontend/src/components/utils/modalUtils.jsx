import React, { useState, useEffect, createContext, useContext } from "react";
import AlertModal from "../popups/AlertModal";

// Create a context for the modal
const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: "alert",
    title: "",
    message: "",
    onConfirm: () => {},
    confirmText: "OK",
    cancelText: "Cancel",
    defaultValue: "",
    inputPlaceholder: "",
  });

  // Reset modal state when closed
  const handleClose = () => {
    setModalConfig((prev) => ({ ...prev, isOpen: false }));
  };

  // Modal API functions
  const alert = (message, title = "Alert") => {
    return new Promise((resolve) => {
      setModalConfig({
        isOpen: true,
        type: "alert",
        title,
        message,
        onConfirm: resolve,
        confirmText: "OK",
        cancelText: "Cancel",
        defaultValue: "",
        inputPlaceholder: "",
      });
    });
  };

  const confirm = (
    message,
    title = "Confirm",
    confirmText = "OK",
    cancelText = "Cancel"
  ) => {
    return new Promise((resolve) => {
      setModalConfig({
        isOpen: true,
        type: "confirm",
        title,
        message,
        onConfirm: () => resolve(true),
        onClose: () => resolve(false),
        confirmText,
        cancelText,
        defaultValue: "",
        inputPlaceholder: "",
      });
    });
  };

  const prompt = (
    message,
    defaultValue = "",
    title = "Prompt",
    placeholder = ""
  ) => {
    return new Promise((resolve) => {
      setModalConfig({
        isOpen: true,
        type: "prompt",
        title,
        message,
        onConfirm: (value) => resolve(value),
        confirmText: "OK",
        cancelText: "Cancel",
        defaultValue,
        inputPlaceholder: placeholder,
      });
    });
  };

  // Value to be provided by the context
  const contextValue = {
    alert,
    confirm,
    prompt,
  };

  return (
    <ModalContext.Provider value={contextValue}>
      {children}
      <AlertModal
        isOpen={modalConfig.isOpen}
        onClose={handleClose}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
        defaultValue={modalConfig.defaultValue}
        inputPlaceholder={modalConfig.inputPlaceholder}
      />
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};
