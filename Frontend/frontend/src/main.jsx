import React from "react";
import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";

// 1. Import Leaflet’s CSS so its controls and icons are styled
import "leaflet/dist/leaflet.css";
// 2. Pull in Leaflet and its default marker images
import L from "leaflet";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

// 3. Merge those URLs into the default Icon options
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

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
