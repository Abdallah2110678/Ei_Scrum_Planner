import axios from "axios";

const BACKEND_DOMAIN = "http://localhost:8000";

const REGISTER_URL = `${BACKEND_DOMAIN}/api/v1/auth/users/`;
const LOGIN_URL = `${BACKEND_DOMAIN}/api/v1/auth/jwt/create/`;

// Register user

const register = async (userData) => {
  const config = {
    headers: {
      "Content-type": "application/json",
    },
  };

  const response = await axios.post(REGISTER_URL, userData, config);

  return response.data;
};

// Login user

const login = async (userData) => {
  const config = {
    headers: {
      "Content-type": "application/json",
    },
  };

  const response = await axios.post(LOGIN_URL, userData, config);

  if (response.data) {
    localStorage.setItem("user", JSON.stringify(response.data));
  }

  return response.data;
};

// Logout

const logout = () => {
  return localStorage.removeItem("user");
};

// Activate user

const authService = {
  register,
  login,
  logout,
};

export default authService;
