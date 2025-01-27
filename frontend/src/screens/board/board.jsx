import React from 'react';
import './board.css';
import { Link } from 'react-router-dom';

const Board = ({ toggleComponent }) => {
  return (
    <div className="board-container">
      {/* Projects / School as hyperlinks */}
      <div className="projects-school-links">
        <a href="/projects" className="project-link">Projects</a>
        <span className="separator"> / </span>
        <a href="/school" className="school-link">School</a>
      </div>
      
      <h2>Board</h2>
      
      {/* Search Section */}
      <div className="search-section">
        <div className="search-bar">
          <input type="text" placeholder="Search" className="search-input" />
        </div>
      </div>
      
      {/* Columns Section */}
      <div className="columns-section">
        {/* TO DO Column */}
        <div className="column">
          <div className="column-header">
            <h3>TO DO</h3>
          </div>
          <div className="column-content">
            <div className="empty-state">
              <img 
                src="https://jira-frontend-bifrost.prod-east.frontend.public.atl-paas.net/assets/agile.52407441.svg" 
                alt="Agile Icon" 
              />
              <p>Get started in the backlog</p>
              <p>Plan and start a sprint to see issues here.</p>
              {/* Updated Link component to use onClick handler */}
              <Link 
                to="/backlog" 
                className="go-to-backlog"
                onClick={(e) => {
                  e.preventDefault(); // Prevent default navigation
                  toggleComponent('backlog');
                }}
              >
                Go to Backlog
              </Link>
            </div>
          </div>
        </div>
        
        {/* IN PROGRESS Column */}
        <div className="column">
          <div className="column-header">
            <h3>IN PROGRESS</h3>
          </div>
          <div className="column-content">
            {/* Add issues or tasks here */}
          </div>
        </div>
        
        {/* DONE Column */}
        <div className="column">
          <div className="column-header">
            <h3>DONE</h3>
          </div>
          <div className="column-content">
            {/* Add issues or tasks here */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Board;