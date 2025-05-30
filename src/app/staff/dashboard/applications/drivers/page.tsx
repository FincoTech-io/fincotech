'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  TruckIcon, 
  DocumentTextIcon, 
  ClockIcon, 
  EyeIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface DriverApplication {
  _id: string;
  applicationRef: string;
  status: string;
  submissionDate: string;
  driverApplication: {
    accountHolderName: string;
    licenseNumber: string;
    vehicleType?: string;
    vehicleMake?: string;
    vehicleModel?: string;
  };
  applicantUserId: string;
}

export default function DriverApplicationsPage() {
  const [applications, setApplications] = useState<DriverApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/commerce/apply?applicationType=driver');
      
      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }

      const data = await response.json();
      if (data.success) {
        setApplications(data.data.applications || []);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-900/30 text-yellow-400 border border-yellow-700';
      case 'in review':
        return 'bg-blue-900/30 text-blue-400 border border-blue-700';
      case 'approved':
        return 'bg-green-900/30 text-green-400 border border-green-700';
      case 'declined':
        return 'bg-red-900/30 text-red-400 border border-red-700';
      default:
        return 'bg-gray-700 text-gray-300 border border-gray-600';
    }
  };

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true;
    return app.status.toLowerCase() === filter.toLowerCase();
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-gray-700"></div>
          <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin absolute top-0"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-700 rounded-xl p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-red-900/50 rounded-full flex items-center justify-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-red-300 font-semibold">Error Loading Applications</h3>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        </div>
        <button 
          onClick={fetchApplications}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section - Dark Mode */}
      <div>
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-8 h-8 bg-blue-900/50 rounded-lg flex items-center justify-center">
            <TruckIcon className="w-5 h-5 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Driver Applications</h1>
        </div>
        <p className="text-gray-400">Review and manage driver application submissions</p>
      </div>

      {/* Statistics Cards - Dark Mode */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-700 hover:shadow-lg hover:border-gray-600 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-400">{applications.length}</div>
              <div className="text-sm text-gray-400 font-medium">Total Applications</div>
            </div>
            <div className="w-10 h-10 bg-blue-900/50 rounded-lg flex items-center justify-center">
              <DocumentTextIcon className="w-5 h-5 text-blue-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-700 hover:shadow-lg hover:border-gray-600 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-yellow-400">
                {applications.filter(app => app.status.toLowerCase() === 'pending').length}
              </div>
              <div className="text-sm text-gray-400 font-medium">Pending</div>
            </div>
            <div className="w-10 h-10 bg-yellow-900/50 rounded-lg flex items-center justify-center">
              <ClockIcon className="w-5 h-5 text-yellow-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-700 hover:shadow-lg hover:border-gray-600 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-400">
                {applications.filter(app => app.status.toLowerCase() === 'in review').length}
              </div>
              <div className="text-sm text-gray-400 font-medium">In Review</div>
            </div>
            <div className="w-10 h-10 bg-blue-900/50 rounded-lg flex items-center justify-center">
              <EyeIcon className="w-5 h-5 text-blue-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-700 hover:shadow-lg hover:border-gray-600 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-400">
                {applications.filter(app => app.status.toLowerCase() === 'approved').length}
              </div>
              <div className="text-sm text-gray-400 font-medium">Approved</div>
            </div>
            <div className="w-10 h-10 bg-green-900/50 rounded-lg flex items-center justify-center">
              <CheckCircleIcon className="w-5 h-5 text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters - Dark Mode */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            filter === 'all' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'bg-gray-800 text-gray-300 border border-gray-700 hover:border-gray-600 hover:bg-gray-700'
          }`}
        >
          All Applications ({applications.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            filter === 'pending' 
              ? 'bg-yellow-600 text-white shadow-md' 
              : 'bg-gray-800 text-gray-300 border border-gray-700 hover:border-gray-600 hover:bg-gray-700'
          }`}
        >
          Pending ({applications.filter(app => app.status.toLowerCase() === 'pending').length})
        </button>
        <button
          onClick={() => setFilter('in review')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            filter === 'in review' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'bg-gray-800 text-gray-300 border border-gray-700 hover:border-gray-600 hover:bg-gray-700'
          }`}
        >
          In Review ({applications.filter(app => app.status.toLowerCase() === 'in review').length})
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            filter === 'approved' 
              ? 'bg-green-600 text-white shadow-md' 
              : 'bg-gray-800 text-gray-300 border border-gray-700 hover:border-gray-600 hover:bg-gray-700'
          }`}
        >
          Approved ({applications.filter(app => app.status.toLowerCase() === 'approved').length})
        </button>
        <button
          onClick={() => setFilter('declined')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            filter === 'declined' 
              ? 'bg-red-600 text-white shadow-md' 
              : 'bg-gray-800 text-gray-300 border border-gray-700 hover:border-gray-600 hover:bg-gray-700'
          }`}
        >
          Declined ({applications.filter(app => app.status.toLowerCase() === 'declined').length})
        </button>
      </div>

      {/* Applications Table - Dark Mode */}
      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
        {filteredApplications.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
              <TruckIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {filter === 'all' ? 'No Applications Found' : `No ${filter.charAt(0).toUpperCase() + filter.slice(1)} Applications`}
            </h3>
            <p className="text-gray-400 text-sm">
              {filter === 'all' 
                ? 'Driver applications will appear here once submitted.' 
                : `No applications with ${filter} status found.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-700/50 border-b border-gray-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Application
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Driver
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    License
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredApplications.map((application) => (
                  <tr key={application._id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        {application.applicationRef}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300 font-medium">
                        {application.driverApplication?.accountHolderName || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-400">
                        {application.driverApplication?.licenseNumber || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-400">
                        {application.driverApplication?.vehicleType && application.driverApplication?.vehicleMake 
                          ? `${application.driverApplication.vehicleMake} ${application.driverApplication.vehicleModel || ''} (${application.driverApplication.vehicleType})`
                          : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(application.status)}`}>
                        {application.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-400">
                        {new Date(application.submissionDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/staff/dashboard/applications/drivers/${application.applicationRef}`}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-400 bg-blue-900/30 border border-blue-700 rounded-lg hover:bg-blue-900/50 hover:border-blue-600 transition-all duration-200"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 