import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useSelector } from 'react-redux';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const GamificationPage = () => {
  const [teamData, setTeamData] = useState(null);
  const [error, setError] = useState(null);
  const { selectedProjectId } = useSelector((state) => state.projects);

  // Fetch team data from the API
  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:8000/projects/${selectedProjectId}/users/`);
        setTeamData(response.data);
      } catch (err) {
        setError('Failed to fetch team data');
      }
    };
    fetchTeamData();
  }, [selectedProjectId]);

  // Prepare data for the bar chart
  const prepareChartData = () => {
    if (!teamData) return { labels: [], datasets: [] };

    // Filter developers (exclude Scrum Master)
    const developers = teamData.users.filter((user) => user.role === 'Developer');

    // Extract names and points
    const labels = developers.map((dev) => dev.name);
    const points = developers.map((dev) => dev.points || 0);

    return {
      labels,
      datasets: [
        {
          label: 'Points',
          data: points,
          backgroundColor: 'rgba(59, 130, 246, 0.6)', // Tailwind blue-500 with opacity
          borderColor: 'rgba(59, 130, 246, 1)', // Tailwind blue-500
          borderWidth: 1,
        },
      ],
    };
  };

  // Chart options for customization
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 14,
            family: 'Inter, sans-serif',
          },
          color: '#1f2937', // Tailwind gray-800
        },
      },
      title: {
        display: true,
        text: 'Developer Scores',
        font: {
          size: 20,
          family: 'Inter, sans-serif',
          weight: 'bold',
        },
        color: '#1f2937', // Tailwind gray-800
        padding: {
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: '#1f2937', // Tailwind gray-800
        titleFont: {
          family: 'Inter, sans-serif',
        },
        bodyFont: {
          family: 'Inter, sans-serif',
        },
      },
    },
    scales: {
      x: {
        ticks: {
          font: {
            size: 12,
            family: 'Inter, sans-serif',
          },
          color: '#4b5563', // Tailwind gray-600
        },
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: 12,
            family: 'Inter, sans-serif',
          },
          color: '#4b5563', // Tailwind gray-600
        },
        grid: {
          color: '#e5e7eb', // Tailwind gray-200
        },
        title: {
          display: true,
          text: 'Points',
          font: {
            size: 14,
            family: 'Inter, sans-serif',
            weight: 'bold',
          },
          color: '#1f2937', // Tailwind gray-800
        },
      },
    },
  };

  if (error) return <div className="text-red-500 text-center">{error}</div>;
  if (!teamData) return <div className="text-gray-500 text-center">Loading...</div>;

  const chartData = prepareChartData();
  // Filter developers for the team overview (exclude Scrum Master)
  const developers = teamData.users.filter((user) => user.role === 'Developer');
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-10">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-4xl">
        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Project:  {teamData.project_name}
        </h1>
        <h2 className="text-xl font-semibold text-gray-600 mb-6">
          Gamification Dashboard
        </h2>

        {/* Bar Chart */}
        {chartData.labels.length > 0 ? (
          <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
            <Bar data={chartData} options={chartOptions} />
          </div>
        ) : (
          <p className="text-gray-500 text-center">
            No developers found for this project.
          </p>
        )}

        {/* Additional Info (Optional) */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Team Overview
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {developers.map((user) => (
              <div
                key={user.id}
                className={`p-4 rounded-lg shadow-md
                  bg-green-50 border-l-4 border-green-500
                `}
              >
                <p className="text-gray-800 font-medium">
                  {user.name}
                </p>
                <p className="text-gray-600 text-sm">
                  Specialist: {user.specialist}
                </p>
                <p className="text-gray-600 text-sm">Points: {user.points ?? 'N/A'}</p>
                <p className="text-gray-600 text-sm">
                  Badges: {user.badges.length > 0 ? user.badges.join(', ') : 'None'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamificationPage;