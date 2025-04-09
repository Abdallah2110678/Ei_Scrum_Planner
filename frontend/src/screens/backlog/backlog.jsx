import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import "./backlog.css";
import { useDispatch, useSelector } from "react-redux";
import TaskItem from "../../components/taskList/taskItem";
import {
  fetchSprints,
  addSprint,
  deleteSprint,
  updateSprint,
} from "../../features/sprints/sprintSlice";
import TaskList from "../../components/taskList/taskList";
import projectService from "../../features/projects/projectService";
import ProjectsDropdown from "./../../components/projectsdropdown/ProjectsDropdown";
import { updateTask } from "../../features/tasks/taskSlice";

const StartSprintModal = ({ isOpen, onClose, sprintName, sprintId, projectId }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    sprintName: sprintName,
    duration: "2 weeks",
    startDate: "",
    endDate: "",
    sprintGoal: "",
  });

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const startDate = now.toISOString().split("T")[0];
      // Set default end date to 2 weeks from start
      const endDate = new Date(now.setDate(now.getDate() + 14))
        .toISOString()
        .split("T")[0];

      setFormData((prev) => ({
        ...prev,
        startDate,
        endDate,
      }));
    }
  }, [isOpen]);

  const handleDurationChange = (e) => {
    const duration = e.target.value;
    const startDate = new Date(formData.startDate);
    let endDate;

    switch (duration) {
      case "1 week":
        endDate = new Date(startDate.setDate(startDate.getDate() + 7));
        break;
      case "2 weeks":
        endDate = new Date(startDate.setDate(startDate.getDate() + 14));
        break;
      case "3 weeks":
        endDate = new Date(startDate.setDate(startDate.getDate() + 21));
        break;
      case "4 weeks":
        endDate = new Date(startDate.setDate(startDate.getDate() + 28));
        break;
      case "custom":
        // Keep the current end date when switching to custom
        return setFormData({ ...formData, duration });
      default:
        endDate = new Date(startDate.setDate(startDate.getDate() + 14));
    }

    if (duration !== "custom") {
      setFormData({
        ...formData,
        duration,
        endDate: endDate.toISOString().split("T")[0],
      });
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.sprintName || !formData.startDate || !projectId) {
      alert("Sprint Name, Start Date, and Project are required!");
      return;
    }

    const durationMapping = {
      "1 week": 7,
      "2 weeks": 14,
      "3 weeks": 21,
      "4 weeks": 28,
      "custom": 0,
    };

    try {
      const response = await fetch(
        sprintId ?
          `http://localhost:8000/api/v1/sprints/${sprintId}/` :
          `http://localhost:8000/api/v1/sprints/`,
        {
          method: sprintId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sprint_name: formData.sprintName,
            duration: durationMapping[formData.duration] || 14,
            start_date: formData.startDate,
            sprint_goal: formData.sprintGoal,
            project: parseInt(projectId, 10),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("❌ Backend Error Response:", data);
        throw new Error(data.message || "Failed to create/update sprint");
      }

      console.log("✅ Sprint created/updated:", data);
      onClose();
      dispatch(fetchSprints());
    } catch (error) {
      console.error("❌ Error Creating Sprint:", error);
      alert("Error creating sprint: " + error.message);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Start Sprint</h2>
        <p>
          <b>1</b> issue will be included in this sprint.
        </p>
        <p>Required fields are marked with an asterisk *</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Sprint name*</label>
            <input
              type="text"
              value={formData.sprintName}
              onChange={(e) =>
                setFormData({ ...formData, sprintName: e.target.value })
              }
              required
            />
          </div>

          <div className="form-group">
            <label>Duration*</label>
            <select
              value={formData.duration}
              onChange={handleDurationChange}
              required
            >
              <option value="1 week">1 week</option>
              <option value="2 weeks">2 weeks</option>
              <option value="3 weeks">3 weeks</option>
              <option value="4 weeks">4 weeks</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div className="form-group">
            <label>Start date*</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
              required
            />
            <p className="planned-date">
              Planned start date: {formData.startDate}
            </p>
            <p className="helper-text">
              A sprint's start date impacts velocity and scope in reports.{" "}
              <a href="#">Learn more</a>.
            </p>
          </div>

          <div className="form-group">
            <label>End date*</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) =>
                setFormData({ ...formData, endDate: e.target.value })
              }
              required
            />
          </div>

          <div className="form-group">
            <label>Sprint goal</label>
            <textarea
              value={formData.sprintGoal}
              onChange={(e) =>
                setFormData({ ...formData, sprintGoal: e.target.value })
              }
              style={{ backgroundColor: "white" }}
            />
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button type="submit" className="start-button">
              Start
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Backlog = () => {
  const dispatch = useDispatch();
  const { sprints } = useSelector((state) => state.sprints);
  const { selectedProjectId } = useSelector((state) => state.projects);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isStartSprintModalOpen, setIsStartSprintModalOpen] = useState(false);
  const [selectedSprint, setSelectedSprint] = useState(null);

  // Fetch sprints when component mounts or when selectedProjectId changes
  useEffect(() => {
    if (selectedProjectId) {
      dispatch(fetchSprints(selectedProjectId));
    }
  }, [dispatch, selectedProjectId]);

  // Add this function to check for expired sprints
  const checkExpiredSprints = () => {
    sprints.forEach(sprint => {
      if (sprint.is_active && sprint.end_date) {
        const endDate = new Date(sprint.end_date);
        const now = new Date();

        if (endDate < now) {
          console.log(`Sprint "${sprint.sprint_name}" has expired. Auto-completing...`);
          handleCompleteSprint(sprint.id);
        }
      }
    });
  };

  // Call this function after fetching sprints
  useEffect(() => {
    if (selectedProjectId && sprints.length > 0) {
      checkExpiredSprints();
    }
  }, [sprints, selectedProjectId]);
  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    // Exit if dropped outside
    if (!destination) return;

    const taskId = parseInt(draggableId.replace("task-", ""));
    const sprintId = destination.droppableId.startsWith("sprint-")
      ? parseInt(destination.droppableId.replace("sprint-", ""))
      : null;

    try {
      await dispatch(updateTask({
        id: taskId,
        taskData: {
          sprint: sprintId, // null = backlog
        },
      })).unwrap();

      dispatch(fetchSprints(selectedProjectId));
    } catch (err) {
      console.error("Error moving task:", err);
    }
  };

  const handleProjectSelect = (projectId) => {
    // Make sure we're working with an integer project ID
    const numericProjectId = parseInt(projectId, 10);
    console.log("Selected Project ID:", numericProjectId);
    setSelectedProjectId(numericProjectId);
  };

  const handleCreateSprint = async () => {
    if (!selectedProjectId) {
      alert("Please select a project first.");
      return;
    }

    const newSprintData = {
      sprint_name: `Sprint ${sprints.filter(s => s.project === selectedProjectId).length + 1}`,
      project: selectedProjectId,
      is_active: false,
      is_completed: false
    };

    try {
      await dispatch(addSprint(newSprintData)).unwrap();
      dispatch(fetchSprints(selectedProjectId)); // Refresh sprints
    } catch (error) {
      console.error("❌ Failed to create sprint:", error);
      alert("Failed to create sprint. Please try again.");
    }
  };

  const toggleDropdown = (id) => {
    setOpenDropdown(openDropdown === id ? null : id);
  };

  const handleDeleteSprint = (id) => {
    dispatch(deleteSprint(id));
    setOpenDropdown(null);
  };

  // Helper function to get filtered sprints for current project
  const getFilteredSprints = () => {
    if (!selectedProjectId) return [];
    return sprints.filter(sprint => sprint.project === selectedProjectId && !sprint.is_completed);
  };

  const handleCompleteSprint = async (sprintId) => {
    try {
      // Get the sprint's tasks
      const sprintToComplete = sprints.find(sprint => sprint.id === sprintId);

      // Move incomplete tasks back to backlog
      const incompleteTasks = sprintToComplete.tasks.filter(
        task => task.status !== "DONE"
      );

      // First move incomplete tasks out of the sprint
      for (const task of incompleteTasks) {
        await dispatch(updateTask({
          id: task.id,
          taskData: {
            ...task,
            sprint: null,  // Remove from sprint
            status: "TO DO" // Reset status to TO DO
          }
        })).unwrap();
      }

      // Then complete the sprint
      await dispatch(updateSprint({
        id: sprintId,
        sprintData: {
          is_completed: true,
          end_date: new Date().toISOString()
        }
      })).unwrap();

      // Refresh the sprints to update the UI
      dispatch(fetchSprints(selectedProjectId));

    } catch (error) {
      console.error("Failed to complete sprint:", error);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="backlog-container">

        <div className="projects-school-links">
          <a href="/projects" className="project-link">Projects</a>
          <span className="separator"> / </span>
          <a href="/school" className="school-link">School</a>
        </div>

        <h2>Backlog</h2>

        <div className="search-section">
          <div className="search-bar">
            <input type="text" placeholder="Search" className="search-input" />
          </div>
        </div>

        {/* Show message if no project is selected */}
        {!selectedProjectId ? (
          <p className="no-project-message">Please select a project from the dropdown above.</p>
        ) : (
          <>
            {/* Display sprints for selected project */}
            {getFilteredSprints().length > 0 ? (
              getFilteredSprints().map((sprint) => (
                <div key={sprint.id} className="sprint-info">
                  <strong>{sprint.sprint_name}</strong>
                  <div className="sprint-content">
                    {!sprint.tasks || sprint.tasks.length === 0 ? (
                      <>
                        <div className="sprint-image">
                          <img
                            src="https://jira-frontend-bifrost.prod-east.frontend.public.atl-paas.net/assets/sprint-planning.32ed1a38.svg"
                            alt="Sprint Planning"
                          />
                        </div>
                        <div className="sprint-text">
                          <h3>Plan your sprint</h3>
                          <p>
                            Drag issues from the <b>Backlog</b> section, or create new
                            issues, to plan the work for this sprint.
                          </p>
                        </div>
                      </>
                    ) : (
                      <Droppable droppableId={`sprint-${sprint.id}`}>
                        {(provided) => (
                          <div
                            className="task-list-container"
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                          >
                            {sprint.tasks.map((task, index) => (
                              <Draggable
                                key={task.id}
                                draggableId={`task-${task.id}`}
                                index={index}
                              >
                                {(provided) => (
                                  <div
                                    className="task-item"
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                  >
                                    <TaskItem task={task} />
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>

                    )}
                  </div>

                  <div className="sprint-actions">
                    <button
                      className={sprint.is_active ? "complete-sprint-button" : "start-sprint-button"}
                      onClick={async () => {
                        if (sprint.is_active) {
                          try {
                            await handleCompleteSprint(sprint.id);
                          } catch (error) {
                            console.error("Error completing sprint:", error);
                            alert("Failed to complete sprint: " + error.message);
                          }
                        } else {
                          setSelectedSprint(sprint);
                          setIsStartSprintModalOpen(true);
                        }
                      }}
                    >
                      {sprint.is_active ? "Complete Sprint" : "Start Sprint"}
                    </button>
                    <button
                      className="sprint-actions-button"
                      aria-haspopup="true"
                      onClick={() => toggleDropdown(sprint.id)}
                    >
                      <span className="icon-more-actions">...</span>
                    </button>

                    {openDropdown === sprint.id && (
                      <div className="dropdown-menu1">
                        <button
                          className="dropdown-item1"
                          onClick={() => {
                            setSelectedSprint(sprint);
                            setIsStartSprintModalOpen(true);
                            setOpenDropdown(null);
                          }}
                        >
                          Edit sprint
                        </button>
                        <button
                          className="dropdown-item1"
                          onClick={() => handleDeleteSprint(sprint.id)}
                        >
                          Delete sprint
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="no-sprints-message">No sprints available for this project.</p>
            )}
          </>
        )}

        {/* Task List and Create Issue */}
        <TaskList
          handleCreateSprint={handleCreateSprint}
          projectId={selectedProjectId}
        />

        {/* Pass Sprint ID to StartSprintModal */}
        <StartSprintModal
          isOpen={isStartSprintModalOpen}
          onClose={() => {
            setIsStartSprintModalOpen(false);
            setSelectedSprint(null);
          }}
          sprintId={selectedSprint?.id || null}
          sprintName={selectedSprint?.sprint_name || ""}
          projectId={selectedProjectId}
        />
      </div>
    </DragDropContext>
  );
};

export default Backlog;