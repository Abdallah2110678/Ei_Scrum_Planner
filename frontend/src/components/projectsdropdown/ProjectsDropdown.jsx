import { useState, useEffect, useRef } from "react";
import "./ProjectsDropdown.css";
import { getProjects, createProject } from "../../features/projects/projectService";

const ProjectsDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [projects, setProjects] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [projectName, setProjectName] = useState("");
    const dropdownRef = useRef(null);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const projectsData = await getProjects();
                console.log("Fetched Projects:", projectsData);
                if (Array.isArray(projectsData)) {
                    setProjects(projectsData);
                } else {
                    console.error("Invalid projects data format:", projectsData);
                }
            } catch (error) {
                console.error("Failed to fetch projects:", error);
            }
        };
        fetchProjects();
    }, []);

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

    const handleCreateProject = async (e) => {
        e.preventDefault();
        if (!projectName.trim()) return;

        try {
            const newProject = await createProject({ name: projectName });
            if (newProject) {
                setProjects((prevProjects) => [...prevProjects, newProject]);
                setProjectName("");
                setShowForm(false);
            }
        } catch (error) {
            console.error("Failed to create project");
        }
    };

    return (
        <div className="projects-dropdown" ref={dropdownRef}>
            <button className="dropdown-toggle" onClick={() => setIsOpen(!isOpen)}>
                Projects ▼
            </button>

            {isOpen && (
                <div className="dropdown-menu">
                    <ul>
                        {projects.length > 0 ? (
                            projects.map((project) => <li key={project.id}>{project.name}</li>)
                        ) : (
                            <li>No projects available</li>
                        )}
                    </ul>

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
