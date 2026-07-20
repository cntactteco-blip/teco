import { createRoot } from "react-dom/client";
import { Component, type ReactNode } from "react";
import App from "./App";
import "./index.css";
import { initStore } from "./lib/store";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 480, margin: "40px auto" }}>
          <h2 style={{ color: "#FF4F00", marginBottom: 12 }}>Eroare aplicație</h2>
          <p style={{ color: "#666", marginBottom: 8 }}>Te rugăm să reîncărci pagina. Dacă problema persistă, contactează-ne.</p>
          <pre style={{ background: "#f4f4f5", padding: 12, borderRadius: 8, fontSize: 12, overflow: "auto", color: "#333" }}>
            {(this.state.error as Error).message}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: 16, background: "#FF4F00", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}
          >
            Reîncarcă pagina
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
// initStore e acum sincron — încarcă instant din snapshot/cache fără Supabase.
// Apeluri Supabase se fac NUMAI din Admin panel via refreshFromSupabase().
initStore();
