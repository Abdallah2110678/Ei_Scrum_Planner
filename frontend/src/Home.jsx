import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./screens/navbar/navbar.jsx";
import Sidebar from "./screens/sidebar/sidebar.jsx";
import LoginForm from "./screens/login/login.jsx";
import RegistrationForm from "./screens/registerationForm/registeration.jsx";
import "./Home.css";

const Home = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  return (
    <div className="home">
      {/* Navbar */}
      <Navbar />

      {/* Main Content something new is here*/}
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
