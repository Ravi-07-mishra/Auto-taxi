const { io } = require('socket.io-client');

const socket = io("wss://auto-taxi-1.onrender.com", {
  transports: ["websocket"],
  reconnectionAttempts: Infinity,
  timeout: 10000,
  forceNew: true
});

socket.on('connect', () => {
  console.log('✅ CONNECTED! ID:', socket.id);
  socket.disconnect();
  process.exit(0);
});

socket.on('connect_error', (err) => {
  console.error('❌ ERROR:', err.message);
  console.log('Full error object:', err);
  process.exit(1);
});

// Debug all events
socket.onAny((event, ...args) => {
  console.log('📢 Event:', event, args);
});