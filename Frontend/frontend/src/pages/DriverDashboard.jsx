import React, { useEffect, useState, useRef } from "react"
import io from "socket.io-client"
import { useDriverAuth } from "../Context/driverContext"
import { useNavigate } from "react-router-dom"
import { Button } from "@mui/material"
import "../Css/DriverDashboard.css"
import { useSubscription } from "../Context/SubscriptionContext"

const DriverDashboard = () => {
  const [driverId, setDriverId] = useState("")
  const [bookingRequests, setBookingRequests] = useState([])
  const { subscription } = useSubscription()

  const [bookings, setBookings] = useState([])

  const { driver, dispatch } = useDriverAuth()
  const socketRef = useRef(null)
  const navigate = useNavigate()
  const isSubscriptionValid = subscription.isSubscribed && new Date(subscription.expiryDate) > new Date()

  // Redirect to login if not authenticated
  useEffect(() => {
    const timeout = setTimeout(() => {
      // Redirect to login if not authenticated
      if (!driver) {
        navigate("/driverlogin")
      } else {
        setDriverId(driver._id)
        console.log("Driver ID set to:", driver._id)
      }
    }, 1000) // Wait for 5 seconds (5000 milliseconds)

    return () => clearTimeout(timeout) // Cleanup the timeout on component unmount
  }, [driver, navigate])

  useEffect(() => {
    if (!driverId || !isSubscriptionValid) return

    const fetchBookings = async () => {
      try {
        const response = await fetch(`/api/driver/${driverId}`)
        const json = await response.json()
        setBookings(json.bookings || [])
      } catch (error) {
        console.error("Error fetching bookings:", error)
      }
    }

    fetchBookings()
  }, [driverId, isSubscriptionValid])

  useEffect(() => {
    if (!driverId) return

    socketRef.current = io("http://localhost:3000", {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    const socket = socketRef.current

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id)
    })

    socket.on("BookingRequest", (data) => {
      console.log("Received booking request:", data)
      if (data.driverId === driverId) {
        setBookingRequests((prev) => [...prev, data])
      }
    })
    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error)
    })

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason)
    })
    socket.on("paymentcompleted", (bookingId) => {
      console.log("Payment completed for bookingId:", bookingId)

      // Navigate to the drive page with the bookingId
      navigate(`/driver/drive/${bookingId}`)
    })
    socket.on("reconnect_attempt", () => {
      console.log("Reconnecting to socket...")
    })
    const updateDriverLocation = () => {
      if (driver && driver.location && driver.location.lat && driver.location.lng) {
        socket.emit("driverLocation", {
          id: driverId,
          lat: driver.location.lat,
          lng: driver.location.lng,
        })
      } else {
        // Fallback location
        socket.emit("driverLocation", {
          id: driverId,
          lat: 20.2960587, // Default latitude
          lng: 85.8245398, // Default longitude
        })
      }
    }

    updateDriverLocation()
    return () => {
      socket.off("BookingRequest")
      socket.disconnect()
      console.log("Socket disconnected on cleanup.")
    }
  }, [driverId, driver, navigate])

  const handleAccept = (bookingId) => {
    const socket = socketRef.current
    socket.emit("acceptBooking", { bookingId, price: 100 })
    setBookingRequests((prev) => prev.filter((b) => b.bookingId !== bookingId))
  }

  const handleDecline = (bookingId) => {
    const socket = socketRef.current
    socket.emit("declineBooking", { bookingId })
    setBookingRequests((prev) => prev.filter((b) => b.bookingId !== bookingId))
  }

  const toggleAvailability = async () => {
    if (!driver || !driver.user) return

    try {
      const response = await fetch("/api/driver/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverId: driver.user.id,
          isAvailable: !driver.isAvailable,
        }),
      })

      const data = await response.json()
      if (response.ok) {
        dispatch({ type: "UPDATE_AVAILABILITY", payload: data.driver })
      } else {
        console.error(data.msg)
      }
    } catch (error) {
      console.error("Error updating availability:", error)
    }
  }
  const openInbox = (bookingId) => {
    navigate(`/driver/inbox/${bookingId}`)
  }

  const logout = () => {
    localStorage.removeItem("driver")
    navigate("/login")
  }

  if (!isSubscriptionValid) {
    return (
      <div
        className="flex items-center justify-center h-screen bg-cover bg-center"
        style={{ backgroundImage: 'url("your-image.jpg")' }}
      >
        <div className="bg-white bg-opacity-50 p-8 rounded-lg shadow-xl w-full max-w-lg text-center">
          <h2 className="text-2xl font-bold text-gray-800">Your subscription is inactive or expired.</h2>
          <Button variant="contained" color="primary" onClick={() => navigate("/subscription")} className="mt-4">
            Renew Subscription
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed" style={{ backgroundImage: 'url("driverbg.jpg")' }}>
      {/* Hero Section */}
      <section className="h-screen flex items-center justify-center relative">
        <div className="text-center z-10">
          <h1 className="text-6xl font-bold text-white mb-4 tracking-tight">Driver Dashboard</h1>
          <p className="text-xl text-gray-300">Welcome back, {driver?.name}</p>
          <div className="mt-8 animate-bounce">
            <p className="text-gray-400">Scroll to view bookings</p>
            <div className="mt-2">
              <svg className="w-6 h-6 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-70" />
      </section>

      {/* Booking Requests Section */}
      <section className="py-20 bg-black bg-opacity-80">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">New Booking Requests</h2>
          <div className="overflow-x-auto pb-6">
            <div className="flex space-x-6 snap-x snap-mandatory">
              {bookingRequests.map((req) => (
                <div key={req.bookingId} className="w-[calc(33.33%-1rem)] flex-shrink-0 snap-start">
                  <div className="bg-indigo-900 rounded-xl overflow-hidden shadow-2xl border border-indigo-700 transition-all duration-300 hover:shadow-indigo-500/50 hover:scale-105">
                    <div className="p-6">
                      {/* User Info */}
                      <div className="flex items-center mb-6">
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-500">
                          <img
                            src={req.userImage || "/placeholder.svg?height=64&width=64"}
                            alt="User"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-white font-semibold text-lg">{req.userName || "New Request"}</h3>
                          <span className="text-indigo-300 text-sm">Pending Confirmation</span>
                        </div>
                      </div>

                      {/* Booking Details */}
                      <div className="space-y-4 mb-6">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-green-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 10l7-7m0 0l7 7m-7-7v18"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="text-indigo-200 text-sm">Pickup Location</p>
                            <p className="text-white">
                              {req.pickupLocation.address || `${req.pickupLocation.lat}, ${req.pickupLocation.lng}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                            <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 14l-7 7m0 0l-7-7m7 7V3"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="text-indigo-200 text-sm">Destination</p>
                            <p className="text-white">
                              {req.destinationLocation.address ||
                                `${req.destinationLocation.lat}, ${req.destinationLocation.lng}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-yellow-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="text-indigo-200 text-sm">Estimated Price</p>
                            <p className="text-white">${req.estimatedPrice || "100"}</p>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-4">
                        <button
                          onClick={() => handleAccept(req.bookingId)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors duration-300"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleDecline(req.bookingId)}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors duration-300"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Active Bookings Section */}
      <section className="py-20 bg-black bg-opacity-80">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">Your Active Bookings</h2>
          <div className="overflow-x-auto pb-6">
            <div className="flex space-x-6 snap-x snap-mandatory">
              {bookings.map((booking) => (
                <div key={booking._id} className="w-[calc(33.33%-1rem)] flex-shrink-0 snap-start">
                  <div className="bg-indigo-900 rounded-xl overflow-hidden shadow-2xl border border-indigo-700 transition-all duration-300 hover:shadow-indigo-500/50 hover:scale-105">
                    <div className="p-6">
                      {/* User Info */}
                      <div className="flex items-center mb-6">
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-500">
                          <img
                            src={booking.userImage || "/placeholder.svg?height=64&width=64"}
                            alt="User"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-white font-semibold text-lg">{booking.userName || "User"}</h3>
                          <span
                            className={`text-sm ${
                              booking.status === "completed"
                                ? "text-green-400"
                                : booking.status === "in-progress"
                                  ? "text-yellow-400"
                                  : "text-indigo-300"
                            }`}
                          >
                            {booking.status || "Active"}
                          </span>
                        </div>
                      </div>

                      {/* Booking Details */}
                      <div className="space-y-4 mb-6">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-green-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 10l7-7m0 0l7 7m-7-7v18"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="text-indigo-200 text-sm">Pickup Location</p>
                            <p className="text-white">{booking.pickupLocation?.address || "Address not available"}</p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                            <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 14l-7 7m0 0l-7-7m7 7V3"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="text-indigo-200 text-sm">Destination</p>
                            <p className="text-white">
                              {booking.destinationLocation?.address || "Address not available"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-yellow-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="text-indigo-200 text-sm">Price</p>
                            <p className="text-white">${booking.price || "N/A"}</p>
                          </div>
                        </div>
                      </div>

                      {/* Inbox Button */}
                      <button
                        onClick={() => openInbox(booking._id)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                          />
                        </svg>
                        Open Inbox
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-indigo-900 bg-opacity-80 py-6">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Button
            onClick={toggleAvailability}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors duration-300"
          >
            Toggle Availability
          </Button>
          <Button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors duration-300"
          >
            Logout
          </Button>
        </div>
      </footer>
    </div>
  )
}

export default DriverDashboard

