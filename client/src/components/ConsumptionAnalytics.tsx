import React, { useState, useEffect } from 'react';
import { ChartBarIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { wineApi } from '../services/api';
import type { WineStatistics } from '../types/wine';

interface ConsumptionStats {
  totalConsumed: number;
  consumedThisMonth: number;
  consumedThisYear: number;
  averageRating: number;
  favoriteRegion: string;
  favoriteColor: string;
  totalValue: number;
}

const ConsumptionAnalytics: React.FC = () => {
  const [stats, setStats] = useState<ConsumptionStats | null>(null);
  const [wineStats, setWineStats] = useState<WineStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      
      // Get overall statistics
      const statistics = await wineApi.getWineStatistics();
      setWineStats(statistics);

      // Get consumed wines for detailed analytics
      const consumedResponse = await wineApi.getWines({ 
        consumption_status: 'Consumed' 
      }, 1, 1000); // Get all consumed wines

      const consumedWines = consumedResponse.wines;
      
      // Calculate consumption analytics
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisYear = new Date(now.getFullYear(), 0, 1);

      const consumedThisMonth = consumedWines.filter(wine => 
        wine.date_consumed && new Date(wine.date_consumed) >= thisMonth
      ).length;

      const consumedThisYear = consumedWines.filter(wine => 
        wine.date_consumed && new Date(wine.date_consumed) >= thisYear
      ).length;

      // Calculate average rating of consumed wines
      const ratedWines = consumedWines.filter(wine => wine.rating);
      const averageRating = ratedWines.length > 0 
        ? ratedWines.reduce((sum, wine) => sum + (wine.rating || 0), 0) / ratedWines.length
        : 0;

      // Find favorite region and color
      const regionCounts: Record<string, number> = {};
      const colorCounts: Record<string, number> = {};
      let totalValue = 0;

      consumedWines.forEach(wine => {
        regionCounts[wine.region] = (regionCounts[wine.region] || 0) + 1;
        colorCounts[wine.color] = (colorCounts[wine.color] || 0) + 1;
        if (wine.price) {
          totalValue += wine.price;
        }
      });

      const favoriteRegion = Object.keys(regionCounts).reduce((a, b) => 
        regionCounts[a] > regionCounts[b] ? a : b, ''
      );

      const favoriteColor = Object.keys(colorCounts).reduce((a, b) => 
        colorCounts[a] > colorCounts[b] ? a : b, ''
      );

      setStats({
        totalConsumed: consumedWines.length,
        consumedThisMonth,
        consumedThisYear,
        averageRating: Math.round(averageRating * 10) / 10,
        favoriteRegion,
        favoriteColor,
        totalValue
      });

    } catch (err) {
      console.error('Error loading consumption analytics:', err);
      setError('Failed to load consumption analytics');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats || !wineStats) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Consumption Analytics</h3>
        <p className="text-red-600">{error || 'Unable to load analytics'}</p>
      </div>
    );
  }

  const consumptionRate = wineStats.total > 0 
    ? Math.round((stats.totalConsumed / wineStats.total) * 100)
    : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">Consumption Analytics</h3>
        <ChartBarIcon className="h-5 w-5 text-gray-400" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-wine-600">{stats.totalConsumed}</div>
          <div className="text-sm text-gray-500">Total Consumed</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{consumptionRate}%</div>
          <div className="text-sm text-gray-500">Collection Consumed</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{stats.consumedThisMonth}</div>
          <div className="text-sm text-gray-500">This Month</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.consumedThisYear}</div>
          <div className="text-sm text-gray-500">This Year</div>
        </div>
      </div>

      <div className="space-y-4">
        {stats.averageRating > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Average Rating:</span>
            <span className="font-medium">{stats.averageRating}/100</span>
          </div>
        )}
        
        {stats.favoriteRegion && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Favorite Region:</span>
            <span className="font-medium">{stats.favoriteRegion}</span>
          </div>
        )}
        
        {stats.favoriteColor && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Favorite Color:</span>
            <span className="font-medium">{stats.favoriteColor}</span>
          </div>
        )}
        
        {stats.totalValue > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Total Value Consumed:</span>
            <span className="font-medium">${stats.totalValue.toFixed(2)}</span>
          </div>
        )}
      </div>

      {stats.totalConsumed === 0 && (
        <div className="text-center py-4">
          <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No wines consumed yet</p>
          <p className="text-gray-400 text-xs">Mark wines as consumed to see analytics</p>
        </div>
      )}
    </div>
  );
};

export default ConsumptionAnalytics;