import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/userContext";
import {
  Box,
  Button,
  Typography,
  TextField,
  Alert,
  Divider,
  useMediaQuery,
  useTheme,
  CircularProgress,
} from "@mui/material";
import { RiLoginCircleFill } from "react-icons/ri";
import { keyframes } from "@emotion/react";
import GoogleSignInButton from "../Component/Googlesigninbutton";

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
  100% { transform: translateY(0px); }
`;

/**
 * LoginPage
 *
 * - Handles email/password login via `login` from userContext.
 * - Displays errors, shows spinner when logging in.
 * - Provides Google Sign-In button.
 */
const LoginPage = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await login(email, password);
      if (response?.user) {
        navigate("/userhome");
      } else {
        setError(response.data?.msg || "Unexpected error occurred.");
      }
    } catch (err) {
      setError(err.response?.data?.msg || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: "url('/bg1.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
        p: isMobile ? 2 : 4,
      }}
    >
      {/* Dark translucent overlay */}
      <Box sx={{ position: "absolute", inset: 0, backgroundColor: "rgba(0, 0, 0, 0.6)" }} />

      {/* Login Form Container */}
      <Box
        component="form"
        onSubmit={handleLogin}
        sx={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: isMobile ? "95%" : "400px",
          p: isMobile ? 3 : 4,
          borderRadius: 3,
          background: "rgba(255, 255, 255, 0.15)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          border: "1px solid rgba(255, 255, 255, 0.25)",
          animation: `${float} 3s ease-in-out infinite`,
          textAlign: "center",
        }}
      >
        {/* App Name */}
        <Typography
          variant={isMobile ? "h5" : "h4"}
          sx={{
            fontWeight: "bold",
            mb: 3,
            textShadow: "0 2px 4px rgba(0, 0, 0, 0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 0.5,
            flexWrap: "wrap",
          }}
        >
          {Array.from("auto-drive").map((letter, index) => (
            <span key={index} style={{ color: index % 2 === 0 ? "#cbe557" : "#fff" }}>
              {letter}
            </span>
          ))}
        </Typography>

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              backgroundColor: "rgba(255, 0, 0, 0.15)",
              border: "1px solid rgba(255, 0, 0, 0.3)",
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
            input: { color: "#fff" },
            label: { color: "rgba(255,255,255,0.8)" },
            "& .MuiOutlinedInput-root": {
              "& fieldset": { borderColor: "rgba(255,255,255,0.4)" },
              "&:hover fieldset": { borderColor: "#cbe557" },
              "&.Mui-focused fieldset": { borderColor: "#cbe557" },
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
            input: { color: "#fff" },
            label: { color: "rgba(255,255,255,0.8)" },
            "& .MuiOutlinedInput-root": {
              "& fieldset": { borderColor: "rgba(255,255,255,0.4)" },
              "&:hover fieldset": { borderColor: "#cbe557" },
              "&.Mui-focused fieldset": { borderColor: "#cbe557" },
            },
          }}
        />

        {/* Login Button */}
        <Button
          type="submit"
          fullWidth
          variant="contained"
          endIcon={<RiLoginCircleFill />}
          disabled={loading}
          sx={{
            py: 1.5,
            mb: 2,
            borderRadius: 2,
            background: "linear-gradient(45deg, #cbe557, #b8d93e)",
            color: "#000",
            fontWeight: "bold",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
            textTransform: "none",
            transition: "transform 0.2s, box-shadow 0.2s",
            "&:hover": {
              transform: "scale(1.03)",
              boxShadow: "0 6px 8px rgba(0, 0, 0, 0.4)",
              background: "linear-gradient(45deg, #b8d93e, #cbe557)",
            },
          }}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : "Login"}
        </Button>

        <Divider sx={{ my: 2, color: "rgba(255,255,255,0.7)" }}>OR</Divider>

        {/* Google Sign In Button */}
        <GoogleSignInButton />
      </Box>
    </Box>
  );
};

export default LoginPage;