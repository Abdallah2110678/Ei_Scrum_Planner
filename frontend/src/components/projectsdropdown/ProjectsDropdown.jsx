import { useState, useEffect, useRef } from "react";
import "./ProjectsDropdown.css";
import { getProjects, createProject } from "../../features/projects/projectService";

const ProjectsDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [projects, setProjects] = useState([]);
    const dropdownRef = useRef(null);

    // Fetch projects on component mount
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const projectsData = await getProjects();
                console.log("Fetched Projects:", projectsData); // Debugging log
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

    const handleCreateProject = async () => {
        const projectName = prompt("Enter Project Name:");
        if (!projectName) return;

        try {
            const newProject = await createProject({ name: projectName });
            if (newProject) {
                setProjects((prevProjects) => [...prevProjects, newProject]);
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
                    <button className="create-project-btn" onClick={handleCreateProject}>
                        + Create Project
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProjectsDropdown;
