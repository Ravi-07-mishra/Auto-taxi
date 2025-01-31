import React, { useEffect, useState } from "react"
import { useAuth } from "../Context/userContext"
import { motion } from "framer-motion"
import { FiStar, FiAward, FiMapPin, FiClock, FiEdit2, FiCamera } from "react-icons/fi"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"

const UserProfilePage = () => {
  const [profileImage, setProfileImage] = useState(null)
  const [userName, setUserName] = useState("Jane Doe")
  const [userId, setUserId] = useState(null)
  const [email, setEmail] = useState("janedoe@gmail.com")
  const [memberSince, setMemberSince] = useState("2022")
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!user) {
        navigate("/userlogin")
      } else {
        setUserId(user._id)
        console.log("User ID set to:", user._id)
      }
    }, 1000)

    return () => clearTimeout(timeout)
  }, [user, navigate])

  const fetchUserData = async () => {
    if (!userId) return
    try {
      const response = await axios.get(`http://localhost:3000/api/user/profile/${userId}`, { withCredentials: true })
      const updatedUser = response.data.data.user
      setUserName(updatedUser.name)
      setUserId(updatedUser._id)
      setEmail(updatedUser.email)
      setMemberSince(new Date(updatedUser.createdAt).getFullYear().toString())
      setProfileImage(updatedUser.profileImage ? `http://localhost:3000/${updatedUser.profileImage}` : null)
    } catch (error) {
      console.error("Error fetching user data:", error)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchUserData()
    }
  }, [userId, fetchUserData]) // Added fetchUserData to dependencies

  useEffect(() => {
    if (user) {
      setUserName(user.name)
      setUserId(user._id)
      setEmail(user.email)
      setMemberSince(new Date(user.createdAt).getFullYear().toString())
      setProfileImage(
        user.profileImage
          ? `http://localhost:3000/${user.profileImage}`
          : "http://localhost:3000/uploads/users/profile/default-avatar.png",
      )
    }
  }, [user])

  const handleImageUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append("image", file)
    formData.append("type", "profile")

    try {
      const response = await axios.post(`http://localhost:3000/api/user/uploadProfileImage/${userId}`, formData, {
        withCredentials: true,
      })

      if (response.data.profileImage) {
        await fetchUserData()
      }
    } catch (error) {
      console.error("Error uploading profile image:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const stats = [
    { icon: FiMapPin, label: "Trips Taken", value: "42" },
    { icon: FiClock, label: "Member Since", value: memberSince },
    { icon: FiStar, label: "Avg. Rating", value: "4.9" },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-2xl rounded-3xl overflow-hidden">
          {/* Header Section */}
          <div className="relative h-48 bg-gradient-to-r from-pink-500 to-red-500">
            <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-white to-transparent"></div>
          </div>

          {/* Profile Info Section */}
          <div className="relative px-6 pb-8">
            <div className="flex flex-col sm:flex-row items-center">
              <div className="relative">
                <img
                  src={profileImage || "/placeholder-avatar.jpg"}
                  alt={userName}
                  className="w-32 h-32 rounded-full border-4 border-white shadow-lg -mt-16 z-10 object-cover"
                />
                <label
                  htmlFor="profile-image-upload"
                  className="absolute bottom-0 right-0 bg-pink-500 rounded-full p-2 cursor-pointer"
                >
                  {isUploading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                  ) : (
                    <FiCamera className="text-white" />
                  )}
                  <input
                    id="profile-image-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />
                </label>
              </div>
              <div className="mt-4 sm:mt-0 sm:ml-6 text-center sm:text-left">
                <h1 className="text-3xl font-bold text-gray-900">{userName}</h1>
                <p className="text-lg text-gray-600">{userId}</p>
                <p className="text-md text-gray-500">{email}</p>
              </div>
              <Link
                to="/edit-profile"
                className="mt-4 sm:mt-0 sm:ml-auto px-4 py-2 bg-pink-600 text-white rounded-full flex items-center hover:bg-pink-700 transition duration-300"
              >
                <FiEdit2 className="mr-2" />
                Edit Profile
              </Link>
            </div>

            {/* Stats Section */}
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
              {stats.map((item, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-pink-50 to-red-50 rounded-xl p-6 flex flex-col items-center shadow-md"
                >
                  <item.icon className="h-8 w-8 text-pink-600 mb-3" />
                  <h2 className="text-lg font-semibold text-gray-700">{item.label}</h2>
                  <p className="mt-2 text-3xl font-bold text-pink-700">{item.value}</p>
                </div>
              ))}
            </div>

            {/* About Section */}
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About Me</h2>
              <p className="text-gray-700 leading-relaxed">
                Avid traveler and adventure seeker. Always looking for new experiences and exciting destinations.
                Passionate about sustainable travel and connecting with local cultures. Enjoy sharing travel tips and
                stories with fellow explorers.
              </p>
            </div>

            {/* Recent Trips Section */}
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Trips</h2>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-700">
                  <FiMapPin className="text-pink-600 mr-2" /> New York City - August 2023
                </li>
                <li className="flex items-center text-gray-700">
                  <FiMapPin className="text-pink-600 mr-2" /> Tokyo, Japan - May 2023
                </li>
                <li className="flex items-center text-gray-700">
                  <FiMapPin className="text-pink-600 mr-2" /> Barcelona, Spain - January 2023
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default UserProfilePage

