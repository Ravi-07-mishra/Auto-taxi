// DriverGoogleSignInButton.jsx
import React from "react";
import { Button } from "@mui/material";
import { SiGoogle } from "react-icons/si";

const DriverGoogleSignInButton = () => {
  const handleGoogleSignIn = () => {
    // Redirect to Google OAuth authentication route
    window.location.href = "http://localhost:3000/api/driver/auth/google";
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

export default DriverGoogleSignInButton;
