import React, { useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';

const TaskAssignmentButton = ({ projectId, sprintId }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { projects } = useSelector((state) => state.projects);

  const project = projects.find((p) => p.id === projectId);

  const handleAssignTasks = async () => {
    if (!project?.enable_automation) {
      setMessage('Automation is disabled. Complete at least two sprints.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/projects/task-assignments/auto-assign-tasks/', {
        project_id: projectId,
        sprint_id: sprintId,
      });
      console.log("Full API Response:", response.data);
      setMessage(response.data.message || "No message returned");
    
      if (response.data.assignments) {
        console.log("Assignments:", response.data.assignments);
      } else {
        console.warn("⚠️ 'assignments' not found in response", response.data);
      }
    
    } catch (error) {
      console.error('Task assignment error:', error);
      setMessage(error.response?.data?.error || 'Failed to assign tasks');
    }
  };

  return (
    <div>
      <button
        onClick={handleAssignTasks}
        disabled={loading || !project?.enable_automation}
        style={{
          padding: '10px 20px',
          backgroundColor: project?.enable_automation ? '#4CAF50' : '#cccccc',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: project?.enable_automation ? 'pointer' : 'not-allowed',
        }}
      >
        {loading ? 'Assigning...' : 'Auto-Assign Tasks'}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default TaskAssignmentButton;