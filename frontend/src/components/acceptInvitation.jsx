// src/components/AcceptInvitation.js
import  { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const AcceptInvitation = () => {
    const { token } = useParams(); // Extract token from URL
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const acceptInvitation = async () => {
            try {
                const response = await axios.post(
                    `http://localhost:8000/accept-invitation/${token}/`, // Replace with your backend URL
                    {}, // No body needed for this POST request
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            // Add authentication token here if required (e.g., Authorization: Bearer <token>)
                        },
                    }
                );
                setMessage(response.data.message);
            } catch (err) {
                setError(err.response?.data?.error);
            }
        };

        acceptInvitation();
    }, [token]);

    return (
        <div>
            <h1>Accept Invitation</h1>
            {message && <p style={{ color: 'green' }}>{message}</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
};

export default AcceptInvitation;