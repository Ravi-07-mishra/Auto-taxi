// GoogleSignInButton.jsx
import React from "react";
import { Button } from "@mui/material";
import { SiGoogle } from "react-icons/si";

const GoogleSignInButton = () => {
  // ─── Backend Base URL ───────────────────────────────────────────
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const handleGoogleSignIn = () => {
    // Redirect to Google OAuth authentication route
        console.log("Google OAuth Redirect to:", `${API_BASE}/user/auth/google`);
  window.location.href = "https://auto-taxi-1.onrender.com/api/user/auth/google";



  };

  return (
    <Button
      onClick={handleGoogleSignIn}
      variant="contained"
      startIcon={<SiGoogle size={22} />}
      sx={{
        mt: 1,
        backgroundColor: "#fff",
        color: "#444",
        fontWeight: "bold",
        textTransform: "none",
        borderRadius: 2,
        boxShadow: "0 3px 6px rgba(0,0,0,0.16)",
        "&:hover": {
          backgroundColor: "#f1f1f1",
        },
      }}
    >
      Sign in with Google
    </Button>
  );
};

export default GoogleSignInButton;
