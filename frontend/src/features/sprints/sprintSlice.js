import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import sprintService from "./sprintService";

// Async Thunks for API Requests
export const fetchSprints = createAsyncThunk("sprints/fetchSprints", async (projectId, thunkAPI) => {
  try {
    return await sprintService.fetchSprints(projectId);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message || "Failed to fetch sprints");
  }
});

export const addSprint = createAsyncThunk("sprints/addSprint", async (sprintData, thunkAPI) => {
  try {
    return await sprintService.addSprint(sprintData);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message || "Failed to add sprint");
  }
});

export const updateSprint = createAsyncThunk("sprints/updateSprint", async ({ id, sprintData }, thunkAPI) => {
  try {
    return await sprintService.updateSprint({ id, sprintData });
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message || "Failed to update sprint");
  }
});

export const deleteSprint = createAsyncThunk("sprints/deleteSprint", async (id, thunkAPI) => {
  try {
    return await sprintService.deleteSprint(id);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message || "Failed to delete sprint");
  }
});

const initialState = {
  sprints: [],
  isLoading: false,
  isError: false,
  message: null,
};

// Sprint Slice
const sprintSlice = createSlice({
  name: "sprints",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Sprints
      .addCase(fetchSprints.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchSprints.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sprints = action.payload;
      })
      .addCase(fetchSprints.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Add Sprint
      .addCase(addSprint.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = null;
      })
      .addCase(addSprint.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.sprints.push(action.payload);
      })
      .addCase(addSprint.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      

      // Update Sprint
      .addCase(updateSprint.fulfilled, (state, action) => {
        const index = state.sprints.findIndex(sprint => sprint.id === action.payload.id);
        if (index !== -1) {
          state.sprints[index] = action.payload;
        }
      })
      .addCase(updateSprint.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload;
      })

      // Delete Sprint
      .addCase(deleteSprint.fulfilled, (state, action) => {
        state.sprints = state.sprints.filter(sprint => sprint.id !== action.payload);
      })
      .addCase(deleteSprint.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export default sprintSlice.reducer;
