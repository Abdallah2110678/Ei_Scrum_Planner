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
          errorMessage = error.response.data?.detail || 
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


export const login = createAsyncThunk(
  "auth/login",
  async (userData, thunkAPI) => {
      try {
          return await authService.login(userData)
      } catch (error) {
          const message = (error.response && error.response.data
              && error.response.data.message) ||
              error.message || error.toString()

          return thunkAPI.rejectWithValue(message)
      }
  }
);

export const logout = createAsyncThunk(
  "auth/logout",
  async () => {
      authService.logout()
  }
)



export const getUserInfo = createAsyncThunk(
  "auth/getUserInfo",
  async (_, thunkAPI) => {
      try {
          const accessToken = thunkAPI.getState().auth.user.access
          return await authService.getUserInfo(accessToken)
      } catch (error) {
          const message = (error.response && error.response.data
              && error.response.data.message) ||
              error.message || error.toString()

          return thunkAPI.rejectWithValue(message)
      }
  }
)

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = false;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        // state.user = action.payload;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.isSuccess = false;
        state.isError = true;

        state.message = action.payload;
      }) .addCase(login.pending, (state) => {
        state.isLoading = true
    })
    .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false
        state.isSuccess = true
        state.user = action.payload
    })
    .addCase(login.rejected, (state, action) => {
        state.isLoading = false
        state.isSuccess = false
        state.isError = true
        state.message = action.payload
        state.user = null
    })
    .addCase(logout.fulfilled, (state) => {
        state.user = null
    })
     .addCase(getUserInfo.fulfilled, (state, action) => {
      state.userInfo = action.payload;
      localStorage.setItem("userInfo", JSON.stringify(action.payload));
  });
  },
});

export const { reset, setLoading } = authSlice.actions;

export default authSlice.reducer;
