import React from "react";
import { useAuthContext } from "../hooks/UseAuthContext";
import { Link } from "react-router-dom";

function Navbars() {
  const { user, dispatch } = useAuthContext();

  const logout = () => {
    localStorage.removeItem("user");
    dispatch({ type: "LOGOUT" });
  };

  return (
    <header className="custom-navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/userhome">Workout Buddy</Link>
        </div>
        <nav className="navbar-links">
          <Link to="/userdashboard">Dashboard</Link>
          <Link to="/bookdrive">Book Drive</Link>
          {user ? (
            <div className="auth-links">
              <span>{user.email}</span>
              <button className="logout-btn" onClick={logout}>
                Log out
              </button>
            </div>
          ) : (
            <div className="auth-links">
              <Link to="/login">Login</Link>
              <Link to="/">Signup</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbars;
