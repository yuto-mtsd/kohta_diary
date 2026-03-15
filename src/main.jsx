import React from "react";
import { createRoot } from "react-dom/client";
import App from "../diary-app.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
