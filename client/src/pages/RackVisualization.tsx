import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EyeIcon, PlusIcon } from '@heroicons/react/24/outline';
import RackVisualization from '../components/RackVisualization';
import { wineApi } from '../services/api';
import type { Wine } from '../types/wine';

const RackVisualizationPage: React.FC = () => {
  const navigate = useNavigate();
  const [wines, setWines] = useState<Wine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');

  useEffect(() => {
    const fetchWines = async () => {
      try {
        setIsLoading(true);
        // Fetch all wines to show their rack positions
        const response = await wineApi.getWines({}, 1, 500); // Get up to 500 wines
        setWines(response.wines);
      } catch (err: any) {
        console.error('Error fetching wines:', err);
        setError(err.response?.data?.message || 'Failed to load wines.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWines();
  }, []);

  const handleSlotClick = (slotId: string) => {
    const wine = wines.find(w => w.rack_slot === slotId);
    if (wine) {
      // Navigate to wine detail if slot is occupied
      navigate(`/wines/${wine.id}`);
    } else {
      // Could potentially navigate to add wine with pre-selected slot
      navigate('/wines/add', { state: { rackSlot: slotId } });
    }
  };

  const winesWithSlots = wines.filter(wine => wine.rack_slot);
  const winesWithoutSlots = wines.filter(wine => !wine.rack_slot);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">Wine Rack</h1>
          <p className="text-gray-600">Visual representation of your wine collection</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'overview'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <EyeIcon className="h-4 w-4 inline mr-1" />
              Overview
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'detailed'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Detailed
            </button>
          </div>
          <button
            onClick={() => navigate('/wines/add')}
            className="btn-primary"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Wine
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{wines.length}</div>
          <div className="text-sm text-gray-600">Total Wines</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-green-600">{winesWithSlots.length}</div>
          <div className="text-sm text-gray-600">In Rack</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-amber-600">{winesWithoutSlots.length}</div>
          <div className="text-sm text-gray-600">Unassigned</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-400">
            {/* Calculate available slots - this would need the total rack capacity */}
            ~{Math.max(0, 400 - winesWithSlots.length)}
          </div>
          <div className="text-sm text-gray-600">Available Slots</div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wine-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading wine rack...</p>
          </div>
        </div>
      ) : (
        /* Rack Visualization */
        <RackVisualization
          wines={wines}
          onSlotClick={handleSlotClick}
          mode="view"
        />
      )}

      {/* Unassigned Wines */}
      {winesWithoutSlots.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              Unassigned Wines ({winesWithoutSlots.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {winesWithoutSlots.map(wine => (
              <div
                key={wine.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/wines/${wine.id}`)}
              >
                <div className="font-medium text-gray-900">{wine.name}</div>
                <div className="text-sm text-gray-600">{wine.vineyard}</div>
                <div className="flex items-center justify-between mt-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    wine.color === 'Red' ? 'bg-red-100 text-red-800' :
                    wine.color === 'White' ? 'bg-yellow-100 text-yellow-800' :
                    wine.color === 'Rosé' ? 'bg-pink-100 text-pink-800' :
                    wine.color === 'Sparkling' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {wine.color}
                  </span>
                  <span className="text-xs text-gray-500">
                    {wine.vintage_year}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RackVisualizationPage;