import React, { useState, useEffect } from 'react';
import './backlog.css';

const Backlog = () => {
  const [sprints, setSprints] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null); // Track which sprint's dropdown is open

  const fetchSprints = async () => {
    const response = await fetch('/api/sprints/'); // Adjust the URL as necessary
    const data = await response.json();
    setSprints(data);
  };

  const handleCreateSprint = () => {
    // Create a new sprint object
    const newSprintData = {
      id: sprints.length + 1, // Simple ID generation for demo purposes
      sprint_name: `SCHOOL Sprint ${sprints.length + 1}`, // Dynamic naming
    };

    // Update the state with the new sprint
    setSprints([...sprints, newSprintData]);
  };

  const toggleDropdown = (id) => {
    setOpenDropdown(openDropdown === id ? null : id); // Toggle dropdown for the specific sprint
  };

  const handleDeleteSprint = (id) => {
    const updatedSprints = sprints.filter(sprint => sprint.id !== id);
    setSprints(updatedSprints); // Update the state by removing the sprint
    setOpenDropdown(null); // Close the dropdown if it's open

    // Reassign IDs for remaining sprints
    const reassignedSprints = updatedSprints.map((sprint, index) => ({
      ...sprint,
      id: index + 1, // Reassign ID based on index
      sprint_name: `SCHOOL Sprint ${index + 1}` // Update sprint name
    }));
    
    setSprints(reassignedSprints);
  };

  useEffect(() => {
    fetchSprints();
  }, []);

  return (
    <div className="backlog-container">
      <div className="projects-school-links">
        <a href="/projects" className="project-link">Projects</a>
        <span className="separator"> / </span>
        <a href="/school" className="school-link">School</a>
      </div>

      <h2>Backlog</h2>
      {/* Search Section */}
      <div className="search-section">
        <div className="search-bar">
          <input type="text" placeholder="Search" className="search-input" />
        </div>
      </div>

      {sprints.length > 0 ? (
        sprints.map((sprint) => (
          <div key={sprint.id} className="sprint-info">
            <strong>{sprint.sprint_name}</strong>
            <div className="sprint-content">
              <div className="sprint-image">
                <img
                  src="https://jira-frontend-bifrost.prod-east.frontend.public.atl-paas.net/assets/sprint-planning.32ed1a38.svg"
                  alt="Sprint Planning"
                />
              </div>
              <div className="sprint-text">
                <h3>Plan your sprint</h3>
                <p>Drag issues from the <b>Backlog</b> section, or create new issues, to plan the work for this sprint.</p>
              </div>
            </div>

            <div className="sprint-actions">
              <button className="start-sprint-button" disabled>
                Start sprint
              </button>
              <button 
                className="sprint-actions-button" 
                aria-haspopup="true" 
                onClick={() => toggleDropdown(sprint.id)} // Pass the sprint ID
              >
                <span className="icon-more-actions">...</span>
              </button>

              {openDropdown === sprint.id && ( // Show dropdown only if the sprint ID matches
                <div className="dropdown-menu">
                  <button className="dropdown-item">Edit sprint</button>
                  <button className="dropdown-item" onClick={() => handleDeleteSprint(sprint.id)}>Delete sprint</button>
                </div>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="backlog-info">
          <strong>Backlog</strong>
          <div className="empty-backlog-message">
            <div className="empty-backlog">
              <p>Your backlog is empty.</p>
            </div>
            <div className="sprint-actions">
              <button className="create-sprint-button" onClick={handleCreateSprint}>
                Create sprint
              </button> 
            </div>
            <button className="create-issue-button2">
              <span className="plus-icon">+</span> Create issue
            </button>
          </div>
        </div>
      )}
      
      {sprints.length > 0 && (
        <div className="backlog-info">
        <strong>Backlog</strong>
        <div className="empty-backlog-message">
          <div className="empty-backlog">
            <p>Your backlog is empty.</p>
          </div>
          <div className="sprint-actions">
            <button className="create-sprint-button" onClick={handleCreateSprint}>
              Create sprint
            </button> 
          </div>
          <button className="create-issue-button2">
            <span className="plus-icon">+</span> Create issue
          </button>
        </div>
      </div>
      )}
    </div>
  );
};

export default Backlog;