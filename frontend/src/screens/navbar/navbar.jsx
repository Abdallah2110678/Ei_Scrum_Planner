import { useState, useEffect, useRef } from 'react';
import './navbar.css';
import RegistrationForm from '../registerationForm/registeration.jsx';
import LoginForm from '../login/login.jsx';
import { useDispatch, useSelector } from 'react-redux';
import { logout, reset, setLoading } from '../../features/auth/authSlice';
import { toast } from 'react-toastify';
import axios from 'axios';
import ProjectsDropdown from "../../components/projectsdropdown/ProjectsDropdown.jsx";
import { NavLink } from 'react-router-dom';
import AddUserModal from '../../components/addUserModal';

const Navbar = () => {
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [isRegistrationFormVisible, setIsRegistrationFormVisible] = useState(false);
  const [isLoginFormVisible, setIsLoginFormVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isAddUserModalVisible, setIsAddUserModalVisible] = useState(false); // State for Add User Modal
  const dropdownRef = useRef(null);
  const dispatch = useDispatch();
  const { userInfo, user } = useSelector((state) => state.auth);

  // Function for emotion detection and logout
  const handleLogout = async () => {
    setIsLoggingOut(true);
    dispatch(setLoading(true)); // Set global loading state
    try {
      // Get the user token from Redux store
      const authToken = user?.access;

      // First try emotion detection if we have a token
      if (authToken) {
        try {
          // Emotion Detection Request with authentication token
          const response = await axios.get('http://localhost:8000/emotion_detection/', {
            headers: {
              'Authorization': `Bearer ${authToken}`
            },
            params: {
              type: 'LOGOUT',
              timestamp: new Date().getTime() // Add timestamp to ensure unique requests
            }
          });

          if (response.data.emotion) {
            toast.info(`Detected emotion before logout: ${response.data.emotion}`);

            // If user information is included in the response, display a personalized message
            if (response.data.user && response.data.user.name) {
              toast.info(`Goodbye, ${response.data.user.name}!`);
            } else if (userInfo && userInfo.name) {
              toast.info(`Goodbye, ${userInfo.name}!`);
            }
          } else if (response.data.error && response.data.error.includes('No emotions detected')) {
            // For logout, we don't retry but just inform the user
            toast.warn('No face detected for emotion recording before logout.');
          } else {
            toast.warn('No emotion detected.');
          }
        } catch (emotionError) {
          console.error('Error detecting emotion:', emotionError);
          // Continue with logout even if emotion detection fails
          toast.warn('Unable to detect emotion before logout.');
        }
      }

      // Add a small delay to ensure the emotion detection toast is visible
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Logout after emotion detection (or if emotion detection failed)
      await dispatch(logout());
      dispatch(reset());
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Error during logout:', error);
      toast.error('Failed to logout properly.');
    } finally {
      setIsLoggingOut(false);
      dispatch(setLoading(false)); // Reset global loading state
    }
  };

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
          <ProjectsDropdown /> {/* Projects Dropdown Component */}
          <NavLink to="/dashboard" className="navbar-link">Dashboard</NavLink>
          <NavLink to="/eiscrum/participant" className="navbar-link">Add User</NavLink>
        </div>

        <div className="navbar-search">
          <input type="text" placeholder="Search" />
        </div>

        <div className="navbar-profile" ref={dropdownRef}>
          <img
            src="../src/assets/profile.png"
            alt="Profile"
            className="profile-picture"
            onClick={() => setIsDropdownVisible(!isDropdownVisible)}
          />

          {isDropdownVisible && (
            <div className="dropdown-menu">
              <div className="dropdown-header">
                <div className="profile-info">
                  <div className="profile-initials">AH</div>
                  <div className="profile-details">
                    <div className="profile-name">{userInfo.name}</div>
                    <div className="profile-email">{userInfo.email}</div>
                    <div className="profile-email">{userInfo.specialist}</div>
                  </div>
                </div>
              </div>

              <a href="/manage-account" className="dropdown-item">Manage account</a>
              <a href="/profile" className="dropdown-item">Profile</a>
              <a href="/personal-settings" className="dropdown-item">Personal settings</a>
              <a href="/notifications" className="dropdown-item">Notifications <span className="new-badge">NEW</span></a>
              <a href="/theme" className="dropdown-item">Theme</a>
              <div className="dropdown-divider"></div>
              <NavLink
                className="dropdown-item"
                to="/"
                onClick={handleLogout}
                style={{ pointerEvents: isLoggingOut ? 'none' : 'auto' }}
              >
                {isLoggingOut ? (
                  <div className="logout-loading">
                    <span className="loading-spinner"></span>
                    Logging out...
                  </div>
                ) : (
                  'Logout'
                )}
              </NavLink>
            </div>
          )}
        </div>
      </nav>

      {/* Add User Modal (Only show when isAddUserModalVisible is true) */}
      {isAddUserModalVisible && <AddUserModal onClose={() => setIsAddUserModalVisible(false)} />}
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