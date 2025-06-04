// main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";

import App from "./App.jsx";
import { DriverAuthProvider } from "./Context/driverContext.jsx";
import { AuthProvider } from "./Context/userContext.jsx";
import { SubscriptionAuthProvider } from "./Context/SubscriptionContext.jsx";

axios.defaults.withCredentials = true;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <DriverAuthProvider>
        <SubscriptionAuthProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </SubscriptionAuthProvider>
      </DriverAuthProvider>
    </BrowserRouter>
  </StrictMode>
);
