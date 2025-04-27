import { useEffect, useRef, useState } from "react";
import { FaCheck, FaEdit, FaTimes } from 'react-icons/fa';
import { useDispatch, useSelector } from "react-redux";
import { createNewProject, fetchProjects, resetProjectState, setSelectedProjectId, updateProject } from "../../features/projects/projectSlice";
import "./ProjectsDropdown.css";

const ProjectsDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [projectName, setProjectName] = useState("");
    const dropdownRef = useRef(null);
    const [editingProjectId, setEditingProjectId] = useState(null);
    const [editedProjectName, setEditedProjectName] = useState("");
    const [editError, setEditError] = useState("");

    const dispatch = useDispatch();
    const { projects, isLoading, isError, message, selectedProjectId } = useSelector((state) => state.projects);
    const { userInfo } = useSelector((state) => state.auth);
    const userId = userInfo?.id;

    // Debug logging for state
    useEffect(() => {
        console.log('Current selectedProjectId:', selectedProjectId);
        console.log('Available projects:', projects);
    }, [selectedProjectId, projects]);

    useEffect(() => {
        if (userId && Number.isInteger(userId)) {
            dispatch(fetchProjects(userId));
        }
    }, [dispatch, userId]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                if (editingProjectId) {
                    setEditingProjectId(null);
                    setEditedProjectName("");
                }
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [editingProjectId]);

    const handleProjectSelect = async (project) => {
        try {
            // If we're editing, don't select the project
            if (editingProjectId === project.id) {
                return;
            }

            console.log('Attempting to select project:', project);
            console.log('Current selectedProjectId:', selectedProjectId);

            if (selectedProjectId === project.id) {
                console.log('Already on this project, no action needed');
                setIsOpen(false);
                return;
            }

            console.log('Resetting project state...');
            dispatch(resetProjectState());

            await new Promise(resolve => setTimeout(resolve, 100));

            console.log('Setting new project ID:', project.id);
            await dispatch(setSelectedProjectId(project.id));

            setIsOpen(false);

            if (userId) {
                console.log('Fetching updated project data...');
                await dispatch(fetchProjects(userId));
            }

            window.location.reload();
        } catch (error) {
            console.error("Failed to select project:", error);
        }
    };

    const handleSaveProjectName = async (projectId) => {
        if (!editedProjectName.trim()) {
            setEditError("Project name cannot be empty");
            return;
        }

        try {
            console.log('Attempting to update project:', projectId, editedProjectName);

            // Update the project
            const result = await dispatch(updateProject({
                id: projectId,
                projectData: { name: editedProjectName.trim() }
            })).unwrap();

            console.log('Project update result:', result);

            // Reset editing state
            setEditingProjectId(null);
            setEditedProjectName("");
            setEditError("");

            // Refresh projects list
            if (userId) {
                await dispatch(fetchProjects(userId));
            }
        } catch (error) {
            console.error("Failed to update project name:", error);
            setEditError(error.message || "Failed to update project name");
        }
    };

    const handleStartEditing = (project) => {
        setEditingProjectId(project.id);
        setEditedProjectName(project.name);
        setEditError("");
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        if (!projectName.trim()) return;

        try {
            const result = await dispatch(createNewProject({ name: projectName, user_id: userId })).unwrap();
            setProjectName("");
            setShowForm(false);
            setIsOpen(false);

            // Refresh projects list and select the new project
            await dispatch(fetchProjects(userId));

            // Make sure we have the project data with ID before selecting it
            if (result && result.id) {
                dispatch(setSelectedProjectId(result.id));
            }
        } catch (error) {
            console.error(" Failed to create project:", error.message);
            // Show error to user
            alert(`Failed to create project: ${error.message}`);
        }
    };

    return (
        <div className="projects-dropdown" ref={dropdownRef}>
            <button
                className="dropdown-toggle"
                onClick={() => {
                    console.log('Toggle dropdown. Current state:', !isOpen);
                    setIsOpen(!isOpen);
                }}
            >
                {selectedProjectId
                    ? (projects.find(p => p.id === selectedProjectId)?.name || "Loading...")
                    : "Select a Project"} ▼
            </button>
            {isOpen && (
                <div className="dropdown-menu">
                    {isLoading ? (
                        <p>Loading...</p>
                    ) : isError ? (
                        <p className="error-message">Error: {message}</p>
                    ) : (
                        <ul>
                            {projects.map((project) => (
                                <li key={project.id} className="project-list-item">
                                    {editingProjectId === project.id ? (
                                        <div className="edit-project-container">
                                            <input
                                                type="text"
                                                value={editedProjectName}
                                                onChange={(e) => {
                                                    setEditedProjectName(e.target.value);
                                                    setEditError("");
                                                }}
                                                onBlur={() => {
                                                    if (editedProjectName.trim() !== project.name) {
                                                        handleSaveProjectName(project.id);
                                                    } else {
                                                        setEditingProjectId(null);
                                                        setEditError("");
                                                    }
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        if (editedProjectName.trim() !== project.name) {
                                                            handleSaveProjectName(project.id);
                                                        } else {
                                                            setEditingProjectId(null);
                                                            setEditError("");
                                                        }
                                                    } else if (e.key === 'Escape') {
                                                        setEditingProjectId(null);
                                                        setEditedProjectName("");
                                                        setEditError("");
                                                    }
                                                }}
                                                autoFocus
                                                className={`edit-project-input ${editError ? 'error' : ''}`}
                                                placeholder="Enter project name"
                                            />
                                            <div className="edit-actions">
                                                <button
                                                    className="edit-action-btn save"
                                                    onClick={() => handleSaveProjectName(project.id)}
                                                    title="Save"
                                                >
                                                    <FaCheck />
                                                </button>
                                                <button
                                                    className="edit-action-btn cancel"
                                                    onClick={() => {
                                                        setEditingProjectId(null);
                                                        setEditedProjectName("");
                                                        setEditError("");
                                                    }}
                                                    title="Cancel"
                                                >
                                                    <FaTimes />
                                                </button>
                                            </div>
                                            {editError && <div className="edit-error-message">{editError}</div>}
                                        </div>
                                    ) : (
                                            <div className="project-name-container">
                                                <span
                                                    onClick={() => handleProjectSelect(project)}
                                                className={`project-name ${selectedProjectId === project.id ? 'selected' : ''}`}
                                                >
                                                    {project.name}
                                                </span>
                                                <button
                                                    className="edit-icon-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Prevent project selection
                                                        handleStartEditing(project);
                                                    }}
                                                    title="Edit project name"
                                                >
                                                    <FaEdit />
                                                </button>
                                            </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                    <button className="create-project-btn" onClick={() => setShowForm(true)}>
                        + Create Project
                    </button>
                </div>
            )}

            {showForm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Create New Project</h2>
                        <form onSubmit={handleCreateProject}>
                            <input
                                type="text"
                                placeholder="Project Name"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                required
                            />
                            <div className="modal-actions">
                                <button type="submit" className="modal-submit">Create</button>
                                <button type="button" className="modal-cancel" onClick={() => setShowForm(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectsDropdown;
