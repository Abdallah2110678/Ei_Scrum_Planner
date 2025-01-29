import React, { useState } from 'react';
import './registeration.css';
import { useNavigate } from 'react-router-dom';

const RegistrationForm = () => {
  const navigate = useNavigate(); 
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    specialist: '',
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility

  const validateForm = () => {
    const newErrors = {};
  
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
  
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email address is invalid';
    }
  
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
  
    // Add specialist validation
    if (!formData.specialist.trim()) {
      newErrors.specialist = 'Specialist field is required';
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
      navigate('/login');
      alert('Registration Successful!');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword); // Toggle password visibility
  };

  return (
    <div className="registration-container">
      <h2>Register to Continue</h2>
      <form onSubmit={handleSubmit}>
        {/* Name Input */}
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your name"
          />
          {errors.name && <div className="error-message">{errors.name}</div>}
        </div>

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
              type={showPassword ? 'text' : 'password'} // Toggle between text and password
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
              {showPassword ? '👁️' : '👁️‍🗨️'} {/* Eye icons for show/hide */}
            </span>
          </div>
          {errors.password && <div className="error-message">{errors.password}</div>}
        </div>

        {/* Specialist Text Input */}
        <div className="form-group">
          <label htmlFor="specialist">Specialist</label>
          <input
            type="text"
            id="specialist"
            name="specialist"
            value={formData.specialist}
            onChange={handleChange}
            placeholder="Enter your specialist" // Added this line
          />
          {errors.specialist && <div className="error-message">{errors.specialist}</div>}
        </div>

        <button type="submit" className="submit-button">
          Register
        </button>
      </form>

      {/* Social Login and Footer sections remain the same */}
      <div className="social-login">
        <p>Or register with:</p>
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

      <div className="atlassian-footer">
        <p>One account for EI Scrum Planner and more.</p>
      </div>
    </div>
  );
};

export default RegistrationForm;