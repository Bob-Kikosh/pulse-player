import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";

import App from "./App";
import "./styles/global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <Toaster
      position="top-center"
      toastOptions={{
        style: {
          background: "rgb(28 28 36 / 0.95)",
          color: "#fff",
          borderRadius: "14px",
          border: "1px solid rgb(255 255 255 / 0.1)",
        },
      }}
    />
  </StrictMode>
);
