import React, { useState, useEffect } from 'react';
import { MapPinIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface RackSlotSelectorProps {
  value?: string;
  onChange: (slotId: string | undefined) => void;
  disabled?: boolean;
  className?: string;
}

interface SlotInfo {
  id: string;
  row: string;
  position: number;
  isOccupied: boolean;
  wineId?: string;
  wineName?: string;
}

const RackSlotSelector: React.FC<RackSlotSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  className = ''
}) => {
  const [showSlotPicker, setShowSlotPicker] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<SlotInfo[]>([]);
  const [_loading, _setLoading] = useState(false);

  // Generate rack slots (20 rows × 20 columns = 400 total)
  const generateSlots = (): SlotInfo[] => {
    const slots: SlotInfo[] = [];
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];
    
    for (const row of rows) {
      for (let pos = 1; pos <= 20; pos++) {
        slots.push({
          id: `${row}${pos}`,
          row,
          position: pos,
          isOccupied: false // We'll update this with real data later
        });
      }
    }
    
    return slots;
  };

  useEffect(() => {
    // For now, generate empty slots. In a real implementation, 
    // you'd fetch this data from an API to check which slots are occupied
    const slots = generateSlots();
    setAvailableSlots(slots);
  }, []);

  const handleSlotSelect = (slotId: string) => {
    onChange(slotId);
    setShowSlotPicker(false);
  };

  const handleClear = () => {
    onChange(undefined);
  };

  const getSlotDisplay = (slotId?: string) => {
    if (!slotId) return 'No slot assigned';
    
    const slot = availableSlots.find(s => s.id === slotId);
    if (!slot) return slotId;
    
    return `${slot.row}${slot.position}`;
  };

  const renderSlotGrid = () => {
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];
    
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-21 gap-1 text-xs">
          {/* Column headers */}
          <div></div>
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} className="text-center text-gray-500 font-mono">
              {i + 1}
            </div>
          ))}
        </div>
        
        {rows.map((row) => (
          <div key={row} className="grid grid-cols-21 gap-1">
            {/* Row header */}
            <div className="text-center text-gray-500 font-mono text-sm font-medium">
              {row}
            </div>
            
            {/* Slots for this row */}
            {Array.from({ length: 20 }, (_, pos) => {
              const slotId = `${row}${pos + 1}`;
              const slot = availableSlots.find(s => s.id === slotId);
              const isSelected = value === slotId;
              const isOccupied = slot?.isOccupied || false;
              
              return (
                <button
                  key={slotId}
                  type="button"
                  onClick={() => !isOccupied && handleSlotSelect(slotId)}
                  disabled={isOccupied}
                  className={`
                    aspect-square text-xs font-mono border rounded transition-all duration-150
                    ${isSelected
                      ? 'bg-wine-600 text-white border-wine-700 ring-2 ring-wine-300'
                      : isOccupied
                      ? 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed'
                      : 'bg-white border-gray-300 hover:bg-wine-50 hover:border-wine-400 cursor-pointer'
                    }
                  `}
                  title={isOccupied ? `Slot ${slotId} is occupied` : `Select slot ${slotId}`}
                >
                  {pos + 1}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  if (showSlotPicker) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            Select Rack Slot
          </label>
          <button
            type="button"
            onClick={() => setShowSlotPicker(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-auto">
          <div className="text-sm text-gray-600 mb-3">
            Click on an available slot to assign it to this wine. Occupied slots are grayed out.
          </div>
          
          {renderSlotGrid()}
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-white border border-gray-300 rounded mr-2"></div>
              <span className="text-gray-600">Available</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-200 border border-gray-300 rounded mr-2"></div>
              <span className="text-gray-600">Occupied</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-wine-600 border border-wine-700 rounded mr-2"></div>
              <span className="text-gray-600">Selected</span>
            </div>
          </div>
          
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="text-red-600 hover:text-red-700 text-sm"
            >
              Clear Selection
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Rack Slot
      </label>
      
      <div className="flex items-center space-x-2">
        <div className="flex-1">
          <div
            className={`
              w-full px-3 py-2 border rounded-md shadow-sm bg-white cursor-pointer
              transition-colors duration-200
              ${disabled 
                ? 'border-gray-200 text-gray-400 cursor-not-allowed' 
                : 'border-gray-300 hover:border-wine-400 focus-within:border-wine-600'
              }
            `}
            onClick={() => !disabled && setShowSlotPicker(true)}
          >
            <div className="flex items-center justify-between">
              <span className={`text-sm ${value ? 'text-gray-900' : 'text-gray-500'}`}>
                {getSlotDisplay(value)}
              </span>
              <MapPinIcon className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
        
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
            title="Clear slot selection"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>
      
      <p className="mt-1 text-xs text-gray-500">
        Click to open slot selector and choose a rack position
      </p>
    </div>
  );
};

export default RackSlotSelector;