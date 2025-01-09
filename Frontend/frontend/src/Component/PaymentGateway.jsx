import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import DropIn from "braintree-web-drop-in-react";
import { useAuth } from "../Context/userContext";

export const Payment = () => {
  const { user } = useAuth();
  const [clientToken, setClientToken] = useState('');
  const [instance, setInstance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { bookingId } = useParams();

  useEffect(() => {
    const fetchClientToken = async () => {
      try {
        const { data } = await axios.get('/api/payment/braintree/token');
        setClientToken(data.clientToken);
      } catch (error) {
        console.error("Error fetching client token:", error);
        setError("Failed to initialize payment. Please try again later.");
      }
    };

    fetchClientToken();
  }, []);

  const handlePayment = async () => {
    setLoading(true);
    setError(null);
    try {
      const { nonce } = await instance.requestPaymentMethod();
      const { data } = await axios.post('/api/payment/braintree/payment', {
        nonce,
        bookingId,
      });
      // Redirect or display success message
      console.log("Payment successful:", data);
    } catch (error) {
      console.error("Payment failed:", error);
      setError("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && <div className="error-message">{error}</div>}
      {clientToken ? (
        <DropIn
          options={{
            authorization: clientToken,
            paypal: { flow: 'vault' },
          }}
          onInstance={(instance) => setInstance(instance)}
        />
      ) : (
        <p>Loading payment gateway...</p>
      )}
      <button
        onClick={handlePayment}
        disabled={!instance || loading || !user}
      >
        {loading ? 'Processing...' : 'Make Payment'}
      </button>
    </div>
  );
};
