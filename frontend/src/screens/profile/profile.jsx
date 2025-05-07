import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import axios from 'axios';
import { setCredentials } from '../../features/auth/authSlice'; // Make sure the path is correct
import './Profile.css';

const Profile = () => {
  const { user, userInfo } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: userInfo?.name || '',
    specialist: userInfo?.specialist || ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // Handle form input change
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Handle form submit to update profile
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.patch(
        'http://localhost:8000/api/v1/auth/users/me/', // Update the URL as needed
        formData,
        {
          headers: {
            Authorization: `Bearer ${user.access}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // If the profile is successfully updated, update Redux state and localStorage
      if (response.status === 200) {
        toast.success('Profile updated successfully');
        dispatch(setCredentials({ user: response.data, userInfo: response.data }));
        localStorage.setItem("userInfo", JSON.stringify(response.data));
        setIsEditing(false);  // Exit edit mode
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || 
        error.response?.data?.detail ||
        'Failed to update profile'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            <span className="avatar-text">{userInfo?.name?.charAt(0) || '?'}</span>
          </div>
          <div className="profile-title">
            <h2>My Profile</h2>
            <p className="profile-subtitle">Manage your profile information</p>
            <p className="profile-email">{userInfo?.email}</p>
          </div>
        </div>

        <div className="profile-content">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={userInfo.email}
                  disabled
                  className="input-disabled"
                />
              </div>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="input-field"
                />
              </div>
              <div className="form-group">
                <label>Specialist Role</label>
                <input
                  type="text"
                  name="specialist"
                  value={formData.specialist}
                  onChange={handleChange}
                  required
                  className="input-field"
                />
              </div>
              <div className="form-actions">
                <button
                  type="submit"
                  className="save-button"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      name: userInfo.name,
                      specialist: userInfo.specialist
                    });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-info">
              <div className="info-group">
                <label>Email Address</label>
                <p className="info-value">{userInfo.email}</p>
              </div>
              <div className="info-group">
                <label>Full Name</label>
                <p className="info-value">{userInfo.name}</p>
              </div>
              <div className="info-group">
                <label>Specialist Role</label>
                <p className="info-value">{userInfo.specialist}</p>
              </div>
              <button
                className="edit-button"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
