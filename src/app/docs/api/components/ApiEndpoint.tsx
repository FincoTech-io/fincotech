'use client';

import React, { useState } from 'react';

type EndpointProps = {
  endpoint: {
    category: string;
    endpoint: string;
    method: string;
    description: string;
    requestBody?: Record<string, any>;
    responseExample?: Record<string, any>;
    headers?: Record<string, string>;
    queryParams?: Record<string, string>;
  };
};

export const ApiEndpoint: React.FC<EndpointProps> = ({ endpoint }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get method color
  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'bg-green-600';
      case 'POST':
        return 'bg-blue-600';
      case 'PUT':
        return 'bg-yellow-600';
      case 'DELETE':
        return 'bg-red-600';
      case 'PATCH':
        return 'bg-purple-600';
      default:
        return 'bg-gray-600';
    }
  };

  // Format JSON for display
  const formatJSON = (json: any) => {
    return JSON.stringify(json, null, 2);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <span className={`${getMethodColor(endpoint.method)} px-3 py-1 rounded-md text-white font-mono text-sm`}>
            {endpoint.method}
          </span>
          <span className="font-mono text-gray-800">{endpoint.endpoint}</span>
        </div>
        <div className="flex items-center">
          <span className="text-gray-500 text-sm mr-4 hidden sm:inline">
            {endpoint.description.length > 60 
              ? `${endpoint.description.substring(0, 60)}...` 
              : endpoint.description}
          </span>
          <svg 
            className={`w-5 h-5 text-gray-500 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Content (only visible when expanded) */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4">
          <div className="mb-4">
            <h3 className="text-md font-semibold mb-2 text-gray-700">Description</h3>
            <p className="text-gray-600">{endpoint.description}</p>
          </div>

          {/* Headers */}
          {endpoint.headers && Object.keys(endpoint.headers).length > 0 && (
            <div className="mb-4">
              <h3 className="text-md font-semibold mb-2 text-gray-700">Headers</h3>
              <div className="bg-gray-50 p-3 rounded-md">
                {Object.entries(endpoint.headers).map(([key, value]) => (
                  <div key={key} className="grid grid-cols-3 gap-2 mb-1">
                    <span className="font-mono text-sm text-gray-700">{key}</span>
                    <span className="col-span-2 text-sm text-gray-600">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Query Parameters */}
          {endpoint.queryParams && Object.keys(endpoint.queryParams).length > 0 && (
            <div className="mb-4">
              <h3 className="text-md font-semibold mb-2 text-gray-700">Query Parameters</h3>
              <div className="bg-gray-50 p-3 rounded-md">
                {Object.entries(endpoint.queryParams).map(([key, value]) => (
                  <div key={key} className="grid grid-cols-3 gap-2 mb-1">
                    <span className="font-mono text-sm text-gray-700">{key}</span>
                    <span className="col-span-2 text-sm text-gray-600">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Request Body */}
          {endpoint.requestBody && Object.keys(endpoint.requestBody).length > 0 && (
            <div className="mb-4">
              <h3 className="text-md font-semibold mb-2 text-gray-700">Request Body</h3>
              <div className="bg-gray-50 p-3 rounded-md">
                {Object.entries(endpoint.requestBody).map(([key, value]) => (
                  <div key={key} className="grid grid-cols-3 gap-2 mb-1">
                    <span className="font-mono text-sm text-gray-700">{key}</span>
                    <span className="col-span-2 text-sm text-gray-600">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Response Example */}
          {endpoint.responseExample && (
            <div>
              <h3 className="text-md font-semibold mb-2 text-gray-700">Response Example</h3>
              <pre className="bg-gray-50 p-3 rounded-md overflow-x-auto font-mono text-sm text-gray-700">
                {formatJSON(endpoint.responseExample)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 