import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import TaskItem from "../../components/taskList/taskItem";
import TaskList from "../../components/taskList/taskList";
import UserAvatars from '../../components/userAvatars/UserAvatars';
import {
  addSprint,
  deleteSprint,
  fetchSprints,
  updateSprint,
} from "../../features/sprints/sprintSlice";
import { updateTask } from "../../features/tasks/taskSlice";
import StartSprintModal from "./../../components/sprint/StartSprintModal";
import "./backlog.css";
import TaskAssignmentButton from '../../components/taskAssignmentButton';

const Backlog = () => {
  const dispatch = useDispatch();
  const { sprints } = useSelector((state) => state.sprints);
const { selectedProjectId, projects,  } = useSelector((state) => state.projects);

  const [openDropdown, setOpenDropdown] = useState(null);
  const [isStartSprintModalOpen, setIsStartSprintModalOpen] = useState(false);
  const [enableAutomation, setEnableAutomation] = useState(false);
  const [selectedSprint, setSelectedSprint] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch sprints when component mounts or when selectedProjectId changes
  useEffect(() => {
    if (selectedProjectId) {
      dispatch(fetchSprints(selectedProjectId));
      setEnableAutomation(projects.find((p) => p.id === selectedProjectId)?.enable_automation)
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

  // Modify the getFilteredSprints function to include search functionality
  const getFilteredSprints = () => {
    if (!selectedProjectId) return [];
    
    let filteredSprints = sprints.filter(sprint => 
      sprint.project === selectedProjectId && !sprint.is_completed
    );

    // First filter out DONE tasks from each sprint
    filteredSprints = filteredSprints.map(sprint => ({
      ...sprint,
      tasks: sprint.tasks?.filter(task => task.status !== "DONE")
    }));

    // Filter by search query
    if (searchQuery) {
      filteredSprints = filteredSprints.map(sprint => ({
        ...sprint,
        tasks: sprint.tasks?.filter(task => 
          task.task_name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(sprint => sprint.tasks?.length > 0);
    }

    // If a user is selected, only show sprints that have tasks assigned to that user
    if (selectedUserId) {
      filteredSprints = filteredSprints.map(sprint => ({
        ...sprint,
        tasks: sprint.tasks?.filter(task => task.user === selectedUserId)
      })).filter(sprint => sprint.tasks?.length > 0);
    }

    return filteredSprints;
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

  const handleUserSelect = (userId) => {
    setSelectedUserId(userId);
  };

  const filterTasksByUser = (tasks) => {
    if (!selectedUserId) return tasks;
    return tasks.filter(task => task.user === selectedUserId);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="backlog-container">

        <div className="projects-school-links">
          <a href="#" className="project-link">Project</a>
          <span className="separator"> / </span>
          <a href="#" className="school-link">{selectedProjectId ? projects.find(p => p.id === selectedProjectId)?.name : ""}</a>
        </div>

        <h2>Backlog</h2>

        <div className="search-section">
          <div className="search-bar">
            <input 
              type="text" 
              placeholder="Search" 
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <UserAvatars 
              onUserSelect={handleUserSelect}
              selectedUserId={selectedUserId}
            />
          </div>
        </div>

        {/* Show message if no project is selected */}
        {!selectedProjectId ? (
          <p className="no-project-message">Please select a project from the dropdown above.</p>
        ) : (
          <>
            {/* Display sprints for selected project */}
            {getFilteredSprints().length > 0 ? (
              getFilteredSprints().map((sprint) => {
                // Filter tasks if they exist
                const filteredTasks = sprint.tasks ? filterTasksByUser(sprint.tasks) : [];
                
                return (
                  <div key={sprint.id} className="sprint-info">
                    <strong>{sprint.sprint_name}</strong>
                    <div className="sprint-content">
                      {!filteredTasks || filteredTasks.length === 0 ? (
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
                              {filteredTasks.map((task, index) => (
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
                                      <TaskItem 
                                        task={task} 
                                        sprints={sprints} 
                                        selectedProjectId={selectedProjectId} 
                                      />
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
                      <TaskAssignmentButton projectId={selectedProjectId} sprintId={sprint.id} />
                      <button
                      className='start-sprint-button'
                      onClick={() => {
                      alert("wow!!");
                      
                      }}
                      disabled = {!enableAutomation}
                      >
                        Automate Assignment
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
                );
              })
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