import React, { useState, useEffect } from "react";
import { format, addDays, parseISO, differenceInDays, startOfDay, endOfDay, isAfter, isBefore, startOfMonth, endOfMonth, addMonths, getDaysInMonth, addHours, startOfYear, endOfYear, addQuarters, startOfQuarter, endOfQuarter } from "date-fns";
import { useDispatch, useSelector } from "react-redux";
import { fetchSprints, addSprint } from "../../features/sprints/sprintSlice";
import "./Timeline.css";
import { FaSearch } from 'react-icons/fa';

const Timeline = () => {
  const dispatch = useDispatch();
  const { sprints } = useSelector((state) => state.sprints);
  const [selectedView, setSelectedView] = useState("months");
  const [currentDate] = useState(new Date());
  const [showSprintForm, setShowSprintForm] = useState(false);
  const [sprintFormData, setSprintFormData] = useState({
    sprint_name: "",
    start_date: "",
    duration: 14, // Default duration (2 weeks)
    sprint_goal: "",
  });

  // Fetch sprints when the component mounts
  useEffect(() => {
    dispatch(fetchSprints());
  }, [dispatch]);

  // Generate timeline headers based on the selected view
  const generateTimelineHeaders = () => {
    const headers = [];
    switch (selectedView) {
      case "weeks":
        for (let i = 0; i < 7; i++) {
          const day = addDays(currentDate, i);
          headers.push({
            label: format(day, "EEE dd"),
            days: 1
          });
        }
        break;
      case "months":
        for (let i = 0; i < 12; i++) {
          const monthDate = addMonths(startOfMonth(currentDate), i);
          headers.push({
            label: format(monthDate, "MMMM yyyy"),
            days: getDaysInMonth(monthDate)
          });
        }
        break;
      case "quarters":
        // Show 4 quarters of the current year
        const startYear = startOfYear(currentDate);
        for (let i = 0; i < 4; i++) {
          const quarterStart = addMonths(startYear, i * 3);
          const quarterEnd = endOfMonth(addMonths(quarterStart, 2));
          headers.push({
            label: `Q${i + 1} ${format(quarterStart, "yyyy")}`,
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

  const timelineHeaders = generateTimelineHeaders();

  // Add this helper function to calculate bar position and width
  const calculateGanttBar = (sprint) => {
    if (!sprint.start_date || !sprint.end_date) return null;

    try {
      const sprintStart = parseISO(sprint.start_date);
      const sprintEnd = parseISO(sprint.end_date);
      let viewStart, viewEnd, totalDays;

      switch (selectedView) {
        case "weeks":
          viewStart = startOfDay(currentDate);
          viewEnd = endOfDay(addDays(currentDate, 6));
          totalDays = 7;
          break;
        case "months":
          viewStart = startOfMonth(currentDate);
          viewEnd = endOfMonth(addMonths(currentDate, 11));
          totalDays = differenceInDays(viewEnd, viewStart) + 1;
          break;
        case "quarters":
          viewStart = startOfYear(currentDate);
          viewEnd = endOfYear(currentDate);
          totalDays = differenceInDays(viewEnd, viewStart) + 1;
          break;
        default:
          return null;
      }

      // Check if sprint is within view range
      if (isAfter(sprintStart, viewEnd) || isBefore(sprintEnd, viewStart)) {
        return null;
      }

      const leftDays = Math.max(0, differenceInDays(sprintStart, viewStart));
      const durationDays = Math.min(
        differenceInDays(sprintEnd, sprintStart) + 1,
        differenceInDays(viewEnd, sprintStart) + 1
      );

      return {
        left: `${(leftDays / totalDays) * 100}%`,
        width: `${(durationDays / totalDays) * 100}%`,
      };
    } catch (error) {
      console.error("Error calculating sprint position:", error);
      return null;
    }
  };

  // Replace the existing sprints table with this new Gantt chart table
  const renderGanttChart = () => {
    const timelineHeaders = generateTimelineHeaders();
    const totalDays = timelineHeaders.reduce((sum, header) => sum + header.days, 0);

    return (
      <div className="gantt-chart-container">
        <table className={`gantt-table ${selectedView}`}>
          <thead>
            <tr>
              <th className="fixed-column">Sprint Name</th>
              {timelineHeaders.map((header, index) => (
                <th 
                  key={index}
                  style={{ 
                    width: `${(header.days / totalDays) * 100}%`,
                    minWidth: selectedView === 'quarters' ? '250px' : '120px'
                  }}
                >
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sprints && sprints.length > 0 ? (
              sprints.map((sprint) => {
                const barPosition = calculateGanttBar(sprint);
                return (
                  <tr key={sprint.id}>
                    <td className="fixed-column sprint-name">
                      {sprint.sprint_name}
                    </td>
                    <td colSpan={timelineHeaders.length} className="gantt-chart-cell">
                      <div className="gantt-grid">
                        {timelineHeaders.map((header, index) => (
                          <div 
                            key={index} 
                            className="gantt-grid-line"
                            style={{ 
                              width: `${(header.days / totalDays) * 100}%`
                            }}
                          />
                        ))}
                      </div>
                      {barPosition && (
                        <div
                          className="gantt-bar"
                          style={barPosition}
                          title={`${sprint.sprint_name}
Start: ${format(parseISO(sprint.start_date), 'MMM dd, yyyy')}
End: ${format(parseISO(sprint.end_date), 'MMM dd, yyyy')}
${sprint.sprint_goal ? `\nGoal: ${sprint.sprint_goal}` : ''}`}
                        >
                          <span className="sprint-bar-label">
                            {sprint.sprint_name}
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
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

  // Handler for sprint form input changes
  const handleSprintFormChange = (e) => {
    const { name, value } = e.target;
    setSprintFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Create sprint handler using Redux
  const handleCreateSprint = () => {
    if (!sprintFormData.sprint_name.trim() || !sprintFormData.start_date) return;
    dispatch(addSprint(sprintFormData));
    // Reset the form
    setSprintFormData({
      sprint_name: "",
      start_date: "",
      duration: 14,
      sprint_goal: "",
    });
    setShowSprintForm(false);
  };

  // Add this CSS class for the sprint bar label
  const additionalStyles = `
    <style>
      .sprint-bar-label {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
        display: block;
      }
    </style>
  `;

  return (
    <div className="timeline-container">
      {additionalStyles}
      {/* Navigation Breadcrumb & Title */}
      <div className="timeline-header">
        <div className="breadcrumb">
          <span>Projects</span>
          <span>/</span>
          <span>My Scrum Project</span>
        </div>
        <h1>Timeline</h1>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Control Bar */}
        <div className="control-bar">
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search sprints..."
            />
          </div>

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

        {/* Timeline Grid */}
        <div className="timeline-grid">
          {/* Sprint Section */}
          <div className="sprint-section">
            <header>Sprints</header>
            {renderGanttChart()}

            {/* Create Sprint Section */}
            <div className="create-sprint">
              <button onClick={() => setShowSprintForm(!showSprintForm)}>
                + Create Sprint
              </button>
              {showSprintForm && (
                <div className="sprint-form">
                  <input
                    type="text"
                    name="sprint_name"
                    value={sprintFormData.sprint_name}
                    onChange={handleSprintFormChange}
                    placeholder="Sprint name"
                  />
                  <input
                    type="date"
                    name="start_date"
                    value={sprintFormData.start_date}
                    onChange={handleSprintFormChange}
                  />
                  <select
                    name="duration"
                    value={sprintFormData.duration}
                    onChange={handleSprintFormChange}
                  >
                    <option value={7}>1 week</option>
                    <option value={14}>2 weeks</option>
                    <option value={21}>3 weeks</option>
                    <option value={28}>4 weeks</option>
                    <option value={0}>Custom</option>
                  </select>
                  <textarea
                    name="sprint_goal"
                    value={sprintFormData.sprint_goal}
                    onChange={handleSprintFormChange}
                    placeholder="Sprint goal (optional)"
                  />
                  <button onClick={handleCreateSprint}>Create Sprint</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;

