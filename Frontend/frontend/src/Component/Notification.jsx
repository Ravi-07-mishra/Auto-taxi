import React, { useState, useEffect } from "react";
import { Snackbar } from "@mui/material";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";

const Notification = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState(""); // success, info, error, etc.
  const navigate = useNavigate();

  useEffect(() => {
    const socket = io("http://localhost:3000"); // Connect to the server

    socket.on("newNotification", (data) => {
      setMessage(data.message);
      setType(data.type);
      setOpen(true);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleClose = () => {
    setOpen(false);
  };

  const handleAction = () => {
    // Handle action on notification click (optional, e.g., navigate to booking page)
    navigate("/booking-details"); // Example of navigating to a booking details page
    setOpen(false);
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={handleClose}
      message={message}
      action={
        <button onClick={handleAction} className="text-white">
          View
        </button>
      }
      style={{
        backgroundColor: type === "success" ? "green" : type === "info" ? "blue" : "red",
      }}
    />
  );
};

export default Notification;
