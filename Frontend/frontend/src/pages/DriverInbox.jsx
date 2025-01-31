import React, { useEffect, useState, useRef } from "react"
import { io } from "socket.io-client"
import { useParams, Link, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { FiSend, FiCheck, FiCheckCircle, FiMoreVertical, FiSearch } from "react-icons/fi"
import { useDriverAuth } from "../Context/driverContext"

const DriverInbox = () => {
  const { bookingId } = useParams()
  const [chat, setChat] = useState([])
  const [driverId,setDriverId] = useState(null);
  const [conversations, setConversations] = useState([])
  const [message, setMessage] = useState("")
  const navigate = useNavigate();
  const [seenMessages, setSeenMessages] = useState({})
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const socketRef = useRef(null)
  const chatContainerRef = useRef(null)
  const { driver } = useDriverAuth()


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
    // Fetch conversations list
   
    const fetchConversations = async () => {
      try {
        if (!driver) {
            console.error("User object is null or undefined");
            return;
        }
        const response = await fetch(`http://localhost:3000/api/chat/driver/conversations/${driver._id}`);
        const data = await response.json();
        console.log(data);
        setConversations(data)
      } catch (error) {
        console.error("Error fetching conversations:", error)
      }
    }

    fetchConversations()
  }, [])

  useEffect(() => {
    if (!bookingId) return

    const fetchChatHistory = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/chat/${bookingId}`)
        const json = await response.json()
        setChat(json)
      } catch (error) {
        console.error("Error fetching chat history:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchChatHistory()
  }, [bookingId])

  useEffect(() => {
    if (!bookingId) return

    socketRef.current = io("http://localhost:3000", {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    const socket = socketRef.current
    socket.on("connect", () => {
      socket.emit("joinRoom", bookingId)
    })

    socket.on("newMessage", (message) => {
      setChat((prev) => [...prev, message])
    })

    socket.on("messageSeen", ({ messageId, userId, seenBy }) => {
      setSeenMessages((prev) => ({
        ...prev,
        [messageId]: userId,
      }))
      setChat((prevChat) => prevChat.map((msg) => (msg._id === messageId ? { ...msg, seenBy } : msg)))
    })

    return () => {
      socket.disconnect()
    }
  }, [bookingId])

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatContainerRef]) //Corrected dependency

  const sendMessage = (message) => {
    if (!message.trim() || !bookingId) return

    if (driver?._id) {
      const newMessage = {
        bookingId,
        senderId: driver._id,
        message,
        senderModel: "Driver",
        timestamp: new Date().toISOString(),
      }
      socketRef.current.emit("sendMessage", newMessage)
      setChat((prev) => [...prev, newMessage])
      setMessage("")
    }
  }

  const handleSeen = (messageId) => {
    socketRef.current.emit("markMessageAsSeen", {
      bookingId,
      messageId,
      userId: driver._id,
    })
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return ""
    const date = new Date(timestamp)
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  }

  const filteredConversations = conversations.filter((conv) =>
    conv.userName?.toLowerCase().includes(searchQuery.toLowerCase())
)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen pt-16">
        {/* Left Panel - Conversations List */}
        <div className="w-1/3 border-r border-gray-200 bg-white">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="overflow-y-auto h-[calc(100vh-9rem)]">
            {filteredConversations.map((conv) => (
              <Link
                key={conv.bookingId}
                to={`/driver/inbox/${conv.bookingId}`}
                className={`flex items-center px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  conv.bookingId === bookingId ? "bg-blue-50" : ""
                }`}
              >
                <div className="relative">
                  <img
                    src={conv.userImage || "/placeholder.svg?height=40&width=40"}
                    alt={conv.userName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {conv.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-gray-900">{conv.userName}</h3>
                    <span className="text-xs text-gray-500">{formatTime(conv.lastMessageTime)}</span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{conv.lastMessage}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right Panel - Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          {bookingId ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div className="flex items-center">
                  <img
                    src={
                      conversations.find((c) => c.bookingId === bookingId)?.userImage ||
                      "/placeholder.svg?height=40&width=40"
                    }
                    alt="User"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="ml-4">
                    <h2 className="font-semibold text-gray-900">
                      {conversations.find((c) => c.bookingId === bookingId)?.userName || "Chat"}
                    </h2>
                    <p className="text-sm text-gray-500">Booking ID: {bookingId}</p>
                  </div>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-full">
                  <FiMoreVertical className="text-gray-600" />
                </button>
              </div>

              {/* Chat Messages */}
              <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-6 py-4">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : chat.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <svg className="w-16 h-16 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    <p className="text-lg font-medium">No messages yet</p>
                    <p className="text-sm">Start the conversation!</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {chat.map((chatMessage, index) => (
                      <motion.div
                        key={chatMessage._id || index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`flex ${chatMessage.senderModel === "Driver" ? "justify-end" : "justify-start"} mb-4`}
                        onMouseEnter={() => handleSeen(chatMessage._id)}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                            chatMessage.senderModel === "Driver"
                              ? "bg-blue-500 text-white"
                              : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          <p className="text-sm">{chatMessage.message}</p>
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <span
                              className={`text-xs ${chatMessage.senderModel === "Driver" ? "text-blue-100" : "text-gray-500"}`}
                            >
                              {formatTime(chatMessage.timestamp)}
                            </span>
                            {chatMessage.senderModel === "Driver" &&
                              (chatMessage.seenBy?.includes(driver?._id) ? (
                                <FiCheckCircle
                                  className={`text-xs ${chatMessage.senderModel === "Driver" ? "text-blue-100" : "text-gray-500"}`}
                                />
                              ) : (
                                <FiCheck
                                  className={`text-xs ${chatMessage.senderModel === "Driver" ? "text-blue-100" : "text-gray-500"}`}
                                />
                              ))}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>

              {/* Message Input */}
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        sendMessage(message)
                      }
                    }}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => sendMessage(message)}
                    className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                    disabled={!message.trim()}
                  >
                    <FiSend className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <svg className="w-16 h-16 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm">Choose a chat from the left to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DriverInbox

