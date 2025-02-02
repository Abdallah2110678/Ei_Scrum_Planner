import { useState, useEffect, useRef } from 'react';
import './navbar.css';
import RegistrationForm from '../registerationForm/registeration.jsx'; // Import the RegistrationForm component
import LoginForm from '../login/login.jsx'; // Im
import { useDispatch } from 'react-redux'
import { logout, reset } from '../../features/auth/authSlice'
import { toast } from 'react-toastify'
import { NavLink } from 'react-router-dom'

const Navbar = () => {
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [isRegistrationFormVisible, setIsRegistrationFormVisible] = useState(false);
  const [isLoginFormVisible, setIsLoginFormVisible] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDropdown = () => {
    setIsDropdownVisible(!isDropdownVisible);
  };


  const dispatch = useDispatch()

  

    const handleLogout = () => {
        dispatch(logout())
        dispatch(reset())
        toast.success('Logged out successfully')
    }

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

  const openLoginForm = (e) => {
    e.preventDefault();
    setIsLoginFormVisible(true);
    setIsDropdownVisible(false);
  };

  return (
    <div>
      <nav className="navbar">
        <div className="navbar-logo">
          <img src="../src/assets/emotional-intelligence.png" alt="Logo" />
        </div>

        <div className="navbar-links">
          <a href="/#" className="navbar-link">Assigned to Me</a>
          <a href="/#" className="navbar-link">Projects</a>
          <a href="/#" className="navbar-link">Dashboard</a>
        </div>

        <div className="navbar-search">
          <input type="text" placeholder="Search" />
        </div>

        <div className="navbar-profile" ref={dropdownRef}>
          <img
            src="../src/assets/profile.png"
            alt="Profile"
            className="profile-picture"
            onClick={toggleDropdown}
          />

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
              
              <a href="/login" className="dropdown-item" onClick={openLoginForm}>Login</a>
              <div className="dropdown-divider"></div>
              <a href="/manage-account" className="dropdown-item">Manage account</a>
              <a href="/profile" className="dropdown-item">Profile</a>
              <a href="/personal-settings" className="dropdown-item">Personal settings</a>
              <a href="/notifications" className="dropdown-item">Notifications <span className="new-badge">NEW</span></a>
              <a href="/theme" className="dropdown-item">Theme</a>
              <div className="dropdown-divider"></div>
              <NavLink className='dropdown-item' to="/" onClick={handleLogout}>Logout</NavLink>
            </div>
          )}
        </div>
      </nav>

      {isRegistrationFormVisible && (
        <div className="overlay">
          <div className="registration-modal-content">
            <button
              className="close-button"
              onClick={() => setIsRegistrationFormVisible(false)}
            >
              ×
            </button>
            <RegistrationForm />
          </div>
        </div>
      )}

      {isLoginFormVisible && (
        <div className="overlay">
          <div className="registration-modal-content">
            <button
              className="close-button"
              onClick={() => setIsLoginFormVisible(false)}
            >
              ×
            </button>
            <LoginForm />
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;