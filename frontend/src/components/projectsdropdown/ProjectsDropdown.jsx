import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProjects, createNewProject, setSelectedProjectId, updateProject } from "../../features/projects/projectSlice";
import "./ProjectsDropdown.css";

const ProjectsDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [projectName, setProjectName] = useState("");
    const dropdownRef = useRef(null);
    const [editingProjectId, setEditingProjectId] = useState(null);
    const [editedProjectName, setEditedProjectName] = useState("");

    const dispatch = useDispatch();
    const { projects, isLoading, isError, message, selectedProjectId } = useSelector((state) => state.projects);
    const { userInfo } = useSelector((state) => state.auth);
    const userId = userInfo?.id;

    useEffect(() => {
        if (userId && Number.isInteger(userId)) {
            dispatch(fetchProjects(userId));
        }
    }, [dispatch, userId]);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleProjectSelect = (project) => {
        dispatch(setSelectedProjectId(project.id)); // Save in Redux + localStorage
        setIsOpen(false);
    };
    const handleSaveProjectName = async (projectId) => {
        if (!editedProjectName.trim()) return;

        try {
            await dispatch(updateProject({
                id: projectId,
                projectData: { name: editedProjectName }
            })).unwrap();

            // ✅ FETCH UPDATED LIST AGAIN
            if (userId) {
                await dispatch(fetchProjects(userId));
            }

            setEditingProjectId(null);
            setEditedProjectName("");
        } catch (error) {
            console.error("Failed to update project name:", error);
            alert("Could not update project name.");
        }
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
            <button className="dropdown-toggle" onClick={() => setIsOpen(!isOpen)}>
                {selectedProjectId ? projects.find(p => p.id === selectedProjectId)?.name : "Select a Project"} ▼
            </button>
            {isOpen && (
                <div className="dropdown-menu">
                    {isLoading ? <p>Loading...</p> : isError ? <p className="error-message">Error: {message}</p> : (
                        <ul>
                            {projects.map((project) => (
                                <li key={project.id}>
                                    {editingProjectId === project.id ? (
                                        <input
                                            type="text"
                                            value={editedProjectName}
                                            onChange={(e) => setEditedProjectName(e.target.value)}
                                            onBlur={() => handleSaveProjectName(project.id)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") handleSaveProjectName(project.id);
                                                if (e.key === "Escape") setEditingProjectId(null);
                                            }}
                                            autoFocus
                                            className="edit-project-input"
                                        />
                                    ) : (
                                        <span
                                            onClick={() => handleProjectSelect(project)}
                                            onDoubleClick={() => {
                                                setEditingProjectId(project.id);
                                                setEditedProjectName(project.name);
                                            }}
                                            className="project-name"
                                        >
                                            {project.name}
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}

                    <button className="create-project-btn" onClick={() => setShowForm(true)}>+ Create Project</button>
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
