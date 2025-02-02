import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateTask, fetchTasks, deleteTask } from "../../features/tasks/taskSlice";
import { fetchSprints } from "../../features/sprints/sprintSlice"; // Import sprint fetching
import "./taskList.css";

const TaskList = ({ handleCreateSprint }) => {
  const dispatch = useDispatch();
  const { tasks } = useSelector((state) => state.tasks);
  const { sprints } = useSelector((state) => state.sprints);

  const [editTaskId, setEditTaskId] = useState(null);
  const [editStoryId, setEditStoryId] = useState(null);
  const [editTaskName, setEditTaskName] = useState("");
  const [editStoryPoints, setEditStoryPoints] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [moveDropdownOpen, setMoveDropdownOpen] = useState(null);

  useEffect(() => {
    dispatch(fetchTasks());
    dispatch(fetchSprints());
  }, [dispatch]);

  // Handle Task Name Editing
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

  // Handle Story Points Editing
  const handleEditStoryPoints = (task) => {
    setEditStoryId(task.id);
    setEditStoryPoints(task.story_points);
  };

  const handleBlurStoryPoints = (id) => {
    let correctedValue = parseFloat(editStoryPoints);
    if (isNaN(correctedValue) || correctedValue < 0) {
      correctedValue = 0;
    }
    dispatch(updateTask({ id, taskData: { story_points: correctedValue } }));
    setEditStoryId(null);
  };

  // Handle Status Change
  const handleStatusChange = (id, newStatus) => {
    dispatch(updateTask({ id, taskData: { status: newStatus } }));
  };

  // Handle Task Deletion
  const handleDeleteTask = (id) => {
    dispatch(deleteTask(id));
  };

  // Handle Assigning a Task to a Sprint
  const handleMoveToSprint = (taskId, sprintId) => {
    dispatch(updateTask({ id: taskId, taskData: { sprint: sprintId } }));
    setMoveDropdownOpen(null);
    setDropdownOpen(null);
    
    dispatch(fetchSprints());dispatch(fetchTasks());
  };

  return (
    <div className="sprint-info">
      <strong>Backlog</strong>
      <div className="empty-backlog-message">
        <div className="empty-backlog">
          {tasks.length === 0 ? (
            <p>Your backlog is empty.</p>
          ) : (
            <div className="task-list-container">
              {tasks.map((task) => (
                <div key={task.id} className="task-item">
                  {/* Task Name (Editable) */}
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

                  {/* Story Points (Editable) */}
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

                  {/* User Avatar */}
                  <div className="user-avatar">{task.user_initials || "ZM"}</div>

                  {/* Task Options Button */}
                  <button className="task-options-button" onClick={() => setDropdownOpen(task.id)}>
                    ...
                  </button>

                  {/* Task Options Dropdown */}
                  {dropdownOpen === task.id && (
                    <div className="task-dropdown-menu">
                      <button className="dropdown-item" onClick={() => handleDeleteTask(task.id)}>
                        Delete
                      </button>
                      <div
                        className="dropdown-item move-to"
                        onMouseEnter={() => setMoveDropdownOpen(task.id)}
                        onMouseLeave={() => setMoveDropdownOpen(null)}
                      >
                        Move to
                        {moveDropdownOpen === task.id && (
                          <div className="move-to-dropdown">
                          {sprints.length > 0 ? (
                            sprints.map((sprint) => (
                              <button
                                key={sprint.id}
                                className="dropdown-item"
                                onClick={() => handleMoveToSprint(task.id, sprint.id)}
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
              ))}
            </div>
          )}
          <div className="sprint-actions">
            <button className="create-sprint-button" onClick={handleCreateSprint}>
              Create sprint
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskList;
