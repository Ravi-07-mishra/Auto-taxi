// src/pages/UserHome.jsx

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../Context/userContext";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Star,
  Eye,
  X as CloseIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import BackgroundSlider from "../Component/BackgroundSlider";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Snackbar,
  Alert as MuiAlert,
  MenuItem,
  Stack,
} from "@mui/material";

const logError = (message, error) => {
  console.error(message, error);
};

const fetchAddressFromCoordinates = async (lat, lon, API_BASE, addressCache) => {
  const key = `${lat},${lon}`;
  if (addressCache.current[key]) return addressCache.current[key];
  try {
    const res = await fetch(`${API_BASE}/reverse-geocode?lat=${lat}&lon=${lon}`);
    if (!res.ok) throw new Error(res.statusText);
    const data = await res.json();
    const addr =
      data.formatted ||
      data.results?.[0]?.formatted ||
      data.results?.[0]?.display_name ||
      "Address not available";
    addressCache.current[key] = addr;
    return addr;
  } catch (err) {
    logError("Reverse geocode error:", err);
    return "Address not available";
  }
};

const UserHome = () => {
  const API_BASE =
    import.meta.env.VITE_API_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://api.yourdomain.com"
      : "http://localhost:3000");

  const auth = useAuth();
  const navigate = useNavigate();
  const sliderRef = useRef(null);

  const [bookings, setBookings] = useState([]);
  const [addresses, setAddresses] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filter, setFilter] = useState("all");
  const [reviewVisible, setReviewVisible] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [rideDetails, setRideDetails] = useState(null);

  const [loadingBookings, setLoadingBookings] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const addressCache = useRef({});

  useEffect(() => {
    if (!auth.user?._id) {
      setLoadingBookings(false);
      return;
    }
    (async () => {
      setLoadingBookings(true);
      try {
        const res = await fetch(`${API_BASE}/user/${auth.user._id}`);
        if (!res.ok) throw new Error(res.statusText);
        const json = await res.json();
        setBookings(json.bookings || []);
      } catch (err) {
        logError("Error fetching bookings:", err);
        setErrorMsg("Failed to load bookings.");
        setSnackbarOpen(true);
      } finally {
        setLoadingBookings(false);
      }
    })();
  }, [auth.user?._id, API_BASE]);

  const filteredBookings = bookings.filter((bk) => {
    if (filter === "all") return true;
    return bk.status?.toLowerCase() === filter;
  });

  useEffect(() => {
    const booking = filteredBookings[currentIndex];
    if (!booking) return;
    const id = booking._id.toString();
    if (addresses[id]) return;
    const { pickupLocation, destinationLocation } = booking;
    (async () => {
      let pickupAddress = "Address not available";
      let destinationAddress = "Address not available";
      if (pickupLocation?.lat && pickupLocation?.lng) {
        pickupAddress = await fetchAddressFromCoordinates(
          pickupLocation.lat,
          pickupLocation.lng,
          API_BASE,
          addressCache
        );
      }
      if (destinationLocation?.lat && destinationLocation?.lng) {
        destinationAddress = await fetchAddressFromCoordinates(
          destinationLocation.lat,
          destinationLocation.lng,
          API_BASE,
          addressCache
        );
      }
      setAddresses((prev) => ({
        ...prev,
        [id]: { pickupAddress, destinationAddress },
      }));
    })();
  }, [currentIndex, bookings, addresses, API_BASE, filter]);

  const handleCancelBooking = async (bookingId) => {
    try {
      const res = await fetch(`${API_BASE}/booking/cancel/${bookingId}`, {
        method: "PUT",
      });
      if (!res.ok) throw new Error(res.statusText);
      await res.json();
      setBookings((prev) =>
        prev.map((bk) =>
          bk._id.toString() === bookingId
            ? { ...bk, status: "Cancelled" }
            : bk
        )
      );
    } catch (err) {
      logError("Cancel booking error:", err);
      setErrorMsg("Failed to cancel booking.");
      setSnackbarOpen(true);
    }
  };

  const handleSubmitReview = async (bookingId) => {
      console.log("Calling handleSubmitReview for:", bookingId); // ✅ Add this

    try {
      const res = await fetch(`${API_BASE}/user/rating/${bookingId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      if (!res.ok) throw new Error(res.statusText);
      await res.json();
      setReviewVisible(null);
      setRating(0);
      setComment("");
      setErrorMsg("Review submitted!");
      setSnackbarOpen(true);
    } catch (err) {
      logError("Submit review error:", err);
      setErrorMsg("Failed to submit review.");
      setSnackbarOpen(true);
    }
  };

  const handleShowRideDetails = (booking) => setRideDetails(booking);
  const handleCloseSnackbar = () => setSnackbarOpen(false);

  const CustomPrevArrow = () => (
    <Box
      onClick={() => sliderRef.current.slickPrev()}
      sx={{
        position: "absolute",
        top: "50%",
        left: 16,
        transform: "translateY(-50%)",
        bgcolor: "rgba(0,0,0,0.5)",
        borderRadius: "50%",
        p: 1,
        cursor: "pointer",
        zIndex: 30,
        "&:hover": { bgcolor: "rgba(63,81,181,0.8)", transform: "scale(1.1)" },
      }}
    >
      <ChevronLeft size={24} color="#fff" />
    </Box>
  );

  const CustomNextArrow = () => (
    <Box
      onClick={() => sliderRef.current.slickNext()}
      sx={{
        position: "absolute",
        top: "50%",
        right: 16,
        transform: "translateY(-50%)",
        bgcolor: "rgba(0,0,0,0.5)",
        borderRadius: "50%",
        p: 1,
        cursor: "pointer",
        zIndex: 30,
        "&:hover": { bgcolor: "rgba(63,81,181,0.8)", transform: "scale(1.1)" },
      }}
    >
      <ChevronRight size={24} color="#fff" />
    </Box>
  );

  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: false,
    afterChange: (idx) => setCurrentIndex(idx),
    appendDots: (dots) => (
      <Box sx={{ mt: 2, display: "flex", justifyContent: "center", gap: 1 }}>
        {dots}
      </Box>
    ),
    customPaging: () => (
      <Box
        sx={{
          width: 8,
          height: 8,
          bgcolor: "rgba(255,255,255,0.3)",
          borderRadius: "50%",
          "&:hover": { bgcolor: "rgba(255,255,255,0.8)" },
        }}
      />
    ),
  };

  if (loadingBookings) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "grey.900",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "linear-gradient(to bottom right, #1f2937, #4338ca)",
        color: "#fff",
        fontFamily: "sans-serif",
        position: "relative",
      }}
    >
      <BackgroundSlider
        images={["/bg1.jpg", "/bg2.jpg", "/bg3.jpg"]}
        interval={7000}
        className="absolute inset-0 z-0"
      />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <MuiAlert
          onClose={handleCloseSnackbar}
          severity={errorMsg.includes("Failed") ? "error" : "success"}
          sx={{ width: "100%" }}
        >
          {errorMsg}
        </MuiAlert>
      </Snackbar>

      <Box component="section" sx={{ pt: 24, pb: 12, textAlign: "center", zIndex: 10, px: 2 }}>
        <Typography variant="h3" component="h1" sx={{ fontWeight: "bold", mb: 2 }}>
          Welcome, {auth.user ? auth.user.name || "User" : "Please Login"}!
        </Typography>
        <Typography variant="h6" sx={{ color: "rgba(255,255,255,0.8)" }}>
          Manage your bookings and explore your dashboard.
        </Typography>
      </Box>

      <Box component="section" sx={{ py: 12, position: "relative", zIndex: 10, px: 2 }}>
        <Box sx={{ maxWidth: 1000, mx: "auto" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
            <Typography variant="h4" component="h2" sx={{ fontWeight: "bold" }}>
              Your Bookings
            </Typography>
            <TextField
              select
              label="Filter"
              value={filter}
              size="small"
              onChange={(e) => setFilter(e.target.value)}
              sx={{ bgcolor: "#fff", borderRadius: 1 }}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="accepted">Accepted</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </TextField>
          </Stack>

          {filteredBookings.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 12 }}>
              <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.6)" }}>
                No bookings found.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ position: "relative" }}>
              <Slider ref={sliderRef} {...carouselSettings}>
                {filteredBookings.map((bk) => {
                 const id = bk._id.toString()
                  const statusLower = bk.status?.toLowerCase();
                  return (
                    <Box key={id} sx={{ px: { xs: 1, sm: 2 } }}>
                      {/* Booking Card */}
                      <Box
                        sx={{
                          bgcolor: "rgba(31,41,55,0.8)",
                          backdropFilter: "blur(8px)",
                          borderRadius: 3,
                          overflow: "hidden",
                          boxShadow: 3,
                          border: "1px solid rgba(255,255,255,0.1)",
                          transition: "box-shadow 0.3s ease, border-color 0.3s ease",
                          "&:hover": {
                            boxShadow: "0 0 20px rgba(67,56,202,0.3)",
                            borderColor: "rgba(67,56,202,0.3)",
                          },
                        }}
                      >
                        {/* Header */}
                        <Box sx={{ display: "flex", alignItems: "center", p: 4, pb: 2, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                          <Box sx={{ position: "relative" }}>
                            <Box
                              component="img"
                              src={`${API_BASE}/${bk.profileImage}` || "/placeholder.svg"}
                              alt="Driver"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.svg";
                              }}
                              sx={{
                                width: 64,
                                height: 64,
                                borderRadius: "50%",
                                objectFit: "cover",
                                border: "2px solid rgba(99,102,241,0.5)",
                                boxShadow: 2,
                              }}
                            />
                            {bk.driver?.avgRating != null && (
                              <Box
                                sx={{
                                  position: "absolute",
                                  bottom: -8,
                                  left: "50%",
                                  transform: "translateX(-50%)",
                                  bgcolor: "rgba(99,102,241,0.8)",
                                  color: "#fff",
                                  px: 1.5,
                                  py: 0.5,
                                  borderRadius: "16px",
                                  display: "flex",
                                  alignItems: "center",
                                  typography: "caption",
                                  fontWeight: "bold",
                                  boxShadow: 1,
                                }}
                              >
                                <Star size={12} />
                                <Box component="span" sx={{ ml: 0.5 }}>
                                  {bk.driver.avgRating.toFixed(1)}
                                </Box>
                              </Box>
                            )}
                          </Box>
                          <Box sx={{ ml: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                              {bk.driver?.name || "Driver"}
                            </Typography>
                            <Box
                              component="span"
                              sx={{
                                typography: "caption",
                                fontWeight: "medium",
                                px: 1,
                                py: 0.25,
                                borderRadius: 1,
                                bgcolor:
                                  statusLower === "completed"
                                    ? "rgba(16,185,129,0.2)"
                                    : statusLower === "in-progress"
                                    ? "rgba(234,179,8,0.2)"
                                    : statusLower === "cancelled"
                                    ? "rgba(239,68,68,0.2)"
                                    : "rgba(99,102,241,0.2)",
                                color:
                                  statusLower === "completed"
                                    ? "rgba(16,185,129,0.8)"
                                    : statusLower === "in-progress"
                                    ? "rgba(234,179,8,0.8)"
                                    : statusLower === "cancelled"
                                    ? "rgba(239,68,68,0.8)"
                                    : "rgba(99,102,241,0.8)",
                              }}
                            >
                              {bk.status}
                            </Box>
                          </Box>
                        </Box>

                        {/* Body */}
                        <Box sx={{ p: 4, pt: 2 }}>
                          <Box sx={{ mb: 4 }}>
                            <Box sx={{ display: "flex", alignItems: "flex-start", mb: 1 }}>
                              <Box sx={{ bgcolor: "rgba(99,102,241,0.2)", p: 1, borderRadius: 1, mr: 2 }}>
                                <MapPin size={20} color="rgba(147,197,253,1)" />
                              </Box>
                              <Box>
                                <Typography variant="overline" sx={{ color: "rgba(147,197,253,0.8)", mb: 0.5 }}>
                                  Pickup Location
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: "medium" }}>
                                  {addresses[id]?.pickupAddress ||
                                    (filteredBookings.indexOf(bk) === currentIndex ? "Loading address..." : "–")}
                                </Typography>
                              </Box>
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                              <Box sx={{ bgcolor: "rgba(99,102,241,0.2)", p: 1, borderRadius: 1, mr: 2 }}>
                                <MapPin size={20} color="rgba(147,197,253,1)" />
                              </Box>
                              <Box>
                                <Typography variant="overline" sx={{ color: "rgba(147,197,253,0.8)", mb: 0.5 }}>
                                  Destination
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: "medium" }}>
                                  {addresses[id]?.destinationAddress ||
                                    (filteredBookings.indexOf(bk) === currentIndex ? "Loading address..." : "–")}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Box>

                        {/* Footer */}
                        {statusLower === "completed" ? (
                          <Button
                            fullWidth
                            variant="contained"
                            color="primary"
                            onClick={() => setReviewVisible(id)}
                            startIcon={<Star size={20} />}
                            sx={{
                              borderRadius: 2,
                              py: 1.5,
                              bgcolor: "rgba(99,102,241,0.9)",
                              "&:hover": { bgcolor: "rgba(79,84,230,0.9)" },
                            }}
                          >
                            Leave a Review
                          </Button>
                        ) : (
                          <Box sx={{ display: "flex", gap: 2, p: 4, pt: 2 }}>
                            <Button
                              fullWidth
                              variant="contained"
                              color="info"
                              onClick={() => handleShowRideDetails(bk)}
                              startIcon={<Eye size={20} />}
                              sx={{
                                borderRadius: 2,
                                py: 1.5,
                                bgcolor: "rgba(99,102,241,0.7)",
                                "&:hover": { bgcolor: "rgba(79,84,230,0.7)" },
                              }}
                            >
                              Details
                            </Button>
                                                       {statusLower !== "cancelled" && (
                              <Button
                                fullWidth
                                variant="contained"
                                color="error"
                                onClick={() => handleCancelBooking(id)}
                                startIcon={<CloseIcon size={20} />}
                                sx={{
                                  borderRadius: 2,
                                  py: 1.5,
                                  bgcolor: "rgba(239,68,68,0.8)",
                                  "&:hover": { bgcolor: "rgba(220,38,38,0.8)" },
                                }}
                              >
                                Cancel
                              </Button>
                            )}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Slider>
              <CustomPrevArrow />
              <CustomNextArrow />
            </Box>
          )}
        </Box>
      </Box>

      {/* Ride Details Dialog */}
      <Dialog
        open={Boolean(rideDetails)}
        onClose={() => setRideDetails(null)}
        aria-labelledby="ride-details-title"
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle id="ride-details-title">Ride Details</DialogTitle>
        <DialogContent dividers>
          {rideDetails && (
            <Box sx={{ color: "#000" }}>
              <Typography variant="body1" gutterBottom>
                <strong>Driver:</strong> {rideDetails.driver?.name || "N/A"}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Status:</strong> {rideDetails.status}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Price:</strong> $
                {rideDetails.price?.toFixed(2) || "0.00"}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Pickup:</strong>{" "}
                {addresses[rideDetails._id]?.pickupAddress || "Loading..."}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Destination:</strong>{" "}
                {addresses[rideDetails._id]?.destinationAddress || "Loading..."}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Booked At:</strong>{" "}
                {new Date(rideDetails.createdAt).toLocaleString()}
              </Typography>
              {rideDetails.rating != null && (
                <Typography variant="body1" gutterBottom>
                  <strong>Your Rating:</strong> {rideDetails.rating} / 5
                </Typography>
              )}
              {rideDetails.review && (
                <Typography variant="body1" gutterBottom>
                  <strong>Your Review:</strong> “{rideDetails.review}”
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRideDetails(null)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Review Dialog */}
      <Dialog
        open={Boolean(reviewVisible)}
        onClose={() => setReviewVisible(null)}
        aria-labelledby="review-dialog-title"
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle id="review-dialog-title">Leave a Review</DialogTitle>
        <DialogContent dividers>
          <Box component="form" noValidate
           onSubmit={e => e.preventDefault()}
          >
            <TextField
              type="number"
              label="Rating (1–5)"
              inputProps={{ min: 1, max: 5 }}
              fullWidth
              variant="outlined"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              sx={{ mb: 3 }}
            />
            <TextField
              label="Review"
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              sx={{ mb: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewVisible(null)} color="secondary">
            Cancel
          </Button>
         <Button
  type="button"
  onClick={() => handleSubmitReview(reviewVisible)}
  color="primary"
  variant="contained"
>
  Submit Review
</Button>

        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserHome;

