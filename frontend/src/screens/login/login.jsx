import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, reset, getUserInfo } from '../../features/auth/authSlice';
import { toast } from 'react-toastify';
import axios from 'axios';
import './login.css';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, isError, user, userInfo } = useSelector((state) => state.auth);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (errors[name]) {
      setErrors((prevErrors) => {
        const { [name]: removedError, ...rest } = prevErrors;
        return rest;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (validateForm()) {
      const userData = {
        email: formData.email,
        password: formData.password,
      };

      try {
        // First attempt login
        const loginResult = await dispatch(login(userData)).unwrap();

        if (loginResult) {
          dispatch(reset());

          // Wait a moment for the token to be stored in localStorage
          setTimeout(async () => {
            try {
              // Get user info first
              await dispatch(getUserInfo()).unwrap();

              // Then perform emotion detection
              detectEmotion('LOGIN');

              // Schedule second emotion detection randomly between 2-3 hours later
              const randomDelay = 2000 + Math.random() * 1000;  // Random value between 2000 and 30000 ms
              const randomMilliseconds = randomDelay * 60 * 60;
              setTimeout(() => {
                detectEmotion('FOLLOWUP');
              }, randomMilliseconds); // Random time between 2-3 hours in milliseconds

              navigate('/eiscrum');
            } catch (error) {
              console.error('Error after login:', error);
            }
          }, 1000); // Increased delay to ensure token is properly stored
        }
      } catch (loginError) {
        console.error('Login failed:', loginError);
        toast.error('Login failed. Please check your credentials.');
      }
    }
  };

  const detectEmotion = async (type = 'LOGIN', retryCount = 0) => {
    try {
      // Get the token directly from localStorage to ensure it's the most up-to-date
      const storedUser = JSON.parse(localStorage.getItem('user'));
      const authToken = storedUser?.access;

      if (!authToken) {
        console.warn('No authentication token available for emotion detection');
        return;
      }

      // Set up headers with authentication token
      const config = {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        params: {
          type: type,
          timestamp: new Date().getTime() // Add timestamp to ensure unique requests
        }
      };

      const response = await axios.get(`http://localhost:8000/emotion_detection/`, config);

      if (response.data.emotion) {
        toast.success(`Detected emotion: ${response.data.emotion}`);
        if (response.data.daily_average) {
          toast.info(`Daily average emotion: ${response.data.daily_average}`);
        }

        // If user information is included in the response, display a personalized message
        if (response.data.user && response.data.user.name) {
          toast.info(`Emotion recorded for: ${response.data.user.name}`);
        }
      } else if (response.data.error && response.data.error.includes('No emotions detected')) {
        // If no emotions were detected and this is not a logout request, schedule a retry
        if (type !== 'LOGOUT' && retryCount < 3) {  // Limit to 3 retries
          toast.info(`No face detected. Will try again in 10 minute. (Attempt ${retryCount + 1}/3)`);

          // Schedule retry after 10 minute
          setTimeout(() => {
            detectEmotion(type, retryCount + 1);
          }, 10 * 60 * 1000); // 10 minute in milliseconds
        } else {
          toast.info('No emotion detected');
        }
      } else {
        toast.info('No emotion detected');
      }
    } catch (emotionError) {
      console.error('Error detecting emotion:', emotionError);

      // If there was an error and this is not a logout request, schedule a retry
      if (type !== 'LOGOUT' && retryCount < 3) {  // Limit to 3 retries
        toast.warning(`Emotion detection failed. Will try again in 1 minute. (Attempt ${retryCount + 1}/3)`);

        // Schedule retry after 1 minute
        setTimeout(() => {
          detectEmotion(type, retryCount + 1);
        }, 10 * 60 * 1000); // 10 minute in milliseconds
      } else {
        toast.warning('Emotion detection unavailable');
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };


  return (
    <div className="registration-container">
      <h2>Login to Continue</h2>
      <form onSubmit={handleSubmit}>
        {/* Email Input */}
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
          />
          {errors.email && <div className="error-message">{errors.email}</div>}
        </div>

        {/* Password Input with Toggle */}
        <div className="form-group password-group">
          <label htmlFor="password">Password</label>
          <div className="password-input-container">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
            />
            <span className="password-toggle-icon" onClick={togglePasswordVisibility}>
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </span>
          </div>
          {errors.password && <div className="error-message">{errors.password}</div>}
        </div>

        {/* Remember Me Checkbox */}
        <div className="form-group remember-me">
          <label htmlFor="rememberMe">
            <input
              type="checkbox"
              id="rememberMe"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
            />
            <span className="checkbox-custom"></span>
            <span className="remember-me-text">Remember me</span>
          </label>
        </div>
        {isError && <div className="error-message"> Email or Password are incorrect </div>}

        <button type="submit" className="submit-button" disabled={isLoading}>
          {isLoading ? "Loading..." : "Login"}
        </button>
      </form>

      <div className="social-login">
        <p>Or login with:</p>
        <div className="social-buttons">
          <button className="social-button">
            <img src="../src/assets/google.png" alt="Google Logo" />
            <span>Google</span>
          </button>
        </div>
      </div>

      <div className="footer-links">
        <button onClick={() => navigate('/register')} className="link-button">
          Create an account
        </button>
      </div>

      <div className="atlassian-footer">
        <p>One account for EI Scrum Planner and more.</p>
      </div>
    </div>
  );
};

export default LoginForm;