import React, { useState } from 'react';
import './backlog.css';

const Backlog = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="backlog-container">
      {/* Projects / School as hyperlinks */}
      <div className="projects-school-links">
        <a href="/projects" className="project-link">Projects</a>
        <span className="separator"> / </span>
        <a href="/school" className="school-link">School</a>
      </div>

      <h2>Backlog</h2>

      {/* Sprint Information */}
      <div className="sprint-info">
        <strong>SCHOOL Sprint 1</strong>
        <div className="sprint-content">
          <div className="sprint-image">
            <img
              src="https://jira-frontend-bifrost.prod-east.frontend.public.atl-paas.net/assets/sprint-planning.32ed1a38.svg"
              alt="Sprint Planning"
            />
          </div>
          <div className="sprint-text">
            <h3>Plan your sprint</h3>
            <p>
              Drag issues from the <b>Backlog</b> section, or create new issues, to plan the work for this sprint.
              <br />
              Select <b>Start sprint</b> when you're ready.
            </p>
          </div>
        </div>

        <div className="sprint-actions">
          <button className="start-sprint-button" disabled>
            Start sprint
          </button>

          <button 
            className="sprint-actions-button" 
            aria-haspopup="true" 
            onClick={toggleDropdown}
          >
            <span className="icon-more-actions">...</span>
          </button>

          {isDropdownOpen && (
            <div className="dropdown-menu">
              <button className="dropdown-item">Edit sprint</button>
              <button className="dropdown-item">Delete sprint</button>
            </div>
          )}
        </div>

        <button className="create-issue-button">
          <span className="plus-icon">+</span> Create issue
        </button>
      </div>

      {/* Empty Backlog Message */}
      <div className="backlog-info">
        <strong>Backlog</strong>
        <div className="empty-backlog-message">
          <div className="empty-backlog">
            <p>Your backlog is empty.</p>
          </div>

        <div className="sprint-actions">
          <button className="create-sprint-button" disabled>
            Create sprint
          </button> 
        </div>

          <button className="create-issue-button2">
            <span className="plus-icon">+</span> Create issue
          </button>
        </div>
      </div>
      
    </div>
  );
};

export default Backlog;