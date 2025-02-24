import React from 'react';
import { Link } from 'react-router-dom';
import './sidebar.css';

const Sidebar = ({ toggleComponent }) => {
  return (
    <div className="sidebar">
      <ul className="sidebar-menu">
        <li className="sidebar-item">
          <Link to="/eiscrum/timeline" className="sidebar-link" onClick={() => toggleComponent('timeline')}>
            <span className="sidebar-icon">📅</span>
            <span className="sidebar-text">Timeline</span>
          </Link>
        </li>
        <li className="sidebar-item">
          <Link to="/eiscrum/backlog" className="sidebar-link" onClick={() => toggleComponent('backlog')}>
            <span className="sidebar-icon">📋</span>
            <span className="sidebar-text">Backlog</span>
          </Link>
        </li>
        <li className="sidebar-item">
          <Link to="/eiscrum/board" className="sidebar-link" onClick={() => toggleComponent('board')}>
            <span className="sidebar-icon">📊</span>
            <span className="sidebar-text">Board</span>
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;