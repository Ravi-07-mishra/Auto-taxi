import { useState, useEffect, useRef } from "react";
import axios from "axios";
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import io from "socket.io-client";

const Payment = () => {
  const [values, setValues] = useState({
    clientToken: null,
    success: "",
    errors: "",
    instance: null,
    ridePrice: null, // NEW: To hold the booking price
  });

  const socketRef = useRef(null);
  const { bookingId } = useParams();
  const [loading, setLoading] = useState(false);
  const { clientToken, success, errors, instance, ridePrice } = values;
  const navigate = useNavigate();

  // Establish socket connection
  useEffect(() => {
    socketRef.current = io("http://localhost:3000", {
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

  // Fetch booking price from backend
  useEffect(() => {
    axios
      .get(`http://localhost:3000/api/user/driver/${bookingId}`)
      .then(({ data }) => {
        setValues((prevValues) => ({
          ...prevValues,
          ridePrice: data.booking.price,
        }));
      })
      .catch(() => {
        setValues((prevValues) => ({
          ...prevValues,
          errors: "Failed to load booking info.",
        }));
      });
  }, [bookingId]);

  const handlePayment = async () => {
    if (!instance) {
      setValues((prevValues) => ({
        ...prevValues,
        errors: "Payment instance not initialized.",
      }));
      return;
    }

    if (ridePrice == null) {
      setValues((prevValues) => ({
        ...prevValues,
        errors: "Ride price not loaded yet.",
      }));
      return;
    }

    setLoading(true);

    try {
      const { nonce } = await instance.requestPaymentMethod();
      const { data } = await axios.post(
        "http://localhost:3000/api/payment/braintree/pay",
        {
          nonce,
          bookingId,
          amount: ridePrice, // Include ride price in the payment request
        }
      );

      setValues((prevValues) => ({
        ...prevValues,
        success: "Payment completed successfully.",
      }));

      toast.success("Booking successful!");

      if (socketRef.current) {
        socketRef.current.emit("Paymentcompleted", { bookingId });
        console.log("Payment completed event emitted:", bookingId);
      }

      navigate("/userhome");
    } catch (error) {
      setValues((prevValues) => ({
        ...prevValues,
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
          "http://localhost:3000/api/payment/braintree/token"
        );
        setValues((prevValues) => ({
          ...prevValues,
          clientToken: data.clientToken,
        }));
      } catch (error) {
        console.error("Error fetching client token:", error);
        setValues((prevValues) => ({
          ...prevValues,
          errors: "Failed to initialize payment.",
        }));
      }
    };

    fetchClientToken();
  }, []);

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
            setValues((prevValues) => ({
              ...prevValues,
              errors: "Drop-in container is missing.",
            }));
            return;
          }

          container.innerHTML = "";

          try {
            window.braintree.dropin
              .create({
                authorization: clientToken,
                container: "#dropin-container",
              })
              .then((instance) => {
                setValues((prevValues) => ({
                  ...prevValues,
                  instance,
                }));
              })
              .catch((error) => {
                setValues((prevValues) => ({
                  ...prevValues,
                  errors: `Failed to initialize payment gateway: ${error.message}`,
                }));
              });
          } catch (error) {
            setValues((prevValues) => ({
              ...prevValues,
              errors: `Error initializing Drop-in: ${error.message}`,
            }));
          }
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
          <button onClick={handlePayment} disabled={!instance || loading}>
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
