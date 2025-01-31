import { useState, useEffect, useRef } from "react";
import axios from "axios";
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import io from 'socket.io-client';

const Payment = () => {
  const [values, setValues] = useState({
    clientToken: null,
    success: "",
    errors: "",
    instance: null,
  });
  const socketRef = useRef(null);
  const { bookingId } = useParams();
  const [loading, setLoading] = useState(false);
  const { clientToken, success, errors, instance } = values;
  const navigate = useNavigate();

  // Establish socket connection and emit payment completion after payment
  useEffect(() => {
    // Only initiate the socket connection when payment has been completed
    socketRef.current = io('http://localhost:3000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    // Cleanup the socket connection on component unmount
    return () => {
      socket.disconnect();
      console.log('Socket disconnected on cleanup.');
    };
  }, []); // This effect should run only once, after the component mounts.

  const handlePayment = async () => {
    if (!instance) {
      setValues((prevValues) => ({
        ...prevValues,
        errors: "Payment instance not initialized.",
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
        }
      );

      setValues((prevValues) => ({
        ...prevValues,
        success: "Payment completed successfully.",
      }));
      // Show toast notification
      toast.success("Booking successful!");

      // Emit 'Paymentcompleted' event to the driver after payment completion
      if (socketRef.current) {
        socketRef.current.emit('Paymentcompleted', { bookingId });
        console.log('Payment completed event emitted:', bookingId);
      }

      // Navigate to the Driver's Drive Page
      navigate('/userhome');
    } catch (error) {
      setValues((prevValues) => ({
        ...prevValues,
        errors: "Payment failed. Please try again.",
      }));
    } finally {
      setLoading(false);
    }
  };

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
  }, []); // Fetch client token only once when the component mounts.

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
  }, [clientToken]); // Re-run the script load if the client token changes.

  return (
    <div className="payment-container">
      <ToastContainer /> {/* Toast container to render notifications */}
      {errors && <div className="error-message">{errors}</div>}
      {success && <div className="success-message">{success}</div>}

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
