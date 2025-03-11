import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import projectService from "./projectService";

// Fetch all projects
export const fetchProjects = createAsyncThunk("projects/fetchProjects", async (_, thunkAPI) => {
  try {
    return await projectService.getProjects();
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message || "Failed to fetch projects");
  }
});

// Create a new project
export const createNewProject = createAsyncThunk("projects/createProject", async (projectData, thunkAPI) => {
  try {
    return await projectService.createNewProject(projectData);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message || "Failed to create project");
  }
});
const initialState = {
  projects: [],
  selectedProjectId: localStorage.getItem("selectedProjectId")
    ? JSON.parse(localStorage.getItem("selectedProjectId")) 
    : null,
  isLoading: false,
  isError: false,
  message: null,
};

const projectSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    setSelectedProjectId: (state, action) => {
      console.log("Setting Selected Project ID:", action.payload);
      state.selectedProjectId = action.payload;
      localStorage.setItem("selectedProjectId", JSON.stringify(action.payload));
    },
  },
  extraReducers: (builder) => {
    builder
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
      .addCase(createNewProject.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createNewProject.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects.push(action.payload);
      })
      .addCase(createNewProject.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { setSelectedProjectId } = projectSlice.actions;
export default projectSlice.reducer;
