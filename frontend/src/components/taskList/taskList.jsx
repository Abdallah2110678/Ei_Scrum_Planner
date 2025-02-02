import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateTask, fetchTasks, deleteTask } from "../../features/tasks/taskSlice";
import "./taskList.css";

const TaskList = () => {
  const dispatch = useDispatch();
  const { tasks } = useSelector((state) => state.tasks);

  const [editTaskId, setEditTaskId] = useState(null);
  const [editStoryId, setEditStoryId] = useState(null);
  const [editTaskName, setEditTaskName] = useState("");
  const [editStoryPoints, setEditStoryPoints] = useState("");

  useEffect(() => {
    dispatch(fetchTasks());
  }, [dispatch]);

  // Handle Editing Task Name
  const handleEditTask = (task) => {
    setEditTaskId(task.id);
    setEditTaskName(task.task_name);
  };

  const handleSaveTaskName = (id) => {
    if (editTaskName.trim() !== "") {
      dispatch(updateTask({ id, taskData: { task_name: editTaskName } }));
    }
    setEditTaskId(null);
  };

  // Handle Editing Story Points
  const handleEditStoryPoints = (task) => {
    setEditStoryId(task.id);
    setEditStoryPoints(task.story_points);
  };

  const handleSaveStoryPoints = (id) => {
    if (editStoryPoints.trim() !== "") {
      dispatch(updateTask({ id, taskData: { story_points: editStoryPoints } }));
    }
    setEditStoryId(null);
  };

  // Handle Status Change
  const handleStatusChange = (id, newStatus) => {
    dispatch(updateTask({ id, taskData: { status: newStatus } }));
  };
  const handleBlurStoryPoints = (id) => {
    let correctedValue = parseFloat(editStoryPoints);
    if (isNaN(correctedValue) || correctedValue < 0) {
      correctedValue = 0; // Reset to 0 if invalid
    }
    dispatch(updateTask({ id, taskData: { story_points: correctedValue } }));
    setEditStoryId(null);
  };

  // Handle Task Deletion
  const handleDeleteTask = (id) => {
    dispatch(deleteTask(id));
  };

  return (
    <div className="task-list-container">
      {tasks.map((task) => (
        <div key={task.id} className="task-item">
          {/* Task ID with Icon */}

          {/* Task Name (Resizable Text Area) */}
          <div className="task-name-container">
            {editTaskId === task.id ? (
              <textarea
                value={editTaskName}
                onChange={(e) => setEditTaskName(e.target.value)}
                onBlur={() => handleSaveTaskName(task.id)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveTaskName(task.id)}
                autoFocus
                className="task-textarea"
              />
            ) : (
              <span className="task-name" onClick={() => handleEditTask(task)}>
                {task.task_name}
              </span>
            )}
          </div>

          {/* Task Status Dropdown */}
          <select
            value={task.status}
            onChange={(e) => handleStatusChange(task.id, e.target.value)}
            className="task-status"
          >
            <option value="TO DO">TO DO</option>
            <option value="IN PROGRESS">IN PROGRESS</option>
            <option value="DONE">DONE</option>
          </select>

          {/* Story Points (Only editable when clicked) */}
          <div className="story-points">
            {editStoryId === task.id ? (
              <input
                type="number"
                value={editStoryPoints}
                onChange={(e) => setEditStoryPoints(e.target.value)}
                onBlur={() => handleBlurStoryPoints(task.id)}
                onKeyDown={(e) => e.key === "Enter" && handleBlurStoryPoints(task.id)}
                min="0"
                className="story-points-input"
                autoFocus
              />
            ) : (
              <span className="story-points-text" onClick={() => handleEditStoryPoints(task)}>
                {task.story_points}
              </span>
            )}
          </div>

          {/* User Avatar (Based on Initials) */}
          <div className="user-avatar">{task.user_initials || "ZM"}</div>

          {/* Delete Button */}
          <button className="delete-task" onClick={() => handleDeleteTask(task.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
};

export default TaskList;
