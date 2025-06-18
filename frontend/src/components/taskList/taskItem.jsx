import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProjectParticipants } from "../../features/projects/projectSlice";
import { fetchSprints } from "../../features/sprints/sprintSlice";
import { deleteTask, fetchTasks, predictEffort, updateTask, updateTaskInState } from "../../features/tasks/taskSlice";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import './taskList.css';

const TaskItem = ({ task, sprints, selectedProjectId }) => {

  const dispatch = useDispatch();
  const { developers } = useSelector((state) => state.projects);
  const [editTaskId, setEditTaskId] = useState(null);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [editTaskName, setEditTaskName] = useState(task.task_name);
  const [editStoryPoints, setEditStoryPoints] = useState(task.story_points);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [moveDropdownOpen, setMoveDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [taskData, setTaskData] = useState(task);

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
          dispatch(fetchSprints(selectedProjectId));
          dispatch(updateTaskInState({
            id: task.id,
            updatedFields: { task_name: editTaskName }
          }));

        })
        .catch((error) => console.error("Error updating task:", error));
    }
    setEditTaskId(null);
  };

  // Handle Task Status Change
  const handleStatusChange = (newStatus) => {
    const updatedTask = { ...taskData, status: newStatus };
    setTaskData(updatedTask);
    dispatch(updateTask({ id: task.id, taskData: updatedTask }))
      .unwrap()
      .then(() => {
        dispatch(fetchSprints(selectedProjectId));
        dispatch(updateTaskInState({ id: task.id, updatedFields: { status: newStatus } }));
      })
      .catch((error) => console.error("Error updating task:", error));
  };

  // Handle Task Deletion
  const handleDeleteTask = () => {
    dispatch(deleteTask(task.id))
      .unwrap()
      .then(() => {

        dispatch(fetchSprints(selectedProjectId));
      })
      .catch((error) => console.error("Error updating task:", error));
  };

  const handleEstimateEffort = async () => {
    try {
      setLoadingEstimate(true);

      const response = await dispatch(
        predictEffort({
          taskId: task.id,
          taskData: {
            task_id: task.id,
            task_complexity: task.task_complexity,
            task_category: task.task_category,
          },
          sprintId: task.sprint ? Number(task.sprint) : null,
        })
      ).unwrap();

      if (response?.estimated_effort !== undefined) {
        const updatedTask = { ...taskData, estimated_effort: response.estimated_effort };
        setTaskData(updatedTask);

        dispatch(updateTaskInState({
          id: task.id,
          updatedFields: { estimated_effort: response.estimated_effort }
        }));

        toast.success(`✅ Estimated effort: ${response.estimated_effort.toFixed(1)} hrs`);
      }
    } catch (error) {
      const message = error?.message || "Estimation failed.";
      console.error("❌ Error estimating effort:", message);
      toast.error(`❌ ${message}`);
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
        dispatch(updateTaskInState({
          id: task.id,
          updatedFields: { user: userId }
        }));
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
    <>
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

      {/* Task Category Input */}
      <input
        type="text"
        className="task-category-input"
        value={taskData.task_category || ""}
        onChange={(e) => handleUpdateTask('task_category', e.target.value)}
        placeholder="Enter category"
      />

      {/* Priority Input */}
      <input
        type="number"
        className="priority-input"
        value={taskData.priority || ""}
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

      {/* Effort Input Field */}
      {taskData.is_reactivated ? (
        <input
          type="number"
          className="effort-input"
          value={taskData.rework_effort || ""}
          onChange={(e) =>
            handleUpdateTask('rework_effort', parseFloat(e.target.value) || 0)
          }
          min="0"
          step="0.5"
          placeholder="Rework Effort"
        />
      ) : (
        <input
          type="number"
          className="effort-input"
          value={taskData.actual_effort || ""}
          onChange={(e) =>
            handleUpdateTask('actual_effort', parseFloat(e.target.value) || 0)
          }
          min="0"
          step="0.5"
          placeholder="Actual Effort"
        />
      )}


      {/* Estimate Button */}
      <button
        className="estimate-button"
        onClick={handleEstimateEffort}
        disabled={loadingEstimate}
      >
        {loadingEstimate ? "..." : "Estimate"}
      </button>
      <div className="estimated-effort-display">
        <strong>
          {taskData.estimated_effort != null ? `${taskData.estimated_effort.toFixed(1)} hrs` : "N/A"}
        </strong>
      </div>

      {/* User Avatar */}
      <div className="user-avatar-container relative">
        <div
          className="user-avatar cursor-pointer"
          onClick={() => setUserDropdownOpen(!userDropdownOpen)}
          title={
            taskData.user
              ? developers?.users?.find((dev) => dev.id === taskData.user)?.name || "Unassigned"
              : "Unassigned"
          }
        >
          {taskData.user
            ? getInitials(developers?.users?.find((dev) => dev.id === taskData.user)?.name)
            : "N/A"}
        </div>

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

      {/* Task Options Button */}
      <button className="task-options-button" onClick={() => setDropdownOpen(!dropdownOpen)}>
        ...
      </button>

      {dropdownOpen && (
        <div className="task-dropdown-menu">
          <button className="dropdown-item" onClick={handleDeleteTask}>
            Delete
          </button>

          <div
            className="dropdown-item move-to"
            onMouseEnter={() => setMoveDropdownOpen(true)}
            onMouseLeave={() => setMoveDropdownOpen(false)}
          >
            Move to
            {moveDropdownOpen && (
              <div className="move-to-dropdown">
                {task.sprint && (
                  <button
                    className="dropdown-item remove-sprint"
                    onClick={() => handleMoveToSprint(null)}
                  >
                    Remove from Sprint
                  </button>
                )}
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
    </>
  );
};

export default TaskItem;
