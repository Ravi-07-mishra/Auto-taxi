// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import axiosInstance from '../helpers/axiosInstance'
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

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [aggregated, setAggregated] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
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
        setError('Failed to fetch dashboard data.');
      }
    };

    fetchDashboardData();
  }, []);

  // Prepare chart data for bookings by status
  const bookingStatusLabels = aggregated.map(item => item._id);
  const bookingStatusCounts = aggregated.map(item => item.count);

  const barChartData = {
    labels: bookingStatusLabels,
    datasets: [
      {
        label: 'Bookings by Status',
        data: bookingStatusCounts,
        backgroundColor: 'rgba(203, 229, 87, 0.7)',
      },
    ],
  };

  // Prepare chart data comparing drivers vs. users
  const pieChartData = {
    labels: ['Drivers', 'Users'],
    datasets: [
      {
        data: [stats.totalDrivers, stats.totalUsers],
        backgroundColor: ['rgba(203, 229, 87, 0.7)', 'rgba(255, 99, 132, 0.7)'],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { label: 'Total Drivers', value: stats.totalDrivers },
          { label: 'Total Bookings', value: stats.totalBookings },
          { label: 'Total Users', value: stats.totalUsers },
          { label: 'Completed Bookings', value: stats.completedBookings },
          { label: 'Pending Bookings', value: stats.pendingBookings },
        ].map((stat, index) => (
          <div key={index} className="bg-black bg-opacity-80 p-6 rounded shadow">
            <h2 className="text-xl">{stat.label}</h2>
            <p className="text-3xl font-bold">{stat.value || 0}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-black bg-opacity-80 p-6 rounded shadow">
          <h2 className="text-2xl mb-4">Bookings by Status</h2>
          <Bar data={barChartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
        </div>
        <div className="bg-black bg-opacity-80 p-6 rounded shadow">
          <h2 className="text-2xl mb-4">Drivers vs Users</h2>
          <Pie data={pieChartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
        </div>
      </div>

      {/* Data Tables */}
      <section className="mb-8">
        <h2 className="text-2xl mb-4">Drivers List</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse">
            <thead>
              <tr className="bg-[#cbe557] text-black">
                <th className="p-3 border">Name</th>
                <th className="p-3 border">Email</th>
                <th className="p-3 border">License</th>
                <th className="p-3 border">Available</th>
                <th className="p-3 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map(driver => (
                <tr key={driver._id} className="bg-black bg-opacity-80">
                  <td className="p-3 border">{driver.name}</td>
                  <td className="p-3 border">{driver.email}</td>
                  <td className="p-3 border">{driver.driving_license_number}</td>
                  <td className="p-3 border">{driver.isAvailable ? 'Yes' : 'No'}</td>
                  <td className="p-3 border">
                    <button className="bg-[#cbe557] text-black px-3 py-1 rounded mr-2 hover:bg-[#b8d93e]">Edit</button>
                    <button className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* You can add similar tables for Bookings and Users */}
    </div>
  );
};

export default AdminDashboard;
