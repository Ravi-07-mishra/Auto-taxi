// DriverRegistrationForm.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDriverAuth } from "../Context/driverContext";
import { BiUserPlus } from "react-icons/bi";
import DriverGoogleSignInButton from "../Component/Drivergooglesigninbutton"; // adjust path as needed

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
    <div
      className="flex items-center justify-center min-h-screen px-4"
      style={{
        backgroundImage: "url('/bg1.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/50"></div>

      {/* Registration Form Container */}
      <div className="w-full max-w-3xl bg-white/5 backdrop-blur-lg rounded-xl shadow-lg p-8 relative z-10 border border-white/10">
        {/* Logo */}
        <h1 className="text-2xl md:text-3xl font-extrabold lowercase tracking-wider shadow-md flex justify-center items-center gap-2 mb-6">
          {["a", "u", "t", "o", "-", "d", "r", "i", "v", "e"].map(
            (letter, index) => (
              <span
                key={index}
                style={{ color: index % 2 === 0 ? "#cbe557" : "white" }}
              >
                {letter}
              </span>
            )
          )}
        </h1>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <h2 className="text-xl font-bold text-center text-white">Driver Registration</h2>

          {msg && (
            <div className="bg-red-100 text-red-700 border border-red-400 rounded p-3 text-sm">
              {msg}
            </div>
          )}

          {/* Grid Layout for Input Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[ 
              { name: "name", label: "Name", type: "text" },
              { name: "email", label: "Email", type: "email" },
              { name: "password", label: "Password", type: "password" },
              { name: "aadhaar_number", label: "Aadhaar Number", type: "text" },
              { name: "driving_license_number", label: "Driving License Number", type: "text" },
              { name: "vehicle_license_number", label: "Vehicle License Number", type: "text" },
              { name: "date_of_birth", label: "Date of Birth", type: "date" },
            ].map(({ name, label, type }) => (
              <div key={name} className="flex flex-col">
                <label className="block text-sm font-medium text-gray-200 mb-1" htmlFor={name}>
                  {label}
                </label>
                <input
                  id={name}
                  name={name}
                  type={type}
                  value={formData[name]}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#cbe557] text-white placeholder-gray-300"
                />
              </div>
            ))}
          </div>

          {/* File Upload */}
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Upload License Document
            </label>
            <input
              type="file"
              name="licenseDoc"
              onChange={handleFileChange}
              required
              className="block w-full text-sm text-gray-300 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#cbe557]"
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-col md:flex-row gap-4">
            <button
              type="button"
              onClick={getLocation}
              className="w-full md:w-auto py-2 px-4 bg-[#cbe557] text-gray-900 rounded-lg hover:bg-[#b8d93e] focus:ring-2 focus:ring-[#cbe557] transition-all"
            >
              Get My Location
            </button>
            <button
              type="submit"
              className="w-full md:w-auto py-2 px-4 flex items-center justify-center space-x-2 bg-[#cbe557] text-gray-900 rounded-lg hover:bg-[#b8d93e] focus:ring-2 focus:ring-[#cbe557] transition-all"
            >
              <BiUserPlus className="text-lg" />
              <span>Register</span>
            </button>
          </div>

          {/* Divider and Google Sign In Button */}
          <div className="mt-4">
            <hr className="border-gray-300" />
            <DriverGoogleSignInButton />
          </div>
        </form>
      </div>
    </div>
  );
};

export default DriverRegistrationForm;
