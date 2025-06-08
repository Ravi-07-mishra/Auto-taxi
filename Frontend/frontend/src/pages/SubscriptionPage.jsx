import React, { useEffect, useState } from "react";
import axios from "axios";
import dropin from "braintree-web-drop-in";
import { useDriverAuth } from "../Context/driverContext";

const SubscriptionPage = () => {
  const { driver } = useDriverAuth();

  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [clientToken, setClientToken] = useState(null);
  const [instance, setInstance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const API_BASE = import.meta.env.VITE_API_BASE_URL2 || "http://localhost:3000";

  // Fetch Plans and Token
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansRes, tokenRes] = await Promise.all([
          axios.get(`${API_BASE}/api/payment/plans`),
          axios.get(`${API_BASE}/api/payment/braintree/token`),
        ]);
        setPlans(plansRes.data.plans);
        setClientToken(tokenRes.data.clientToken);
      } catch (err) {
        console.error(err);
        setError("Failed to load subscription information. Please try again later.");
      }
    };
    fetchData();
  }, [API_BASE]);

  // Initialize Drop-In UI
  useEffect(() => {
    const initializeDropin = async () => {
      if (clientToken && selectedPlan) {
        const container = document.getElementById("dropin-container");
        if (!container) return;

        container.innerHTML = ""; // clean old dropin

        try {
          const dropinInstance = await dropin.create({
            authorization: clientToken,
            container: "#dropin-container",
          });
          setInstance(dropinInstance);
        } catch (err) {
          console.error(err);
          setError("Braintree Drop-in failed to load.");
        }
      }
    };

    initializeDropin();
  }, [clientToken, selectedPlan]);

  // Handle Subscription
  const handlePayment = async () => {
    setError("");
    setSuccess("");

    if (!instance || !selectedPlan || !driver?._id) {
      setError("Please select a plan and make sure you're logged in.");
      return;
    }

    setLoading(true);

    try {
      const { nonce } = await instance.requestPaymentMethod();
      const res = await axios.post(`${API_BASE}/api/payment/braintree/subscribe`, {
        paymentMethodNonce: nonce,
        planId: selectedPlan.plan_id,
        driverId: driver._id,
      });

      if (res.data.success) {
        setSuccess("🎉 Subscription successful!");
        setSelectedPlan(null);
        setInstance(null);
      } else {
        setError(res.data.error || "Subscription failed.");
      }
    } catch (err) {
      console.error(err);
      setError("Payment could not be processed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      {error && <div className="text-red-600 bg-red-100 p-4 rounded mb-4 w-full max-w-md">{error}</div>}
      {success && <div className="text-green-600 bg-green-100 p-4 rounded mb-4 w-full max-w-md">{success}</div>}

      <h2 className="text-3xl font-semibold text-center mb-6">Choose a Subscription Plan</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
        {plans.map((plan) => (
          <div
            key={plan.plan_id}
            className={`p-6 rounded-lg shadow-sm border cursor-pointer transition-all duration-200 ${
              selectedPlan?.plan_id === plan.plan_id
                ? "bg-blue-100 border-blue-600"
                : "bg-white border-gray-300 hover:bg-blue-50"
            }`}
            onClick={() => setSelectedPlan(plan)}
          >
            <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
            <p className="text-gray-700 mb-4">{plan.description}</p>
            <p className="text-lg font-semibold">₹{plan.price} / {plan.billing_cycle}</p>
          </div>
        ))}
      </div>

      {selectedPlan && (
        <div className="mt-8 w-full max-w-md">
          <div id="dropin-container" className="mb-4" />
          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Processing..." : "Subscribe Now"}
          </button>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPage;
