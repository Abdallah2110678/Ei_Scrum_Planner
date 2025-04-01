import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import taskService from "./taskService";

export const predictStoryPoints = createAsyncThunk(
  "tasks/predictStoryPoints",
  async ({ taskId, taskData }, thunkAPI) => {
    if (!taskData || !taskData.task_id) {
      return thunkAPI.rejectWithValue("❌ task_id is missing");
    }

    try {
      const predictedPoints = await taskService.predictStoryPoints(taskData);
      return { id: taskId, story_points: predictedPoints };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || "Failed to estimate story points"
      );
    }
  }
);

// Fetch Tasks
export const fetchTasks = createAsyncThunk(
  "tasks/fetchTasks",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { projects } = getState();
      const selectedProjectId = projects.selectedProjectId;  // ✅ Get selected project ID

      if (!selectedProjectId) {
        return [];
      }
      
      return await taskService.fetchTasks(selectedProjectId);
    } catch (error) {
      console.error("❌ Error fetching tasks:", error);
      return rejectWithValue(error.message || "Failed to fetch tasks");
    }
  }
);
// Add Task
export const addTask = createAsyncThunk(
  "tasks/addTask",
  async (taskData, { getState, rejectWithValue }) => {
    try {
      const { projects } = getState();
      const selectedProjectId = projects.selectedProjectId;

      if (!selectedProjectId) {
        return rejectWithValue("No project selected");
      }

      // Ensure all required fields are present
      const completeTaskData = {
        ...taskData,
        project: selectedProjectId,
        task_name: taskData.task_name,
        task_category: taskData.task_category || "FE",
        task_complexity: taskData.task_complexity || "MEDIUM",
        effort: taskData.effort || 1.0,
        priority: taskData.priority || 1,
        status: taskData.status || "TO DO"
      };

      return await taskService.addTask(completeTaskData);
    } catch (error) {
      console.error("Error adding task:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || "Failed to add task");
    }
  }
);

// Update Task
export const updateTask = createAsyncThunk(
  "tasks/updateTask",
  async ({ id, taskData }, thunkAPI) => {
    try {
      return await taskService.updateTask({ id, taskData });
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || "Failed to update task");
    }
  }
);

// Delete Task
export const deleteTask = createAsyncThunk(
  "tasks/deleteTask",
  async (id, thunkAPI) => {
    try {
      return await taskService.deleteTask(id);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || "Failed to delete task");
    }
  }
);

const initialState = {
  tasks: [],
  isLoading: false,
  isError: false,
  message: null,
};

// Task Slice
const taskSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    clearTasks(state) {
      state.tasks = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Tasks
      .addCase(fetchTasks.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Add Task
      .addCase(addTask.fulfilled, (state, action) => {
        state.tasks.push(action.payload);
      })
      .addCase(addTask.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload;
      })

      // Update Task
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(
          (task) => task.id === action.payload.id
        );
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload;
      })

      // Delete Task
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter((task) => task.id !== action.payload);
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload;
      })

      // 🔥 NEW: Predict Story Points
      .addCase(predictStoryPoints.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(predictStoryPoints.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.tasks.findIndex(
          (task) => task.id === action.payload.id
        );
        if (index !== -1) {
          state.tasks[index].story_points = action.payload.story_points;
        }
      })
      .addCase(predictStoryPoints.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});


export const { clearTasks } = taskSlice.actions;
export default taskSlice.reducer;
