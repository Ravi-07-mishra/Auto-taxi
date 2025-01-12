import { useState, useEffect } from "react";
import axios from "axios";
import React from "react";
import { useParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Payment = () => {
  const [values, setValues] = useState({
    clientToken: null,
    success: "",
    errors: "",
    instance: null,
  });
  const { bookingId } = useParams();
  const [loading, setLoading] = useState(false);
  const { clientToken, success, errors, instance } = values;

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
    } catch (error) {
      setValues((prevValues) => ({
        ...prevValues,
        errors: "Payment failed. Please try again.",
      }));
    } finally {
      setLoading(false);
    }
  };

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
