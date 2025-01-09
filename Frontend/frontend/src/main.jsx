import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import React from 'react'
import axios from 'axios'
// import './index.css'
import App from './App.jsx'
import { DriverAuthProvider } from './Context/driverContext.jsx'
import { AuthProvider } from './Context/userContext.jsx'
axios.defaults.withCredentials = true;

// import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
   
    <DriverAuthProvider>
    <AuthProvider>
    <App />
    </AuthProvider>
    </DriverAuthProvider>
   
  </StrictMode>,
)
