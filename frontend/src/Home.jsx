import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import Navbar from "./screens/navbar/navbar.jsx";
import Sidebar from "./screens/sidebar/sidebar.jsx";
import LoginForm from "./screens/login/login.jsx";
import RegistrationForm from "./screens/registerationForm/registeration.jsx";
import "./Home.css";

const Home = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const { isLoading } = useSelector((state) => state.auth);

  return (
    <div className="home">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p>Please wait to log out...</p>
          </div>
        </div>
      )}

      {/* Navbar */}
      <Navbar />

      {/* Main Content*/}
      <div className="home-container">
        {/* Sidebar */}
        <Sidebar />

        {/* Content Rendered via React Router */}
        <div className="home-content">
          <Outlet />
        </div>
      </div>

      {/* Login Modal */}
      {showLogin && <LoginForm onClose={() => setShowLogin(false)} />}

      {/* Register Modal */}
      {showRegister && <RegistrationForm onClose={() => setShowRegister(false)} />}
    </div>
  );
};

export default Home;
