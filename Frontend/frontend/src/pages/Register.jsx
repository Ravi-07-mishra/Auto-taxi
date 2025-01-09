import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDriverAuth } from "../Context/driverContext";
import { Box, Button, Typography, TextField, Alert } from "@mui/material";
import { BiUserPlus } from "react-icons/bi";

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
  const { signup } = useDriverAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, licenseDoc: e.target.files[0] });
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error(error);
          setMsg("Unable to fetch location.");
        }
      );
    } else {
      setMsg("Geolocation is not supported by this browser.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const form = new FormData();
    Object.keys(formData).forEach((key) => {
      form.append(key, formData[key]);
    });

    try {
      await signup(formData);
      setMsg("Registration successful!");
      navigate("/driverdashboard");
    } catch (error) {
      setMsg(error.message);
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        height: "calc(100vh - 64px)", // Adjust height for navbar (e.g., 64px)
        marginTop: "64px", // Space for navbar
        padding: "1rem",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: "400px",
          height: "100%",
          overflowY: "auto", // Scrollable for small screens
          padding: "1rem",
          borderRadius: "10px",
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(10px)",
          color: "white",
        }}
      >
        <form onSubmit={handleSubmit}>
          <Typography variant="h5" textAlign="center" mb={2}>
            Driver Registration
          </Typography>

          {msg && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {msg}
            </Alert>
          )}

          {[
            { name: "name", label: "Name", type: "text" },
            { name: "email", label: "Email", type: "email" },
            { name: "password", label: "Password", type: "password" },
            { name: "aadhaar_number", label: "Aadhaar Number", type: "text" },
            { name: "driving_license_number", label: "Driving License Number", type: "text" },
            { name: "vehicle_license_number", label: "Vehicle License Number", type: "text" },
            { name: "date_of_birth", label: "Date of Birth", type: "date", shrink: true },
          ].map(({ name, label, type, shrink }) => (
            <TextField
              key={name}
              type={type}
              name={name}
              label={label}
              fullWidth
              variant="outlined"
              value={formData[name]}
              onChange={handleChange}
              required
              InputLabelProps={shrink ? { shrink: true } : undefined}
              sx={{
                mb: 2,
                "& .MuiInputBase-input": { color: "white" },
                "& .MuiInputLabel-root": { color: "white" },
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "white" },
                  "&:hover fieldset": { borderColor: "#00fffc" },
                  "&.Mui-focused fieldset": { borderColor: "#00fffc" },
                },
              }}
            />
          ))}

          <Typography variant="body1" mb={1}>
            Upload License Document
          </Typography>
          <input
            type="file"
            name="licenseDoc"
            onChange={handleFileChange}
            required
            style={{ marginBottom: "16px", color: "white" }}
          />

          <Button
            type="button"
            onClick={getLocation}
            fullWidth
            sx={{
              py: 1.5,
              mb: 3,
              borderRadius: 2,
              bgcolor: "#00fffc",
              color: "#000",
              ":hover": {
                bgcolor: "white",
                color: "black",
              },
            }}
          >
            Get My Location
          </Button>

          <Button
            type="submit"
            fullWidth
            sx={{
              py: 1.5,
              mt: 2,
              borderRadius: 2,
              bgcolor: "#00fffc",
              color: "#000",
              ":hover": {
                bgcolor: "white",
                color: "black",
              },
            }}
            endIcon={<BiUserPlus />}
          >
            Register
          </Button>
        </form>
      </Box>
    </Box>
  );
};

export default DriverRegistrationForm;
