import React, { useState, useEffect, useRef } from 'react';
import type { Wine } from '../types/wine';

interface RackVisualizationProps {
  wines: Wine[];
  onSlotClick?: (slotId: string) => void;
  selectedSlot?: string;
  mode?: 'view' | 'assign'; // view mode shows wines, assign mode for selecting slots
}

const RackVisualization: React.FC<RackVisualizationProps> = ({
  wines,
  onSlotClick,
  selectedSlot,
  mode = 'view'
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Create a map of rack slots to wines
  const slotToWineMap = wines.reduce((map, wine) => {
    if (wine.rack_slot) {
      map[wine.rack_slot] = wine;
    }
    return map;
  }, {} as Record<string, Wine>);

  // Extract all valid slot IDs from the SVG
  const getAllSlotIds = (svgContent: string): string[] => {
    const slotPattern = /id="(tower1-[^"]+)"/g;
    const slots: string[] = [];
    let match;
    
    while ((match = slotPattern.exec(svgContent)) !== null) {
      const slotId = match[1];
      // Filter for actual wine slots (not structural elements)
      if (slotId.includes('-r') && slotId.includes('-c') || 
          slotId.includes('-d') || 
          slotId.includes('diamond') || 
          slotId.includes('box')) {
        slots.push(slotId);
      }
    }
    
    return slots.sort();
  };

  useEffect(() => {
    const loadSvg = async () => {
      try {
        setIsLoading(true);
        // Import the SVG file as text
        const response = await fetch('/winerack2.svg');
        const svgText = await response.text();
        setSvgContent(svgText);
      } catch (error) {
        console.error('Error loading SVG:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSvg();
  }, []);

  useEffect(() => {
    if (!svgContent || !svgRef.current) return;

    const svg = svgRef.current;
    const slots = getAllSlotIds(svgContent);

    // Set up event listeners for each slot
    slots.forEach(slotId => {
      const element = svg.querySelector(`#${slotId}`);
      if (!element) return;

      const wine = slotToWineMap[slotId];
      const isOccupied = !!wine;
      const isSelected = selectedSlot === slotId;
      const isHovered = hoveredSlot === slotId;

      // Style the slot based on its state
      if (mode === 'view') {
        if (isOccupied) {
          // Wine is present - color by wine type
          const wineColors = {
            'Red': '#dc2626', // red-600
            'White': '#fbbf24', // amber-400
            'Rosé': '#ec4899', // pink-500
            'Sparkling': '#3b82f6', // blue-500
            'Dessert': '#8b5cf6', // violet-500
            'Fortified': '#f59e0b' // amber-500
          };
          element.setAttribute('fill', wineColors[wine.color] || '#6b7280');
          element.setAttribute('opacity', '0.8');
        } else {
          // Empty slot
          element.setAttribute('fill', '#e5e7eb'); // gray-200
          element.setAttribute('opacity', '0.3');
        }
      } else if (mode === 'assign') {
        if (isOccupied) {
          // Slot occupied - red
          element.setAttribute('fill', '#dc2626');
          element.setAttribute('opacity', '0.5');
        } else if (isSelected) {
          // Selected slot - green
          element.setAttribute('fill', '#16a34a');
          element.setAttribute('opacity', '0.8');
        } else if (isHovered) {
          // Hovered slot - blue
          element.setAttribute('fill', '#3b82f6');
          element.setAttribute('opacity', '0.6');
        } else {
          // Available slot - light gray
          element.setAttribute('fill', '#9ca3af');
          element.setAttribute('opacity', '0.4');
        }
      }

      // Add hover effects
      const handleMouseEnter = () => {
        setHoveredSlot(slotId);
        if (mode === 'assign' && !isOccupied) {
          element.setAttribute('opacity', '0.6');
        }
      };

      const handleMouseLeave = () => {
        setHoveredSlot(null);
        if (mode === 'assign' && !isOccupied && !isSelected) {
          element.setAttribute('opacity', '0.4');
        }
      };

      const handleClick = () => {
        if (onSlotClick) {
          onSlotClick(slotId);
        }
      };

      // Add event listeners
      element.addEventListener('mouseenter', handleMouseEnter);
      element.addEventListener('mouseleave', handleMouseLeave);
      element.addEventListener('click', handleClick);

      // Style the cursor
      if (mode === 'assign' && !isOccupied) {
        (element as HTMLElement).style.cursor = 'pointer';
      } else if (mode === 'view' && isOccupied) {
        (element as HTMLElement).style.cursor = 'pointer';
      } else {
        (element as HTMLElement).style.cursor = 'default';
      }

      // Cleanup function
      return () => {
        element.removeEventListener('mouseenter', handleMouseEnter);
        element.removeEventListener('mouseleave', handleMouseLeave);
        element.removeEventListener('click', handleClick);
      };
    });
  }, [svgContent, slotToWineMap, selectedSlot, hoveredSlot, mode, onSlotClick]);

  // Helper function for potential future use
  // const getSlotInfo = (slotId: string) => {
  //   const wine = slotToWineMap[slotId];
  //   if (!wine) return null;
  //   
  //   return {
  //     name: wine.name,
  //     vineyard: wine.vineyard,
  //     vintage: wine.vintage_year,
  //     color: wine.color
  //   };
  // };

  const renderTooltip = () => {
    if (!hoveredSlot) return null;

    const wine = slotToWineMap[hoveredSlot];
    
    return (
      <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white p-3 rounded-lg shadow-lg max-w-xs z-10">
        <div className="text-sm font-medium">Slot: {hoveredSlot}</div>
        {wine ? (
          <div className="mt-1">
            <div className="font-medium">{wine.name}</div>
            <div className="text-xs text-gray-300">
              {wine.vineyard} • {wine.vintage_year} • {wine.color}
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-300">Empty slot</div>
        )}
      </div>
    );
  };

  const renderLegend = () => {
    if (mode === 'view') {
      const wineColors = {
        'Red': '#dc2626',
        'White': '#fbbf24',
        'Rosé': '#ec4899',
        'Sparkling': '#3b82f6',
        'Dessert': '#8b5cf6',
        'Fortified': '#f59e0b'
      };

      return (
        <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Wine Types</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(wineColors).map(([type, color]) => (
              <div key={type} className="flex items-center space-x-2">
                <div 
                  className="w-4 h-4 rounded" 
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-gray-700">{type}</span>
              </div>
            ))}
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-gray-200" />
              <span className="text-xs text-gray-700">Empty</span>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Slot Selection</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-gray-400" />
              <span className="text-xs text-gray-700">Available</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-red-600" />
              <span className="text-xs text-gray-700">Occupied</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-green-600" />
              <span className="text-xs text-gray-700">Selected</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-blue-500" />
              <span className="text-xs text-gray-700">Hover</span>
            </div>
          </div>
        </div>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wine-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading wine rack...</p>
        </div>
      </div>
    );
  }

  if (!svgContent) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <p className="text-gray-600">Unable to load wine rack visualization</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative bg-white rounded-lg border border-gray-200 p-4">
        {renderTooltip()}
        <div className="overflow-auto">
          <svg
            ref={svgRef}
            className="w-full h-auto max-w-4xl mx-auto"
            viewBox="0 0 1024 1024"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        </div>
      </div>
      {renderLegend()}
    </div>
  );
};

export default RackVisualization;