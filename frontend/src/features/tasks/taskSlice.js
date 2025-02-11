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
  async (_, thunkAPI) => {
    try {
      return await taskService.fetchTasks();
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || "Failed to fetch tasks");
    }
  }
);

// Add Task
export const addTask = createAsyncThunk(
  "tasks/addTask",
  async (taskData, thunkAPI) => {
    try {
      return await taskService.addTask(taskData);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || "Failed to add task");
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
  reducers: {},
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

export default taskSlice.reducer;
