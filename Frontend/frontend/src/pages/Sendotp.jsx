import { Button, Typography, Box } from "@mui/material";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoSendSharp } from "react-icons/io5";
import toast from "react-hot-toast";

const Sendotp = () => {
  const [error, setError] = useState(null);
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch("http://localhost:3000/api/user/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await response.json();

      if (!response.ok) {
        setError(json.message || "Failed to send OTP. Please try again.");
      } else {
        toast.success("OTP sent successfully!", { id: "send-otp" });
        navigate("/usersignup");
      }
    } catch (error) {
      setError("Something went wrong. Please try again.");
      console.error(error);
    }
  };

  return (
    <Box
  sx={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh", // Full viewport height
    width: "100%",
    background: "rgba(0,0,0,0.8)", // Optional background for the viewport
  }}
>
  <Box
    sx={{
      width: "100%",
      maxWidth: "400px",
      padding: "2rem",
      borderRadius: "12px",
      background: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))",
      boxShadow: "0px 8px 20px rgba(0, 0, 0, 0.3)",
      backdropFilter: "blur(15px)",
      color: "white",
      textAlign: "center",
      transition: "all 0.3s ease-in-out",
      "&:hover": {
        boxShadow: "0px 12px 25px rgba(0, 0, 0, 0.5)",
        transform: "scale(1.03)",
      },
    }}
  >
      <form onSubmit={handleSubmit}>
        <Typography
          variant="h4"
          sx={{
            marginBottom: "1rem",
            fontWeight: "bold",
            textTransform: "uppercase",
            letterSpacing: "2px",
          }}
        >
          Send OTP
        </Typography>
        <Typography
          variant="body1"
          sx={{
            marginBottom: "1.5rem",
            color: "rgba(255, 255, 255, 0.8)",
            fontSize: "0.9rem",
          }}
        >
          Enter your email to receive a one-time password
        </Typography>
        <Box
          sx={{
            position: "relative",
            marginBottom: "1rem",
          }}
        >
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
            style={{
              width: "100%",
              padding: "0.75rem 2.5rem",
              fontSize: "1rem",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.3)",
              background: "rgba(0,0,0,0.5)",
              color: "white",
              outline: "none",
              transition: "all 0.3s ease",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#ffffff")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.3)")}
          />
          <svg
            style={{
              position: "absolute",
              top: "50%",
              left: "10px",
              transform: "translateY(-50%)",
              width: "20px",
              height: "20px",
              fill: "rgba(255,255,255,0.6)",
            }}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 16"
          >
            <path d="m10.036 8.278 9.258-7.79A1.979 1.979 0 0 0 18 0H2A1.987 1.987 0 0 0 .641.541l9.395 7.737Z" />
            <path d="M11.241 9.817c-.36.275-.801.425-1.255.427-.428 0-.845-.138-1.187-.395L0 2.6V14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2.5l-8.759 7.317Z" />
          </svg>
        </Box>
        <Button
          type="submit"
          sx={{
            width: "100%",
            padding: "0.75rem",
            borderRadius: "8px",
            background: "linear-gradient(135deg, #4caf50, #81c784)",
            color: "white",
            fontWeight: "bold",
            fontSize: "1rem",
            textTransform: "none",
            transition: "all 0.3s ease",
            "&:hover": {
              background: "linear-gradient(135deg, #388e3c, #66bb6a)",
              boxShadow: "0px 5px 15px rgba(0,0,0,0.2)",
            },
          }}
          endIcon={<IoSendSharp />}
        >
          Send OTP
        </Button>
        {error && (
          <Typography
            variant="body2"
            sx={{ color: "red", marginTop: "1rem", fontWeight: "500" }}
          >
            {error}
          </Typography>
        )}
      </form>
      </Box>
    </Box>
  );
};

export default Sendotp;
