// SubscriptionContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useDriverAuth } from "./driverContext";

const SubscriptionContext = createContext(null);

export const SubscriptionAuthProvider = ({ children }) => {
  // ─── Backend Base URL ───────────────────────────────────────────
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const { driver } = useDriverAuth();
  const [subscription, setSubscription] = useState({
    isSubscribed: false,
    planId: null,
    expiryDate: null,
  });

  useEffect(() => {
    if (driver?._id) {
      const fetchSubscriptionStatus = async () => {
        try {
          const { data } = await axios.get(
            `${API_BASE}/driver/subscription/${driver._id}`,
            { withCredentials: true }
          );
          setSubscription({
            isSubscribed: data.isSubscribed,
            planId: data.planId,
            expiryDate: data.expiryDate,
          });
        } catch (error) {
          console.error("Error fetching subscription status:", error);
          setSubscription({
            isSubscribed: false,
            planId: null,
            expiryDate: null,
          });
        }
      };

      fetchSubscriptionStatus();
    }
  }, [driver?._id, API_BASE]);

  return (
    <SubscriptionContext.Provider value={{ subscription, setSubscription }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => useContext(SubscriptionContext);
