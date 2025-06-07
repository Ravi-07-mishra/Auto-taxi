import { useState, useEffect, useRef } from "react";
import axios from "axios";
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import io from "socket.io-client";

// Define base URL from environment
const API_BASE =
  import.meta.env.VITE_API_URL2 ||
  (process.env.NODE_ENV === "production"
    ? "https://api.yourdomain.com"
    : "http://localhost:3000");

const Payment = () => {
  const [values, setValues] = useState({
    clientToken: null,
    success: "",
    errors: "",
    instance: null,
    ridePrice: null,
  });

  const socketRef = useRef(null);
  const { bookingId } = useParams();
  const [loading, setLoading] = useState(false);
  const { clientToken, success, errors, instance, ridePrice } = values;
  const navigate = useNavigate();

  // Establish socket connection
  useEffect(() => {
    socketRef.current = io(API_BASE, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    return () => {
      socket.disconnect();
      console.log("Socket disconnected on cleanup.");
    };
  }, []);

  // Fetch ride price
  useEffect(() => {
    axios
      .get(`${API_BASE}/api/user/driver/${bookingId}`)
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
  }, [bookingId]);

  // Handle payment
  const handlePayment = async () => {
    if (!instance || ridePrice == null) {
      setValues((prev) => ({
        ...prev,
        errors: "Payment not ready. Check ride price or drop-in setup.",
      }));
      return;
    }

    setLoading(true);

    try {
      const { nonce } = await instance.requestPaymentMethod();

      const { data } = await axios.post(`${API_BASE}/api/payment/braintree/pay`, {
        nonce,
        bookingId,
        amount: ridePrice,
      });

      if (data.success) {
        setValues((prev) => ({
          ...prev,
          success: "Payment completed successfully.",
          errors: "",
        }));

        toast.success("Booking successful!");
        socketRef.current?.emit("Paymentcompleted", { bookingId });
        navigate("/userhome");
      } else {
        setValues((prev) => ({
          ...prev,
          errors: "Payment failed. Please try again.",
        }));
      }
    } catch (error) {
      setValues((prev) => ({
        ...prev,
        errors: "Payment error. Try again later.",
      }));
    } finally {
      setLoading(false);
    }
  };

  // Fetch client token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/payment/braintree/token`);
        setValues((prev) => ({ ...prev, clientToken: data.clientToken }));
      } catch {
        setValues((prev) => ({ ...prev, errors: "Failed to get payment token." }));
      }
    };

    fetchToken();
  }, []);

  // Load Braintree drop-in
  useEffect(() => {
    const loadScriptAndInitialize = () => {
      if (document.getElementById("braintree-dropin-script")) {
        initializeDropin(); // Already loaded
        return;
      }

      const script = document.createElement("script");
      script.id = "braintree-dropin-script";
      script.src = "https://js.braintreegateway.com/web/dropin/1.29.0/js/dropin.min.js";
      script.async = true;
      script.onload = initializeDropin;
      document.body.appendChild(script);
    };

    const initializeDropin = () => {
      if (!clientToken) return;

      const container = document.getElementById("dropin-container");
      if (!container) {
        setValues((prev) => ({ ...prev, errors: "Drop-in container not found." }));
        return;
      }

      container.innerHTML = "";

      window.braintree?.dropin
        .create({
          authorization: clientToken,
          container: "#dropin-container",
        })
        .then((dropinInstance) => {
          setValues((prev) => ({ ...prev, instance: dropinInstance }));
        })
        .catch((err) => {
          setValues((prev) => ({ ...prev, errors: `Drop-in init failed: ${err.message}` }));
        });
    };

    loadScriptAndInitialize();
  }, [clientToken]);

  return (
    <div className="payment-container p-6 min-h-screen bg-gray-50">
      <ToastContainer />
      {errors && <div className="text-red-600 mb-4">{errors}</div>}
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
        <p>Initializing payment gateway...</p>
      )}
    </div>
  );
};

export default Payment;
