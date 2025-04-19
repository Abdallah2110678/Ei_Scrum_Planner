import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import Navbar from '../navbar/navbar';
import { fetchSprints } from '../../features/sprints/sprintSlice';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const dispatch = useDispatch();
  const { selectedProjectId } = useSelector(state => state.projects);
  const { sprints } = useSelector(state => state.sprints);
  const { user } = useSelector(state => state.auth);

  const [categories, setCategories] = useState([]);
  const [complexities, setComplexities] = useState([]);
  const [users, setUsers] = useState([]);
  const [reworkData, setReworkData] = useState(null);
  const [emotionData, setEmotionData] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedComplexity, setSelectedComplexity] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedSprintId, setSelectedSprintId] = useState('');

  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!selectedProjectId) return;

    dispatch(fetchSprints(selectedProjectId)); // ✅ Only for current project
    fetchMetaData();
  }, [selectedProjectId]);

  useEffect(() => {
    if (!selectedProjectId) return;
    fetchPerformance();
    fetchReworkEffort();
    fetchEmotionData();
  }, [selectedProjectId, selectedCategory, selectedComplexity, selectedUserId, selectedSprintId]);

  const fetchMetaData = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/api/v1/meta/?project_id=${selectedProjectId}`);
      setCategories(res.data.categories);
      setComplexities(res.data.complexities);
      setUsers(res.data.users);
    } catch (err) {
      console.error('Meta fetch failed:', err);
      setError('Error loading metadata');
    }
  };

  const fetchPerformance = async () => {
    setLoading(true);
    try {
      const params = {
        project_id: selectedProjectId,
        ...(selectedCategory && { task_category: selectedCategory }),
        ...(selectedComplexity && { task_complexity: selectedComplexity }),
        ...(selectedUserId && { user_id: selectedUserId }),
        ...(selectedSprintId && { sprint_id: selectedSprintId })
      };
      const res = await axios.get('http://localhost:8000/api/developer-performance/', { params });
      const data = res.data;

      const getUserName = (userId) => users.find(u => u.id === userId)?.name || `User ${userId}`;
      const labels = data.map(item => `${getUserName(item.user)} (S${item.sprint || '-'})`);
      const productivity = data.map(item => parseFloat(item.productivity.toFixed(2)));

      setChartData({
        labels,
        datasets: [{
          label: 'Productivity',
          data: productivity,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          borderRadius: 5
        }]
      });
    } catch (err) {
      console.error('Performance fetch failed:', err);
      setError('Error loading performance data');
    } finally {
      setLoading(false);
    }
  };

  const fetchReworkEffort = async () => {
    try {
      const params = {
        project_id: selectedProjectId,
        ...(selectedCategory && { task_category: selectedCategory }),
        ...(selectedComplexity && { task_complexity: selectedComplexity }),
        ...(selectedUserId && { user_id: selectedUserId }),
        ...(selectedSprintId && { sprint_id: selectedSprintId })
      };
      const res = await axios.get('http://localhost:8000/api/v1/rework-effort/', { params });
      setReworkData(res.data);
    } catch (err) {
      console.error('Failed to fetch rework effort:', err);
    }
  };

  const fetchEmotionData = async () => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${user?.access}` }
      };
      const res = await axios.get('http://localhost:8000/emotion_detection/team_emotions/', config);
      setEmotionData(res.data || []);
    } catch (err) {
      console.error('Emotion data fetch failed:', err);
    }
  };

  const getReworkChartData = () => {
    if (!reworkData || !reworkData.per_user) return null;
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
    const colors = [
      'rgba(75, 192, 192, 0.6)',
      'rgba(54, 162, 235, 0.6)',
      'rgba(255, 99, 132, 0.6)',
      'rgba(255, 205, 86, 0.6)',
      'rgba(153, 102, 255, 0.6)'
    ];
    const datasets = emotionTypes.map((emotion, idx) => ({
      label: emotion.charAt(0).toUpperCase() + emotion.slice(1),
      data: emotionData.map(d =>
        [d.first_emotion, d.second_emotion, d.third_emotion].filter(e => e === emotion).length
      ),
      backgroundColor: colors[idx],
      borderColor: colors[idx].replace('0.6', '1'),
      borderWidth: 2
    }));
    return {
      labels: emotionData.map(d => d.user?.name || d.user_email || 'Anonymous'),
      datasets
    };
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100 p-8 mt-6 overflow-x-hidden">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">📊 Developer Productivity Dashboard</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <select onChange={e => setSelectedCategory(e.target.value)} className="p-2 border rounded">
              <option value=''>All Categories</option>
              {categories.map((c, i) => <option key={i} value={c}>{c}</option>)}
            </select>
            <select onChange={e => setSelectedComplexity(e.target.value)} className="p-2 border rounded">
              <option value=''>All Complexities</option>
              {complexities.map((c, i) => <option key={i} value={c}>{c}</option>)}
            </select>
            <select onChange={e => setSelectedUserId(e.target.value)} className="p-2 border rounded">
              <option value=''>All Developers</option>
              {users.map((u, i) => <option key={i} value={u.id}>{u.name}</option>)}
            </select>
            <select onChange={e => setSelectedSprintId(e.target.value)} className="p-2 border rounded">
              <option value=''>All Sprints</option>
              {sprints.map((s, i) => <option key={i} value={s.id}>{s.sprint_name || `Sprint ${s.id}`}</option>)}
            </select>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6 overflow-x-auto">
            {loading ? <p className="text-center">Loading productivity...</p> : error ? <p className="text-red-500 text-center">{error}</p> : chartData ? (
              <Bar
                key={'productivity-' + chartData?.labels?.join(',')}
                data={chartData}
                options={{ responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Productivity Scores by User and Sprint' } }, scales: { y: { beginAtZero: true } } }}
              />
            ) : <p className="text-center">No productivity data available.</p>}
          </div>

          {reworkData && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Rework Effort by Developer</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <select onChange={e => setSelectedCategory(e.target.value)} className="p-2 border rounded">
                  <option value=''>All Categories</option>
                  {categories.map((c, i) => <option key={i} value={c}>{c}</option>)}
                </select>
                <select onChange={e => setSelectedComplexity(e.target.value)} className="p-2 border rounded">
                  <option value=''>All Complexities</option>
                  {complexities.map((c, i) => <option key={i} value={c}>{c}</option>)}
                </select>
                <select onChange={e => setSelectedUserId(e.target.value)} className="p-2 border rounded">
                  <option value=''>All Developers</option>
                  {users.map((u, i) => <option key={i} value={u.id}>{u.name}</option>)}
                </select>
                <select onChange={e => setSelectedSprintId(e.target.value)} className="p-2 border rounded">
                  <option value=''>All Sprints</option>
                  {sprints.map((s, i) => <option key={i} value={s.id}>{s.sprint_name || `Sprint ${s.id}`}</option>)}
                </select>
              </div>
              {selectedSprintId && (
                <p className="mb-4 text-sm text-gray-600">
                  {reworkData?.per_user?.some(user => user.rework > 0)
                    ? 'There was rework effort in this sprint.'
                    : 'No rework effort recorded in this sprint.'}
                </p>
              )}
              <Bar
                key={'rework-' + reworkData?.per_user?.map(u => u.name).join(',')}
                data={getReworkChartData()}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'top' },
                    title: {
                      display: true,
                      text: `Total Rework Effort: ${reworkData.total} hrs`
                    }
                  },
                  scales: {
                    y: { beginAtZero: true }
                  }
                }}
              />
            </div>
          )}

          {emotionData.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Emotional States by Developer</h3>
              <Line
                key={'emotion-' + emotionData?.map(d => d.user?.name || d.user_email).join(',')}
                data={getEmotionChartData()}
                options={{ responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Detected Emotions per Team Member' } }, scales: { y: { beginAtZero: true } } }}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;
