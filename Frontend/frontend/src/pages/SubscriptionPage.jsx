import React, { useState, useEffect } from "react";
import axios from "axios";
import dropin from "braintree-web-drop-in";
import React from "react";
import { useDriverAuth } from "../Context/driverContext";

const SubscriptionPage = () => {
  // ─── Backend Base URL ───────────────────────────────────────────
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const [plans, setPlans] = useState([]);
  const { driver } = useDriverAuth();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [clientToken, setClientToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [instance, setInstance] = useState(null);
  const [errors, setErrors] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/payment/plans`);
        setPlans(data.plans);
      } catch (error) {
        setErrors("Failed to fetch subscription plans.");
      }
    };

    const fetchClientToken = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/payment/braintree/token`);
        setClientToken(data.clientToken);
      } catch (error) {
        setErrors("Failed to fetch client token.");
      }
    };

    fetchPlans();
    fetchClientToken();
  }, []);

  useEffect(() => {
    const initializeDropin = async () => {
      if (clientToken) {
        const container = document.getElementById("dropin-container");
        if (!container) {
          setErrors("Drop-in container is missing.");
          return;
        }
        container.innerHTML = "";
        try {
          const dropInstance = await dropin.create({
            authorization: clientToken,
            container: "#dropin-container",
          });
          setInstance(dropInstance);
        } catch (error) {
          setErrors("Failed to initialize Braintree Drop-in.");
        }
      }
    };

    initializeDropin();
  }, [clientToken]);

  const handlePayment = async () => {
    if (!instance || !selectedPlan) {
      setErrors("Please select a plan and then try again");
      return;
    }
    setLoading(true);
    try {
      const { nonce } = await instance.requestPaymentMethod();
      const { data } = await axios.post(
        `${API_BASE}/api/payment/braintree/subscribe`,
        {
          paymentMethodNonce: nonce,
          planId: selectedPlan.plan_id,
          driverId: driver._id,
        }
      );
      if (data.success) {
        setSuccess("Subscription successful.");
      } else {
        setErrors(data.error || "Subscription failed. Please try again.");
      }
    } catch (error) {
      setErrors("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      {errors && <div className="text-red-600 bg-red-100 p-4 rounded mb-4">{errors}</div>}
      {success && <div className="text-green-600 bg-green-100 p-4 rounded mb-4">{success}</div>}

      <h2 className="text-3xl font-semibold text-center mb-6">Select a Subscription Plan</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
        {plans.map((plan) => (
          <div
            key={plan.plan_id}
            className={`p-6 border rounded-lg cursor-pointer transition-all hover:bg-blue-50 ${
              selectedPlan?.plan_id === plan.plan_id ? "bg-blue-100 border-blue-500" : "bg-white border-gray-300"
            }`}
            onClick={() => setSelectedPlan(plan)}
          >
            <h3 className="text-xl font-medium mb-2">{plan.name}</h3>
            <p className="text-gray-700 mb-4">{plan.description}</p>
            <p className="text-lg font-semibold">{`$${plan.price} / ${plan.billing_cycle}`}</p>
          </div>
        ))}
      </div>

      {selectedPlan && (
        <div className="mt-8 w-full max-w-md mx-auto">
          <div id="dropin-container" className="mb-4"></div>
          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            {loading ? "Processing..." : "Subscribe Now"}
          </button>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPage;
