// Signup.jsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../Context/userContext";
import {
  Box,
  Button,
  Typography,
  TextField,
  CircularProgress,
  InputAdornment,
  Alert
} from "@mui/material";
import Divider from '@mui/material/Divider';

import { RiUser3Line, RiMailLine, RiLockLine } from "react-icons/ri";
import GoogleSignInButton from "../Component/Googlesigninbutton";

const Signup = () => {
  const { signup } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await signup(name, email, password); // Removed OTP parameter
      navigate("/userhome");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
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
      {/* Signup Card */}
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          width: "100%",
          maxWidth: "500px",
          padding: { xs: 3, sm: 4 },
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
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              mb: 1,
              color: "#f1f5f9",
              letterSpacing: "-0.5px",
            }}
          >
            CREATE ACCOUNT
          </Typography>
          <Typography sx={{ color: "#94a3b8", maxWidth: "300px", margin: "0 auto" }}>
            Join our platform to get started
          </Typography>
        </Box>

        {error && (
          <Alert
            severity="error"
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
            {error}
          </Alert>
        )}

        <Box mb={3}>
          <Typography variant="subtitle2" sx={{ color: "#94a3b8", mb: 1, fontWeight: 500 }}>
            FULL NAME
          </Typography>
          <TextField
            fullWidth
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <RiUser3Line color="#94a3b8" size={20} />
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

        <Box mb={3}>
          <Typography variant="subtitle2" sx={{ color: "#94a3b8", mb: 1, fontWeight: 500 }}>
            EMAIL ADDRESS
          </Typography>
          <TextField
            type="email"
            fullWidth
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <RiMailLine color="#94a3b8" size={20} />
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

        <Box mb={4}> {/* Removed OTP section */}
          <Typography variant="subtitle2" sx={{ color: "#94a3b8", mb: 1, fontWeight: 500 }}>
            PASSWORD
          </Typography>
          <TextField
            type="password"
            fullWidth
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <RiLockLine color="#94a3b8" size={20} />
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
          disabled={isLoading}
        >
          {isLoading ? <CircularProgress size={24} color="inherit" /> : "CREATE ACCOUNT"}
        </Button>

        <Divider sx={{ my: 3, backgroundColor: "rgba(148, 163, 184, 0.2)" }}>
          <Typography variant="body2" sx={{ color: "#94a3b8", px: 2, fontWeight: 500 }}>
            OR CONTINUE WITH
          </Typography>
        </Divider>

        <Box sx={{ mt: 3, mb: 2 }}>
          <GoogleSignInButton />
        </Box>

        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 500 }}>
            Already have an account?{" "}
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
              onClick={() => navigate("/userlogin")}
            >
              Sign in here
            </Button>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Signup;