import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import React from 'react'
import './index.css'
import App from './App.jsx'
import { DriverAuthContextProvider } from './Context/driverContext.jsx'
import { AuthContextProvider } from './Context/userContext.jsx'

import './index.css'
createRoot(document.getElementById('root')).render(
  <StrictMode>
   
    <DriverAuthContextProvider>
    <AuthContextProvider>
    <App />
    </AuthContextProvider>
    </DriverAuthContextProvider>
   
  </StrictMode>,
)
