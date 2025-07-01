// src/components/DriverLogin.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Typography, TextField, Divider, CircularProgress, InputAdornment, IconButton } from "@mui/material";
import { RiLoginCircleFill, RiEyeLine, RiEyeOffLine } from "react-icons/ri";
import { MdEmail, MdPassword } from "react-icons/md";
import toast from "react-hot-toast";
import { useSocket } from "../Context/SocketContext";
import { useDriverAuth } from "../Context/driverContext";

const DriverLogin = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const socket = useSocket();
  const { login } = useDriverAuth();
  const navigate = useNavigate();
  const locationIntervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const sendDriverLocation = useCallback((driverId) => {
    const attemptSend = () => {
      if (!navigator.geolocation) {
        console.error("Geolocation not supported.");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            id: driverId,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          if (socket?.connected) {
            socket.emit("driverLocation", location);
          } else {
            setTimeout(attemptSend, 5000);
          }
        },
        (error) => {
          console.error("Geolocation error:", error.message);
        }
      );
    };

    attemptSend();
    const intervalId = setInterval(attemptSend, 10000);
    locationIntervalRef.current = intervalId;
  }, [socket]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const data = await login(formData.email, formData.password);
      if (data?.driver) {
        sendDriverLocation(data.driver._id);
        toast.success("Logged in Successfully", { id: "login" });
        setTimeout(() => navigate("/driverdashboard"), 500);
      } else {
        throw new Error("Login failed: Driver data not found");
      }
    } catch (error) {
      setMsg(error.message || "Login failed. Please try again.");
      toast.error(error.message || "Login failed.", { id: "loginError" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        px: 2,
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: "-50%",
          right: "-10%",
          width: "700px",
          height: "700px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(203, 229, 87, 0.1) 0%, transparent 70%)",
          zIndex: 1,
        },
        "&::after": {
          content: '""',
          position: "absolute",
          bottom: "-30%",
          left: "-10%",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)",
          zIndex: 1,
        },
      }}
    >
      {/* Login Card */}
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          width: "100%",
          maxWidth: "500px",
          padding: { xs: 3, sm: 4, md: 5 },
          borderRadius: "16px",
          background: "rgba(15, 23, 42, 0.7)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
          position: "relative",
          zIndex: 2,
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "4px",
            background: "linear-gradient(90deg, #cbe557, #3b82f6)",
            zIndex: 3,
          },
        }}
      >
        {/* Branding */}
        <Box sx={{ textAlign: "center", mb: 5 }}>
          <Box
            sx={{
              width: "80px",
              height: "80px",
              borderRadius: "16px",
              background: "rgba(30, 41, 59, 0.8)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(203, 229, 87, 0.3)",
              mb: 3,
            }}
          >
            <RiLoginCircleFill size={40} color="#cbe557" />
          </Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              mb: 1,
              color: "#f1f5f9",
              letterSpacing: "-0.5px",
            }}
          >
            DRIVER LOGIN
          </Typography>
          <Typography sx={{ color: "#94a3b8", maxWidth: "300px", margin: "0 auto" }}>
            Sign in to access your driver dashboard
          </Typography>
        </Box>

        {msg && (
          <Box
            sx={{
              backgroundColor: "rgba(220, 38, 38, 0.15)",
              color: "#fecaca",
              padding: "12px 16px",
              borderRadius: "8px",
              mb: 3,
              border: "1px solid rgba(220, 38, 38, 0.3)",
              fontSize: "0.9rem",
            }}
          >
            {msg}
          </Box>
        )}

        <Box mb={3}>
          <Typography variant="subtitle2" sx={{ color: "#94a3b8", mb: 1, fontWeight: 500 }}>
            EMAIL ADDRESS
          </Typography>
          <TextField
            type="email"
            name="email"
            fullWidth
            variant="outlined"
            placeholder="you@company.com"
            value={formData.email}
            onChange={handleChange}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MdEmail color="#94a3b8" size={20} />
                </InputAdornment>
              ),
              sx: {
                borderRadius: "10px",
                background: "rgba(30, 41, 59, 0.5)",
                "& input": { 
                  color: "#f1f5f9", 
                  padding: "14px",
                  fontSize: "1rem"
                },
              },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                "& fieldset": { 
                  borderColor: "rgba(148, 163, 184, 0.2)",
                },
                "&:hover fieldset": { 
                  borderColor: "rgba(203, 229, 87, 0.3)" 
                },
                "&.Mui-focused fieldset": { 
                  borderColor: "#cbe557",
                  borderWidth: "1px"
                },
              },
            }}
          />
        </Box>

        <Box mb={4}>
          <Typography variant="subtitle2" sx={{ color: "#94a3b8", mb: 1, fontWeight: 500 }}>
            PASSWORD
          </Typography>
          <TextField
            type={showPassword ? "text" : "password"}
            name="password"
            fullWidth
            variant="outlined"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MdPassword color="#94a3b8" size={20} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={togglePasswordVisibility}
                    edge="end"
                    sx={{ color: "#94a3b8", "&:hover": { color: "#cbe557" } }}
                  >
                    {showPassword ? <RiEyeOffLine size={20} /> : <RiEyeLine size={20} />}
                  </IconButton>
                </InputAdornment>
              ),
              sx: {
                borderRadius: "10px",
                background: "rgba(30, 41, 59, 0.5)",
                "& input": { 
                  color: "#f1f5f9", 
                  padding: "14px",
                  fontSize: "1rem"
                },
              },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                "& fieldset": { 
                  borderColor: "rgba(148, 163, 184, 0.2)",
                },
                "&:hover fieldset": { 
                  borderColor: "rgba(203, 229, 87, 0.3)" 
                },
                "&.Mui-focused fieldset": { 
                  borderColor: "#cbe557",
                  borderWidth: "1px"
                },
              },
            }}
          />
        </Box>

        <Button
          type="submit"
          fullWidth
          sx={{
            py: 1.8,
            mb: 2,
            borderRadius: "10px",
            background: "linear-gradient(90deg, #cbe557 0%, #3b82f6 100%)",
            color: "#0f172a",
            fontWeight: 700,
            fontSize: "1rem",
            letterSpacing: "0.5px",
            position: "relative",
            overflow: "hidden",
            zIndex: 1,
            "&:hover": {
              "&::before": {
                opacity: 1,
              },
            },
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: "rgba(255, 255, 255, 0.2)",
              opacity: 0,
              transition: "opacity 0.3s",
              zIndex: -1,
            },
            "&:disabled": {
              background: "#334155",
              color: "#94a3b8",
            },
          }}
          endIcon={<RiLoginCircleFill size={20} />}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : "SIGN IN"}
        </Button>

      

        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 500 }}>
            Need driver access?{" "}
            <Button
              variant="text"
              sx={{
                color: "#cbe557",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.95rem",
                p: 0,
                "&:hover": {
                  background: "none",
                  textDecoration: "underline",
                },
              }}
            >
              Contact Administrator
            </Button>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default DriverLogin;