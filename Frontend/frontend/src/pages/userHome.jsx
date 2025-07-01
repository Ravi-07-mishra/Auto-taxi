// src/pages/UserHome.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Chip,
  useMediaQuery,
  useTheme
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

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
  const addressesRef = useRef({});
  addressesRef.current = addresses;

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

  // Optimized address fetching
  const fetchAddresses = useCallback(async (bookingIds) => {
    const newAddresses = { ...addressesRef.current };
    let needsUpdate = false;

    for (const id of bookingIds) {
      const booking = bookings.find(bk => bk._id.toString() === id);
      if (!booking || newAddresses[id]) continue;

      const { pickupLocation, destinationLocation } = booking;
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

      newAddresses[id] = { pickupAddress, destinationAddress };
      needsUpdate = true;
    }

    if (needsUpdate) {
      setAddresses(newAddresses);
    }
  }, [API_BASE]);

  useEffect(() => {
    if (filteredBookings.length === 0) return;
    
    // Fetch addresses for visible bookings only
    const visibleIds = filteredBookings
      .slice(Math.max(0, currentIndex - 1), currentIndex + 2)
      .map(bk => bk._id.toString());
    
    fetchAddresses(visibleIds);
  }, [currentIndex, filteredBookings, fetchAddresses]);

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
        left: isMobile ? 4 : 16,
        transform: "translateY(-50%)",
        bgcolor: "rgba(0,0,0,0.7)",
        borderRadius: "50%",
        p: 1,
        cursor: "pointer",
        zIndex: 30,
        "&:hover": { bgcolor: "rgba(99,102,241,0.9)", transform: "scale(1.1)" },
      }}
    >
      <ChevronLeft size={isMobile ? 18 : 24} color="#fff" />
    </Box>
  );

  const CustomNextArrow = () => (
    <Box
      onClick={() => sliderRef.current.slickNext()}
      sx={{
        position: "absolute",
        top: "50%",
        right: isMobile ? 4 : 16,
        transform: "translateY(-50%)",
        bgcolor: "rgba(0,0,0,0.7)",
        borderRadius: "50%",
        p: 1,
        cursor: "pointer",
        zIndex: 30,
        "&:hover": { bgcolor: "rgba(99,102,241,0.9)", transform: "scale(1.1)" },
      }}
    >
      <ChevronRight size={isMobile ? 18 : 24} color="#fff" />
    </Box>
  );

  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: isMobile ? 1 : isTablet ? 2 : 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 7000,
    arrows: false,
    afterChange: (idx) => setCurrentIndex(idx),
    appendDots: (dots) => (
      <Box sx={{ mt: 2, display: "flex", justifyContent: "center", gap: 0.5 }}>
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
    responsive: [
      {
        breakpoint: 900,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        }
      }
    ]
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
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        color: "#fff",
        fontFamily: "'Inter', sans-serif",
        position: "relative",
        overflowX: "hidden",
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

      <Box component="section" sx={{ 
        pt: { xs: 18, sm: 20, md: 24 }, 
        pb: { xs: 6, md: 12 }, 
        textAlign: "center", 
        zIndex: 10, 
        px: 2,
        position: "relative"
      }}>
        <Typography variant="h3" component="h1" sx={{ 
          fontWeight: 800, 
          mb: 2,
          fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
          background: "linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent"
        }}>
          Welcome, {auth.user ? auth.user.name || "User" : "Please Login"}!
        </Typography>
        <Typography variant="h6" sx={{ 
          color: "rgba(255,255,255,0.8)", 
          maxWidth: 600, 
          mx: "auto",
          fontSize: { xs: '1rem', sm: '1.1rem' }
        }}>
          Manage your bookings and explore your dashboard
        </Typography>
      </Box>

      <Box component="section" sx={{ 
        py: { xs: 6, md: 12 }, 
        position: "relative", 
        zIndex: 10, 
        px: 2,
        backdropFilter: "blur(4px)"
      }}>
        <Box sx={{ maxWidth: 1400, mx: "auto" }}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center" sx={{ mb: 4, gap: 2 }}>
            <Typography variant="h4" component="h2" sx={{ 
              fontWeight: 700,
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
            }}>
              Your Bookings
            </Typography>
            <TextField
              select
              label="Filter"
              value={filter}
              size="small"
              onChange={(e) => setFilter(e.target.value)}
              sx={{ 
                bgcolor: "rgba(255,255,255,0.1)", 
                borderRadius: 2,
                minWidth: 140,
                "& .MuiInputBase-input": { color: "#fff" },
                "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.7)" },
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.2)" },
                "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.4)" }
              }}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="accepted">Accepted</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </TextField>
          </Stack>

          {filteredBookings.length === 0 ? (
            <Box sx={{ 
              textAlign: "center", 
              py: 12,
              bgcolor: "rgba(15,23,42,0.6)",
              borderRadius: 4,
              backdropFilter: "blur(8px)"
            }}>
              <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.6)" }}>
                No bookings found
              </Typography>
            </Box>
          ) : (
            <Box sx={{ position: "relative" }}>
              <Slider ref={sliderRef} {...carouselSettings}>
                {filteredBookings.map((bk) => {
                  const id = bk._id.toString();
                  const statusLower = bk.status?.toLowerCase();
                  const addressData = addresses[id] || {};
                  
                  return (
                    <Box key={id} sx={{ px: { xs: 0.5, sm: 1.5 }, py: 1 }}>
                      <Box
                        sx={{
                          bgcolor: "rgba(30,41,59,0.7)",
                          backdropFilter: "blur(10px)",
                          borderRadius: 4,
                          overflow: "hidden",
                          boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          transition: "transform 0.3s ease, box-shadow 0.3s ease",
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          "&:hover": {
                            transform: "translateY(-5px)",
                            boxShadow: "0 15px 35px rgba(99,102,241,0.25)",
                          },
                        }}
                      >
                        <Box sx={{ 
                          p: { xs: 2, sm: 3 }, 
                          borderBottom: "1px solid rgba(255,255,255,0.08)",
                          display: "flex",
                          alignItems: "center"
                        }}>
                          <Box sx={{ position: "relative", flexShrink: 0 }}>
                            <Box
                              component="img"
                              src={bk.driver?.profileImage ? `${API_BASE}/${bk.driver.profileImage}` : "/placeholder.svg"}
                              alt="Driver"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.svg";
                              }}
                              sx={{
                                width: 60,
                                height: 60,
                                borderRadius: "50%",
                                objectFit: "cover",
                                border: "2px solid rgba(99,102,241,0.5)",
                                boxShadow: "0 0 15px rgba(99,102,241,0.3)",
                              }}
                            />
                            {bk.driver?.avgRating != null && (
                              <Chip
                                size="small"
                                icon={<Star size={14} />}
                                label={bk.driver.avgRating.toFixed(1)}
                                sx={{
                                  position: "absolute",
                                  bottom: -8,
                                  left: "50%",
                                  transform: "translateX(-50%)",
                                  bgcolor: "rgba(99,102,241,0.9)",
                                  color: "#fff",
                                  fontWeight: 700,
                                  boxShadow: 1,
                                  "& .MuiChip-icon": { color: "#fff", ml: 0.5 }
                                }}
                              />
                            )}
                          </Box>
                          <Box sx={{ ml: 2.5, overflow: "hidden" }}>
                            <Typography variant="h6" sx={{ 
                              fontWeight: 700,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis"
                            }}>
                              {bk.driver?.name || "Driver"}
                            </Typography>
                            <Chip
                              label={bk.status}
                              size="small"
                              sx={{
                                mt: 0.5,
                                fontWeight: 600,
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
                                    ? "rgba(16,185,129,0.9)"
                                    : statusLower === "in-progress"
                                    ? "rgba(234,179,8,0.9)"
                                    : statusLower === "cancelled"
                                    ? "rgba(239,68,68,0.9)"
                                    : "rgba(99,102,241,0.9)",
                              }}
                            />
                          </Box>
                        </Box>

                        <Box sx={{ 
                          p: { xs: 2, sm: 3 },
                          flexGrow: 1
                        }}>
                          <Stack spacing={2.5} sx={{ mb: 3 }}>
                            <Box sx={{ display: "flex" }}>
                              <Box sx={{ 
                                bgcolor: "rgba(99,102,241,0.15)", 
                                p: 1.5, 
                                borderRadius: 2, 
                                mr: 2,
                                flexShrink: 0
                              }}>
                                <MapPin size={20} color="#93c5fd" />
                              </Box>
                              <Box sx={{ overflow: "hidden" }}>
                                <Typography variant="overline" sx={{ 
                                  color: "#93c5fd", 
                                  fontWeight: 600,
                                  letterSpacing: 1,
                                  display: "block",
                                  mb: 0.5
                                }}>
                                  Pickup Location
                                </Typography>
                                <Typography variant="body1" sx={{ 
                                  fontWeight: 500,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis"
                                }}>
                                  {addressData.pickupAddress || "Loading..."}
                                </Typography>
                              </Box>
                            </Box>
                            <Box sx={{ display: "flex" }}>
                              <Box sx={{ 
                                bgcolor: "rgba(99,102,241,0.15)", 
                                p: 1.5, 
                                borderRadius: 2, 
                                mr: 2,
                                flexShrink: 0
                              }}>
                                <MapPin size={20} color="#93c5fd" />
                              </Box>
                              <Box sx={{ overflow: "hidden" }}>
                                <Typography variant="overline" sx={{ 
                                  color: "#93c5fd", 
                                  fontWeight: 600,
                                  letterSpacing: 1,
                                  display: "block",
                                  mb: 0.5
                                }}>
                                  Destination
                                </Typography>
                                <Typography variant="body1" sx={{ 
                                  fontWeight: 500,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis"
                                }}>
                                  {addressData.destinationAddress || "Loading..."}
                                </Typography>
                              </Box>
                            </Box>
                          </Stack>
                          
                          <Box sx={{ 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "space-between",
                            bgcolor: "rgba(15,23,42,0.4)",
                            borderRadius: 2,
                            p: 1.5,
                            mt: "auto"
                          }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {new Date(bk.createdAt).toLocaleDateString()}
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 700 }}>
                              ${bk.price?.toFixed(2) || "0.00"}
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ 
                          p: { xs: 2, sm: 3 }, 
                          pt: 0,
                          display: "flex",
                          gap: 2
                        }}>
                          {statusLower === "completed" ? (
                            <Button
                              fullWidth
                              variant="contained"
                              onClick={() => setReviewVisible(id)}
                              startIcon={<Star size={20} />}
                              sx={{
                                borderRadius: 2,
                                py: 1.5,
                                bgcolor: "rgba(139,92,246,0.9)",
                                "&:hover": { bgcolor: "rgba(124,58,237,0.9)" },
                                fontWeight: 600,
                                fontSize: "0.9rem"
                              }}
                            >
                              Leave Review
                            </Button>
                          ) : (
                            <>
                              <Button
                                fullWidth
                                variant="contained"
                                onClick={() => handleShowRideDetails(bk)}
                                startIcon={<Eye size={20} />}
                                sx={{
                                  borderRadius: 2,
                                  py: 1.5,
                                  bgcolor: "rgba(99,102,241,0.9)",
                                  "&:hover": { bgcolor: "rgba(79,70,229,0.9)" },
                                  fontWeight: 600,
                                  fontSize: "0.9rem"
                                }}
                              >
                                Details
                              </Button>
                              {statusLower !== "cancelled" && (
                                <Button
                                  fullWidth
                                  variant="contained"
                                  onClick={() => handleCancelBooking(id)}
                                  startIcon={<CloseIcon size={20} />}
                                  sx={{
                                    borderRadius: 2,
                                    py: 1.5,
                                    bgcolor: "rgba(239,68,68,0.9)",
                                    "&:hover": { bgcolor: "rgba(220,38,38,0.9)" },
                                    fontWeight: 600,
                                    fontSize: "0.9rem"
                                  }}
                                >
                                  Cancel
                                </Button>
                              )}
                            </>
                          )}
                        </Box>
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
        PaperProps={{
          sx: {
            borderRadius: 4,
            bgcolor: "#0f172a",
            backgroundImage: "none",
            border: "1px solid rgba(255,255,255,0.1)"
          }
        }}
      >
        <DialogTitle id="ride-details-title" sx={{ 
          bgcolor: "rgba(15,23,42,0.6)", 
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          fontWeight: 700,
          color: "#e2e8f0"
        }}>
          Ride Details
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: "rgba(15,23,42,0.4)", color: "#cbd5e1" }}>
          {rideDetails && (
            <Box sx={{ py: 2 }}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: "#94a3b8", fontWeight: 600 }}>Driver</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{rideDetails.driver?.name || "N/A"}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" sx={{ color: "#94a3b8", fontWeight: 600 }}>Status</Typography>
                  <Chip 
                    label={rideDetails.status} 
                    size="small"
                    sx={{
                      fontWeight: 600,
                      bgcolor:
                        rideDetails.status?.toLowerCase() === "completed"
                          ? "rgba(16,185,129,0.2)"
                          : rideDetails.status?.toLowerCase() === "in-progress"
                          ? "rgba(234,179,8,0.2)"
                          : rideDetails.status?.toLowerCase() === "cancelled"
                          ? "rgba(239,68,68,0.2)"
                          : "rgba(99,102,241,0.2)",
                      color:
                        rideDetails.status?.toLowerCase() === "completed"
                          ? "rgba(16,185,129,0.9)"
                          : rideDetails.status?.toLowerCase() === "in-progress"
                          ? "rgba(234,179,8,0.9)"
                          : rideDetails.status?.toLowerCase() === "cancelled"
                          ? "rgba(239,68,68,0.9)"
                          : "rgba(99,102,241,0.9)",
                    }}
                  />
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" sx={{ color: "#94a3b8", fontWeight: 600 }}>Price</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    ${rideDetails.price?.toFixed(2) || "0.00"}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" sx={{ color: "#94a3b8", fontWeight: 600 }}>Pickup</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {addresses[rideDetails._id]?.pickupAddress || "Loading..."}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" sx={{ color: "#94a3b8", fontWeight: 600 }}>Destination</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {addresses[rideDetails._id]?.destinationAddress || "Loading..."}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" sx={{ color: "#94a3b8", fontWeight: 600 }}>Booked At</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {new Date(rideDetails.createdAt).toLocaleString()}
                  </Typography>
                </Box>
                
                {rideDetails.rating != null && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: "#94a3b8", fontWeight: 600 }}>Your Rating</Typography>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Star size={18} color="#fbbf24" fill="#fbbf24" />
                      <Typography variant="body1" sx={{ fontWeight: 500, ml: 0.5 }}>
                        {rideDetails.rating} / 5
                      </Typography>
                    </Box>
                  </Box>
                )}
                
                {rideDetails.review && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: "#94a3b8", fontWeight: 600 }}>Your Review</Typography>
                    <Typography variant="body1" sx={{ 
                      fontWeight: 500, 
                      fontStyle: "italic",
                      p: 1.5,
                      bgcolor: "rgba(255,255,255,0.05)",
                      borderRadius: 2,
                      mt: 1
                    }}>
                      “{rideDetails.review}”
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          bgcolor: "rgba(15,23,42,0.6)", 
          borderTop: "1px solid rgba(255,255,255,0.1)",
          p: 2
        }}>
          <Button 
            onClick={() => setRideDetails(null)} 
            sx={{
              fontWeight: 600,
              color: "#94a3b8",
              "&:hover": { color: "#e2e8f0" }
            }}
          >
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
        PaperProps={{
          sx: {
            borderRadius: 4,
            bgcolor: "#0f172a",
            backgroundImage: "none",
            border: "1px solid rgba(255,255,255,0.1)"
          }
        }}
      >
        <DialogTitle id="review-dialog-title" sx={{ 
          bgcolor: "rgba(15,23,42,0.6)", 
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          fontWeight: 700,
          color: "#e2e8f0"
        }}>
          Leave a Review
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: "rgba(15,23,42,0.4)" }}>
          <Box component="form" noValidate
           onSubmit={e => e.preventDefault()}
          >
            <Box sx={{ mb: 3, display: "flex", alignItems: "center" }}>
              <Typography variant="body1" sx={{ mr: 2, color: "#cbd5e1", fontWeight: 500 }}>Rating:</Typography>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={32}
                  onClick={() => setRating(star)}
                  style={{
                    cursor: "pointer",
                    margin: "0 2px",
                    color: star <= rating ? "#fbbf24" : "#64748b",
                    fill: star <= rating ? "#fbbf24" : "transparent",
                    transition: "all 0.2s"
                  }}
                />
              ))}
            </Box>
            <TextField
              label="Review"
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              sx={{ 
                mb: 2,
                "& .MuiInputBase-root": {
                  bgcolor: "rgba(30,41,59,0.5)",
                  borderRadius: 2,
                  color: "#e2e8f0",
                  "& fieldset": {
                    borderColor: "rgba(255,255,255,0.1)"
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(99,102,241,0.5)"
                  }
                },
                "& .MuiInputLabel-root": {
                  color: "rgba(255,255,255,0.7)"
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          bgcolor: "rgba(15,23,42,0.6)", 
          borderTop: "1px solid rgba(255,255,255,0.1)",
          p: 2
        }}>
          <Button 
            onClick={() => setReviewVisible(null)} 
            sx={{
              fontWeight: 600,
              color: "#94a3b8",
              "&:hover": { color: "#e2e8f0" }
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => handleSubmitReview(reviewVisible)}
            variant="contained"
            sx={{
              fontWeight: 600,
              borderRadius: 2,
              bgcolor: "rgba(139,92,246,0.9)",
              "&:hover": { bgcolor: "rgba(124,58,237,0.9)" },
              px: 3,
              py: 1
            }}
          >
            Submit Review
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserHome;