import React, { useState } from "react";
import { useSocket } from "../Context/SocketContext";
import { useNavigate } from "react-router-dom";
import { useDriverAuth } from "../Context/driverContext";
import { Box, Button, Typography, TextField } from "@mui/material";
import { RiLoginCircleFill } from "react-icons/ri";
import toast from "react-hot-toast";
import { keyframes } from "@emotion/react";

// Floating animation for the login box
const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const DriverLogin = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const socket = useSocket();
  const { login } = useDriverAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await login(formData.email, formData.password);
      if (data && data.driver) {
        sendDriverLocation(data.driver._id);
        setMsg("Login successful!");
        toast.success("Logged in Successfully", { id: "login" });
        setTimeout(() => navigate("/driverdashboard"), 500);
      } else {
        throw new Error("Login failed: Driver data not found");
      }
    } catch (error) {
      setMsg(error.message);
      toast.error(error.message, { id: "loginError" });
    } finally {
      setLoading(false);
    }
  };

  const sendDriverLocation = (driverId) => {
    const sendLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              id: driverId,
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };

            if (socket?.connected) {
              socket.emit("driverLocation", location);
              console.log("Location sent:", location);
            } else {
              console.error("Socket is not connected. Retrying...");
              setTimeout(sendLocation, 5000); // Retry after 5 seconds
            }
          },
          (error) => console.error("Geolocation error:", error.message)
        );
      } else {
        console.error("Geolocation is not supported by this browser.");
      }
    };

    sendLocation();
    setInterval(sendLocation, 10000); // Send location every 10 seconds
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundImage: "url('/bg1.jpg')", // Replace with your image path
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
      }}
    >
      {/* Dark Overlay */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 1,
        }}
      />

      {/* Login Form Container */}
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          width: "100%",
          maxWidth: "400px",
          padding: 4,
          borderRadius: "16px",
          background: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          textAlign: "center",
          position: "relative",
          zIndex: 2,
          animation: `${float} 4s ease-in-out infinite`,
        }}
      >
        {/* Logo */}
        <Typography
          variant="h4"
          sx={{
            fontWeight: "bold",
            mb: 3,
            textShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          {["a", "u", "t", "o", "-", "d", "r", "i", "v", "e"].map((letter, index) => (
            <span
              key={index}
              style={{ color: index % 2 === 0 ? "#cbe557" : "white" }}
            >
              {letter}
            </span>
          ))}
        </Typography>

        <Typography variant="h5" textAlign="center" fontWeight={600} mb={3}>
          Driver Login
        </Typography>

        {msg && (
          <Box
            sx={{
              backgroundColor: "rgba(255, 0, 0, 0.1)",
              border: "1px solid rgba(255, 0, 0, 0.2)",
              color: "#fff",
              padding: 2,
              borderRadius: 1,
              mb: 3,
            }}
          >
            {msg}
          </Box>
        )}

        <Box mb={3}>
          <TextField
            type="email"
            name="email"
            fullWidth
            variant="outlined"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            sx={{
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: "rgba(255, 255, 255, 0.3)",
                },
                "&:hover fieldset": {
                  borderColor: "rgba(255, 255, 255, 0.5)",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#cbe557",
                },
              },
              "& .MuiInputLabel-root": {
                color: "rgba(255, 255, 255, 0.7)",
              },
              "& .MuiInputBase-input": {
                color: "#fff",
              },
            }}
          />
        </Box>

        <Box mb={3}>
          <TextField
            type="password"
            name="password"
            fullWidth
            variant="outlined"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            sx={{
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: "rgba(255, 255, 255, 0.3)",
                },
                "&:hover fieldset": {
                  borderColor: "rgba(255, 255, 255, 0.5)",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#cbe557",
                },
              },
              "& .MuiInputLabel-root": {
                color: "rgba(255, 255, 255, 0.7)",
              },
              "& .MuiInputBase-input": {
                color: "#fff",
              },
            }}
          />
        </Box>

        <Button
          type="submit"
          fullWidth
          sx={{
            py: 1.5,
            mt: 2,
            borderRadius: "10px",
            background: "linear-gradient(45deg, #cbe557, #b8d93e)",
            color: "#000",
            fontWeight: "bold",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.2)",
            transition: "transform 0.2s, box-shadow 0.2s",
            ":hover": {
              transform: "scale(1.05)",
              boxShadow: "0 6px 8px rgba(0, 0, 0, 0.3)",
              background: "linear-gradient(45deg, #b8d93e, #cbe557)",
            },
          }}
          endIcon={<RiLoginCircleFill />}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </Button>
      </Box>
    </Box>
  );
};

export default DriverLogin;