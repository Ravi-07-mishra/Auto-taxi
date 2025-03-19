import React from "react";
import { Button } from "@mui/material";

const GoogleSignInButton = () => {
  const handleGoogleSignIn = () => {
    // Update the URL to match your mounted route
    
    console.log("Redirecting to Google OAuth...");
    window.location.href = "http://localhost:3000/api/user/auth/google";
  };

  return (
    <Button 
      onClick={handleGoogleSignIn}
      variant="contained"
      color="primary"
      sx={{
        mt: 2,
        backgroundColor: "#4285F4",
        "&:hover": { backgroundColor: "#357ae8" },
      }}
    >
      Sign in with Google
    </Button>
  );
};

export default GoogleSignInButton;
