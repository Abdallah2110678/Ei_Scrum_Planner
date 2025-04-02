import { useState, useRef, useEffect } from "react";
import axios from "axios";

const AddUserModal = ({ onClose }) => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(null); // Track message type
  const modalRef = useRef();

  // Close modal if clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // Handle API request
  const handleSubmit = async () => {
    if (!email) {
      setMessage("Please enter an email.");
      setIsSuccess(false);
      return;
    }

    try {
      const response = await axios.post("http://127.0.0.1:8000/add-user-to-project/", {
        email,
        project_id: localStorage.getItem("selectedProjectId"), // Hardcoded project ID (replace with dynamic value if needed)
      });

      setMessage(response.data.message || "User added successfully!");
      setIsSuccess(true);
      setEmail(""); // Clear input field on success
    } catch (error) {
      setMessage(error.response?.data?.error || "An error occurred.");
      setIsSuccess(false);
    }
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center">
      <div ref={modalRef} className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-semibold mb-4">Add User to Project</h2>
        
        <input
          type="email"
          placeholder="Enter user email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-300"
        />

        {message && (
          <p className={`text-sm mt-2 ${isSuccess ? "text-green-500" : "text-red-500"}`}>
            {message}
          </p>
        )}

        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="mr-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400">
            Cancel
          </button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
            Add User
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddUserModal;
