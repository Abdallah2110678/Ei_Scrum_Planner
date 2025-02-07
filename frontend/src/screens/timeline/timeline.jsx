import React, { useState, useEffect } from "react";
import { format, addDays, addMonths, parseISO, differenceInDays, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, addWeeks } from "date-fns";
import { useDispatch, useSelector } from "react-redux";
import { fetchSprints, addSprint } from "../../features/sprints/sprintSlice";
import "./Timeline.css";
import { FaSearch, FaPlus, FaTasks } from 'react-icons/fa';

const Timeline = () => {
  const dispatch = useDispatch();
  const { sprints } = useSelector((state) => state.sprints);
  const [selectedView, setSelectedView] = useState("months");
  const [currentDate] = useState(new Date());
  const [showSprintForm, setShowSprintForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sprintFormData, setSprintFormData] = useState({
    sprint_name: "",
    start_date: "",
    duration: 14,
    sprint_goal: "",
  });
  const [expandedSprint, setExpandedSprint] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskFormData, setTaskFormData] = useState({
    task_name: "",
    task_duration: 1,
    task_complexity: 1,
    story_points: 1,
    status: "TO DO",
    user_experience: 1
  });

  useEffect(() => {
    dispatch(fetchSprints());
  }, [dispatch]);

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

  const handleAddTask = async (sprintId) => {
    try {
      if (!taskFormData.task_name.trim()) {
        return;
      }

      const response = await fetch('http://localhost:8000/api/tasks/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...taskFormData,
          sprint: sprintId
        }),
      });
      
      if (response.ok) {
        setShowTaskForm(false);
        setTaskFormData({
          task_name: "",
          task_duration: 1,
          task_complexity: 1,
          story_points: 1,
          status: "TO DO",
          user_experience: 1
        });
        dispatch(fetchSprints());
      } else {
        const errorData = await response.json();
        console.error('Error adding task:', errorData);
      }
    } catch (error) {
      console.error('Error adding task:', error);
    }
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
                          {sprint.sprint_name}
                          <button 
                            className="add-task-button"
                            onClick={() => setShowTaskForm(true)}
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
                    {sprint.tasks?.map((task) => {
                      // Calculate task bar position based on sprint start date and task duration
                      const taskStart = parseISO(sprint.start_date);
                      const taskWidth = (task.task_duration / totalDays) * 100;
                      const taskLeft = (differenceInDays(taskStart, timelineHeaders[0].start) / totalDays) * 100;

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
                              title={`${task.task_name} (${task.task_duration} days)`}
                            >
                              {task.task_name}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="add-task-row">
                      <td colSpan={timelineHeaders.length + 1}>
                        {showTaskForm ? (
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
                              onClick={() => handleAddTask(sprint.id)}
                              disabled={!taskFormData.task_name.trim()}
                            >
                              Add Task
                            </button>
                            <button onClick={() => {
                              setShowTaskForm(false);
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
                            onClick={() => setShowTaskForm(true)}
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

  const handleSprintFormChange = (e) => {
    const { name, value } = e.target;
    setSprintFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateSprint = () => {
    if (!sprintFormData.sprint_name || !sprintFormData.start_date) return;
    dispatch(addSprint(sprintFormData));
    setSprintFormData({ sprint_name: "", start_date: "", duration: 14, sprint_goal: "" });
    setShowSprintForm(false);
  };

  return (
    <div className="timeline-container">
      <div className="projects-school-links">
        <a href="/projects" className="projects-link">
          Projects
        </a>
        <span className="separator"> / </span>
        <a href="/school" className="school-link">
          School
        </a>
      </div>

      <div className="timeline-content">
        <div className="timeline-header-section">
          <h2>Timeline</h2>
          <div className="search-section">
            <div className="search-bar">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search"
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
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

        <div className="create-sprint">
          <button onClick={() => setShowSprintForm(!showSprintForm)}>+ Create Sprint</button>
          {showSprintForm && (
            <div className="sprint-form">
              <input 
                type="text" 
                name="sprint_name" 
                placeholder="Sprint Name" 
                onChange={handleSprintFormChange} 
              />
              <input 
                type="date" 
                name="start_date" 
                onChange={handleSprintFormChange} 
              />
              <select name="duration" onChange={handleSprintFormChange}>
                <option value={7}>1 Week</option>
                <option value={14}>2 Weeks</option>
                <option value={21}>3 Weeks</option>
              </select>
              <textarea 
                name="sprint_goal" 
                placeholder="Sprint Goal (optional)" 
                onChange={handleSprintFormChange}
              ></textarea>
              <button onClick={handleCreateSprint}>Create Sprint</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Timeline;