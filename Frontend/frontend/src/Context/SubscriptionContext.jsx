import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios"; // Ensure axios is imported
import { useDriverAuth } from "./driverContext";

const SubscriptionContext = createContext(null);

export const SubscriptionAuthProvider = ({ children }) => {
  const { driver } = useDriverAuth(); // Ensure driver context is properly used
  const [subscription, setSubscription] = useState({
    isSubscribed: false,
    planId: null,
    expiryDate: null,
  });

  useEffect(() => {
    if (driver?._id) {
      const fetchSubscriptionStatus = async () => {
        try {
          const { data } = await axios.get(`/api/driver/subscription/${driver._id}`);
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
  }, [driver?._id]); // Dependency added to prevent unnecessary calls

  return (
    <SubscriptionContext.Provider value={{ subscription, setSubscription }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => useContext(SubscriptionContext);
