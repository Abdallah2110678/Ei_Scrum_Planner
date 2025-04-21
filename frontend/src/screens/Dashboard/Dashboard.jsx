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
import { Bar, Line } from 'react-chartjs-2';
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
    if (!selectedProjectId) return;
    fetchPerformance();
    fetchEmotionData();
  }, [selectedProjectId, selectedCategory, selectedComplexity, selectedUserId, selectedSprintId]);

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

      const grouped = {};
      res.data.forEach(item => {
        if (!grouped[item.user]) grouped[item.user] = [];
        grouped[item.user].push(item.productivity);
      });

      const labels = Object.keys(grouped).map(userId => {
        const user = users.find(u => u.id === parseInt(userId));
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
      const config = { headers: { Authorization: `Bearer ${user?.access}` } };
      const res = await axios.get('http://localhost:8000/emotion_detection/team_emotions/', config);
      setEmotionData(res.data || []);
    } catch (err) {
      console.error('Emotion data fetch failed:', err);
    }
  };

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

  const getEmotionChartData = () => {
    if (!emotionData.length) return null;
    const emotionTypes = ['happy', 'sad', 'angry', 'neutral', 'surprised'];
    const colors = ['rgba(75, 192, 192, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 99, 132, 0.6)', 'rgba(255, 205, 86, 0.6)', 'rgba(153, 102, 255, 0.6)'];
    return {
      labels: emotionData.map(d => d.user?.name || d.user_email || 'Anonymous'),
      datasets: emotionTypes.map((emotion, idx) => ({
        label: emotion.charAt(0).toUpperCase() + emotion.slice(1),
        data: emotionData.map(d => [d.first_emotion, d.second_emotion, d.third_emotion].filter(e => e === emotion).length),
        backgroundColor: colors[idx],
        borderColor: colors[idx].replace('0.6', '1'),
        borderWidth: 2
      }))
    };
  };

  const handleGenerateReport = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8000/generates_report/generate_dashboard_pdf/?project_id=${selectedProjectId}`,
        {
          responseType: 'blob',
          headers: {
            Authorization: `Bearer ${user?.access}`,
          },
        }
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
    }
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
          {emotionData.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Emotional States by Developer</h3>
              <Line data={getEmotionChartData()} options={{ responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Detected Emotions per Team Member' } }, scales: { y: { beginAtZero: true } } }} />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;