import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchSprints } from '../../features/sprints/sprintSlice';
import { fetchTasks } from '../../features/tasks/taskSlice';
import { Bar, Line, Pie } from 'react-chartjs-2';
import Navbar from '../navbar/navbar';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './Dashboard.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const dispatch = useDispatch();
  const { sprints } = useSelector((state) => state.sprints);
  const { tasks } = useSelector((state) => state.tasks);
  const { selectedProjectId } = useSelector((state) => state.projects);
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [emotionData, setEmotionData] = useState([]);
  const [error, setError] = useState(null);

  // Function to fetch emotion data from backend
  const fetchEmotionData = async () => {
    try {
      // Get auth token from user state or localStorage
      const authToken = user?.access;
      
      if (!authToken) {
        setError('Authentication required. Please log in again.');
        console.warn('No authentication token available for emotion data fetch');
        return [];
      }
      
      // Set up headers with authentication token
      const config = {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        }
      };
      
      // Fetch all team members' emotion data
      const response = await axios.get('http://localhost:8000/emotion_detection/team_emotions/', config);
      
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      } else {
        console.warn('Invalid emotion data format returned from API');
        return [];
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError('Session expired or unauthorized. Please log in again.');
      } else {
        setError(`Error fetching emotion data: ${err.message}`);
      }
      console.error('Error fetching emotion data:', err);
      return [];
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (selectedProjectId && selectedProjectId !== 'undefined') {
          await dispatch(fetchSprints(selectedProjectId)).unwrap();
          await dispatch(fetchTasks({ project: selectedProjectId })).unwrap();
          
          // Fetch real emotion data
          const emotionResults = await fetchEmotionData();
          setEmotionData(emotionResults);
        } else {
          // If no project is selected, show a message or default data
          console.log('No project selected. Please select a project in the Backlog view.');
          // Clear any existing data
          setEmotionData([]);
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        setError("Error loading dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [dispatch, selectedProjectId, user]);

  // Calculate productivity by sprint (completed tasks / total tasks)
  const getProductivityBySprintData = () => {
    const sprintData = sprints.map(sprint => {
      const sprintTasks = tasks.filter(task => task.sprint === sprint.id);
      const completedTasks = sprintTasks.filter(task => task.status === 'DONE').length;
      const totalTasks = sprintTasks.length || 1; // Avoid division by zero
      const productivity = (completedTasks / totalTasks) * 100;

      return {
        sprintName: sprint.sprint_name,
        productivity: productivity.toFixed(2)
      };
    });

    return {
      labels: sprintData.map(data => data.sprintName),
      datasets: [
        {
          label: 'Productivity (%)',
          data: sprintData.map(data => data.productivity),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  // Calculate rework by sprint (tasks that moved from DONE back to other statuses)
  const getReworkBySprintData = () => {
    // In a real implementation, you would track task history
    // For now, we'll use mock data
    const sprintData = sprints.map(sprint => ({
      sprintName: sprint.sprint_name,
      rework: Math.floor(Math.random() * 30) // Mock rework percentage
    }));

    return {
      labels: sprintData.map(data => data.sprintName),
      datasets: [
        {
          label: 'Rework (%)',
          data: sprintData.map(data => data.rework),
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  // Calculate productivity by developer
  const getProductivityByDeveloperData = () => {
    // Group tasks by developer and calculate productivity
    const developers = [...new Set(tasks.map(task => task.user_initials || 'Unassigned'))];

    const developerData = developers.map(developer => {
      const developerTasks = tasks.filter(task => (task.user_initials || 'Unassigned') === developer);
      const completedTasks = developerTasks.filter(task => task.status === 'DONE').length;
      const totalTasks = developerTasks.length || 1; // Avoid division by zero
      const productivity = (completedTasks / totalTasks) * 100;

      return {
        developer,
        productivity: productivity.toFixed(2)
      };
    });

    return {
      labels: developerData.map(data => data.developer),
      datasets: [
        {
          label: 'Productivity (%)',
          data: developerData.map(data => data.productivity),
          backgroundColor: [
            'rgba(54, 162, 235, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)',
            'rgba(255, 99, 132, 0.6)',
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(255, 99, 132, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  // Calculate rework by developer
  const getReworkByDeveloperData = () => {
    // In a real implementation, you would track task history
    // For now, we'll use mock data
    const developers = [...new Set(tasks.map(task => task.user_initials || 'Unassigned'))];

    const developerData = developers.map(developer => ({
      developer,
      rework: Math.floor(Math.random() * 30) // Mock rework percentage
    }));

    return {
      labels: developerData.map(data => data.developer),
      datasets: [
        {
          label: 'Rework (%)',
          data: developerData.map(data => data.rework),
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(255, 159, 64, 0.6)',
            'rgba(255, 205, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(54, 162, 235, 0.6)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(255, 205, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(54, 162, 235, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  // Calculate emotions by developer using real fetched data
  const getEmotionsByDeveloperData = () => {
    if (!emotionData.length) return null;

    const emotionTypes = ['happy', 'sad', 'angry', 'neutral', 'surprised'];
    const colors = [
      'rgba(75, 192, 192, 0.6)', // happy - teal
      'rgba(54, 162, 235, 0.6)', // sad - blue
      'rgba(255, 99, 132, 0.6)', // angry - red
      'rgba(255, 205, 86, 0.6)', // neutral - yellow
      'rgba(153, 102, 255, 0.6)', // surprised - purple
    ];

    const datasets = emotionTypes.map((emotion, index) => {
      return {
        label: emotion.charAt(0).toUpperCase() + emotion.slice(1),
        data: emotionData.map(data => {
          // Count occurrences of this emotion type in user's emotions
          const count = [data.first_emotion, data.second_emotion, data.third_emotion]
            .filter(e => e === emotion).length;
          return count;
        }),
        backgroundColor: colors[index],
        borderColor: colors[index].replace('0.6', '1'),
        borderWidth: 1,
      };
    });

    return {
      labels: emotionData.map(data => data.user?.name || data.user_email || 'Anonymous'),
      datasets,
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        font: {
          size: 16,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  if (loading) {
    return <div className="dashboard-loading">Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="dashboard-error">Error: {error}</div>;
  }

  return (
    <div className="dashboard-container">
      <Navbar />
      <div className="dashboard-header">
        <h2>Dashboard</h2>
        <p>Project performance metrics and analytics</p>
      </div>

      <div className="dashboard-grid">
        <div className="chart-container">
          <h3>Productivity by Sprint</h3>
          <div className="chart-wrapper">
            <Bar
              data={getProductivityBySprintData()}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  title: {
                    ...chartOptions.plugins.title,
                    text: 'Percentage of Completed Tasks per Sprint',
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="chart-container">
          <h3>Rework by Sprint</h3>
          <div className="chart-wrapper">
            <Bar
              data={getReworkBySprintData()}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  title: {
                    ...chartOptions.plugins.title,
                    text: 'Percentage of Tasks Requiring Rework per Sprint',
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="chart-container">
          <h3>Productivity by Developer</h3>
          <div className="chart-wrapper">
            <Pie
              data={getProductivityByDeveloperData()}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  title: {
                    ...chartOptions.plugins.title,
                    text: 'Productivity Rate by Team Member',
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="chart-container">
          <h3>Rework by Developer</h3>
          <div className="chart-wrapper">
            <Pie
              data={getReworkByDeveloperData()}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  title: {
                    ...chartOptions.plugins.title,
                    text: 'Rework Rate by Team Member',
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="chart-container full-width">
          <h3>Emotions Detected by Developer</h3>
          <div className="chart-wrapper">
            {getEmotionsByDeveloperData() ? (
              <Line
                data={getEmotionsByDeveloperData()}
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    title: {
                      ...chartOptions.plugins.title,
                      text: 'Team Member Emotional States',
                    },
                  },
                }}
              />
            ) : (
              <p>No emotion data available. {emotionData.length === 0 ? 'Try logging in with some team members to collect emotion data.' : ''}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;