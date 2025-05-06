"use client"

import { useEffect, useState, useRef } from "react"
import React from "react"
import { useParams, useNavigate } from "react-router-dom"
import { MapContainer, TileLayer, Marker, Polyline, Tooltip } from "react-leaflet"
import { Button, TextField, Snackbar } from "@mui/material"
import L from "leaflet"
import io from "socket.io-client"
import axios from "axios"
import { useDriverAuth } from "../Context/driverContext"
import { Send, X, Play, CheckCircle, Clock, AlertCircle, Mic, AlertTriangle, Navigation } from "lucide-react"

const DrivePage = () => {
  const { bookingId } = useParams()
  const [pickupLocation, setPickupLocation] = useState(null)
  const [destinationLocation, setDestinationLocation] = useState(null)
  const [route, setRoute] = useState([])
  const [driverLocation, setDriverLocation] = useState(null)
  const [driverToDestinationRoute, setDriverToDestinationRoute] = useState([])
  const [eta, setEta] = useState(null)
  const [speed, setSpeed] = useState(null) // Added speed state
  const [loading, setLoading] = useState(true)
  const { driver } = useDriverAuth()
  const socketRef = useRef(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [rideEnded, setRideEnded] = useState(false)
  const mapRef = useRef(null) // Ref to hold the Leaflet map instance
  const [rideStatus, setRideStatus] = useState("accepted")
  const [rideStartTime, setRideStartTime] = useState(null)
  const [totalRideTime, setTotalRideTime] = useState(null)
  const [showRideInfo, setShowRideInfo] = useState(false)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [isChatOpen, setIsChatOpen] = useState(false)
  const chatContainerRef = useRef(null)
  const [isNearDestination, setIsNearDestination] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [progress, setProgress] = useState(0)
  const [nextLandmark, setNextLandmark] = useState("")
  const navigate = useNavigate()

  // Recenter the map on the driver's location
  const handleRecenter = () => {
    if (mapRef.current && driverLocation) {
      mapRef.current.setView([driverLocation.lat, driverLocation.lng], 14) // 14 is the zoom level
    } else {
      console.error("Map ref or driver location is not available")
    }
  }

  // Calculate distance between two points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371 // Radius of the earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c // Distance in km
  }

  // Calculate ETA and speed
  const calculateETAAndSpeed = (prevLocation, currentLocation, prevTime, currentTime) => {
    const distance = calculateDistance(prevLocation.lat, prevLocation.lng, currentLocation.lat, currentLocation.lng)
    const timeDifference = (currentTime - prevTime) / 3600 // Time difference in hours
    const currentSpeed = distance / timeDifference // Speed in km/h
    setSpeed(currentSpeed.toFixed(2))

    if (destinationLocation) {
      const remainingDistance = calculateDistance(currentLocation.lat, currentLocation.lng, destinationLocation.lat, destinationLocation.lng)
      const etaHours = remainingDistance / currentSpeed
      setEta(etaHours.toFixed(2))
    }
  }

  // Calculate ride progress
  useEffect(() => {
    if (driverLocation && pickupLocation && destinationLocation) {
      const totalDistance = calculateDistance(pickupLocation.lat, pickupLocation.lng, destinationLocation.lat, destinationLocation.lng)
      const distanceCovered = calculateDistance(pickupLocation.lat, pickupLocation.lng, driverLocation.lat, driverLocation.lng)
      const progressPercentage = (distanceCovered / totalDistance) * 100
      setProgress(Math.min(progressPercentage, 100))
    }
  }, [driverLocation, pickupLocation, destinationLocation])

  // Speech recognition setup
  const recognitionRef = useRef(null)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = "en-US"

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setNewMessage(transcript)
        setIsListening(false)
      }

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error)
        setIsListening(false)
      }
    }
  }, [])

  const startListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  // Predefined quick replies
  const quickReplies = ["I'm on my way", "I've arrived", "Traffic delay", "Please wait"]

  // Emergency button handler
  const handleEmergency = () => {
    alert("Emergency alert sent to passenger and support team!")
    socketRef.current.emit("emergencyAlert", { bookingId, driverId: driver._id })
  }

  // Original functionality (unchanged)
  const formatRideTime = (milliseconds) => {
    const seconds = Math.floor((milliseconds / 1000) % 60)
    const minutes = Math.floor((milliseconds / (1000 * 60)) % 60)
    const hours = Math.floor((milliseconds / (1000 * 60 * 60)) % 24)

    const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes
    const formattedHours = hours > 0 ? `${hours}:` : ""

    return `${formattedHours}${formattedMinutes}:${formattedSeconds}`
  }

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const { data } = await axios.get(`http://localhost:3000/api/driver/driver/${bookingId}`)
        console.log(data.booking.status)
        setPickupLocation(data.booking.pickupLocation)
        setDestinationLocation(data.booking.destinationLocation)
        setRideStatus(data.booking.status)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching booking details:", err.message)
        setLoading(false)
        alert("Failed to load booking details.")
      }
    }
    fetchBookingDetails()
  }, [bookingId])

  useEffect(() => {
    if (driverLocation && destinationLocation && rideStatus === "started") {
      const distance = calculateDistance(driverLocation.lat, driverLocation.lng, destinationLocation.lat, destinationLocation.lng)
      setIsNearDestination(distance <= 0.1)
    }
  }, [driverLocation, destinationLocation, rideStatus])

  const fetchRoute = async (start, end, setRouteCallback) => {
    try {
      const response = await axios.get(`http://localhost:3000/directions`, {
        params: {
          start: `${start.lng},${start.lat}`,
          end: `${end.lng},${end.lat}`,
        },
      })

      if (response.data.features && response.data.features.length > 0) {
        const routeData = response.data.features[0]

        if (routeData?.geometry?.coordinates) {
          setRouteCallback(routeData.geometry.coordinates)
          if (setRouteCallback === setRoute) {
            const duration = routeData.properties.segments[0].duration
            setEta((duration / 60).toFixed(2))
          }
        } else {
          console.error("Route data does not contain valid coordinates:", routeData)
          alert("Failed to fetch route data. Coordinates not found.")
        }
      } else {
        console.error("No valid route data found in response:", response.data)
        alert("Failed to fetch route data. No route found.")
      }
    } catch (error) {
      console.error("Error fetching route:", error.message)
      alert("Failed to fetch the route. Please try again.")
    } finally {
      setRouteLoading(false)
    }
  }

  useEffect(() => {
    if (pickupLocation && destinationLocation) {
      const intervalId = setInterval(() => {
        fetchRoute(
          { lat: pickupLocation.lat, lng: pickupLocation.lng },
          { lat: destinationLocation.lat, lng: destinationLocation.lng },
          setRoute,
        )
      }, 5000)

      return () => clearInterval(intervalId)
    }
  }, [pickupLocation, destinationLocation])

  useEffect(() => {
    if (driverLocation && destinationLocation) {
      fetchRoute(driverLocation, destinationLocation, setDriverToDestinationRoute)
    }
  }, [driverLocation, destinationLocation])

  const handleStartRide = () => {
    setRideStatus("started")
    setRideStartTime(Date.now())
  }

  const handleCompleteRide = async () => {
    try {
      const endTime = Date.now();
      const totalTime = endTime - rideStartTime;
      setTotalRideTime(totalTime);
  
      const response = await axios.patch(`http://localhost:3000/api/driver/end/${bookingId}`, {
        totalRideTime: totalTime,
      });
  
      setRideStatus("completed");
      setShowRideInfo(true);
  
      // Emit rideCompleted event with payment amount
      socketRef.current.emit("rideCompleted", {
        bookingId,
        paymentAmount: response.data.paymentAmount, // Use the payment amount from the response
      });
  
      toast.success("Ride completed successfully!");
    } catch (error) {
      console.error("Error completing the ride:", error);
      toast.error("Failed to complete the ride. Please try again.");
    }
  };
  const handleEndRide = async () => {
    try {
      const response = await axios.patch(`http://localhost:3000/api/driver/end/${bookingId}`)
      alert(response.data.message)
      setRideEnded(true)
    } catch (error) {
      console.error("Error ending the ride:", error.message)
      alert("Failed to end the ride. Please try again.")
    }
  }

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (!driver) return

    socketRef.current = io("http://localhost:3000", {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    const socket = socketRef.current

    let prevLocation = null
    let prevTime = null

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const currentLocation = { lat: latitude, lng: longitude }
        setDriverLocation(currentLocation)

        if (prevLocation && prevTime) {
          const currentTime = Date.now()
          calculateETAAndSpeed(prevLocation, currentLocation, prevTime, currentTime)
        }

        prevLocation = currentLocation
        prevTime = Date.now()

        socket.emit("driverLocation", {
          id: driver._id,
          lat: latitude,
          lng: longitude,
        })
      },
      (error) => {
        console.error("Geolocation error:", error.message)
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      },
    )

    socket.on("connect", () => {
      console.log("Connected to socket")
      socket.emit("joinRoom", bookingId)
    })

    socket.on("newMessage", (message) => {
      setMessages((prevMessages) => [...prevMessages, message])
    })

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId)
      socket.disconnect()
    }
  }, [driver, bookingId])

  const sendMessage = () => {
    if (newMessage.trim() === "") return

    const messageData = {
      bookingId,
      message: newMessage,
      senderId: driver._id,
      senderModel: "Driver",
      senderName: "Driver",
    }

    socketRef.current.emit("sendMessage", messageData)
    setNewMessage("")
  }

  if (rideEnded) {
    return <div className="text-center py-5 text-xl font-semibold text-green-600">Ride has ended successfully!</div>
  }

  if (loading) return <div className="text-center py-5 text-xl font-semibold text-gray-700">Loading booking details...</div>

  if (routeLoading) return <div className="text-center py-5 text-xl font-semibold text-gray-700">Loading route...</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 p-6">
      <div className="fixed top-0 left-0 w-full h-full z-0">
        <MapContainer
          center={driverLocation || { lat: pickupLocation?.lat, lng: pickupLocation?.lng }}
          zoom={14}
          whenCreated={(map) => {
            mapRef.current = map // Store the Leaflet map instance
          }}
          className="w-full h-full"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {pickupLocation && (
            <Marker position={pickupLocation}>
              <Tooltip>Pickup Location</Tooltip>
            </Marker>
          )}
          {destinationLocation && (
            <Marker position={destinationLocation}>
              <Tooltip>Destination</Tooltip>
            </Marker>
          )}
          {driverLocation && (
            <Marker
              position={driverLocation}
              icon={L.icon({ iconUrl: "path-to-driver-icon.png", iconSize: [30, 30] })}
            >
              <Tooltip>Driver's Location</Tooltip>
            </Marker>
          )}
          <Polyline positions={route.map(([lng, lat]) => ({ lat, lng }))} color="blue" weight={4} />
          <Polyline
            positions={driverToDestinationRoute.map(([lng, lat]) => ({ lat, lng }))}
            color="green"
            weight={4}
          />
        </MapContainer>
      </div>

      {/* Recenter Button */}
      <button
        onClick={handleRecenter}
        className="fixed bottom-32 right-4 bg-white bg-opacity-90 p-3 rounded-full shadow-lg hover:bg-gray-100 transition-all z-50"
      >
        <Navigation size={24} className="text-gray-800" />
      </button>

      {/* Ride Progress Bar */}
      <div className="fixed top-4 left-4 right-4 bg-white bg-opacity-90 p-3 rounded-lg shadow-lg z-50">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-sm mt-2 text-black">Next: {nextLandmark || "Main Street"}</p>
        <p className="text-sm mt-2 text-black">ETA: {eta ? `${eta} hours` : "Calculating..."}</p>
        <p className="text-sm mt-2 text-black">Speed: {speed ? `${speed} km/h` : "Calculating..."}</p>
      </div>

      {/* Emergency Button */}
      <button
        onClick={handleEmergency}
        className="fixed bottom-20 right-4 bg-red-500 text-white p-4 rounded-full shadow-lg hover:bg-red-600 transition-all z-50"
      >
        <AlertTriangle size={24} />
      </button>

      {/* Chat Window */}
      {isChatOpen && (
        <div className="fixed bottom-20 right-4 w-80 h-96 bg-white rounded-lg shadow-xl flex flex-col z-50">
          <div className="bg-blue-500 text-white p-4 rounded-t-lg">
            <h2 className="text-lg font-semibold">Chat with Passenger</h2>
          </div>
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`max-w-[70%] ${msg.senderModel === "Driver" ? "ml-auto" : "mr-auto"}`}>
                <div
                  className={`p-3 rounded-lg ${
                    msg.senderModel === "Driver" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {msg.text}
                </div>
                <p className="text-xs text-gray-500 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</p>
              </div>
            ))}
          </div>
          <div className="p-4 border-t">
            <div className="flex items-center">
              <TextField
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                variant="outlined"
                size="small"
                className="flex-1"
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              />
              <Button onClick={startListening} disabled={isListening} className="ml-2">
                <Mic size={20} />
              </Button>
              <Button variant="contained" color="primary" onClick={sendMessage} className="ml-2">
                <Send size={20} />
              </Button>
            </div>
            <div className="mt-2 flex space-x-2">
              {quickReplies.map((reply, index) => (
                <Button
                  key={index}
                  variant="outlined"
                  size="small"
                  onClick={() => setNewMessage(reply)}
                >
                  {reply}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Chat Toggle Button */}
      <button
  onClick={() => setIsChatOpen(!isChatOpen)}
  className="fixed bottom-4 right-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all z-50"
  style={{
    opacity: 1, // Ensure the button is visible
    visibility: "visible", // Ensure the button is visible
    zIndex: 1000, // Ensure the button is on top
    pointerEvents: "auto", // Enable pointer events
  }}
  disabled={false} // Ensure the button is not disabled
>
  {isChatOpen ? <X size={24} /> : <Send size={24} />}
</button>
      {/* Original Buttons Section */}
      <div className="fixed bottom-4 left-4 right-4 flex justify-center space-x-4 z-50">
        {rideStatus === 'Accepted' && (
          <button
            onClick={handleStartRide}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all flex items-center shadow-lg"
          >
            <Play size={20} className="mr-2" /> Start Ride
          </button>
        )}
        {rideStatus === "started" && (
          <button
            onClick={handleCompleteRide}
            className={`px-6 py-3 rounded-lg ${
              isNearDestination
                ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                : "bg-gray-400 cursor-not-allowed"
            } text-white transition-all flex items-center shadow-lg`}
            disabled={!isNearDestination}
          >
            <CheckCircle size={20} className="mr-2" /> Complete Ride
          </button>
        )}
        {rideStatus === "completed" && (
          <button
            onClick={handleEndRide}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all shadow-lg"
          >
            End Ride
          </button>
        )}
      </div>
    </div>
  )
}

export default DrivePage
