import React from 'react';
import './timeline.css';
import { Link } from 'react-router-dom';

const Timeline = ({ toggleComponent }) => {
  return (
    <div className="board-container">
      {/* Projects / School as hyperlinks */}
      <div className="projects-school-links">
        <a href="/projects" className="project-link">Projects</a>
        <span className="separator"> / </span>
        <a href="/school" className="school-link">School</a>
      </div>
      
      <h2>Timeline</h2>
      
      {/* Search Section */}
      <div className="search-section">
        <div className="search-bar">
          <input type="text" placeholder="Search" className="search-input" />
        </div>
      </div>
    </div>
  );
};

export default Timeline;