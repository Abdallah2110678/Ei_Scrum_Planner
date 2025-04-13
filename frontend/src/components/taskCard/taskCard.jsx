import React from 'react';
import { FaEllipsisH } from 'react-icons/fa';
import { useSelector } from 'react-redux';

const TaskCard = ({ task }) => {
  // Destructure all attributes from the task object
  const {
    task_name,
    task_category,
    task_complexity,
    priority,
    estimated_effort,
    actual_effort,
    user,
  } = task;

  // Optional: Map complexity values to human-readable labels
  const complexityLabels = {
    EASY: 'Easy',
    MEDIUM: 'Medium',
    HARD: 'Hard',
  };

  const { developers } = useSelector((state) => state.projects);
  const getInitials = (name) => {
    if (!name) return 'N/A';
    const nameParts = name.split(' ');
    return nameParts.length > 1
      ? `${nameParts[0][0]}${nameParts[1][0]}`
      : nameParts[0][0] || 'N/A';
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 m-2 bg-white shadow-sm flex flex-col gap-3">
      <div className="flex justify-end">
        <button className="text-gray-600 hover:text-gray-800">
          <FaEllipsisH />
        </button>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-sm text-gray-800">
          <strong>Name:</strong> {task_name}
        </p>
        <p className="text-sm text-gray-800">
          <strong>Category:</strong> {task_category}
        </p>
        <p className="text-sm text-gray-800">
          <strong>Complexity:</strong> {complexityLabels[task_complexity] || task_complexity}
        </p>
        <p className="text-sm text-gray-800">
          <strong>Priority:</strong> {priority}
        </p>
        <p className="text-sm text-gray-800">
          <strong>Estimated Effort:</strong>{' '}
          {estimated_effort != null ? `${Number(estimated_effort).toFixed(1)} hours` : 'N/A'}
        </p>
        <p className="text-sm text-gray-800">
          <strong>Actual Effort:</strong>{' '}
          {actual_effort != null ? `${Number(actual_effort).toFixed(1)} hours` : 'N/A'}
        </p>
      </div>
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <span className="text-sm text-gray-600"></span>
        </div>
        <div className="flex items-center gap-2">
          {/* <img
            src="avatar"
            alt="avatar"
            className="w-6 h-6 rounded-full"
          /> */}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;