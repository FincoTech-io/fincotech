'use client';

import { useEffect, useState } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export default function ApiDocs() {
  const [spec, setSpec] = useState<any>(null);

  useEffect(() => {
    // Fetch the Swagger specification
    fetch('/swagger.json')
      .then((response) => response.json())
      .then((data) => setSpec(data))
      .catch((error) => console.error('Error loading swagger spec:', error));
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-primary mb-8">FincoTech API Documentation</h1>
      <div className="bg-white rounded-lg shadow-lg p-6">
        {spec ? (
          <SwaggerUI spec={spec} />
        ) : (
          <div className="flex items-center justify-center p-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}
      </div>
    </div>
  );
} 