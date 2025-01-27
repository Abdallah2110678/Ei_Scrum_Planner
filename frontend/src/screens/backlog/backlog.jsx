import React from 'react';
import './Backlog.css';

const Backlog = () => {
  return (
    <div className="backlog-container">
      {/* Projects / School as hyperlinks */}
      <div className="projects-school-links">
        <a href="/projects" className="project-link">Projects</a>
        <span className="separator"> / </span>
        <a href="/school" className="school-link">School</a>
      </div>

      <h2>Backlog</h2>

      {/* Search Section */}
      <div className="search-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search"
            className="search-input"
          />
        </div>
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
          <button className="create-issue-button">
                <span className="plus-icon">+</span> Create issue
              </button>
        </div>
      </div>

      
    </div>
  );
};

export default Backlog;