import React, { useState, useEffect } from "react";
import { format, addDays, addMonths, parseISO, differenceInDays, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, addWeeks } from "date-fns";
import { useDispatch, useSelector } from "react-redux";
import { fetchSprints, updateSprint } from "../../features/sprints/sprintSlice";
import { fetchTasks, updateTask } from '../../features/tasks/taskSlice';
import "./Timeline.css";
import { FaSearch, FaPlus, FaTasks, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';


const Timeline = () => {

  const dispatch = useDispatch();
  const { sprints } = useSelector((state) => state.sprints);
  const { selectedProjectId, projects } = useSelector((state) => state.projects);
  const { tasks: allTasks } = useSelector((state) => state.tasks);
  const [selectedView, setSelectedView] = useState("months");
  const [currentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSprint, setExpandedSprint] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [activeSprintId, setActiveSprintId] = useState(null);
  const [taskFormData, setTaskFormData] = useState({
    task_name: "",
    task_duration: 1,
    task_complexity: 1,
    story_points: 1,
    status: "TO DO",
    user_experience: 1
  });
  const [editingSprint, setEditingSprint] = useState(null);
  const [editFormData, setEditFormData] = useState({
    sprint_name: "",
    start_date: "",
    duration: 14,
    sprint_goal: ""
  });
  const [tasks, setTasks] = useState({});

  useEffect(() => {
    // Only proceed if we have a valid project ID
    if (selectedProjectId && selectedProjectId !== 'undefined') {
      // Normalize the project ID to ensure consistent comparison
      const projectId = typeof selectedProjectId === 'string'
        ? parseInt(selectedProjectId, 10)
        : selectedProjectId;

      if (!isNaN(projectId)) {
        // Get sprints first
        dispatch(fetchSprints(projectId));

        // Then fetch tasks for the selected project
        dispatch(fetchTasks({ project: projectId }));
      } else {
        console.log('Invalid project ID format');
        setTasks({});
      }
    } else {
      console.log('No project selected. Please select a project in the Backlog view.');
      setTasks({});
    }
  }, [dispatch, selectedProjectId]);

  useEffect(() => {
    if (allTasks && allTasks.length > 0) {
      const tasksBySprint = {};

      // Group tasks by their sprint ID
      allTasks.forEach(task => {
        if (task.sprint) {
          const sprintId = String(task.sprint);
          if (!tasksBySprint[sprintId]) {
            tasksBySprint[sprintId] = [];
          }
          tasksBySprint[sprintId].push(task);
        } else {
          // Handle unassigned tasks
          if (!tasksBySprint['unassigned']) {
            tasksBySprint['unassigned'] = [];
          }
          tasksBySprint['unassigned'].push(task);
        }
      });

      setTasks(tasksBySprint);
    } else {
      setTasks({});
    }
  }, [allTasks, sprints]);

  const generateTimelineHeaders = () => {
    const headers = [];
    switch (selectedView) {
      case "weeks":
        for (let i = 0; i < 24; i++) {
          const weekStart = addWeeks(startOfDay(currentDate), i);
          const weekEnd = addDays(weekStart, 6);
          headers.push({
            label: `Week ${i + 1}`,
            subLabel: `${format(weekStart, "MMM d")}`,
            days: 7,
            start: weekStart,
            end: weekEnd
          });
        }
        break;
      case "months":
        for (let i = 0; i < 12; i++) {
          const monthDate = addMonths(startOfMonth(currentDate), i);
          headers.push({
            label: format(monthDate, "MMMM yyyy"),
            subLabel: "",
            days: differenceInDays(endOfMonth(monthDate), startOfMonth(monthDate)) + 1,
            start: startOfMonth(monthDate),
            end: endOfMonth(monthDate)
          });
        }
        break;
      case "quarters":
        for (let i = 0; i < 4; i++) {
          const quarterStart = addMonths(startOfYear(currentDate), i * 3);
          const quarterEnd = endOfMonth(addMonths(quarterStart, 2));
          headers.push({
            label: `Q${i + 1} ${format(quarterStart, "yyyy")}`,
            subLabel: "",
            days: differenceInDays(quarterEnd, quarterStart) + 1,
            start: quarterStart,
            end: quarterEnd
          });
        }
        break;
      default:
        break;
    }
    return headers;
  };

  const calculateGanttBar = (sprint) => {
    if (!sprint.start_date) return null;

    const sprintStart = parseISO(sprint.start_date);
    const sprintEnd = addDays(sprintStart, sprint.duration - 1);
    const timelineHeaders = generateTimelineHeaders();

    const totalDays = timelineHeaders.reduce((sum, header) => sum + header.days, 0);

    const viewStart = timelineHeaders[0].start;
    const viewEnd = timelineHeaders[timelineHeaders.length - 1].end;

    if (sprintEnd < viewStart || sprintStart > viewEnd) return null;

    const daysFromStart = Math.max(0, differenceInDays(sprintStart, viewStart));
    const left = (daysFromStart / totalDays) * 100;

    const durationDays = Math.min(
      differenceInDays(sprintEnd, sprintStart) + 1,
      differenceInDays(
        sprintEnd > viewEnd ? viewEnd : sprintEnd,
        sprintStart < viewStart ? viewStart : sprintStart
      ) + 1
    );
    const width = (durationDays / totalDays) * 100;

    return {
      left: `${left}%`,
      width: `${width}%`,
    };
  };

  const handleAddTask = async () => {
    try {
      if (!taskFormData.task_name.trim()) {
        return;
      }

      const response = await fetch('http://localhost:8000/api/tasks/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Add token if authentication is needed
        },
        body: JSON.stringify({
          ...taskFormData,
          sprint: activeSprintId,
          project: selectedProjectId
        }),
      });

      if (response.ok) {
        // Reset form state
        setShowTaskForm(false);
        setActiveSprintId(null);
        setTaskFormData({
          task_name: "",
          task_duration: 1,
          task_complexity: 1,
          story_points: 1,
          status: "TO DO",
          user_experience: 1
        });

        // Refresh data
        dispatch(fetchSprints(selectedProjectId));
        dispatch(fetchTasks({ project: selectedProjectId }));
      } else {
        const errorData = await response.json();
        console.error('Error adding task:', errorData);
      }
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleEditClick = (sprint) => {
    setEditingSprint(sprint.id);
    setEditFormData({
      sprint_name: sprint.sprint_name,
      start_date: format(parseISO(sprint.start_date), 'yyyy-MM-dd'),
      duration: sprint.duration,
      sprint_goal: sprint.sprint_goal || ""
    });
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveEdit = async (sprintId) => {
    try {
      await dispatch(updateSprint({ id: sprintId, ...editFormData })).unwrap();
      setEditingSprint(null);
      setEditFormData({
        sprint_name: "",
        start_date: "",
        duration: 14,
        sprint_goal: ""
      });
    } catch (error) {
      console.error('Failed to update sprint:', error);
    }
  };

  const renderSprintBar = (sprint) => {
    if (editingSprint === sprint.id) {
      return (
        <div className="sprint-edit-form">
          <input
            type="text"
            name="sprint_name"
            value={editFormData.sprint_name}
            onChange={handleEditFormChange}
            className="sprint-edit-input"
          />
          <input
            type="date"
            name="start_date"
            value={editFormData.start_date}
            onChange={handleEditFormChange}
            className="sprint-edit-input"
          />
          <select
            name="duration"
            value={editFormData.duration}
            onChange={handleEditFormChange}
            className="sprint-edit-select"
          >
            <option value={7}>1 Week</option>
            <option value={14}>2 Weeks</option>
            <option value={21}>3 Weeks</option>
          </select>
          <div className="sprint-edit-actions">
            <FaSave onClick={() => handleSaveEdit(sprint.id)} className="edit-icon" />
            <FaTimes onClick={() => setEditingSprint(null)} className="edit-icon" />
          </div>
        </div>
      );
    }

    return (
      <div className="sprint-bar">
        <span>{sprint.sprint_name}</span>
        <FaEdit
          onClick={() => handleEditClick(sprint)}
          className="edit-icon"
        />
      </div>
    );
  };

  const renderGanttChart = () => {
    const timelineHeaders = generateTimelineHeaders();
    const totalDays = timelineHeaders.reduce((sum, header) => sum + header.days, 0);

    const filteredSprints = sprints.filter(sprint =>
      sprint.sprint_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="gantt-chart-container">
        <table className="gantt-table">
          <thead>
            <tr>
              <th className="fixed-column">Sprint Name</th>
              {timelineHeaders.map((header, index) => (
                <th
                  key={index}
                  style={{
                    width: `${(header.days / totalDays) * 100}%`,
                    minWidth: selectedView === "weeks" ? "150px" : "200px"
                  }}
                  className="timeline-header-cell"
                >
                  <div className="header-content">
                    <div className="header-main-label">{header.label}</div>
                    {header.subLabel && (
                      <div className="header-sub-label">{header.subLabel}</div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredSprints.length > 0 ? (
              filteredSprints.map((sprint) => {
                const barPosition = calculateGanttBar(sprint);

                return (
                  <React.Fragment key={sprint.id}>
                    <tr>
                      <td className="fixed-column sprint-name">
                        <div className="sprint-name-container">
                          {renderSprintBar(sprint)}
                          <button
                            className="add-task-button"
                            onClick={() => {
                              setShowTaskForm(true);
                              setActiveSprintId(sprint.id);
                            }}
                          >
                            <FaPlus />
                          </button>
                        </div>
                      </td>
                      <td colSpan={timelineHeaders.length} className="gantt-chart-cell">
                        <div className="gantt-grid">
                          {timelineHeaders.map((header, index) => (
                            <div
                              key={index}
                              className="gantt-grid-line"
                              style={{ width: `${(header.days / totalDays) * 100}%` }}
                            />
                          ))}
                        </div>
                        {barPosition && (
                          <div
                            className={`gantt-bar ${sprint.is_active ? 'active' : ''}`}
                            style={barPosition}
                            title={`${sprint.sprint_name} (${format(parseISO(sprint.start_date), "MMM d")} - ${format(addDays(parseISO(sprint.start_date), sprint.duration - 1), "MMM d")})`}
                          >
                            <span className="sprint-bar-label">{sprint.sprint_name}</span>
                          </div>
                        )}
                      </td>
                    </tr>
                    {tasks[String(sprint.id)]?.map((task) => {
                      // Use default date if sprint isn't started
                      const sprintStart = sprint.start_date ? parseISO(sprint.start_date) : new Date();

                      // Use task duration or default to 1 day
                      const taskDuration = task.task_duration || 1;
                      const taskWidth = (taskDuration / totalDays) * 100;

                      // Calculate position relative to timeline start
                      const taskLeft = (differenceInDays(sprintStart, timelineHeaders[0].start) / totalDays) * 100;

                      const taskBarPosition = {
                        left: `${taskLeft}%`,
                        width: `${taskWidth}%`,
                      };

                      return (
                        <tr key={task.id} className="task-row">
                          <td className="fixed-column task-name">
                            {task.task_name}
                            <span className={`task-status ${task.status.toLowerCase().replace(' ', '-')}`}>
                              {task.status}
                            </span>
                          </td>
                          <td colSpan={timelineHeaders.length} className="gantt-chart-cell">
                            <div className="gantt-grid">
                              {timelineHeaders.map((header, index) => (
                                <div
                                  key={index}
                                  className="gantt-grid-line"
                                  style={{ width: `${(header.days / totalDays) * 100}%` }}
                                />
                              ))}
                            </div>
                            <div
                              className={`task-bar ${task.status.toLowerCase().replace(' ', '-')}`}
                              style={taskBarPosition}
                              title={`${task.task_name} (${taskDuration} days)`}
                            >
                              {task.task_name}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="add-task-row">
                      <td colSpan={timelineHeaders.length + 1}>
                        {showTaskForm && activeSprintId === sprint.id ? (
                          <div className="task-form">
                            <input
                              type="text"
                              placeholder="What needs to be done?"
                              value={taskFormData.task_name}
                              onChange={(e) => setTaskFormData({
                                ...taskFormData,
                                task_name: e.target.value
                              })}
                            />
                            <button
                              onClick={handleAddTask}
                              disabled={!taskFormData.task_name.trim()}
                            >
                              Add Task
                            </button>
                            <button onClick={() => {
                              setShowTaskForm(false);
                              setActiveSprintId(null);
                              setTaskFormData({
                                task_name: "",
                                task_duration: 1,
                                task_complexity: 1,
                                story_points: 1,
                                status: "TO DO",
                                user_experience: 1
                              });
                            }}>
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            className="create-task-button"
                            onClick={() => {
                              setShowTaskForm(true);
                              setActiveSprintId(sprint.id);
                            }}
                          >
                            <FaPlus />
                          </button>
                        )}
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan={timelineHeaders.length + 1} className="no-sprints">
                  No sprints found. Create a sprint to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    const sourceSprintId = source.droppableId;
    const destSprintId = destination.droppableId;

    if (sourceSprintId === destSprintId) {
      // Reorder within same sprint
      const sprintTasks = Array.from(tasks[sourceSprintId]);
      const [removed] = sprintTasks.splice(source.index, 1);
      sprintTasks.splice(destination.index, 0, removed);

      setTasks({
        ...tasks,
        [sourceSprintId]: sprintTasks
      });
    } else {
      // Move to different sprint
      const sourceTasks = Array.from(tasks[sourceSprintId]);
      const destTasks = Array.from(tasks[destSprintId] || []);
      const [movedTask] = sourceTasks.splice(source.index, 1);
      destTasks.splice(destination.index, 0, movedTask);

      // Update task's sprint assignment
      const newSprintId = destSprintId === 'unassigned' ? null : destSprintId;
      await dispatch(updateTask({
        id: draggableId,
        sprint: newSprintId
      }));

      setTasks({
        ...tasks,
        [sourceSprintId]: sourceTasks,
        [destSprintId]: destTasks
      });
    }
  };

  const renderTaskList = (sprintId) => {
    const sprintTasks = tasks[sprintId] || [];

    return (
      <Droppable droppableId={String(sprintId)}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="task-list"
          >
            {sprintTasks.map((task, index) => (
              <Draggable
                key={task.id}
                draggableId={String(task.id)}
                index={index}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`task-item ${snapshot.isDragging ? 'dragging' : ''}`}
                  >
                    <div className="task-content">
                      <span className="task-name">{task.task_name}</span>
                      <span className={`task-status ${task.status.toLowerCase().replace(' ', '-')}`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    );
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="timeline-container">
        <div className="projects-school-links">
          <a href="/projects" className="projects-link">Projects</a>
          <span className="separator"> / </span>
          <span className="school-link">
            {selectedProjectId
              ? projects.find((p) => p.id === selectedProjectId)?.name || "Unnamed Project"
              : "No Project Selected"}
          </span>
        </div>


        <div className="timeline-content">
          <div className="timeline-header-section">
            <h2>Timeline</h2>
            <div className="timeline-controls">
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search sprints..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                <FaSearch className="search-icon" />
              </div>
            </div>
          </div>

          <div className="timeline-header">
            <div className="view-controls">
              <button
                className={selectedView === "weeks" ? "active" : ""}
                onClick={() => setSelectedView("weeks")}
              >
                Weeks
              </button>
              <button
                className={selectedView === "months" ? "active" : ""}
                onClick={() => setSelectedView("months")}
              >
                Months
              </button>
              <button
                className={selectedView === "quarters" ? "active" : ""}
                onClick={() => setSelectedView("quarters")}
              >
                Quarters
              </button>
            </div>
          </div>

          <div className="timeline-grid">{renderGanttChart()}</div>
        </div>
      </div>
    </DragDropContext>
  );
};

export default Timeline;