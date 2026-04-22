import React from 'react';

export default function LoadingSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
      <div className="space-y-4">
        {/* Header skeleton */}
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        
        {/* Form skeleton */}
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
        
        {/* Results skeleton */}
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
        
        {/* Button skeleton */}
        <div className="h-12 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}
