import React from "react";
import { useDriverAuth } from "../Context/driverContext"; // Assuming useDriverAuth provides driver data
import { useSubscription } from "../Context/SubscriptionContext";

const ProfilePage = () => {
  const { driver } = useDriverAuth();
  const { subscription } = useSubscription();

  // Extracting data
  const driverName = driver?.name || "Driver";
  const driverId = driver?._id || "12345";
  const subscriptionStatus = subscription?.status || "Inactive"; // Default to "Inactive" if status is missing
  const driverInitial = driverName.charAt(0).toUpperCase();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-6">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-6">
          <div className="bg-blue-500 text-white rounded-full w-32 h-32 flex items-center justify-center text-6xl font-bold">
            {driverInitial}
          </div>
          <h1 className="text-xl font-semibold mt-4">{driverName}</h1>
        </div>

        {/* Driver Information */}
        <div className="space-y-4">
          <div className="flex items-center">
            <span className="font-bold text-gray-700">Driver ID:</span>
            <span className="ml-2 text-gray-600">{driverId}</span>
          </div>
          <div className="flex items-center">
            <span className="font-bold text-gray-700">Subscription Status:</span>
            <span
              className={`ml-2 font-medium ${
                subscriptionStatus === "Active" ? "text-green-600" : "text-red-600"
              }`}
            >
              {subscriptionStatus}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
