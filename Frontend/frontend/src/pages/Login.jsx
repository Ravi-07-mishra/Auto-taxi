import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/userContext";
import { Box, Button, Typography, TextField, Alert } from "@mui/material";
import { RiLoginCircleFill } from "react-icons/ri";
import { keyframes } from "@emotion/react";

// Floating animation for the login box
const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const LoginPage = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await login(email, password);
      if (response.user) {
        navigate("/userhome");
      } else {
        setError(response.data.msg || "Unexpected error occurred.");
      }
    } catch (err) {
      setError(err.response?.data?.msg || "Login failed. Please try again.");
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
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
          background: "rgba(0, 0, 0, 0.5)", // Dark overlay for better readability
          zIndex: 1,
        }}
      />

      {/* Login Form Container */}
      <Box
        component="form"
        onSubmit={handleLogin}
        sx={{
          width: "100%",
          maxWidth: "400px",
          padding: 4,
          borderRadius: "16px",
          background: "rgba(255, 255, 255, 0.1)", // Transparent glassmorphism effect
          backdropFilter: "blur(10px)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          animation: `${float} 4s ease-in-out infinite`,
          textAlign: "center",
          position: "relative",
          zIndex: 2,
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

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              background: "rgba(255, 0, 0, 0.1)",
              border: "1px solid rgba(255, 0, 0, 0.2)",
              color: "#fff",
            }}
          >
            {error}
          </Alert>
        )}

        {/* Email Input */}
        <TextField
          type="email"
          fullWidth
          label="Email"
          variant="outlined"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          sx={{
            mb: 3,
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

        {/* Password Input */}
        <TextField
          type="password"
          fullWidth
          label="Password"
          variant="outlined"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          sx={{
            mb: 3,
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

        {/* Login Button */}
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
        >
          Login
        </Button>
      </Box>
    </Box>
  );
};

export default LoginPage;