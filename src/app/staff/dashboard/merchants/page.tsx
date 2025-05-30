'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserGroupIcon,
  PlusIcon,
  AdjustmentsHorizontalIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

interface Merchant {
  _id: string;
  merchantName: string;
  email: string;
  phoneNumber: string;
  merchantType: string;
  merchantAddress: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  merchantStaff: Array<{
    name: string;
    role: string;
    email: string;
    phoneNumber: string;
    userId: string;
  }>;
  applicationRef?: string;
  createdAt: string;
  updatedAt: string;
}

export default function MerchantsManagementPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('verified');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [staffUser, setStaffUser] = useState<any>(null);
  
  const merchantTypes = [
    'RESTAURANT', 'RETAIL', 'MARKET', 'SERVICE', 'EDUCATIONAL',
    'ENTERTAINMENT', 'HOTEL', 'RENTAL', 'TRANSPORTATION', 'OTHER'
  ];

  useEffect(() => {
    // Get staff user from localStorage
    const staffData = localStorage.getItem('staff');
    if (staffData) {
      try {
        setStaffUser(JSON.parse(staffData));
      } catch (error) {
        console.error('Error parsing staff data:', error);
      }
    }
    
    fetchMerchants();
  }, []);

  const fetchMerchants = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('staff-token');
      
      const response = await fetch('/api/staff/merchants', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch merchants');
      }

      const data = await response.json();
      if (data.success) {
        setMerchants(data.data.merchants || []);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch merchants');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'verified':
        return 'bg-green-900/30 text-green-400 border border-green-700';
      case 'pending':
        return 'bg-yellow-900/30 text-yellow-400 border border-yellow-700';
      case 'rejected':
        return 'bg-red-900/30 text-red-400 border border-red-700';
      default:
        return 'bg-gray-700 text-gray-300 border border-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'verified':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'pending':
        return <ClockIcon className="w-4 h-4" />;
      case 'rejected':
        return <XCircleIcon className="w-4 h-4" />;
      default:
        return <ClockIcon className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    const colors = {
      'RESTAURANT': 'bg-orange-900/30 text-orange-400',
      'RETAIL': 'bg-blue-900/30 text-blue-400',
      'MARKET': 'bg-green-900/30 text-green-400',
      'SERVICE': 'bg-purple-900/30 text-purple-400',
      'EDUCATIONAL': 'bg-indigo-900/30 text-indigo-400',
      'ENTERTAINMENT': 'bg-pink-900/30 text-pink-400',
      'HOTEL': 'bg-teal-900/30 text-teal-400',
      'RENTAL': 'bg-cyan-900/30 text-cyan-400',
      'TRANSPORTATION': 'bg-gray-900/30 text-gray-400',
      'OTHER': 'bg-slate-900/30 text-slate-400'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-700 text-gray-300';
  };

  // Filter merchants based on search and filters
  const filteredMerchants = merchants.filter(merchant => {
    const matchesSearch = !searchQuery || 
      merchant.merchantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      merchant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      merchant.phoneNumber.includes(searchQuery);
    
    const matchesStatus = statusFilter === 'all' || 
      merchant.verificationStatus.toLowerCase() === statusFilter.toLowerCase();
    
    const matchesType = typeFilter === 'all' || 
      merchant.merchantType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-gray-700"></div>
          <div className="w-12 h-12 rounded-full border-4 border-green-500 border-t-transparent animate-spin absolute top-0"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-700 rounded-xl p-6">
        <h3 className="text-red-300 font-semibold mb-2">Error</h3>
        <p className="text-red-400 text-sm mb-4">{error}</p>
        <button
          onClick={fetchMerchants}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Active Merchants</h1>
          <p className="text-gray-400">Manage verified merchant accounts and operations</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-400">
            {filteredMerchants.length} of {merchants.length} merchants
          </span>
          <Link
            href="/staff/dashboard/merchants/create"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Merchant
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search merchants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="verified">Verified (Active)</option>
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Types</option>
              {merchantTypes.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0) + type.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Merchants</p>
              <p className="text-2xl font-bold text-white">{merchants.length}</p>
            </div>
            <BuildingOfficeIcon className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Verified</p>
              <p className="text-2xl font-bold text-green-400">
                {merchants.filter(m => m.verificationStatus === 'VERIFIED').length}
              </p>
            </div>
            <CheckCircleIcon className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Pending</p>
              <p className="text-2xl font-bold text-yellow-400">
                {merchants.filter(m => m.verificationStatus === 'PENDING').length}
              </p>
            </div>
            <ClockIcon className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Rejected</p>
              <p className="text-2xl font-bold text-red-400">
                {merchants.filter(m => m.verificationStatus === 'REJECTED').length}
              </p>
            </div>
            <XCircleIcon className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Merchants List */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="text-left p-4 text-gray-300 font-medium">Merchant</th>
                <th className="text-left p-4 text-gray-300 font-medium">Contact</th>
                <th className="text-left p-4 text-gray-300 font-medium">Type</th>
                <th className="text-left p-4 text-gray-300 font-medium">Status</th>
                <th className="text-left p-4 text-gray-300 font-medium">Staff</th>
                <th className="text-left p-4 text-gray-300 font-medium">Created</th>
                <th className="text-right p-4 text-gray-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredMerchants.map((merchant) => (
                <tr key={merchant._id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="p-4">
                    <div>
                      <h4 className="font-medium text-white">{merchant.merchantName}</h4>
                      <div className="flex items-center text-sm text-gray-400 mt-1">
                        <MapPinIcon className="w-4 h-4 mr-1" />
                        <span className="truncate max-w-xs">{merchant.merchantAddress}</span>
                      </div>
                      {merchant.applicationRef && (
                        <div className="text-xs text-blue-400 mt-1">
                          App: {merchant.applicationRef}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-300">
                        <EnvelopeIcon className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="truncate max-w-xs">{merchant.email}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-300">
                        <PhoneIcon className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{merchant.phoneNumber}</span>
                      </div>
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(merchant.merchantType)}`}>
                      {merchant.merchantType.charAt(0) + merchant.merchantType.slice(1).toLowerCase()}
                    </span>
                  </td>
                  
                  <td className="p-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(merchant.verificationStatus)}`}>
                      {getStatusIcon(merchant.verificationStatus)}
                      <span className="ml-2">{merchant.verificationStatus}</span>
                    </span>
                  </td>
                  
                  <td className="p-4">
                    <div className="flex items-center text-sm text-gray-300">
                      <UserGroupIcon className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{merchant.merchantStaff.length} member{merchant.merchantStaff.length !== 1 ? 's' : ''}</span>
                    </div>
                    {merchant.merchantStaff.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        Owner: {merchant.merchantStaff.find(s => s.role === 'MERCHANT_OWNER')?.name || 'Unknown'}
                      </div>
                    )}
                  </td>
                  
                  <td className="p-4 text-sm text-gray-400">
                    {new Date(merchant.createdAt).toLocaleDateString()}
                  </td>
                  
                  <td className="p-4">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        href={`/staff/dashboard/merchants/${merchant._id}`}
                        className="p-2 text-gray-400 hover:text-green-400 hover:bg-gray-700 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredMerchants.length === 0 && (
            <div className="text-center py-12">
              <BuildingOfficeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No merchants found</h3>
              <p className="text-gray-400 text-sm">
                {merchants.length === 0
                  ? "No verified merchants found."
                  : "Try adjusting your search or filter criteria."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 