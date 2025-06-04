// src/pages/Payment.jsx
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import axios from "axios";
import io from "socket.io-client";
import "react-toastify/dist/ReactToastify.css";

const Payment = () => {
  // ─── Backend Base URL ───────────────────────────────────────────
  const API_BASE =
    import.meta.env.VITE_API_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://api.yourdomain.com"
      : "http://localhost:3000");

  const { bookingId } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef(null);

  const [ridePrice, setRidePrice] = useState(null);
  const [clientToken, setClientToken] = useState(null);
  const [errors, setErrors] = useState("");
  const [success, setSuccess] = useState("");
  const [instance, setInstance] = useState(null);
  const [loading, setLoading] = useState(false);

  // ─── 1. Establish socket connection ─────────────────────────────
  useEffect(() => {
    const socket = io(API_BASE, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    return () => {
      socket.disconnect();
      console.log("Socket disconnected on cleanup.");
    };
  }, [API_BASE]);

  // ─── 2. Fetch booking price ───────────────────────────────────────
  useEffect(() => {
    axios
      .get(`${API_BASE}/api/user/driver/${bookingId}`, { withCredentials: true })
      .then(({ data }) => {
        setRidePrice(data.booking.price);
      })
      .catch((err) => {
        console.error("Failed to load booking info:", err);
        setErrors("Failed to load booking info.");
      });
  }, [bookingId, API_BASE]);

  // ─── 3. Fetch Braintree client token ─────────────────────────────
  useEffect(() => {
    const fetchClientToken = async () => {
      try {
        const { data } = await axios.get(
          `${API_BASE}/api/payment/braintree/token`,
          { withCredentials: true }
        );
        setClientToken(data.clientToken);
      } catch (err) {
        console.error("Failed to initialize payment:", err);
        setErrors("Failed to initialize payment.");
      }
    };
    fetchClientToken();
  }, [API_BASE]);

  // ─── 4. Load Braintree Drop‑in script & create instance ───────────
  useEffect(() => {
    if (!clientToken) return;

    const loadBraintreeScript = () => {
      const existingScript = document.getElementById("bt-dropin-script");
      if (existingScript) {
        // If script already loaded, initialize directly
        initializeDropin();
        return;
      }

      const script = document.createElement("script");
      script.id = "bt-dropin-script";
      script.src =
        "https://js.braintreegateway.com/web/dropin/1.29.0/js/dropin.min.js";
      script.async = true;
      script.onload = () => {
        initializeDropin();
      };
      script.onerror = () => {
        console.error("Failed to load Drop‑in script");
        setErrors("Failed to load payment gateway.");
      };
      document.body.appendChild(script);
    };

    const initializeDropin = () => {
      const container = document.getElementById("dropin-container");
      if (!container) {
        setErrors("Drop‑in container is missing.");
        return;
      }
      container.innerHTML = "";

      window.braintree.dropin
        .create({
          authorization: clientToken,
          container: "#dropin-container",
        })
        .then((dropinInstance) => {
          setInstance(dropinInstance);
        })
        .catch((err) => {
          console.error("Failed to initialize Drop‑in:", err);
          setErrors(`Failed to initialize payment gateway: ${err.message}`);
        });
    };

    loadBraintreeScript();
  }, [clientToken]);

  // ─── 5. Handle “Make Payment” click ───────────────────────────────
  const handlePayment = async () => {
    if (!instance) {
      setErrors("Payment instance not initialized.");
      return;
    }
    if (ridePrice == null) {
      setErrors("Ride price not loaded yet.");
      return;
    }

    setLoading(true);
    setErrors("");
    setSuccess("");

    try {
      const { nonce } = await instance.requestPaymentMethod();
      const { data } = await axios.post(
        `${API_BASE}/api/payment/braintree/pay`,
        { nonce, bookingId, amount: ridePrice },
        { withCredentials: true }
      );

      if (data.success) {
        setSuccess("Payment completed successfully.");
        toast.success("Booking successful!");

        if (socketRef.current) {
          socketRef.current.emit("Paymentcompleted", { bookingId });
          console.log("Paymentcompleted event emitted:", bookingId);
        }

        navigate("/userhome");
      } else {
        setErrors(data.error || "Payment failed. Please try again.");
      }
    } catch (err) {
      console.error("Payment processing error:", err);
      setErrors("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-container min-h-screen flex flex-col items-center p-6 bg-white">
      <ToastContainer />

      {errors && (
        <div className="error-message text-red-600 bg-red-100 p-4 rounded mb-4">
          {errors}
        </div>
      )}
      {success && (
        <div className="success-message text-green-600 bg-green-100 p-4 rounded mb-4">
          {success}
        </div>
      )}

      {ridePrice != null ? (
        <div className="fare text-lg font-semibold mb-4">
          <strong>Amount to pay:</strong> ₹{ridePrice}
        </div>
      ) : (
        <div className="fare text-lg font-semibold mb-4">Loading fare…</div>
      )}

      {clientToken ? (
        <>
          <div id="dropin-container" className="mb-4 w-full max-w-md"></div>
          <button
            onClick={handlePayment}
            disabled={!instance || loading}
            className="payment-button w-full max-w-md bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            {loading ? "Processing…" : "Make Payment"}
          </button>
        </>
      ) : (
        <p>Initializing payment gateway…</p>
      )}
    </div>
  );
};

export default Payment;
