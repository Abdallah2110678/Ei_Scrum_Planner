import React, { useState, useEffect } from "react";
import "./registeration.css";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { register, reset } from "../../features/auth/authSlice";
import { useNavigate } from "react-router-dom";

const RegistrationForm = ({ onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    specialist: "",
  });

  const { user, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email address is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    if (!formData.specialist.trim()) {
      newErrors.specialist = "Specialist field is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
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
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        specialist: formData.specialist,
      };
      dispatch(register(userData));
      console.log("Form Data Submitted:", userData);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  useEffect(() => {
    if (isError) {
      console.log(message);
      console.log(isError);
      toast.error(message);
    }

    if (isSuccess) {
      //toast.success("email create successfully");
      formData.name = "";
      formData.email = "";
      formData.password = "";
      formData.specialist = "";
      // if (onClose) onClose();
      navigate("/login");
    }
  }, [isError, isSuccess, dispatch]);

  return (
    <div className="modal-overlay">
      <div className="registration-container">
        <button className="close-button" onClick={onClose}>
          ×
        </button>
        <h2>Register to Continue</h2>
        <form onSubmit={handleSubmit}>
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
            {errors.email && (
              <div className="error-message">{errors.email}</div>
            )}
          </div>

          <div className="form-group password-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
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
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </span>
            </div>
            {errors.password && (
              <div className="error-message">{errors.password}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="specialist">Specialist</label>
            <input
              type="text"
              id="specialist"
              name="specialist"
              value={formData.specialist}
              onChange={handleChange}
              placeholder="Enter your specialist"
            />
            {errors.specialist && (
              <div className="error-message">{errors.specialist}</div>
            )}
          </div>
          <div>
            {isError && message && (
              <div style={{ color: "red", marginTop: "10px" }}>{message}</div>
            )}
          </div>

          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? "Registering..." : "Register"}
          </button>
        </form>

        <div className="social-login">
          <p>Or register with:</p>
          <div className="social-buttons">
            <button className="social-button">
              <img src="../src/assets/google.png" alt="Google Logo" />
              <span>Google</span>
            </button>
          </div>
        </div>

        <div className="atlassian-footer">
          <p>One account for EI Scrum Planner and more.</p>
        </div>
      </div>
    </div>
  );
};

export default RegistrationForm;
