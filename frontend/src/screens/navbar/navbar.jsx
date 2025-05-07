import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { toast } from 'react-toastify';
import AddUserModal from '../../components/adduser/addUserModal.jsx';
import ProjectsDropdown from "../../components/projectsdropdown/ProjectsDropdown.jsx";
import { logout, reset, setLoading } from '../../features/auth/authSlice';
import LoginForm from '../login/login.jsx';
import RegistrationForm from '../registerationForm/registeration.jsx';
import './navbar.css';

const Navbar = () => {
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [isRegistrationFormVisible, setIsRegistrationFormVisible] = useState(false);
  const [isLoginFormVisible, setIsLoginFormVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isAddUserModalVisible, setIsAddUserModalVisible] = useState(false);
  const dropdownRef = useRef(null);
  const dispatch = useDispatch();
  const { userInfo, user } = useSelector((state) => state.auth);
  console.log(userInfo.email);
  console.log("userInfo from Redux:", userInfo);
  console.log("user from Redux:", user);

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
          <NavLink to="/eiscrum/">
            <img src="../src/assets/emotional-intelligence.png" alt="Logo" />
          </NavLink>
        </div>

        <div className="navbar-links">
          <NavLink to="/eiscrum/assigned" className="navbar-link">Assigned to Me</NavLink>
          <div className="project-selector">
            <ProjectsDropdown />
          </div>
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
            <div className="profile-dropdown-menu">
              <div className="profile-dropdown-header">
                <div className="profile-info">
                  <div className="profile-initials">
                    {userInfo?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="profile-details">
                    <div className="profile-name">{userInfo?.name || 'User'}</div>
                    <div style={{ color: 'black', fontSize: '12px', display: 'block' }}>
                      {userInfo?.email || 'no-email'}
                    </div>

                    <div className="profile-email">{userInfo?.specialist}</div>
                  </div>
                </div>
              </div>

              <NavLink to="/eiscrum/profile" className="profile-dropdown-item">Profile</NavLink>
              <a href="/personal-settings" className="profile-dropdown-item">Personal settings</a>
              <a href="/notifications" className="profile-dropdown-item">Notifications <span className="new-badge">NEW</span></a>
              <a href="/theme" className="profile-dropdown-item">Theme</a>
              <div className="profile-dropdown-divider"></div>
              <NavLink
                className="profile-dropdown-item"
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