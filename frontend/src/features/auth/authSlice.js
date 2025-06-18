import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import authService from "./authService";

const user = JSON.parse(localStorage.getItem("user"));
const savedUserInfo = JSON.parse(localStorage.getItem("userInfo"));

const initialState = {
  user: user ? user : null,
  userInfo: savedUserInfo ? savedUserInfo : {},
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: "",
};

// Register
export const register = createAsyncThunk(
  "auth/register",
  async (userData, thunkAPI) => {
    try {
      const response = await authService.register(userData);
      return response;
    } catch (error) {
      let errorMessage = "Registration failed due to an unknown error";
      if (error.response) {
        if (error.response.data && typeof error.response.data === "object") {
          errorMessage = Object.entries(error.response.data)
            .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
            .join("; ");
        } else {
          errorMessage =
            error.response.data?.detail ||
            error.response.data?.message ||
            error.response.statusText ||
            "Server error occurred";
        }
      } else if (error.request) {
        errorMessage = "Network error: Unable to connect to the server";
      } else {
        errorMessage = error.message || error.toString();
      }
      console.error("Registration Error:", errorMessage);
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

// Login
export const login = createAsyncThunk(
  "auth/login",
  async (userData, thunkAPI) => {
    try {
      return await authService.login(userData);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Logout
export const logout = createAsyncThunk("auth/logout", async () => {
  authService.logout();
});

// Get user info
export const getUserInfo = createAsyncThunk(
  "auth/getUserInfo",
  async (_, thunkAPI) => {
    try {
      const accessToken = thunkAPI.getState().auth.user.access;
      return await authService.getUserInfo(accessToken);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = "";
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.userInfo = action.payload.userInfo;
      localStorage.setItem("userInfo", JSON.stringify(action.payload.userInfo));
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(register.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.isSuccess = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = { access: action.payload.access }; // Save only the token
        state.userInfo = action.payload.user; // ✅ Save user info separately
        localStorage.setItem(
          "user",
          JSON.stringify({ access: action.payload.access })
        );
        localStorage.setItem("userInfo", JSON.stringify(action.payload.user));
      })

      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isSuccess = false;
        state.isError = true;
        state.message = action.payload;
        state.user = null;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.userInfo = {};
        localStorage.removeItem("user");
        localStorage.removeItem("userInfo");
      })
      // Get user info
      .addCase(getUserInfo.fulfilled, (state, action) => {
        state.userInfo = action.payload;
        localStorage.setItem("userInfo", JSON.stringify(action.payload));
      });
  },
});

export const { reset, setLoading, setCredentials } = authSlice.actions;

export default authSlice.reducer;
