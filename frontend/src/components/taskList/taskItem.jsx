import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { updateTask, deleteTask, fetchTasks, predictStoryPoints } from "../../features/tasks/taskSlice";
import { fetchSprints } from "../../features/sprints/sprintSlice";

const TaskItem = ({ task, sprints, selectedProjectId }) => {

  const dispatch = useDispatch();

  const [editTaskId, setEditTaskId] = useState(null);
  const [editStoryId, setEditStoryId] = useState(null);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [editTaskName, setEditTaskName] = useState(task.task_name);
  const [editStoryPoints, setEditStoryPoints] = useState(task.story_points);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [moveDropdownOpen, setMoveDropdownOpen] = useState(false);

  // Fetch tasks & sprints when component mounts
  useEffect(() => {
    dispatch(fetchTasks());
    dispatch(fetchSprints());
  }, [dispatch]);

  // Handle Editing Task Name
  const handleEditTask = () => {
    setEditTaskId(task.id);
    setEditTaskName(task.task_name);
  };

  const handleSaveTaskName = () => {
    if (editTaskName.trim() !== "") {
      dispatch(updateTask({ id: task.id, taskData: { task_name: editTaskName } }))
        .unwrap()
        .then(() => {
          dispatch(fetchSprints());
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
    dispatch(updateTask({ id: task.id, taskData: { story_points: correctedValue } }))
      .unwrap()
      .then(() => {
        dispatch(fetchSprints());
        dispatch(fetchTasks());

      })
      .catch((error) => console.error("Error updating task:", error));
    setEditStoryId(null);
  };

  // Handle Task Status Change
  const handleStatusChange = (newStatus) => {
    dispatch(updateTask({ id: task.id, taskData: { status: newStatus } }))
      .unwrap()
      .then(() => {
        dispatch(fetchSprints());
        dispatch(fetchTasks());

      })
      .catch((error) => console.error("Error updating task:", error));
  };

  // Handle Task Deletion
  const handleDeleteTask = () => {
    dispatch(deleteTask(task.id))
      .unwrap()
      .then(() => {
        dispatch(fetchSprints());
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
        setEditStoryPoints(response.estimatedPoints); // Update state to reflect changes immediately
      }

      dispatch(fetchTasks()); // Refresh tasks after updating state
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
      dispatch(updateTask({ 
        id: task.id, 
        taskData: { 
          sprint: sprintId,
          // Set additional fields as needed when moving to a sprint
          // For example, you might want to set a default status
          status: task.status || "TO DO" 
        } 
      }))
        .unwrap()
        .then(() => {
          // Show success message
          const sprintName = sprints.find(s => s.id === sprintId)?.sprint_name || "selected sprint";
          alert(`Task "${task.task_name}" has been moved to ${sprintName}`);
          
          // Refresh data
          dispatch(fetchSprints());
          dispatch(fetchTasks(selectedProjectId));
        })
        .catch((error) => {
          console.error("Error moving task to sprint:", error);
          alert("Failed to move task to sprint. Please try again.");
        });
    } else {
      // Removing from sprint (moving back to backlog)
      dispatch(updateTask({ 
        id: task.id, 
        taskData: { 
          sprint: null 
        } 
      }))
        .unwrap()
        .then(() => {
          alert(`Task "${task.task_name}" has been moved to Backlog`);
          
          // Refresh data
          dispatch(fetchSprints());
          dispatch(fetchTasks(selectedProjectId));
        })
        .catch((error) => {
          console.error("Error removing task from sprint:", error);
          alert("Failed to move task to Backlog. Please try again.");
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

      {/* Task Status Dropdown */}
      <select value={task.status} onChange={(e) => handleStatusChange(e.target.value)} className="task-status">
        <option value="TO DO">TO DO</option>
        <option value="IN PROGRESS">IN PROGRESS</option>
        <option value="DONE">DONE</option>
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
      {/* User Avatar */}
      <div className="user-avatar">{task.user_initials || "ZM"}</div>

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
                        sprint.id !== task.sprint)
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
