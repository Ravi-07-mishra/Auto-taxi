import React, { useState } from "react";
import SubscriptionPage from "./SubscriptionPage"; // Import the subscription page component

const DriverHomePage = () => {
  const [showSubscription, setShowSubscription] = useState(false);

  const premiumFeatures = [
    "Priority Support",
    "Exclusive Driver Tools",
    "Enhanced Analytics",
    "Ad-Free Experience",
    "Dedicated Account Manager",
  ];

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center text-white"
      style={{
        backgroundImage: "url('https://source.unsplash.com/1600x900/?transport,technology')",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        backgroundBlendMode: "overlay",
      }}
    >
      <div className="backdrop-blur-md bg-black/50 p-6 rounded-lg text-center shadow-lg max-w-4xl">
        <h1 className="text-4xl font-bold mb-4">Welcome, User!</h1>
        <p className="text-lg mb-6">
          Discover the exclusive benefits of our premium subscription tailored just for you.
        </p>
        <button
          onClick={() => setShowSubscription(true)}
          className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition-all"
        >
          Subscribe
        </button>
        {showSubscription && (
          <div className="mt-8 p-6 bg-white rounded-lg shadow-lg text-gray-900 w-full max-w-4xl">
            <SubscriptionPage />
            <button
              onClick={() => setShowSubscription(false)}
              className="mt-4 px-6 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-all"
            >
              Close
            </button>
          </div>
        )}
      </div>

      <div className="mt-12 p-6 bg-white/70 backdrop-blur-md rounded-lg shadow-lg w-full max-w-4xl">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Premium Features</h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {premiumFeatures.map((feature, index) => (
            <li
              key={index}
              className="bg-blue-50 p-4 rounded-lg shadow text-blue-800 font-medium text-center"
            >
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default DriverHomePage;
