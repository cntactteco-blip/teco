import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initStore } from "./lib/store";

createRoot(document.getElementById("root")!).render(<App />);
initStore().catch((err) => {
  console.error("initStore failed:", err);
});
