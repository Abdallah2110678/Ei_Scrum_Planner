import React, { useState, useEffect } from "react";
import "./backlog.css";
import { useDispatch, useSelector } from "react-redux";
import TaskItem from "../../components/taskList/taskItem";
import {
  fetchSprints,
  addSprint,
  deleteSprint,
} from "../../features/sprints/sprintSlice";
import CreateIssueButton from "../../components/taskButton/createTaskButton";
import TaskList from "../../components/taskList/taskList";
import projectService from "../../features/projects/projectService";

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
    console.log("Form submitted", formData);

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

    console.log("🚀 Sprint Request Payload:", {
      sprint_name: formData.sprintName,
      duration: durationMapping[formData.duration] || 14,
      start_date: formData.startDate,
      sprint_goal: formData.sprintGoal,
      project: parseInt(projectId, 10),  // ✅ FIXED: Sending correct field name
    });

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
            project: parseInt(projectId, 10),  // ✅ FIXED (Line 140)
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
          {" "}
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
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isStartSprintModalOpen, setIsStartSprintModalOpen] = useState(false);
  const [selectedSprint, setSelectedSprint] = useState(null);

  useEffect(() => {
    dispatch(fetchSprints());
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      const projectList = await projectService.getProjects();
      setProjects(projectList);
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    dispatch(fetchSprints());
  }, [dispatch]);
  const handleCreateSprint = async () => {
    if (!selectedProjectId) {
      alert("Please select a project first.");
      return;
    }

    const newSprintData = {
      sprint_name: `Sprint ${sprints.length + 1}`,
      project: parseInt(selectedProjectId, 10),  // ✅ Convert to integer
      is_active: false,
      is_completed: false
    };

    console.log("🚀 Creating Sprint with Data:", newSprintData);  // ✅ Debugging

    try {
      await dispatch(addSprint(newSprintData)).unwrap();
      dispatch(fetchSprints()); // Refresh sprints

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

  return (
    <div className="backlog-container">
      <div className="projects-school-links">
        <a href="/projects" className="project-link">
          Projects
        </a>
        <span className="separator"> / </span>
        <a href="/school" className="school-link">
          School
        </a>
      </div>

      <h2>Backlog</h2>
      <div className="search-section">
        <div className="search-bar">
          <input type="text" placeholder="Search" className="search-input" />
        </div>
      </div>

      {sprints.length > 0 &&
        sprints.map((sprint) => (
          <div key={sprint.id} className="sprint-info">
            <strong>{sprint.sprint_name}</strong>
            <div className="sprint-content">
              {sprint.tasks.length === 0 ? (
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
                <div className="task-list-container">
                  {/* Add the list of tasks inside the sprint */}
                  {sprint.tasks.map((task) => (
                    <div key={task.id} className="task-item">
                      <TaskItem key={task.id} task={task} sprints={sprints} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="sprint-actions">
              <button
                className={sprint.is_active ? "complete-sprint-button" : "start-sprint-button"}
                onClick={async () => {
                  if (sprint.is_active) {
                    try {
                      const response = await fetch(
                        `http://localhost:8000/api/v1/sprints/${sprint.id}/`,
                        {
                          method: "PATCH",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            sprint_name: sprint.sprint_name,  // ✅ Use sprint instead of formData
                            duration: sprint.duration,  // ✅ Use sprint's actual duration
                            start_date: sprint.start_date,  // ✅ Use sprint's start date
                            sprint_goal: sprint.sprint_goal,  // ✅ Use sprint's goal
                            project: parseInt(sprint.project, 10),  // ✅ Ensure correct project ID key
                            is_completed: true,  // ✅ Mark as completed
                            is_active: false,
                            end_date: new Date().toISOString()  // ✅ Set end date
                          }),
                        }
                      );
                      if (!response.ok) {
                        const errorData = await response.json();
                        console.error("Error response:", errorData);
                        throw new Error(errorData.message || "Failed to complete sprint");
                      }
                      console.log(`Sprint ${sprint.id} marked as completed.`);
                      dispatch(fetchSprints()); // Refresh sprints after updating
                    } catch (error) {
                      console.error("Error completing sprint:", error);
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
                  <button className="dropdown-item1">Edit sprint</button>
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
        ))}

      <div className="project-selection">
        <label>Select Project:</label>
        <select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)}>
          <option value="">-- Select a Project --</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {/* Task List and Create Issue */}
      <TaskList handleCreateSprint={handleCreateSprint} />


      {/* ✅ Pass Sprint ID to StartSprintModal */}
      <StartSprintModal
        isOpen={isStartSprintModalOpen}
        onClose={() => setIsStartSprintModalOpen(false)}
        sprintId={selectedSprint?.id || null}
        sprintName={selectedSprint?.sprint_name || ""}
        projectId={selectedProjectId} // Pass the selected project ID

      />
    </div>
  );
};

export default Backlog;
