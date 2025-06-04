import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const RatingReview = () => {
  // ─── Backend Base URL ───────────────────────────────────────────
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { bookingId } = useParams();

  const handleRatingChange = (newRating) => {
    setRating(newRating);
  };

  const handleReviewChange = (event) => {
    setReview(event.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0 || review.trim() === "") {
      setError("Please provide both a rating and a review.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${API_BASE}/user/${bookingId}/review`,
        { review, rating },
        { withCredentials: true }
      );
      if (response.status === 200) {
        setSubmitted(true);
        setRating(0);
        setReview("");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "There was an error submitting your review. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow-lg mt-10">
      <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
        Rate and Review
      </h2>

      {/* Rating Section */}
      <div className="flex justify-center mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            onClick={() => handleRatingChange(star)}
            xmlns="http://www.w3.org/2000/svg"
            fill={star <= rating ? "yellow" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
            className="w-8 h-8 cursor-pointer"
          >
            <path
              d="M12 17.75l6.18 3.868-1.64-7.071 5.27-4.806-7.26-.632L12 2.25 9.46 9.109l-7.26.632 5.27 4.806-1.64 7.071L12 17.75z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ))}
      </div>

      {/* Review Section */}
      <div className="mb-6">
        <textarea
          value={review}
          onChange={handleReviewChange}
          placeholder="Write your review..."
          rows="4"
          className="w-full p-4 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          style={{ color: "black" }}
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-center">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-full shadow-md hover:bg-blue-600 transition duration-200"
        >
          {loading ? "Submitting..." : "Submit Review"}
        </button>
      </div>

      {/* Success Message */}
      {submitted && (
        <div className="mt-4 p-4 text-center text-green-600 font-medium bg-green-100 rounded-md">
          Thank you for your review!
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 text-center text-red-600 font-medium bg-red-100 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
};

export default RatingReview;
