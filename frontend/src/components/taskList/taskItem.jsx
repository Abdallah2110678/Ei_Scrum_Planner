import { useState, useEffect } from "react";
import { useDispatch,useSelector } from "react-redux";
import { updateTask, deleteTask, fetchTasks, predictStoryPoints } from "../../features/tasks/taskSlice";
import { fetchProjectParticipants } from "../../features/projects/projectSlice";
import { fetchSprints } from "../../features/sprints/sprintSlice";
import './taskList.css';

const TaskItem = ({ task, sprints, selectedProjectId }) => {

  const dispatch = useDispatch();
  const { developers } = useSelector((state) => state.projects);
  const [editTaskId, setEditTaskId] = useState(null);
  const [editStoryId, setEditStoryId] = useState(null);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [editTaskName, setEditTaskName] = useState(task.task_name);
  const [editStoryPoints, setEditStoryPoints] = useState(task.story_points);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [moveDropdownOpen, setMoveDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [taskData, setTaskData] = useState(task);

  // Fetch tasks & sprints when component mounts
  useEffect(() => {
    dispatch(fetchTasks());
    
    dispatch(fetchProjectParticipants(selectedProjectId));
  }, [dispatch]);

  // Handle Editing Task Name
  const handleEditTask = () => {
    setEditTaskId(task.id);
    setEditTaskName(task.task_name);
  };

  const handleSaveTaskName = () => {
    if (editTaskName.trim() !== "") {
      const updatedTask = { ...taskData, task_name: editTaskName };
      setTaskData(updatedTask);
      dispatch(updateTask({ id: task.id, taskData: updatedTask }))
        .unwrap()
        .then(() => {
          dispatch(fetchSprints(selectedProjectId))
          dispatch(fetchTasks());
        })
        .catch((error) => console.error("Error updating task:", error));
    }
    setEditTaskId(null);
  };

  // Handle Editing Story Points
  const handleEditStoryPoints = () => {
    setEditStoryId(task.id);
    setEditStoryPoints(task.story_points);
  };

  const handleBlurStoryPoints = () => {
    let correctedValue = parseFloat(editStoryPoints);
    if (isNaN(correctedValue) || correctedValue < 0) {
      correctedValue = 0;
    }
    const updatedTask = { ...taskData, story_points: correctedValue };
    setTaskData(updatedTask);
    dispatch(updateTask({ id: task.id, taskData: updatedTask }))
      .unwrap()
      .then(() => {
        
        dispatch(fetchTasks());
      })
      .catch((error) => console.error("Error updating task:", error));
    setEditStoryId(null);
  };

  // Handle Task Status Change
  const handleStatusChange = (newStatus) => {
    const updatedTask = { ...taskData, status: newStatus };
    setTaskData(updatedTask);
    dispatch(updateTask({ id: task.id, taskData: updatedTask }))
      .unwrap()
      .then(() => {
        
        dispatch(fetchTasks());
      })
      .catch((error) => console.error("Error updating task:", error));
  };

  // Handle Task Deletion
  const handleDeleteTask = () => {
    dispatch(deleteTask(task.id))
      .unwrap()
      .then(() => {
        
        dispatch(fetchTasks());
      })
      .catch((error) => console.error("Error updating task:", error));
  };

  const handleEstimateStoryPoints = async () => {
    try {
      setLoadingEstimate(true);

      const response = await dispatch(
        predictStoryPoints({
          task_id: task.id,
          taskData: {
            task_id: task.id,
            user_id: 1,
            task_duration: task.task_duration,
            task_complexity: task.task_complexity,
          },
        })
      ).unwrap();

      if (response?.estimatedPoints !== undefined) {
        const updatedTask = { ...taskData, story_points: response.estimatedPoints };
        setTaskData(updatedTask);
      }

      dispatch(updateTask({ id: task.id, taskData: taskData }))
        .unwrap()
        .then(() => {
          dispatch(fetchTasks());
        })
        .catch((error) => console.error("Error estimating story points:", error));
    } catch (error) {
      console.error("Error estimating story points:", error);
    } finally {
      setLoadingEstimate(false);
    }
  };

  // Handle Assigning a Task to a Sprint
  const handleMoveToSprint = (sprintId) => {
    // If moving to a sprint (not removing from sprint)
    if (sprintId) {
        const updatedTask = { ...taskData, sprint: sprintId, status: task.status || "TO DO" };
        setTaskData(updatedTask);
        dispatch(updateTask({ id: task.id, taskData: updatedTask }))
            .unwrap()
            .then(() => {
                // Refresh data without showing alert
                dispatch(fetchSprints(selectedProjectId));
                dispatch(fetchTasks(selectedProjectId));
            })
            .catch((error) => {
                console.error("Error moving task to sprint:", error);
            });
    } else {
        // Removing from sprint (moving back to backlog)
        const updatedTask = { ...taskData, sprint: null };
        setTaskData(updatedTask);
        dispatch(updateTask({ id: task.id, taskData: updatedTask }))
            .unwrap()
            .then(() => {
                // Refresh data without showing alert
                
                dispatch(fetchTasks(selectedProjectId));
            })
            .catch((error) => {
                console.error("Error removing task from sprint:", error);
            });
    }
    
    // Close dropdowns
    setMoveDropdownOpen(false);
    setDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const closeDropdown = (event) => {
      if (!event.target.closest(".task-options-button") && !event.target.closest(".task-dropdown-menu")) {
        setDropdownOpen(false);
        setMoveDropdownOpen(false);
      }
    };

    document.addEventListener("click", closeDropdown);
    return () => document.removeEventListener("click", closeDropdown);
  }, []);

  const handleUpdateTask = (field, value) => {
    const updatedTask = { ...taskData, [field]: value };
    setTaskData(updatedTask);
    dispatch(updateTask({ id: task.id, taskData: updatedTask }));
  };
// Function to get initials from a name
const getInitials = (name) => {
  if (!name) return "N/A";
  const nameParts = name.split(" ");
  return nameParts.length > 1
    ? `${nameParts[0][0]}${nameParts[1][0]}`
    : nameParts[0][0] || "N/A";
};

// Handle assigning a developer to the task
const handleAssignUser = (userId) => {
  const updatedTask = { ...taskData, user: userId };
  setTaskData(updatedTask);
  dispatch(updateTask({ id: task.id, taskData: updatedTask }))
    .unwrap()
    .then(() => {
      dispatch(fetchTasks()); // Refresh tasks after update
    })
    .catch((error) => console.error("Error assigning user to task:", error));
  setUserDropdownOpen(false); // Close dropdown after selection
};

// Close user dropdown when clicking outside
useEffect(() => {
  const closeUserDropdown = (event) => {
    if (!event.target.closest(".user-avatar-container") && !event.target.closest(".user-dropdown-menu")) {
      setUserDropdownOpen(false);
    }
  };

  document.addEventListener("click", closeUserDropdown);
  return () => document.removeEventListener("click", closeUserDropdown);
}, []);
  return (
    <div key={task.id} className="task-item">
      {/* Task Name (Editable) */}
      <div className="task-name-container">
        {editTaskId === task.id ? (
          <textarea
            value={editTaskName}
            onChange={(e) => setEditTaskName(e.target.value)}
            onBlur={handleSaveTaskName}
            onKeyDown={(e) => e.key === "Enter" && handleSaveTaskName()}
            autoFocus
            className="task-textarea"
          />
        ) : (
          <span className="task-name" onClick={handleEditTask}>
            {task.task_name}
          </span>
        )}
      </div>

      {/* Task Complexity Dropdown */}
      <select
        className="task-complexity-select"
        value={taskData.task_complexity}
        onChange={(e) => handleUpdateTask('task_complexity', e.target.value)}
      >
        <option value="EASY">Easy</option>
        <option value="MEDIUM">Medium</option>
        <option value="HARD">Hard</option>
      </select>

      {/* Task Category Input - Changed from select to input */}
      <input
        type="text"
        className="task-category-input"
        value={taskData.task_category}
        onChange={(e) => handleUpdateTask('task_category', e.target.value)}
        placeholder="Enter category"
      />

      {/* Priority Input */}
      <input
        type="number"
        className="priority-input"
        value={taskData.priority}
        min="1"
        max="5"
        onChange={(e) => handleUpdateTask('priority', parseInt(e.target.value))}
      />

      {/* Task Status Dropdown */}
      <select
        className="task-status"
        value={taskData.status}
        onChange={(e) => handleStatusChange(e.target.value)}
      >
        <option value="TO DO">To Do</option>
        <option value="IN PROGRESS">In Progress</option>
        <option value="DONE">Done</option>
      </select>

      {/* Story Points (Editable) */}
      <div className="story-points">
        {editStoryId === task.id ? (
          <input
            type="number"
            value={editStoryPoints}
            onChange={(e) => setEditStoryPoints(e.target.value)}
            onBlur={handleBlurStoryPoints}
            onKeyDown={(e) => e.key === "Enter" && handleBlurStoryPoints()}
            min="0"
            className="story-points-input"
            autoFocus
          />
        ) : (
          <span className="story-points-text" onClick={handleEditStoryPoints}>
            {editStoryPoints}
          </span>
        )}

        {/* "Estimate" Button */}
        <button
          className="estimate-button"
          onClick={handleEstimateStoryPoints}
          disabled={loadingEstimate}
        >
          {loadingEstimate ? "Estimating..." : "Estimate"}
        </button>
      </div>

    {/* User Avatar with Dropdown */}
    <div className="user-avatar-container relative">
        <div
          className="user-avatar cursor-pointer"
          onClick={() => setUserDropdownOpen(!userDropdownOpen)}
          title={taskData.user ? developers?.users?.find((dev) => dev.id === taskData.user)?.name || "Unassigned" : "Unassigned"}
        >
          {taskData.user
            ? getInitials(developers?.users?.find((dev) => dev.id === taskData.user)?.name)
            : "N/A"}
        </div>

        {/* User Dropdown */}
        {userDropdownOpen && (
          <div className="user-dropdown-menu absolute z-10 bg-white border border-gray-200 rounded-md shadow-lg mt-1">
            <button
              className="dropdown-item px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
              onClick={() => handleAssignUser(null)}
            >
              Unassign
            </button>
            {developers?.users?.length > 0 ? (
              developers.users.map((developer) => (
                <button
                  key={developer.id}
                  className="dropdown-item px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  onClick={() => handleAssignUser(developer.id)}
                >
                  {developer.name}
                </button>
              ))
            ) : (
              <div className="px-4 py-2 text-sm text-gray-500">No developers available</div>
            )}
          </div>
        )}
      </div>

      {/* ... (rest of the component unchanged) */}
      {/* Task Options Button */}
      <button className="task-options-button" onClick={() => setDropdownOpen(!dropdownOpen)}>...</button>

      {/* Task Options Dropdown */}
      {dropdownOpen && (
        <div className="task-dropdown-menu">
          <button className="dropdown-item" onClick={handleDeleteTask}>Delete</button>

          <div className="dropdown-item move-to" onMouseEnter={() => setMoveDropdownOpen(true)} onMouseLeave={() => setMoveDropdownOpen(false)}>
            Move to
            {moveDropdownOpen && (
              <div className="move-to-dropdown">
                {/* Show "Remove from Sprint" if task is already assigned to a sprint */}
                {task.sprint && (
                  <button
                    className="dropdown-item remove-sprint"
                    onClick={() => handleMoveToSprint(null)}
                  >
                    Remove from Sprint
                  </button>
                )}

                {/* Display only sprints the task is NOT already in */}
                {sprints.length > 0 ? (
                  sprints
                    .filter(
                      (sprint) =>
                        Number(sprint.project) === Number(selectedProjectId) &&
                        sprint.id !== task.sprint &&
                        !sprint.is_completed
                    )
                    .map((sprint) => (
                      <button
                        key={sprint.id}
                        className="dropdown-item"
                        onClick={() => handleMoveToSprint(sprint.id)}
                      >
                        {sprint.sprint_name}
                      </button>
                    ))
                ) : (
                  <div className="no-sprints">No sprints available</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskItem;
