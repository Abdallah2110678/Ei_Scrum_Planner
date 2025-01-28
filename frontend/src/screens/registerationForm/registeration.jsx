import { useState, useEffect } from "react";
import "./registeration.css";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { register, reset } from "../../features/auth/authSlice";
import { useNavigate } from "react-router-dom";
const RegistrationForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "Developer",
    password: "",
    specialist: "Frontend Developer",
    rememberMe: false,
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility

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
    setShowPassword(!showPassword); // Toggle password visibility
  };

  useEffect(() => {
    if (isError) {
      toast.error(message);
    }

    if (isSuccess) {
      navigate("/board");
      toast.success("email create successfully");
      formData.name = "";
      formData.email = "";
      formData.password = "";
      formData.specialist = "";
    }

    dispatch(reset());
  }, [isError, isSuccess, dispatch]);

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
              type={showPassword ? "text" : "password"} // Toggle between text and password
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
              {showPassword ? "👁️" : "👁️‍🗨️"} {/* Eye icons for show/hide */}
            </span>
          </div>
          {errors.password && (
            <div className="error-message">{errors.password}</div>
          )}
        </div>

        {/* Specialist Select */}
        <div className="form-group">
          <label htmlFor="specialist">Specialist</label>
          <select
            id="specialist"
            name="specialist"
            value={formData.specialist}
            onChange={handleChange}
          >
            <option value="Frontend Developer">Frontend Developer</option>
            <option value="Backend Developer">Backend Developer</option>
            <option value="Data Analyst">Data Analyst</option>
          </select>
          {errors.specialist && (
            <div className="error-message">{errors.specialist}</div>
          )}
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
          Register
        </button>
      </form>

      {/* Social Login and Footer sections remain the same */}
      <div className="social-login">
        <p>Or register with:</p>
        <div className="social-buttons">
          <button className="social-button">
            <img src="../src/assets/google.png" alt="Google Logo" />
            <span>Google</span>
          </button>
        </div>
      </div>

      <div className="footer-links">
        <a href="#">Create an account</a>
      </div>

      <div className="atlassian-footer">
        <p>One account for EI Scrum Planner and more.</p>
      </div>
    </div>
  );
};

export default RegistrationForm;
