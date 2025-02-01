import React, { useState, useEffect } from 'react';
import './backlog.css';

const StartSprintModal = ({ isOpen, onClose, sprintName }) => {
  const [formData, setFormData] = useState({
    sprintName: sprintName,
    duration: '2 weeks',
    startDate: '',
    endDate: '',
    sprintGoal: ''
  });

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const startDate = now.toISOString().split('T')[0];
      // Set default end date to 2 weeks from start
      const endDate = new Date(now.setDate(now.getDate() + 14)).toISOString().split('T')[0];
      
      setFormData(prev => ({
        ...prev,
        startDate,
        endDate
      }));
    }
  }, [isOpen]);

  const handleDurationChange = (e) => {
    const duration = e.target.value;
    const startDate = new Date(formData.startDate);
    let endDate;

    switch(duration) {
      case '1 week':
        endDate = new Date(startDate.setDate(startDate.getDate() + 7));
        break;
      case '2 weeks':
        endDate = new Date(startDate.setDate(startDate.getDate() + 14));
        break;
      case '3 weeks':
        endDate = new Date(startDate.setDate(startDate.getDate() + 21));
        break;
      case '4 weeks':
        endDate = new Date(startDate.setDate(startDate.getDate() + 28));
        break;
      case 'custom':
        // Keep the current end date when switching to custom
        return setFormData({ ...formData, duration });
    }

    if (duration !== 'custom') {
      setFormData({
        ...formData,
        duration,
        endDate: endDate.toISOString().split('T')[0]
      });
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submitted"); // Log form data

    const durationMapping = {
      "1 week": 7,
      "2 weeks": 14,
      "3 weeks": 21,
      "4 weeks": 28,
      "Custom": 0
  };
    try {
      const response = await fetch('http://localhost:8000/api/v1/sprints/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            sprint_name: formData.sprintName,
            duration: durationMapping[formData.duration], // Ensure it's an integer
            start_date: formData.startDate,
            sprint_goal: formData.sprintGoal,
        }),
    });

        console.log("Sending payload:", {
          sprint_name: formData.sprintName,
          duration: parseInt(formData.duration.split(' ')[0]),
          start_date: formData.startDate,
          sprint_goal: formData.sprintGoal,
          custom_end_date: formData.customEndDate || null,
      });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error response:', errorData); // Log error response
            throw new Error(errorData.message || 'Failed to create sprint');
        }

        const data = await response.json();
        console.log('Sprint created:', data); // Log created sprint
        onClose(); // Close the modal
    } catch (error) {
        console.error('Error creating sprint:', error);
        // Optionally show an error message to the user
    }
};

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Start Sprint</h2>
        <p> <b>1</b> issue will be included in this sprint.</p>
        <p>Required fields are marked with an asterisk *</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Sprint name*</label>
            <input
              type="text"
              value={formData.sprintName}
              onChange={(e) => setFormData({ ...formData, sprintName: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Duration*</label>
            <select
              value={formData.duration}
              onChange={handleDurationChange}
              required
            >
              <option value="1 week">1 week</option>
              <option value="2 weeks">2 weeks</option>
              <option value="3 weeks">3 weeks</option>
              <option value="4 weeks">4 weeks</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div className="form-group">
            <label>Start date*</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
            <p className="planned-date">
              Planned start date: {formData.startDate}
            </p>
            <p className="helper-text">
              A sprint's start date impacts velocity and scope in reports. <a href="#">Learn more</a>.
            </p>
          </div>

          <div className="form-group">
            <label>End date*</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Sprint goal</label>
            <textarea
              value={formData.sprintGoal}
              onChange={(e) => setFormData({ ...formData, sprintGoal: e.target.value })}
              style={{ backgroundColor: 'white' }}
            />
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button type="submit" className="start-button">
              Start
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Backlog = () => {
  const [sprints, setSprints] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isStartSprintModalOpen, setIsStartSprintModalOpen] = useState(false);
  const [selectedSprint, setSelectedSprint] = useState(null);

  const fetchSprints = async () => {
    const response = await fetch('/api/sprints/');
    const data = await response.json();
    setSprints(data);
  };

  const handleCreateSprint = () => {
    const newSprintData = {
      id: sprints.length + 1,
      sprint_name: `SCHOOL Sprint ${sprints.length + 1}`,
    };
    setSprints([...sprints, newSprintData]);
  };

  const toggleDropdown = (id) => {
    setOpenDropdown(openDropdown === id ? null : id);
  };

  const handleDeleteSprint = (id) => {
    const updatedSprints = sprints.filter(sprint => sprint.id !== id);
    setSprints(updatedSprints);
    setOpenDropdown(null);

    const reassignedSprints = updatedSprints.map((sprint, index) => ({
      ...sprint,
      id: index + 1,
      sprint_name: `SCHOOL Sprint ${index + 1}`
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
              <button 
                className="start-sprint-button"
                onClick={() => {
                  setSelectedSprint(sprint);
                  setIsStartSprintModalOpen(true);
                }}
              >
                Start sprint
              </button>
              <button 
                className="sprint-actions-button" 
                aria-haspopup="true" 
                onClick={() => toggleDropdown(sprint.id)}
              >
                <span className="icon-more-actions">...</span>
              </button>

              {openDropdown === sprint.id && (
                <div className="dropdown-menu">
                  <button className="dropdown-item">Edit sprint</button>
                  <button className="dropdown-item" onClick={() => handleDeleteSprint(sprint.id)}>Delete sprint</button>
                </div>
              )}
            </div>
            <button className="create-issue-button">
              <span className="plus-icon">+</span> Create issue
            </button>
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

      <StartSprintModal 
        isOpen={isStartSprintModalOpen}
        onClose={() => setIsStartSprintModalOpen(false)}
        sprintName={selectedSprint?.sprint_name || ''}
      />
    </div>
  );
};

export default Backlog;