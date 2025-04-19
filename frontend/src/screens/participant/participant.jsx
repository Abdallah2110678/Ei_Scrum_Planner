import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchProjectParticipants } from '../../features/projects/projectSlice';
import axios from 'axios';

const ParticipantsPage = () => {
  const dispatch = useDispatch();
  const { selectedProjectId, participants, isLoading, isError, message } = useSelector((state) => state.projects);
  const projectId = localStorage.getItem("selectedProjectId");

  const [email, setEmail] = useState("");
  const [addMessage, setAddMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(null);

  useEffect(() => {
    if (selectedProjectId) {
      dispatch(fetchProjectParticipants(selectedProjectId));
    }
  }, [dispatch, selectedProjectId]);

  const handleAddUser = async () => {
    if (!email) {
      setAddMessage("Please enter an email.");
      setIsSuccess(false);
      return;
    }

    try {
      const response = await axios.post("http://127.0.0.1:8000/add-user-to-project/", {
        email,
        project_id: projectId,
      });

      setAddMessage(response.data.message || "User added successfully!");
      setIsSuccess(true);
      setEmail("");

      dispatch(fetchProjectParticipants(projectId));
    } catch (error) {
      setAddMessage(error.response?.data?.error || "An error occurred.");
      setIsSuccess(false);
    }
  };

  if (isLoading) return <div className="text-gray-500 text-center">Loading...</div>;
  if (isError) return <div className="text-red-500 text-center">{message}</div>;
  if (!participants) return <div className="text-gray-500 text-center">No participants data available.</div>;

  return (
    <div className="ml-0 md:ml-[220px] px-4 py-8 mt-6 bg-gray-50 overflow-x-hidden">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Project: {participants.project_name}</h1>
        <h2 className="text-lg font-semibold text-gray-600">Participants</h2>
      </div>

      {/* Add New Member */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Add New Member</h3>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <input
            type="email"
            placeholder="Enter user email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 p-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-300"
          />
          <button
            onClick={handleAddUser}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 whitespace-nowrap"
          >
            Add User
          </button>
        </div>
        {addMessage && (
          <p className={`text-sm mt-2 ${isSuccess ? "text-green-500" : "text-red-500"}`}>
            {addMessage}
          </p>
        )}
      </div>

      {/* Participants List */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">All Participants</h3>
        {participants.users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialist</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {participants.users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.specialist}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center">No participants found for this project.</p>
        )}
      </div>
    </div>
  );
};

export default ParticipantsPage;
