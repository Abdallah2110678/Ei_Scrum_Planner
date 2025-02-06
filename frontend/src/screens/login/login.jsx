import  { useState,useEffect } from 'react';
import { useNavigate, Link,} from 'react-router-dom';
import './login.css';
import { useDispatch, useSelector } from 'react-redux'
import { login, reset, getUserInfo } from '../../features/auth/authSlice'
import { toast } from 'react-toastify'


const LoginForm = () => {
    
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { user, isLoading, isError, isSuccess, message } = useSelector((state) => state.auth)


  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email address is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });

    if (errors[name]) {
      setErrors((prevErrors) => {
        const { [name]: removedError, ...rest } = prevErrors;
        return rest;
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});

    if (validateForm()) {
      console.log('Form Data Submitted:', formData);
      const userData = {
        email: formData.email,
        password: formData.password,
    };
     dispatch(login(userData));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  useEffect(() => {
    if (isError) {
        toast.error(message)
    }

    if (isSuccess || user) {
      
      navigate('/eiscrum');
    }

    dispatch(reset())
    dispatch(getUserInfo())

}, [isError, isSuccess, user, navigate, dispatch])

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
            <span
              className="password-toggle-icon"
              onClick={togglePasswordVisibility}
            >
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
            <img
              src="../src/assets/google.png"
              alt="Google Logo"
            />
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