// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import axiosInstance from '../helpers/axiosInstance';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { FiEdit, FiTrash2, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [aggregated, setAggregated] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('drivers');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, aggregatedRes, driversRes, bookingsRes, usersRes] = await Promise.all([
        axiosInstance.get('/admin/dashboard'),
        axiosInstance.get('/admin/aggregated'),
        axiosInstance.get('/admin/drivers'),
        axiosInstance.get('/admin/bookings'),
        axiosInstance.get('/admin/users'),
      ]);
      setStats(statsRes.data);
      setAggregated(aggregatedRes.data.statuses);
      setDrivers(driversRes.data.data);
      setBookings(bookingsRes.data.data);
      setUsers(usersRes.data.data);
    } catch (err) {
      setError('Failed to fetch dashboard data. Please try again.');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDelete = async (type, id) => {
    confirmAlert({
      title: 'Confirm deletion',
      message: `Are you sure you want to delete this ${type}?`,
      buttons: [
        {
          label: 'Yes',
          onClick: async () => {
            try {
              await axiosInstance.delete(`/admin/${type}/${id}`);
              fetchDashboardData(); // Refresh data
            } catch (err) {
              setError(`Failed to delete ${type}.`);
            }
          }
        },
        {
          label: 'No',
          onClick: () => {}
        }
      ]
    });
  };

  // Prepare chart data for bookings by status
  const bookingStatusLabels = aggregated.map(item => item._id);
  const bookingStatusCounts = aggregated.map(item => item.count);

  const barChartData = {
    labels: bookingStatusLabels,
    datasets: [
      {
        label: 'Bookings by Status',
        data: bookingStatusCounts,
        backgroundColor: [
          'rgba(75, 192, 192, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(153, 102, 255, 0.7)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Prepare chart data comparing drivers vs. users
  const pieChartData = {
    labels: ['Drivers', 'Users'],
    datasets: [
      {
        data: [stats.totalDrivers, stats.totalUsers],
        backgroundColor: ['rgba(203, 229, 87, 0.7)', 'rgba(54, 162, 235, 0.7)'],
        borderColor: ['rgba(203, 229, 87, 1)', 'rgba(54, 162, 235, 1)'],
        borderWidth: 1,
      },
    ],
  };

  const statsCards = [
    { label: 'Total Drivers', value: stats.totalDrivers, color: 'bg-green-500' },
    { label: 'Total Bookings', value: stats.totalBookings, color: 'bg-blue-500' },
    { label: 'Total Users', value: stats.totalUsers, color: 'bg-purple-500' },
    { label: 'Completed Bookings', value: stats.completedBookings, color: 'bg-teal-500' },
    { label: 'Pending Bookings', value: stats.pendingBookings, color: 'bg-yellow-500' },
  ];

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors mt-4 md:mt-0"
            disabled={loading}
          >
            <FiRefreshCw className={`${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-100 text-red-700 p-4 rounded-md mb-6">
            <FiAlertCircle className="text-xl" />
            <span>{error}</span>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {statsCards.map((stat, index) => (
            <div key={index} className={`${stat.color} text-white p-4 rounded-lg shadow-md`}>
              <h2 className="text-sm font-medium uppercase tracking-wider">{stat.label}</h2>
              <p className="text-2xl font-bold mt-2">{stat.value || 0}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Bookings by Status</h2>
            <div className="h-80">
              <Bar 
                data={barChartData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: { 
                    legend: { 
                      position: 'top' 
                    } 
                  } 
                }} 
              />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Drivers vs Users</h2>
            <div className="h-80">
              <Pie 
                data={pieChartData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: { 
                    legend: { 
                      position: 'top' 
                    } 
                  } 
                }} 
              />
            </div>
          </div>
        </div>

        {/* Data Tables */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('drivers')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'drivers' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Drivers
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'bookings' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Bookings
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'users' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Users
              </button>
            </nav>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : (
              <>
                {activeTab === 'drivers' && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {drivers.map(driver => (
                          <tr key={driver._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">{driver.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{driver.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{driver.driving_license_number}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${driver.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {driver.isAvailable ? 'Yes' : 'No'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button className="text-indigo-600 hover:text-indigo-900 mr-4">
                                <FiEdit className="inline" />
                              </button>
                              <button 
                                onClick={() => handleDelete('drivers', driver._id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <FiTrash2 className="inline" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === 'bookings' && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {bookings.map(booking => (
                          <tr key={booking._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">{booking.user?.name || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{booking.driver?.name || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{formatDate(booking.createdAt)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                booking.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                booking.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {booking.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button className="text-indigo-600 hover:text-indigo-900 mr-4">
                                <FiEdit className="inline" />
                              </button>
                              <button 
                                onClick={() => handleDelete('bookings', booking._id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <FiTrash2 className="inline" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === 'users' && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map(user => (
                          <tr key={user._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{user.phone || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button className="text-indigo-600 hover:text-indigo-900 mr-4">
                                <FiEdit className="inline" />
                              </button>
                              <button 
                                onClick={() => handleDelete('users', user._id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <FiTrash2 className="inline" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;