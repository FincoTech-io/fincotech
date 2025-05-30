'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isApplicationsOpen, setIsApplicationsOpen] = useState(true);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                FincoTech Staff Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Admin Portal</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white shadow-sm min-h-screen border-r border-gray-200">
          <div className="p-4">
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setIsApplicationsOpen(!isApplicationsOpen)}
                  className="flex items-center justify-between w-full text-left px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50"
                >
                  <span>Applications</span>
                  {isApplicationsOpen ? (
                    <ChevronDownIcon className="h-4 w-4" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4" />
                  )}
                </button>
                
                {isApplicationsOpen && (
                  <ul className="ml-4 mt-2 space-y-1">
                    <li>
                      <Link
                        href="/staff/dashboard/applications/drivers"
                        className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                          pathname === '/staff/dashboard/applications/drivers'
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        Drivers
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/staff/dashboard/applications/businesses"
                        className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                          pathname === '/staff/dashboard/applications/businesses'
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        Businesses
                      </Link>
                    </li>
                  </ul>
                )}
              </li>
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 