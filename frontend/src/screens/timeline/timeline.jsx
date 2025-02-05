import React, { useState, useEffect } from "react";
import { format, addDays, parseISO, differenceInDays } from "date-fns";
import { useDispatch, useSelector } from "react-redux";
import { fetchSprints, addSprint } from "../../features/sprints/sprintSlice";
import "./Timeline.css";

const Timeline = () => {
  const dispatch = useDispatch();
  const { sprints } = useSelector((state) => state.sprints);
  const [selectedView, setSelectedView] = useState("weeks"); // "weeks" view for timeline chart
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
      case "today":
        headers.push(format(currentDate, "eee, MMM do"));
        break;
      case "weeks":
        for (let i = 0; i < 7; i++) {
          const day = addDays(currentDate, i);
          headers.push(format(day, "EEE dd"));
        }
        break;
      case "months":
        for (let i = 0; i < 3; i++) {
          const monthDate = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() + i
          );
          headers.push(format(monthDate, "MMM 'yy").toUpperCase());
        }
        break;
      case "quarters":
        const currentMonth = currentDate.getMonth();
        let currentQuarter = Math.floor(currentMonth / 3) + 1;
        for (let i = 0; i < 3; i++) {
          let quarter = currentQuarter + i;
          let year = currentDate.getFullYear() + Math.floor((quarter - 1) / 4);
          quarter = ((quarter - 1) % 4) + 1;
          headers.push(`Q${quarter} ${year}`);
        }
        break;
      default:
        break;
    }
    return headers;
  };

  const timelineHeaders = generateTimelineHeaders();

  // Render a timeline bar for a sprint (only in "weeks" view)
  const renderSprintTimelineBar = (sprint) => {
    if (selectedView !== "weeks" || !sprint.start_date || !sprint.end_date)
      return null;

    const sprintStart = parseISO(sprint.start_date);
    const sprintEnd = parseISO(sprint.end_date);
    let offset = differenceInDays(sprintStart, currentDate) + 1;
    let duration = differenceInDays(sprintEnd, sprintStart) + 1;

    // Bound the timeline bar within the 7-day view
    if (offset < 1) {
      duration = duration + offset - 1;
      offset = 1;
    }
    if (offset > 7) return null;
    if (offset + duration - 1 > 7) {
      duration = 7 - offset + 1;
    }

    return (
      <div
        className="timeline-bar"
        style={{
          gridColumnStart: offset,
          gridColumnEnd: offset + duration,
        }}
      >
        {sprint.sprint_name}
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

  return (
    <div className="timeline-container">
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
            <input
              type="text"
              placeholder="Search timeline"
              className="search-input"
            />
            <svg
              className="icon"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <div className="view-controls">
            <button
              className={selectedView === "today" ? "active" : ""}
              onClick={() => setSelectedView("today")}
            >
              Today
            </button>
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
          {/* Timeline Headers */}
          <div className="timeline-headers">
            {timelineHeaders.map((header, index) => (
              <div key={index}>{header}</div>
            ))}
          </div>

          {/* Sprints Table */}
          <div className="sprint-section">
            <header>Sprints</header>
            <table className="sprint-table">
              <thead>
                <tr>
                  <th>Sprint Name</th>
                  <th>Timeline Chart</th>
                </tr>
              </thead>
              <tbody>
                {sprints.map((sprint) => (
                  <tr key={sprint.id}>
                    <td>{sprint.sprint_name}</td>
                    <td>
                      <div className="sprint-timeline">
                        {renderSprintTimelineBar(sprint)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

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

