import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, EyeIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { wineApi } from '../services/api';
import type { WineStatistics } from '../types/wine';
import ConsumptionAnalytics from '../components/ConsumptionAnalytics';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<WineStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await wineApi.getWineStatistics();
        setStats(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching statistics:', err);
        setError('Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-serif font-bold text-gray-900">Wine Collection Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage and explore your wine inventory
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          to="/wines/add"
          className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-red-400 hover:bg-red-50 transition-colors"
        >
          <PlusIcon className="mx-auto h-8 w-8 text-gray-400" />
          <span className="mt-2 block text-sm font-medium text-gray-900">Add New Wine</span>
        </Link>

        <Link
          to="/wines"
          className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-red-400 hover:bg-red-50 transition-colors"
        >
          <EyeIcon className="mx-auto h-8 w-8 text-gray-400" />
          <span className="mt-2 block text-sm font-medium text-gray-900">Browse Collection</span>
        </Link>

        <Link
          to="/rack"
          className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-red-400 hover:bg-red-50 transition-colors"
        >
          <ChartBarIcon className="mx-auto h-8 w-8 text-gray-400" />
          <span className="mt-2 block text-sm font-medium text-gray-900">View Rack</span>
        </Link>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card p-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Total Wines</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.total}</dd>
          </div>

          <div className="card p-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Available</dt>
            <dd className="mt-1 text-3xl font-semibold text-green-600">{stats.available}</dd>
          </div>

          <div className="card p-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Consumed</dt>
            <dd className="mt-1 text-3xl font-semibold text-red-600">{stats.consumed}</dd>
          </div>

          <div className="card p-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Reserved</dt>
            <dd className="mt-1 text-3xl font-semibold text-yellow-600">{stats.reserved}</dd>
          </div>
        </div>
      )}

      {/* Wine Colors Distribution */}
      {stats && Object.keys(stats.colors).length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Wine Colors</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {Object.entries(stats.colors).map(([color, count]) => (
              <div key={color} className="text-center">
                <div className={`w-12 h-12 mx-auto rounded-full mb-2 ${getColorClass(color)}`}></div>
                <p className="text-sm font-medium text-gray-900">{color}</p>
                <p className="text-xs text-gray-500">{count} bottles</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two-column layout for regions and consumption analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Regions */}
        {stats && Object.keys(stats.regions).length > 0 && (
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Wine Regions</h3>
            <div className="space-y-3">
              {Object.entries(stats.regions)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([region, count]) => (
                  <div key={region} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{region}</span>
                    <span className="text-sm font-medium text-gray-900">{count} bottles</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Consumption Analytics */}
        <ConsumptionAnalytics />
      </div>
    </div>
  );
};

// Helper function to get color classes for wine types
const getColorClass = (color: string): string => {
  switch (color.toLowerCase()) {
    case 'red':
      return 'bg-red-600';
    case 'white':
      return 'bg-yellow-200';
    case 'rosé':
      return 'bg-pink-400';
    case 'sparkling':
      return 'bg-blue-200';
    case 'dessert':
      return 'bg-amber-400';
    case 'fortified':
      return 'bg-orange-600';
    default:
      return 'bg-gray-400';
  }
};

export default Dashboard;