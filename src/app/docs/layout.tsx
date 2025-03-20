import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FincoTech API Documentation',
  description: 'Documentation for the FincoTech API',
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 max-w-6xl">
          <h1 className="text-2xl font-bold text-blue-600">FincoTech Docs</h1>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
} 