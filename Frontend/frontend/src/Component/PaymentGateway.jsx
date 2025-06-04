// Payment.jsx
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import axios from "axios";
import io from "socket.io-client";
import "react-toastify/dist/ReactToastify.css";

const Payment = () => {
  // ─── Backend Base URL ───────────────────────────────────────────
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const [values, setValues] = useState({
    clientToken: null,
    success: "",
    errors: "",
    instance: null,
    ridePrice: null,
  });
  const { clientToken, success, errors, instance, ridePrice } = values;

  const socketRef = useRef(null);
  const { bookingId } = useParams();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Establish socket connection
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

  // Fetch booking price from backend
  useEffect(() => {
    axios
      .get(`${API_BASE}/api/user/driver/${bookingId}`, { withCredentials: true })
      .then(({ data }) => {
        setValues((prev) => ({
          ...prev,
          ridePrice: data.booking.price,
        }));
      })
      .catch(() => {
        setValues((prev) => ({
          ...prev,
          errors: "Failed to load booking info.",
        }));
      });
  }, [bookingId, API_BASE]);

  const handlePayment = async () => {
    if (!instance) {
      setValues((prev) => ({
        ...prev,
        errors: "Payment instance not initialized.",
      }));
      return;
    }
    if (ridePrice == null) {
      setValues((prev) => ({
        ...prev,
        errors: "Ride price not loaded yet.",
      }));
      return;
    }

    setLoading(true);
    try {
      const { nonce } = await instance.requestPaymentMethod();
      const { data } = await axios.post(
        `${API_BASE}/api/payment/braintree/pay`,
        { nonce, bookingId, amount: ridePrice },
        { withCredentials: true }
      );

      setValues((prev) => ({
        ...prev,
        success: "Payment completed successfully.",
      }));
      toast.success("Booking successful!");

      if (socketRef.current) {
        socketRef.current.emit("Paymentcompleted", { bookingId });
        console.log("Payment completed event emitted:", bookingId);
      }

      navigate("/userhome");
    } catch {
      setValues((prev) => ({
        ...prev,
        errors: "Payment failed. Please try again.",
      }));
    } finally {
      setLoading(false);
    }
  };

  // Fetch Braintree client token
  useEffect(() => {
    const fetchClientToken = async () => {
      try {
        const { data } = await axios.get(
          `${API_BASE}/api/payment/braintree/token`,
          { withCredentials: true }
        );
        setValues((prev) => ({
          ...prev,
          clientToken: data.clientToken,
        }));
      } catch {
        setValues((prev) => ({
          ...prev,
          errors: "Failed to initialize payment.",
        }));
      }
    };
    fetchClientToken();
  }, [API_BASE]);

  // Load Braintree drop-in script
  useEffect(() => {
    const loadBraintreeScript = () => {
      const script = document.createElement("script");
      script.src =
        "https://js.braintreegateway.com/web/dropin/1.29.0/js/dropin.min.js";
      script.async = true;
      script.onload = () => {
        if (clientToken) {
          const container = document.getElementById("dropin-container");
          if (!container) {
            setValues((prev) => ({
              ...prev,
              errors: "Drop-in container is missing.",
            }));
            return;
          }
          container.innerHTML = "";

          window.braintree.dropin
            .create({
              authorization: clientToken,
              container: "#dropin-container",
            })
            .then((dropinInstance) => {
              setValues((prev) => ({
                ...prev,
                instance: dropinInstance,
              }));
            })
            .catch((error) => {
              setValues((prev) => ({
                ...prev,
                errors: `Failed to initialize payment gateway: ${error.message}`,
              }));
            });
        }
      };
      document.body.appendChild(script);
    };

    loadBraintreeScript();
  }, [clientToken]);

  return (
    <div className="payment-container">
      <ToastContainer />

      {errors && <div className="error-message">{errors}</div>}
      {success && <div className="success-message">{success}</div>}

      {ridePrice != null && (
        <div className="fare">
          <strong>Amount to pay:</strong> ₹{ridePrice}
        </div>
      )}

      {clientToken ? (
        <>
          <div id="dropin-container"></div>
          <button
            onClick={handlePayment}
            disabled={!instance || loading}
            className="payment-button"
          >
            {loading ? "Processing..." : "Make Payment"}
          </button>
        </>
      ) : (
        <p>Initializing payment gateway...</p>
      )}
    </div>
  );
};

export default Payment;
