import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDriverAuth } from "../Context/driverContext";
import { BiUserPlus } from "react-icons/bi";
import DriverGoogleSignInButton from "../Component/Drivergooglesigninbutton";
import toast from "react-hot-toast";
import { Box, Button, Typography, TextField, CircularProgress, InputAdornment } from "@mui/material";
import { MdOutlineDriveFileRenameOutline, MdEmail, MdPassword, 
         MdCreditCard, MdDirectionsCar, MdCalendarToday, 
         MdCloudUpload, MdLocationOn } from "react-icons/md";

const DriverRegistrationForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    aadhaar_number: "",
    driving_license_number: "",
    vehicle_license_number: "",
    date_of_birth: "",
    password: "",
    licenseDoc: null,
    lat: null,
    lng: null,
  });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup } = useDriverAuth();
  const navigate = useNavigate();
  const isMounted = useRef(true);

  const API_BASE = import.meta.env.VITE_API_URL;
  if (!API_BASE) console.error("VITE_API_URL is not defined.");

  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, licenseDoc: e.target.files[0] }));
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setMsg("Geolocation not supported by this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!isMounted.current) return;
        setFormData((prev) => ({
          ...prev,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }));
        toast.success("Location captured successfully!");
      },
      (error) => {
        if (!isMounted.current) return;
        console.error(error);
        setMsg("Unable to fetch location.");
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value != null) payload.append(key, value);
      });
      await signup(payload);
      toast.success("Registration successful!");
      if (isMounted.current) navigate("/driverdashboard");
    } catch (error) {
      if (!isMounted.current) return;
      setMsg(error.message || "Registration failed. Please try again.");
      toast.error(error.message || "Registration failed.");
    } finally {
      if (isMounted.current) setLoading(false);
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
      {/* Registration Card */}
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          width: "100%",
          maxWidth: "800px",
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
            DRIVER REGISTRATION
          </Typography>
          <Typography sx={{ color: "#94a3b8", maxWidth: "500px", margin: "0 auto" }}>
            Create your account to start driving with us
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

        <Box sx={{ display: "grid", gridTemplateColumns: { md: "1fr 1fr" }, gap: 3 }}>
          {/* Left Column */}
          <Box>
            {/* Personal Information */}
            <Typography variant="subtitle1" sx={{ color: "#cbe557", mb: 2, fontWeight: 600 }}>
              Personal Information
            </Typography>
            
            <Box mb={3}>
              <TextField
                name="name"
                fullWidth
                variant="outlined"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MdOutlineDriveFileRenameOutline color="#94a3b8" size={20} />
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
              <TextField
                type="email"
                name="email"
                fullWidth
                variant="outlined"
                placeholder="Email address"
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
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MdPassword color="#94a3b8" size={20} />
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
              <TextField
                type="date"
                name="date_of_birth"
                fullWidth
                variant="outlined"
                placeholder="Date of Birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MdCalendarToday color="#94a3b8" size={20} />
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: "10px",
                    background: "rgba(30, 41, 59, 0.5)",
                    "& input": { 
                      color: formData.date_of_birth ? "#f1f5f9" : "#94a3b8", 
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
          </Box>
          
          {/* Right Column */}
          <Box>
            {/* License Information */}
            <Typography variant="subtitle1" sx={{ color: "#cbe557", mb: 2, fontWeight: 600 }}>
              License & Vehicle
            </Typography>
            
            <Box mb={3}>
              <TextField
                name="aadhaar_number"
                fullWidth
                variant="outlined"
                placeholder="Aadhaar Number"
                value={formData.aadhaar_number}
                onChange={handleChange}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MdCreditCard color="#94a3b8" size={20} />
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
              <TextField
                name="driving_license_number"
                fullWidth
                variant="outlined"
                placeholder="Driving License Number"
                value={formData.driving_license_number}
                onChange={handleChange}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MdCreditCard color="#94a3b8" size={20} />
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
              <TextField
                name="vehicle_license_number"
                fullWidth
                variant="outlined"
                placeholder="Vehicle License Number"
                value={formData.vehicle_license_number}
                onChange={handleChange}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MdDirectionsCar color="#94a3b8" size={20} />
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
              <Typography variant="body2" sx={{ color: "#94a3b8", mb: 1 }}>
                Upload License Document
              </Typography>
              <Button
                component="label"
                variant="outlined"
                fullWidth
                startIcon={<MdCloudUpload />}
                sx={{
                  py: 1.5,
                  borderRadius: "10px",
                  borderColor: "rgba(148, 163, 184, 0.3)",
                  color: "#f1f5f9",
                  textTransform: "none",
                  justifyContent: "flex-start",
                  "&:hover": {
                    borderColor: "#cbe557",
                    backgroundColor: "rgba(203, 229, 87, 0.1)",
                  },
                }}
              >
                {formData.licenseDoc ? formData.licenseDoc.name : "Select file"}
                <input
                  type="file"
                  name="licenseDoc"
                  onChange={handleFileChange}
                  required
                  hidden
                />
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Location & Submit */}
        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, mt: 3 }}>
          <Button
            type="button"
            onClick={getLocation}
            startIcon={<MdLocationOn />}
            sx={{
              py: 1.8,
              borderRadius: "10px",
              background: "rgba(30, 41, 59, 0.8)",
              color: "#f1f5f9",
              fontWeight: 500,
              flex: { xs: 1, sm: 0.5 },
              "&:hover": {
                background: "rgba(59, 130, 246, 0.2)",
                border: "1px solid rgba(59, 130, 246, 0.5)",
              },
            }}
          >
            Get My Location
          </Button>
          
          <Button
            type="submit"
            disabled={loading}
            startIcon={<BiUserPlus />}
            sx={{
              py: 1.8,
              borderRadius: "10px",
              background: "linear-gradient(90deg, #cbe557 0%, #3b82f6 100%)",
              color: "#0f172a",
              fontWeight: 600,
              flex: { xs: 1, sm: 0.5 },
              "&:hover": {
                background: "linear-gradient(90deg, #b8d93e 0%, #2563eb 100%)",
              },
              "&:disabled": {
                background: "#334155",
                color: "#94a3b8",
              },
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Register Now"}
          </Button>
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
              onClick={() => navigate("/driverlogin")}
            >
              Sign in here
            </Button>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default DriverRegistrationForm;