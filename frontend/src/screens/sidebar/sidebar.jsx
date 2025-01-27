import React from 'react';
import { Link } from 'react-router-dom';
import './sidebar.css';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <ul className="sidebar-menu">
        <li className="sidebar-item">
          <Link to="/timeline" className="sidebar-link">
            <span className="sidebar-icon">📅</span>
            <span className="sidebar-text">Timeline</span>
          </Link>
        </li>
        <li className="sidebar-item">
          <Link to="/backlog" className="sidebar-link">
            <span className="sidebar-icon">📋</span>
            <span className="sidebar-text">Backlog</span>
          </Link>
        </li>
        <li className="sidebar-item">
          <Link to="/board" className="sidebar-link">
            <span className="sidebar-icon">📊</span>
            <span className="sidebar-text">Board</span>
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;