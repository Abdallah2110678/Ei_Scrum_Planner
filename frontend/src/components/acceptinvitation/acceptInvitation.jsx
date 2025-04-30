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
      <div className="flex justify-center items-center min-h-screen">
      <div className="text-center p-6 rounded-lg ">
        <h1 className="text-2xl font-bold mb-4">Status</h1>
        {message && <p className="text-green-600 mb-2">{message}</p>}
        {error && <p className="text-red-600 mb-2">{error}</p>}
      </div>
    </div>
    );
};

export default AcceptInvitation;