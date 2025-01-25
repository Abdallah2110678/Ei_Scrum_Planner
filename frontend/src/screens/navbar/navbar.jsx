import React, { useState, useEffect, useRef } from 'react';
import './navbar.css'; 
import RegistrationForm from '../registerationForm/registeration.jsx'; // Import the RegistrationForm component

const Navbar = () => {
  const [isDropdownVisible, setIsDropdownVisible] = useState(false); // State for dropdown visibility
  const [isRegistrationFormVisible, setIsRegistrationFormVisible] = useState(false); // State for registration form visibility
  const dropdownRef = useRef(null);

  // Toggle dropdown visibility
  const toggleDropdown = () => {
    setIsDropdownVisible(!isDropdownVisible);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Open registration form
  const openRegistrationForm = (e) => {
    e.preventDefault(); // Prevent default behavior of the <a> tag
    setIsRegistrationFormVisible(true);
    setIsDropdownVisible(false); // Close the dropdown when opening the form
  };

  return (
    <div>
      {/* Navbar */}
      <nav className="navbar">
        {/* Logo */}
        <div className="navbar-logo">
          <img src="../src/assets/emotional-intelligence.png" alt="Logo" />
        </div>

        {/* Navigation Links */}
        <div className="navbar-links">
          <a href="/assigned-to-me" className="navbar-link">Assigned to Me</a>
          <a href="/projects" className="navbar-link">Projects</a>
          <a href="/dashboard" className="navbar-link">Dashboard</a>
        </div>

        {/* Search Bar */}
        <div className="navbar-search">
          <input type="text" placeholder="Search" />
        </div>

        {/* Profile Picture with Dropdown */}
        <div className="navbar-profile" ref={dropdownRef}>
          <img
            src="../src/assets/profile.png"
            alt="Profile"
            className="profile-picture"
            onClick={toggleDropdown}
          />

          {/* Dropdown Menu */}
          {isDropdownVisible && (
            <div className="dropdown-menu">
              <div className="dropdown-header">
                <div className="profile-info">
                  <div className="profile-initials">AH</div>
                  <div className="profile-details">
                    <div className="profile-name">Ahmed Ahmed Ayman Mahmoud Hamdy</div>
                    <div className="profile-email">ahmed2107685@miuegypt.edu.eg</div>
                  </div>
                </div>
              </div>
              <a href="/register" className="dropdown-item" onClick={openRegistrationForm}>Register</a>
              <div className="dropdown-divider"></div>
              <a href="/manage-account" className="dropdown-item">Manage account</a>
              <a href="/profile" className="dropdown-item">Profile</a>
              <a href="/personal-settings" className="dropdown-item">Personal settings</a>
              <a href="/notifications" className="dropdown-item">Notifications <span className="new-badge">NEW</span></a>
              <a href="/theme" className="dropdown-item">Theme</a>
              <div className="dropdown-divider"></div>
              <a href="/logout" className="dropdown-item">Log out</a>
            </div>
          )}
        </div>
      </nav>

      {/* Registration Form Overlay */}
      {isRegistrationFormVisible && (
        <div className="overlay">
          <div className="registration-modal-content">
            <button
              className="close-button"
              onClick={() => setIsRegistrationFormVisible(false)}
            >
              × {/* Close icon (you can replace this with an actual icon if needed) */}
            </button>
            <RegistrationForm />
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;