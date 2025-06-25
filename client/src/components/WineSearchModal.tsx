import React, { useState, useEffect } from 'react';
import { XMarkIcon, MagnifyingGlassIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { wineApi } from '../services/api';

interface WineSearchResult {
  name: string;
  vineyard: string;
  region: string;
  color: string;
  grape_varieties: string[];
  vintage_year?: number;
  rating?: number;
  description?: string;
  price?: number;
  currency?: string;
  food_pairings?: string[];
  image_url?: string;
  source: 'vivino' | 'wine_api' | 'manual';
}

interface WineSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWine: (wine: WineSearchResult) => void;
}

export default function WineSearchModal({ isOpen, onClose, onSelectWine }: WineSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WineSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vintage, setVintage] = useState<string>('');
  const [region, setRegion] = useState<string>('');

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await wineApi.searchExternalWines(
        searchQuery,
        vintage ? parseInt(vintage) : undefined,
        region || undefined,
        10
      );
      
      setSearchResults(result.results);
      if (result.results.length === 0) {
        setError('No wines found. Try adjusting your search terms.');
      }
    } catch (err) {
      console.error('Wine search error:', err);
      setError('Failed to search for wines. Please try again.');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatRating = (rating?: number) => {
    if (!rating) return 'N/A';
    return `${rating}/100`;
  };

  const formatPrice = (price?: number, currency?: string) => {
    if (!price) return 'N/A';
    const currencySymbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';
    return `${currencySymbol}${price.toFixed(2)}`;
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setError(null);
      setVintage('');
      setRegion('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b">
          <h3 className="text-lg font-medium text-gray-900">Search Wine Database</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Search Form */}
        <div className="mt-4 space-y-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search for wine (e.g., Caymus Cabernet, Kendall Jackson)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="input-field w-full"
              />
            </div>
            <div className="w-32">
              <input
                type="number"
                placeholder="Vintage"
                value={vintage}
                onChange={(e) => setVintage(e.target.value)}
                min="1800"
                max={new Date().getFullYear()}
                className="input-field w-full"
              />
            </div>
            <div className="w-40">
              <input
                type="text"
                placeholder="Region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="input-field w-full"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isLoading || !searchQuery.trim()}
              className="btn-primary flex items-center px-4"
            >
              <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="mt-4 text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-wine-600"></div>
            <p className="mt-2 text-gray-600">Searching wine databases...</p>
          </div>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-4 max-h-96 overflow-y-auto">
            <div className="space-y-3">
              {searchResults.map((wine, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start space-x-4">
                    {/* Wine Image */}
                    {wine.image_url && (
                      <div className="flex-shrink-0">
                        <img
                          src={wine.image_url}
                          alt={wine.name}
                          className="h-20 w-auto object-contain rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    {/* Wine Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{wine.name}</h4>
                          <p className="text-gray-600">{wine.vineyard}</p>
                          <p className="text-sm text-gray-500">{wine.region}</p>
                        </div>
                        <button
                          onClick={() => onSelectWine(wine)}
                          className="btn-primary flex items-center px-3 py-2 text-sm"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                          Import
                        </button>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <span className="font-medium">Type:</span>
                          <span className="ml-1">{wine.color}</span>
                        </span>
                        {wine.vintage_year && (
                          <span className="flex items-center">
                            <span className="font-medium">Vintage:</span>
                            <span className="ml-1">{wine.vintage_year}</span>
                          </span>
                        )}
                        {wine.rating && (
                          <span className="flex items-center">
                            <span className="font-medium">Rating:</span>
                            <span className="ml-1">{formatRating(wine.rating)}</span>
                          </span>
                        )}
                        {wine.price && (
                          <span className="flex items-center">
                            <span className="font-medium">Price:</span>
                            <span className="ml-1">{formatPrice(wine.price, wine.currency)}</span>
                          </span>
                        )}
                        <span className="flex items-center">
                          <span className="font-medium">Source:</span>
                          <span className="ml-1 capitalize">{wine.source}</span>
                        </span>
                      </div>

                      {wine.grape_varieties && wine.grape_varieties.length > 0 && (
                        <div className="mt-2">
                          <span className="text-sm font-medium text-gray-700">Grapes: </span>
                          <span className="text-sm text-gray-600">
                            {wine.grape_varieties.join(', ')}
                          </span>
                        </div>
                      )}

                      {wine.description && (
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                          {wine.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t flex justify-between items-center">
          <p className="text-sm text-gray-500">
            Tip: Search results come from Vivino and other wine databases
          </p>
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}