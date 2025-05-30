'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  HomeIcon, 
  DocumentTextIcon, 
  UserGroupIcon, 
  CogIcon,
  ChevronDownIcon,
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  PowerIcon,
  BuildingOfficeIcon,
  TruckIcon
} from '@heroicons/react/24/outline';

interface StaffUser {
  _id: string;
  employeeNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  role: string;
  jobTitle: string;
  team: string;
}

export default function StaffDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [applicationsOpen, setApplicationsOpen] = useState(false);
  const [staffUser, setStaffUser] = useState<StaffUser | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const staffData = localStorage.getItem('staff');
    const token = localStorage.getItem('staff-token');

    if (!staffData || !token) {
      router.push('/staff');
      return;
    }

    try {
      setStaffUser(JSON.parse(staffData));
    } catch (error) {
      console.error('Error parsing staff data:', error);
      router.push('/staff');
    }
  }, [router]);

  const handleLogout = async () => {
    try {
      // Call logout API
      await fetch('/api/staff/auth', {
        method: 'DELETE',
      });

      // Clear local storage
      localStorage.removeItem('staff');
      localStorage.removeItem('staff-token');

      // Redirect to login
      router.push('/staff');
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if API call fails
      localStorage.removeItem('staff');
      localStorage.removeItem('staff-token');
      router.push('/staff');
    }
  };

  if (!staffUser) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-gray-700"></div>
          <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin absolute top-0"></div>
        </div>
      </div>
    );
  }

  const navigation = [
    { name: 'Dashboard', href: '/staff/dashboard', icon: HomeIcon },
    { 
      name: 'Applications', 
      icon: DocumentTextIcon,
      children: [
        { name: 'Drivers', href: '/staff/dashboard/applications/drivers' },
        { name: 'Businesses', href: '/staff/dashboard/applications/businesses' }
      ]
    },
    { name: 'Merchants', href: '/staff/dashboard/merchants', icon: BuildingOfficeIcon },
    { name: 'Drivers', href: '/staff/dashboard/drivers', icon: TruckIcon },
    { name: 'Staff Management', href: '/staff/dashboard/staff', icon: UserGroupIcon },
    { name: 'Settings', href: '/staff/dashboard/settings', icon: CogIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-800 border-r border-gray-700`}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">FT</span>
              </div>
              <span className="ml-3 text-white text-xl font-bold">FincoTech</span>
            </div>
            <p className="text-gray-400 text-sm mt-1">Staff Portal</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 pb-4">
            <ul className="space-y-2">
              {navigation.map((item) => (
                <li key={item.name}>
                  {item.children ? (
                    <div>
                      <button
                        onClick={() => setApplicationsOpen(!applicationsOpen)}
                        className="w-full flex items-center justify-between px-3 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <div className="flex items-center">
                          <item.icon className="w-5 h-5 mr-3" />
                          {item.name}
                        </div>
                        <ChevronDownIcon className={`w-4 h-4 transition-transform ${applicationsOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {applicationsOpen && (
                        <ul className="mt-2 ml-8 space-y-1">
                          {item.children.map((child) => (
                            <li key={child.name}>
                              <Link
                                href={child.href}
                                className="block px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                              >
                                {child.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className="flex items-center px-3 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      {item.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
              >
                {sidebarOpen ? (
                  <XMarkIcon className="w-6 h-6" />
                ) : (
                  <Bars3Icon className="w-6 h-6" />
                )}
              </button>
              <h1 className="ml-4 lg:ml-0 text-xl font-semibold text-white">Staff Dashboard</h1>
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-3 px-3 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <UserCircleIcon className="w-8 h-8" />
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-white">
                    {staffUser.firstName} {staffUser.lastName}
                  </p>
                  <p className="text-xs text-gray-400">{staffUser.role} • {staffUser.employeeNumber}</p>
                </div>
                <ChevronDownIcon className="w-4 h-4" />
              </button>

              {/* Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                  <div className="px-4 py-3 border-b border-gray-700">
                    <p className="text-sm font-medium text-white">
                      {staffUser.firstName} {staffUser.middleName} {staffUser.lastName}
                    </p>
                    <p className="text-xs text-gray-400">{staffUser.email}</p>
                    <p className="text-xs text-gray-400">{staffUser.jobTitle} • {staffUser.team}</p>
                  </div>
                  <div className="py-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                      <PowerIcon className="w-4 h-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
} 