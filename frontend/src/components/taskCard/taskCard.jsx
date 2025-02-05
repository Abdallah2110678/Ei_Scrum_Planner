import React from "react";
//import "./TaskCard.css";
import './taskCard.css';
import { FaEllipsisH } from "react-icons/fa";
const TaskCard = ({ description, sprint_name,  count}) => {
  return (
    <div className="task-card">
      <div className="task-header">
        <button className="task-menu"><FaEllipsisH /></button>
      </div>
      <p className="task-description">{description}</p>
      <div className="task-footer">
        <div className="task-left">
          <span className="task-id"></span>
        </div>
        <div className="task-right">
          <span className="task-count">{count}</span>
          <img src="avatar" alt="avatar" className="task-avatar" />
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
