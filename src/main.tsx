import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ToastProvider } from "./context/ToastContext";
import { OnboardingProvider } from "./context/OnboardingContext";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ToastProvider>
      <OnboardingProvider>
        <App />
      </OnboardingProvider>
    </ToastProvider>
  </StrictMode>
);
