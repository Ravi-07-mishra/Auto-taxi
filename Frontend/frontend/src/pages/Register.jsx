import React, { useState } from "react";
import { useDriverAuthContext } from "../hooks/usedriverauthContext";
import '../Css/DriverRegistration.css'
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
        lat: null,   // Add latitude and longitude in state
        lng: null,
    });
    const [msg, setMsg] = useState("");
    const { dispatch } = useDriverAuthContext();

    // Function to handle form input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Function to handle file input
    const handleFileChange = (e) => {
        setFormData({ ...formData, licenseDoc: e.target.files[0] });
    };

    // Function to get the user's geolocation
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

    // Function to handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        const form = new FormData();
        form.append("name", formData.name);
        form.append("email", formData.email);
        form.append("password", formData.password);
        form.append("aadhaar_number", formData.aadhaar_number);
        form.append("driving_license_number", formData.driving_license_number);
        form.append("vehicle_license_number", formData.vehicle_license_number);
        form.append("date_of_birth", formData.date_of_birth);
        form.append("licenseDoc", formData.licenseDoc);
        form.append("lat", formData.lat);
        form.append("lng", formData.lng);

        try {
            const response = await fetch("http://localhost:3000/api/driver/register", {
                method: 'POST',
                body: form,
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.msg || "Failed to register driver");
            }

            const json = await response.json();
            localStorage.setItem('driver', JSON.stringify(json));
            dispatch({ type: 'LOGIN', payload: json });
            setMsg(json.msg);
        } catch (error) {
            setMsg(error.message);
        }
    };

    return (
        <div className="container">
            <h2>Driver Registration</h2>
            <form onSubmit={handleSubmit}>
                <input type="text" name="name" placeholder="Name" onChange={handleChange} required />
                <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
                <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
                <input type="text" name="aadhaar_number" placeholder="Aadhaar Number" onChange={handleChange} required />
                <input type="text" name="driving_license_number" placeholder="Driving License Number" onChange={handleChange} required />
                <input type="text" name="vehicle_license_number" placeholder="Vehicle License Number" onChange={handleChange} required />
                <input type="date" name="date_of_birth" placeholder="Date of Birth" onChange={handleChange} required />
                <input type="file" name="licenseDoc" onChange={handleFileChange} required />
                <button type="button" onClick={getLocation}>Get My Location</button>
                <button type="submit">Register</button>
            </form>
            {msg && <p className="error">{msg}</p>}
        </div>
    );
};

export default DriverRegistrationForm;
