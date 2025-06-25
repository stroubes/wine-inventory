import React, { useState } from 'react';
import type { Wine } from '../types/wine';
import { wineApi } from '../services/api';

interface ConsumptionTrackerProps {
  wine: Wine;
  onWineUpdated: (wine: Wine) => void;
  className?: string;
}

const ConsumptionTracker: React.FC<ConsumptionTrackerProps> = ({
  wine,
  onWineUpdated,
  className = ""
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showConsumptionForm, setShowConsumptionForm] = useState(false);
  const [consumptionDate, setConsumptionDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const handleMarkConsumed = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const updatedWine = await wineApi.markWineConsumed(
        wine.id,
        new Date(consumptionDate)
      );
      onWineUpdated(updatedWine);
      setShowConsumptionForm(false);
    } catch (error) {
      console.error('Error marking wine as consumed:', error);
      alert('Failed to mark wine as consumed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReserveWine = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const updatedWine = await wineApi.updateWine(wine.id, {
        consumption_status: 'Reserved'
      });
      onWineUpdated(updatedWine);
    } catch (error) {
      console.error('Error reserving wine:', error);
      alert('Failed to reserve wine. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMakeAvailable = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const updatedWine = await wineApi.updateWine(wine.id, {
        consumption_status: 'Available',
        date_consumed: undefined
      });
      onWineUpdated(updatedWine);
    } catch (error) {
      console.error('Error making wine available:', error);
      alert('Failed to make wine available. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'text-green-700 bg-green-100';
      case 'Reserved':
        return 'text-yellow-700 bg-yellow-100';
      case 'Consumed':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Wine Status</h3>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(wine.consumption_status)}`}>
          {wine.consumption_status}
        </span>
      </div>

      {wine.consumption_status === 'Consumed' && wine.date_consumed && (
        <div className="mb-4 p-3 bg-red-50 rounded-md">
          <p className="text-sm text-red-800">
            <span className="font-medium">Consumed on:</span>{' '}
            {new Date(wine.date_consumed).toLocaleDateString()}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {wine.consumption_status === 'Available' && (
          <>
            <button
              onClick={() => setShowConsumptionForm(true)}
              disabled={isLoading}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : 'Mark as Consumed'}
            </button>
            <button
              onClick={handleReserveWine}
              disabled={isLoading}
              className="w-full px-4 py-2 text-sm font-medium text-yellow-700 bg-yellow-100 border border-yellow-300 rounded-md shadow-sm hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : 'Reserve for Special Occasion'}
            </button>
          </>
        )}

        {wine.consumption_status === 'Reserved' && (
          <>
            <button
              onClick={() => setShowConsumptionForm(true)}
              disabled={isLoading}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : 'Mark as Consumed'}
            </button>
            <button
              onClick={handleMakeAvailable}
              disabled={isLoading}
              className="w-full px-4 py-2 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-md shadow-sm hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : 'Make Available'}
            </button>
          </>
        )}

        {wine.consumption_status === 'Consumed' && (
          <button
            onClick={handleMakeAvailable}
            disabled={isLoading}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : 'Restore (Undo Consumption)'}
          </button>
        )}
      </div>

      {/* Consumption Date Form Modal */}
      {showConsumptionForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Mark Wine as Consumed
            </h3>
            
            <div className="mb-4">
              <label htmlFor="consumptionDate" className="block text-sm font-medium text-gray-700 mb-2">
                Consumption Date
              </label>
              <input
                type="date"
                id="consumptionDate"
                value={consumptionDate}
                onChange={(e) => setConsumptionDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-wine-600 focus:border-wine-600"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConsumptionForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wine-600"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkConsumed}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Marking...' : 'Mark as Consumed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsumptionTracker;