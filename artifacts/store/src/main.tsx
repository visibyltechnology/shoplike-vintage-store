import { createRoot } from "react-dom/client";
  import App from "./App";
  import "./index.css";
  import React from "react";
  import { setBaseUrl } from "@workspace/api-client-react";

  // Configure API base URL from environment variable.
  // Set VITE_API_BASE_URL in your Vercel project settings to point to your API server.
  // e.g. https://your-replit-app.replit.app
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  if (apiBaseUrl) {
    setBaseUrl(apiBaseUrl);
  }

  class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { error: Error | null }
  > {
    constructor(props: { children: React.ReactNode }) {
      super(props);
      this.state = { error: null };
    }
    static getDerivedStateFromError(error: Error) {
      return { error };
    }
    render() {
      if (this.state.error) {
        return (
          <div style={{ padding: 32, fontFamily: "monospace", background: "#fee2e2", minHeight: "100vh" }}>
            <h2 style={{ color: "#b91c1c", marginBottom: 16 }}>Application Error</h2>
            <pre style={{ color: "#7f1d1d", whiteSpace: "pre-wrap", fontSize: 13 }}>
              {this.state.error.message}
              {"

"}
              {this.state.error.stack}
            </pre>
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
  