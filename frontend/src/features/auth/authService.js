import axios from "axios";
// import { resetProjectState } from "../projects/projectSlice";
// import { useDispatch } from "react-redux";




const BACKEND_DOMAIN = "http://localhost:8000";

const REGISTER_URL = `${BACKEND_DOMAIN}/api/auth/signup/`;
const LOGIN_URL = `${BACKEND_DOMAIN}/api/auth/login/`;
const GET_USER_INFO = `${BACKEND_DOMAIN}/api/v1/auth/users/me/`

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
  
  localStorage.removeItem("user");
  localStorage.removeItem("userInfo");
  localStorage.removeItem("selectedProjectId");
  localStorage.removeItem("selectedProjectName");
  
};

// Activate user

const getUserInfo = async (accessToken) => {
  const config = {
      headers: {
          "Authorization": `Bearer ${accessToken}`
      }
  }

  const response = await axios.get(GET_USER_INFO, config)

  return response.data
}


const authService = {
  register,
  login,
  logout,
  getUserInfo,
};

export default authService;
