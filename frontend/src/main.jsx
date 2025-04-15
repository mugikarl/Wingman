import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ModalProvider } from "./components/utils/modalUtils";
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ModalProvider>
      <App />
    </ModalProvider>
  </React.StrictMode>
);
