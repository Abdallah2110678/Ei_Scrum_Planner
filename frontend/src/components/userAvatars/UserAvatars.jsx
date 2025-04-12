import React from 'react';
import './UserAvatars.css';
import { useSelector } from 'react-redux';

const UserAvatars = ({ onUserSelect, selectedUserId }) => {
    const { developers } = useSelector((state) => state.projects);

    // Function to get initials from a name
    const getInitials = (name) => {
        if (!name) return "N/A";
        const nameParts = name.split(" ");
        return nameParts.length > 1
            ? `${nameParts[0][0]}${nameParts[1][0]}`
            : nameParts[0][0] || "N/A";
    };

    return (
        <div className="user-avatars-container">
            {developers?.users?.map((user) => (
                <div
                    key={user.id}
                    className={`user-avatar ${selectedUserId === user.id ? 'selected' : ''}`}
                    onClick={() => onUserSelect(selectedUserId === user.id ? null : user.id)}
                    title={user.name}
                >
                    {getInitials(user.name)}
                </div>
            ))}
        </div>
    );
};

export default UserAvatars; 