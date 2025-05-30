'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDownIcon, ChevronRightIcon, UserCircleIcon, BellIcon } from '@heroicons/react/24/outline';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isApplicationsOpen, setIsApplicationsOpen] = useState(true);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Dark Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">FT</span>
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-white">
                    FincoTech
                  </h1>
                  <p className="text-xs text-gray-400">Staff Portal</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-400 hover:text-white transition-colors">
                <BellIcon className="h-5 w-5" />
              </button>
              <button className="text-gray-400 hover:text-white transition-colors">
                <UserCircleIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Modern Sidebar */}
        <nav className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] shadow-sm">
          <div className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Management
                </h3>
                <ul className="space-y-1">
                  <li>
                    <Link
                      href="/staff/dashboard"
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        pathname === '/staff/dashboard'
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <span className="w-2 h-2 bg-gray-400 rounded-full mr-3"></span>
                      Overview
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={() => setIsApplicationsOpen(!isApplicationsOpen)}
                      className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200"
                    >
                      <div className="flex items-center">
                        <span className="w-2 h-2 bg-gray-400 rounded-full mr-3"></span>
                        <span>Applications</span>
                      </div>
                      {isApplicationsOpen ? (
                        <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                    
                    {isApplicationsOpen && (
                      <ul className="ml-5 mt-2 space-y-1 border-l border-gray-200 pl-4">
                        <li>
                          <Link
                            href="/staff/dashboard/applications/drivers"
                            className={`block px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                              pathname === '/staff/dashboard/applications/drivers'
                                ? 'bg-blue-50 text-blue-700 font-medium'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                          >
                            🚗 Drivers
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/staff/dashboard/applications/businesses"
                            className={`block px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                              pathname === '/staff/dashboard/applications/businesses'
                                ? 'bg-blue-50 text-blue-700 font-medium'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                          >
                            🏢 Businesses
                          </Link>
                        </li>
                      </ul>
                    )}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content with Modern Container */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 