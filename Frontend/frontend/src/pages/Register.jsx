import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDriverAuth } from "../Context/driverContext";
import { BiUserPlus } from "react-icons/bi";
import DriverGoogleSignInButton from "../Component/Drivergooglesigninbutton";
import toast from "react-hot-toast";

/**
 * DriverRegistrationForm
 *
 * - Collects driver details, including name, email, IDs, date of birth, password.
 * - Fetches geolocation on demand.
 * - Uploads license document and submits via signup from driverContext.
 */
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
    <div className="flex items-center justify-center min-h-screen px-4" style={{ backgroundImage: "url('/bg1.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}>
      <div className="absolute inset-0 bg-black/50"></div>
      <div className="w-full max-w-3xl bg-white/5 backdrop-blur-lg rounded-xl shadow-lg p-8 relative z-10 border border-white/10">
        <h1 className="text-3xl font-extrabold lowercase tracking-wider flex justify-center items-center gap-2 mb-6">
          {Array.from("auto-drive").map((letter, i) => (
            <span key={i} style={{ color: i % 2 === 0 ? "#cbe557" : "white" }}>{letter}</span>
          ))}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <h2 className="text-xl font-bold text-center text-white">Driver Registration</h2>
          {msg && <div className="bg-red-100 text-red-700 border border-red-400 rounded p-3 text-sm">{msg}</div>}
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
                <label htmlFor={name} className="text-gray-200 mb-1 text-sm font-medium">{label}</label>
                <input
                  id={name}
                  name={name}
                  type={type}
                  value={formData[name]}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#cbe557]"
                />
              </div>
            ))}
          </div>
          <div className="flex flex-col">
            <label className="text-gray-200 mb-1 text-sm font-medium">Upload License Document</label>
            <input
              type="file"
              name="licenseDoc"
              onChange={handleFileChange}
              required
              className="block w-full text-gray-300 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#cbe557]"
            />
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <button
              type="button"
              onClick={getLocation}
              className="w-full md:w-auto py-2 px-4 bg-[#cbe557] text-gray-900 rounded-lg hover:bg-[#b8d93e] focus:ring-2 focus:ring-[#cbe557] transition"
            >Get My Location</button>
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto py-2 px-4 flex items-center justify-center gap-2 bg-[#cbe557] text-gray-900 rounded-lg hover:bg-[#b8d93e] focus:ring-2 focus:ring-[#cbe557] transition"
            >
              <BiUserPlus className="text-lg" />
              <span>{loading ? "Registering..." : "Register"}</span>
            </button>
          </div>
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