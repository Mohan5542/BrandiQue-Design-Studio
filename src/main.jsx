import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/bebas-neue/400.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/700.css";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import "./styles.css";
const updateSW = registerSW({
  onOfflineReady() {
    window.dispatchEvent(new Event("offline-ready"));
  },
  onNeedRefresh() {
    window.dispatchEvent(new Event("studio-update-ready"));
  },
});
window.addEventListener("studio-apply-update", () => updateSW(true));
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
