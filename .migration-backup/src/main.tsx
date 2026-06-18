import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initStore } from "./lib/store";

initStore()
  .then(() => {
    createRoot(document.getElementById("root")!).render(<App />);
  })
  .catch((err) => {
    console.error("initStore failed:", err);
    const root = document.getElementById("root")!;
    root.innerHTML = `<div style="padding:20px;font-family:Inter,sans-serif;">
      <h1 style="color:#FF4F00;font-size:24px;">Eroare la inițializare</h1>
      <p style="color:#333;">${err.message || "Unknown error"}</p>
      <p style="color:#666;font-size:12px;">Verifică consola (F12) pentru detalii.</p>
    </div>`;
  });
