import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import projectService from "./projectService";

// Fetch all projects
export const fetchProjects = createAsyncThunk(
  "projects/fetchProjects",
  async (_, thunkAPI) => {
    try {
      return await projectService.getProjects();
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.message || "Failed to fetch projects"
      );
    }
  }
);

// Create a new project
export const createNewProject = createAsyncThunk(
  "projects/createProject",
  async (projectData, thunkAPI) => {
    try {
      return await projectService.createNewProject(projectData);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.message || "Failed to create project"
      );
    }
  }
);

const initialState = {
  projects: [],
  isLoading: false,
  isError: false,
  message: null,
};

const projectSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Projects
      .addCase(fetchProjects.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Create Project
      .addCase(createNewProject.fulfilled, (state, action) => {
        state.projects.push(action.payload);
      })
      .addCase(createNewProject.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export default projectSlice.reducer;
