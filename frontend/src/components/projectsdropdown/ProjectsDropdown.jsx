import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProjects, createNewProject } from "../../features/projects/projectSlice";
import "./ProjectsDropdown.css";

const ProjectsDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [projectName, setProjectName] = useState("");
    const dropdownRef = useRef(null);

    const dispatch = useDispatch();
    const { projects, isLoading, isError, message } = useSelector((state) => state.projects);

    // Fetch projects on mount
    useEffect(() => {
        dispatch(fetchProjects());
    }, [dispatch]);

    // Close dropdown when clicking outside
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

    // Handle Project Creation
    const handleCreateProject = async (e) => {
        e.preventDefault();
        if (!projectName.trim()) return;

        try {
            await dispatch(createNewProject({ name: projectName })).unwrap();
            setProjectName("");
            setShowForm(false);
            setIsOpen(false);
            dispatch(fetchProjects()); // ✅ Re-fetch projects
        } catch (error) {
            console.error("🚨 Failed to create project:", error);
        }
    };

    return (
        <div className="projects-dropdown" ref={dropdownRef}>
            <button className="dropdown-toggle" onClick={() => setIsOpen(!isOpen)}>
                Projects ▼
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
                                <li key={project.id}>{project.name}</li>
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
