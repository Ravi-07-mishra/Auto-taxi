import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDriverAuth } from "../Context/driverContext";
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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 px-4">
      <div className="w-full max-w-lg bg-white shadow-lg rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <h2 className="text-2xl font-bold text-center text-gray-800">Driver Registration</h2>

          {msg && (
            <div className="bg-red-100 text-red-700 border border-red-400 rounded p-3 text-sm">
              {msg}
            </div>
          )}

          {[ // Form fields mapping
            { name: "name", label: "Name", type: "text" },
            { name: "email", label: "Email", type: "email" },
            { name: "password", label: "Password", type: "password" },
            { name: "aadhaar_number", label: "Aadhaar Number", type: "text" },
            { name: "driving_license_number", label: "Driving License Number", type: "text" },
            { name: "vehicle_license_number", label: "Vehicle License Number", type: "text" },
            { name: "date_of_birth", label: "Date of Birth", type: "date" },
          ].map(({ name, label, type }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={name}>
                {label}
              </label>
              <input
                id={name}
                name={name}
                type={type}
                value={formData[name]}
                onChange={handleChange}
                required
                className="w-full px-3 py-2  border rounded focus:outline-none  text-sm font-medium text-gray-700  focus:ring focus:ring-blue-300"
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload License Document
            </label>
            <input
              type="file"
              name="licenseDoc"
              onChange={handleFileChange}
              required
              className="block w-full text-sm text-gray-600 border border-gray-300 rounded cursor-pointer focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={getLocation}
            className="w-full py-2 text-center bg-blue-500 text-white rounded hover:bg-blue-600 focus:ring focus:ring-blue-300"
          >
            Get My Location
          </button>

          <button
            type="submit"
            className="w-full py-2 flex items-center justify-center space-x-2 bg-green-500 text-white rounded hover:bg-green-600 focus:ring focus:ring-green-300"
          >
            <BiUserPlus className="text-lg" />
            <span>Register</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default DriverRegistrationForm;
