import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { fetchSprints } from "../../features/sprints/sprintSlice";
import "./StartSprintModal.css"; // Assuming you have a CSS file for styling

const StartSprintModal = ({ isOpen, onClose, sprintName, sprintId, projectId }) => {
    const dispatch = useDispatch();
    const [formData, setFormData] = useState({
        sprintName: sprintName,
        duration: "2 weeks",
        startDate: "",
        endDate: "",
        sprintGoal: "",
    });

    useEffect(() => {
        if (isOpen) {
            const now = new Date();
            const startDate = now.toISOString().split("T")[0];
            const endDate = new Date(now.setDate(now.getDate() + 14))
                .toISOString()
                .split("T")[0];

            setFormData((prev) => ({
                ...prev,
                startDate,
                endDate,
            }));
        }
    }, [isOpen]);

    const handleDurationChange = (e) => {
        const duration = e.target.value;
        const startDate = new Date(formData.startDate);
        let endDate;

        switch (duration) {
            case "1 week":
                endDate = new Date(startDate.setDate(startDate.getDate() + 7));
                break;
            case "2 weeks":
                endDate = new Date(startDate.setDate(startDate.getDate() + 14));
                break;
            case "3 weeks":
                endDate = new Date(startDate.setDate(startDate.getDate() + 21));
                break;
            case "4 weeks":
                endDate = new Date(startDate.setDate(startDate.getDate() + 28));
                break;
            case "custom":
                return setFormData({ ...formData, duration });
            default:
                endDate = new Date(startDate.setDate(startDate.getDate() + 14));
        }

        if (duration !== "custom") {
            setFormData({
                ...formData,
                duration,
                endDate: endDate.toISOString().split("T")[0],
            });
        }
    };

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.sprintName || !formData.startDate || !projectId) {
            alert("Sprint Name, Start Date, and Project are required!");
            return;
        }

        const durationMapping = {
            "1 week": 7,
            "2 weeks": 14,
            "3 weeks": 21,
            "4 weeks": 28,
            custom: 0,
        };

        try {
            const response = await fetch(
                sprintId
                    ? `http://localhost:8000/api/v1/sprints/${sprintId}/`
                    : `http://localhost:8000/api/v1/sprints/`,
                {
                    method: sprintId ? "PATCH" : "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        sprint_name: formData.sprintName,
                        duration: durationMapping[formData.duration] || 14,
                        start_date: formData.startDate,
                        sprint_goal: formData.sprintGoal,
                        project: parseInt(projectId, 10),
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                console.error("❌ Backend Error Response:", data);
                throw new Error(data.message || "Failed to create/update sprint");
            }

            console.log("✅ Sprint created/updated:", data);
            onClose();
            dispatch(fetchSprints());
        } catch (error) {
            console.error("❌ Error Creating Sprint:", error);
            alert("Error creating sprint: " + error.message);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2 className="modal-title">Start Sprint</h2>
                <p><b>1</b> issue will be included in this sprint.</p>
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
                        <select value={formData.duration} onChange={handleDurationChange} required>
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
                        <p className="planned-date">Planned start date: {formData.startDate}</p>
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
                            style={{ backgroundColor: "white" }}
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

export default StartSprintModal;
