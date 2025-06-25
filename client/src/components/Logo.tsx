import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12'
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Wine Bottle Icon */}
      <div className={`${sizeClasses[size]} flex items-center`}>
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          className={`${sizeClasses[size]} text-red-800`}
        >
          {/* Wine bottle silhouette */}
          <path
            d="M9 2h6v2.5c0 .5-.2 1-.5 1.4L13 7.5V20c0 1.1-.9 2-2 2H9c-1.1 0-2-.9-2-2V7.5L5.5 5.9c-.3-.4-.5-.9-.5-1.4V2z"
            fill="currentColor"
            opacity="0.9"
          />
          {/* Bottle neck */}
          <path
            d="M10 2h4v2.5c0 .3-.1.6-.3.8L13 6h-2l-.7-.7c-.2-.2-.3-.5-.3-.8V2z"
            fill="currentColor"
          />
          {/* Wine liquid */}
          <path
            d="M8 12v6c0 .6.4 1 1 1h6c.6 0 1-.4 1-1v-6c0-.6-.4-1-1-1H9c-.6 0-1 .4-1 1z"
            fill="#7f1d1d"
          />
          {/* Cork */}
          <rect
            x="10"
            y="1"
            width="4"
            height="1.5"
            rx="0.2"
            fill="#8b4513"
          />
        </svg>
      </div>
      
      {/* Text Logo */}
      <div className="flex flex-col">
        <div className="flex items-baseline space-x-1">
          <span className="text-2xl font-serif font-bold text-red-800 tracking-wide">
            JM
          </span>
          <span className="text-lg font-serif font-semibold text-red-700">
            Wine
          </span>
        </div>
        <span className="text-sm font-serif text-red-600 -mt-1 tracking-wider">
          CELLAR
        </span>
      </div>
    </div>
  );
};

export default Logo;