// src/Component/PaymentGateway.jsx

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import dropin from "braintree-web-drop-in";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_BASE =
  import.meta.env.VITE_API_URL2 ||
  (process.env.NODE_ENV === "production"
    ? "https://api.yourdomain.com"
    : "http://localhost:3000");

const PaymentGateway = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef(null);

  const [ridePrice, setRidePrice] = useState(null);
  const [clientToken, setClientToken] = useState(null);
  const [instance, setInstance] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Inject Drop‑in CSS
  useEffect(() => {
    const href =
      "https://js.braintreegateway.com/web/dropin/1.29.0/css/dropin.min.css";
    if (!document.querySelector(`link[href="${href}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
    }
  }, []);

  // Socket.IO setup
  useEffect(() => {
    const socket = io(API_BASE, { transports: ["websocket", "polling"] });
    socketRef.current = socket;
    socket.on("connect", () => console.log("Socket connected:", socket.id));
    return () => socket.disconnect();
  }, []);

  // Load ride price
  useEffect(() => {
    axios
      .get(`${API_BASE}/api/user/driver/${bookingId}`)
      .then(({ data }) => setRidePrice(data.booking.price))
      .catch(() => setError("Failed to load booking info."));
  }, [bookingId]);

  // Fetch client token
  useEffect(() => {
    axios
      .get(`${API_BASE}/api/payment/braintree/token`)
      .then(({ data }) => setClientToken(data.clientToken))
      .catch(() => setError("Failed to get payment token."));
  }, []);

  // Initialize Drop‑in
  useEffect(() => {
    if (!clientToken) return;

    const container = document.getElementById("dropin-container");
    if (!container) {
      setError("Drop‑in container not found.");
      return;
    }
    container.innerHTML = "";

    dropin
      .create({
        authorization: clientToken,
        container: "#dropin-container",
      })
      .then((dropinInstance) => setInstance(dropinInstance))
      .catch((err) => {
        console.error("Drop‑in init failed:", err);
        setError(`Drop‑in init failed: ${err.message}`);
      });
  }, [clientToken]);

  // Handle the payment flow
  const handlePayment = async () => {
    setError("");
    if (!instance || ridePrice == null) {
      setError("Payment not ready—check drop‑in or ride price.");
      return;
    }

    setLoading(true);
    try {
      const { nonce } = await instance.requestPaymentMethod();
      const { data } = await axios.post(
        `${API_BASE}/api/payment/braintree/pay`,
        { nonce, bookingId, amount: ridePrice }
      );

      if (data.success) {
        setSuccess("Payment completed successfully!");
        toast.success("Booking successful!");
        socketRef.current.emit("Paymentcompleted", { bookingId });
        navigate("/userhome");
      } else {
        setError("Payment failed. Please try again.");
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError("Payment error. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-container p-6 min-h-screen bg-gray-50">
      <ToastContainer />
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {success && <div className="text-green-600 mb-4">{success}</div>}

      {ridePrice != null && (
        <div className="text-lg mb-4">
          <strong>Amount to pay:</strong> ₹{ridePrice}
        </div>
      )}

      {clientToken ? (
        <>
          <div id="dropin-container" className="mb-4"></div>
          <button
            onClick={handlePayment}
            disabled={!instance || loading}
            className="w-full py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? "Processing..." : "Make Payment"}
          </button>
        </>
      ) : (
        <p>Initializing payment gateway…</p>
      )}
    </div>
  );
};

export default PaymentGateway;
