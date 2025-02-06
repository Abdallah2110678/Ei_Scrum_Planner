import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, reset } from '../../features/auth/authSlice';
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
  const { user, isLoading, isError, isSuccess, message } = useSelector((state) => state.auth);

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
          // First emotion detection after successful login
          detectEmotion();

          // Schedule second emotion detection 2 hours later
          setTimeout(() => {
            detectEmotion();
          }, 2 * 60 * 60 * 1000); // 2 hours in milliseconds

          // Navigate only after all operations are complete
          navigate('/eiscrum');
        }
      } catch (loginError) {
        console.error('Login failed:', loginError);
        toast.error('Login failed. Please check your credentials.');
      }
    }
  };

  const detectEmotion = async (type = 'LOGIN') => {
    try {
      const response = await axios.get(`http://localhost:8000/emotion_detection/?type=${type}`);
      
      if (response.data.emotion) {
        toast.success(`Detected emotion: ${response.data.emotion}`);
        if (response.data.daily_average) {
          toast.info(`Daily average emotion: ${response.data.daily_average}`);
        }
      } else {
        toast.info('No emotion detected');
      }
    } catch (emotionError) {
      console.error('Error detecting emotion:', emotionError);
      toast.warning('Emotion detection unavailable');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  useEffect(() => {
    if (isError) {
      toast.error(message);
    }

    if (isSuccess || user) {
      navigate('/eiscrum');
    }

    dispatch(reset());
  }, [isError, isSuccess, user, message, navigate, dispatch]);

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

        <button type="submit" className="submit-button">
          Login
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