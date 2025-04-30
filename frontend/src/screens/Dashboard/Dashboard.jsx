import axios from 'axios';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip
} from 'chart.js';
import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSprints } from '../../features/sprints/sprintSlice';
import Navbar from '../navbar/navbar';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const dispatch = useDispatch();
  const { selectedProjectId } = useSelector(state => state.projects);
  const { sprints } = useSelector(state => state.sprints);
  const { user } = useSelector(state => state.auth);

  const [categories, setCategories] = useState([]);
  const [complexities, setComplexities] = useState([]);
  const [users, setUsers] = useState([]);


  const [emotionUserId, setEmotionUserId] = useState('');
  const [emotionData, setEmotionData] = useState([]);
  const [reworkData, setReworkData] = useState(null);
  const [chartData, setChartData] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Productivity filters
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedComplexity, setSelectedComplexity] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedSprintId, setSelectedSprintId] = useState('');

  // Rework filters
  const [reworkCategory, setReworkCategory] = useState('');
  const [reworkComplexity, setReworkComplexity] = useState('');
  const [reworkUserId, setReworkUserId] = useState('');
  const [reworkSprintId, setReworkSprintId] = useState('');

  useEffect(() => {
    if (!selectedProjectId) return;
    dispatch(fetchSprints(selectedProjectId));
    fetchMetaData();
  }, [selectedProjectId]);

  useEffect(() => {
    if (!selectedProjectId || users.length === 0) return;
    fetchPerformance();
    fetchEmotionData();
  }, [selectedProjectId, selectedCategory, selectedComplexity, selectedUserId, selectedSprintId, users]);


  useEffect(() => {
    if (!selectedProjectId) return;
    fetchReworkEffort();
  }, [selectedProjectId, reworkCategory, reworkComplexity, reworkUserId, reworkSprintId]);

  const fetchMetaData = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/api/v1/meta/?project_id=${selectedProjectId}`);
      setCategories(res.data.categories);
      setComplexities(res.data.complexities);
      setUsers(res.data.users);
    } catch (err) {
      setError('Error loading metadata');
    }
  };

  const fetchPerformance = async () => {
    try {
      await axios.post(`http://localhost:8000/api/developer-performance/calculate_all/?project_id=${selectedProjectId}`);
      const params = {
        project_id: selectedProjectId,
        ...(selectedCategory && { task_category: selectedCategory }),
        ...(selectedComplexity && { task_complexity: selectedComplexity }),
        ...(selectedUserId && { user_id: selectedUserId }),
        ...(selectedSprintId && { sprint_id: selectedSprintId })
      };
      const res = await axios.get('http://localhost:8000/api/developer-performance/', { params });

      // Wait until users are loaded before building chart
      if (!users.length) {
        console.warn("User list not ready");
        return;
      }

      const grouped = {};
      res.data.forEach(item => {
        const key = String(item.user); // Normalize key
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(item.productivity);
      });

      const labels = Object.keys(grouped).map(userId => {
        const user = users.find(u => String(u.id) === userId); // Match types correctly
        return user ? user.name : `User ${userId}`;
      });

      const data = Object.values(grouped).map(productivities => {
        const avg = productivities.reduce((sum, val) => sum + val, 0) / productivities.length;
        return parseFloat(avg.toFixed(2));
      });

      setChartData({
        labels,
        datasets: [{
          label: 'Average Productivity',
          data,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          borderRadius: 5
        }]
      });
    } catch (err) {
      setError('Error loading productivity data');
    }
  };

  const fetchReworkEffort = async () => {
    try {
      const params = {
        project_id: selectedProjectId,
        ...(reworkCategory && { task_category: reworkCategory }),
        ...(reworkComplexity && { task_complexity: reworkComplexity }),
        ...(reworkUserId && { user_id: reworkUserId }),
        ...(reworkSprintId && { sprint_id: reworkSprintId })
      };
      const res = await axios.get('http://localhost:8000/api/v1/rework-effort/', { params });
      setReworkData(res.data);
    } catch (err) {
      console.error('Failed to fetch rework effort:', err);
    }
  };

  const fetchEmotionData = async () => {
    try {
      if (!selectedProjectId) {
        console.warn('No project selected');
        setEmotionData([]);
        return;
      }

      setError(null); // Clear any previous errors

      const config = {
        headers: {
          Authorization: `Bearer ${user?.access}`,
          'Content-Type': 'application/json',
        },
        params: {
          project_id: selectedProjectId
        }
      };

      const res = await axios.get('http://localhost:8000/emotion_detection/team_emotions/', config);
      if (res.data) {
        setEmotionData(res.data);
      } else {
        setEmotionData([]);
      }
    } catch (err) {
      console.error('Emotion data fetch failed:', err.response?.data || err.message);
      setError(err.response?.data?.detail || 'Failed to fetch emotion data');
      setEmotionData([]);
    }
  };

  const getEmotionChartData = () => {
    if (!emotionData.length) {
      return {
        labels: [],
        datasets: []
      };
    }

    const emotionTypes = ['happy', 'neutral', 'sad', 'angry', 'surprise', 'fear', 'disgust'];
    const colors = [
      'rgba(75, 192, 192, 0.6)',  // happy
      'rgba(54, 162, 235, 0.6)',  // neutral
      'rgba(255, 99, 132, 0.6)',  // sad
      'rgba(255, 159, 64, 0.6)',  // angry
      'rgba(153, 102, 255, 0.6)', // surprise
      'rgba(201, 203, 207, 0.6)', // fear
      'rgba(255, 205, 86, 0.6)'   // disgust
    ];

    // Filter by selected user only
    const filtered = emotionData.filter(d =>
      !emotionUserId || String(d.user?.id) === String(emotionUserId)
    );

    if (!filtered.length) {
      console.log('No data after filtering');
      return {
        labels: [],
        datasets: []
      };
    }

    // Group data by user
    const grouped = {};
    filtered.forEach(d => {
      const userKey = d.user?.name || d.user?.email || 'Anonymous';
      if (!grouped[userKey]) {
        grouped[userKey] = {
          emotions: [],
          weights: []
        };
      }
      // Only add emotions that are not empty or null
      if (d.first_emotion) grouped[userKey].emotions.push(d.first_emotion.toLowerCase());
      if (d.second_emotion) grouped[userKey].emotions.push(d.second_emotion.toLowerCase());
      if (d.third_emotion) grouped[userKey].emotions.push(d.third_emotion.toLowerCase());
    });

    const labels = Object.keys(grouped);

    const datasets = emotionTypes.map((emotion, idx) => ({
      label: emotion.charAt(0).toUpperCase() + emotion.slice(1),
      data: labels.map(user => {
        const userEmotions = grouped[user].emotions;
        return userEmotions.filter(e => e === emotion.toLowerCase()).length;
      }),
      backgroundColor: colors[idx],
      borderColor: colors[idx].replace('0.6', '1'),
      borderWidth: 2
    }));

    return { labels, datasets };
  };

  const emotionChartData = getEmotionChartData();


  const getReworkChartData = () => {
    if (!reworkData?.per_user) return null;
    return {
      labels: reworkData.per_user.map(u => {
        const found = users.find(user => user.id === u.user_id);
        return found?.name || `User ${u.getUserName}`;
      }),
      datasets: [{
        label: 'Rework Effort (hrs)',
        data: reworkData.per_user.map(u => u.rework),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 2,
        borderRadius: 4
      }]
    };
  };

  const handleGenerateReport = async () => {
    try {
      if (!user?.access) {
        alert('Please log in to generate reports');
        return;
      }

      setLoading(true);
      const config = {
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${user.access}`,
        },
      };

      const response = await axios.get(
        `http://localhost:8000/api/generate_dashboard_pdf/?project_id=${selectedProjectId}`,
        config
      );

      // Create a blob from the PDF stream
      const file = new Blob([response.data], { type: 'application/pdf' });

      // Create a link and trigger download
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileURL;
      link.download = `project-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(fileURL);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderEmotionsSection = () => {
    return (
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Emotional States by Developer</h3>

        <div className="mb-6">
          <select
            onChange={e => setEmotionUserId(e.target.value)}
            value={emotionUserId}
            className="w-full p-2 border rounded"
          >
            <option value=''>All Developers</option>
            {users.map((u, i) => (
              <option key={i} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
            <p>Error: {error}</p>
          </div>
        ) : emotionData.length === 0 || getEmotionChartData().labels.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-600 mb-2">No emotion data available</p>
            <p className="text-gray-500 text-sm">
              There is no emotion data recorded for the selected developer.
            </p>
          </div>
        ) : (
          <div className="chart-container" style={{ minHeight: "300px" }}>
            <Bar
              data={getEmotionChartData()}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                  legend: { position: 'top' },
                  title: {
                    display: true,
                    text: 'Detected Emotions per Team Member',
                    padding: 20
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    stacked: true,
                    title: {
                      display: true,
                      text: 'Number of Detections'
                    }
                  },
                  x: {
                    stacked: true,
                    title: {
                      display: true,
                      text: 'Team Members'
                    }
                  }
                }
              }}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100 p-8 mt-6 overflow-x-hidden">
        <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">📊 Developer Productivity Dashboard</h2>
            <button
              className="generate-report-button"
              onClick={handleGenerateReport}
              disabled={!selectedProjectId}
            >
              📄 Generate Report
            </button>
          </div>

          {/* Productivity Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <select onChange={e => setSelectedCategory(e.target.value)} className="p-2 border rounded"><option value=''>All Categories</option>{categories.map((c, i) => <option key={i} value={c}>{c}</option>)}</select>
            <select onChange={e => setSelectedComplexity(e.target.value)} className="p-2 border rounded"><option value=''>All Complexities</option>{complexities.map((c, i) => <option key={i} value={c}>{c}</option>)}</select>
            <select onChange={e => setSelectedUserId(e.target.value)} className="p-2 border rounded"><option value=''>All Developers</option>{users.map((u, i) => <option key={i} value={u.id}>{u.name}</option>)}</select>
            <select onChange={e => setSelectedSprintId(e.target.value)} className="p-2 border rounded"><option value=''>All Sprints</option>{sprints.map((s, i) => <option key={i} value={s.id}>{s.sprint_name || `Sprint ${s.id}`}</option>)}</select>
          </div>
          {/* Productivity Chart */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6 overflow-x-auto" style={{ height: '400px' }}>
            {error && <p className="text-red-500 text-center">{error}</p>}
            {chartData ? (
              <Bar
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  layout: {
                    padding: {
                      left: 5 // 👈 adjust as needed (e.g., 40, 50)
                    }
                  },
                  plugins: {
                    legend: { position: 'top' },
                    title: {
                      display: true,
                      text: 'Productivity Scores by User and Sprint'
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }}
              />

            ) : (
              <p className="text-center">No productivity data available.</p>
            )}
          </div>

          {/* Rework Filters */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Rework Effort by Developer</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <select onChange={e => setReworkCategory(e.target.value)} className="p-2 border rounded"><option value=''>All Categories</option>{categories.map((c, i) => <option key={i} value={c}>{c}</option>)}</select>
              <select onChange={e => setReworkComplexity(e.target.value)} className="p-2 border rounded"><option value=''>All Complexities</option>{complexities.map((c, i) => <option key={i} value={c}>{c}</option>)}</select>
              <select onChange={e => setReworkUserId(e.target.value)} className="p-2 border rounded"><option value=''>All Developers</option>{users.map((u, i) => <option key={i} value={u.id}>{u.name}</option>)}</select>
              <select onChange={e => setReworkSprintId(e.target.value)} className="p-2 border rounded"><option value=''>All Sprints</option>{sprints.map((s, i) => <option key={i} value={s.id}>{s.sprint_name || `Sprint ${s.id}`}</option>)}</select>
            </div>
            {reworkData && (
              <Bar
                data={getReworkChartData()}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: `Total Rework Effort: ${reworkData.total} hrs` }
                  },
                  scales: { y: { beginAtZero: true } }
                }}
              />
            )}
          </div>

          {/* Emotions */}
          {renderEmotionsSection()}

        </div>
      </div>
    </>
  );
};

export default Dashboard;