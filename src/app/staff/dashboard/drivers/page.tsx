'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  TruckIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  PlusIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  IdentificationIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';

interface Driver {
  _id: string;
  accountHolderName: string;
  bankAccountNumber: string;
  bankName: string;
  licenseNumber: string;
  licenseExpiry: string;
  licenseState: string;
  licenseClass: string;
  hasVehicle: boolean;
  vehicleType?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: string;
  vehiclePlate?: string;
  serviceTypes: {
    rideShare: boolean;
    foodDelivery: boolean;
    groceryDelivery: boolean;
    packageDelivery: boolean;
  };
  availability: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  maxDeliveryDistance: string;
  verificationStatus: 'pending' | 'under_review' | 'approved' | 'rejected';
  applicantUserId?: string;
  applicationRef?: string;
  createdAt: string;
  updatedAt: string;
}

export default function DriversManagementPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [staffUser, setStaffUser] = useState<any>(null);

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
    
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('staff-token');
      
      const response = await fetch('/api/staff/drivers', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch drivers');
      }

      const data = await response.json();
      if (data.success) {
        setDrivers(data.data.drivers || []);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch drivers');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-900/30 text-green-400 border border-green-700';
      case 'pending':
        return 'bg-yellow-900/30 text-yellow-400 border border-yellow-700';
      case 'under_review':
        return 'bg-blue-900/30 text-blue-400 border border-blue-700';
      case 'rejected':
        return 'bg-red-900/30 text-red-400 border border-red-700';
      default:
        return 'bg-gray-700 text-gray-300 border border-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'pending':
        return <ClockIcon className="w-4 h-4" />;
      case 'under_review':
        return <EyeIcon className="w-4 h-4" />;
      case 'rejected':
        return <XCircleIcon className="w-4 h-4" />;
      default:
        return <ClockIcon className="w-4 h-4" />;
    }
  };

  const getServiceTypes = (driver: Driver) => {
    const services = [];
    if (driver.serviceTypes.rideShare) services.push('Ride Share');
    if (driver.serviceTypes.foodDelivery) services.push('Food');
    if (driver.serviceTypes.groceryDelivery) services.push('Grocery');
    if (driver.serviceTypes.packageDelivery) services.push('Package');
    return services;
  };

  const getAvailableDays = (driver: Driver) => {
    const days = [];
    if (driver.availability.monday) days.push('Mon');
    if (driver.availability.tuesday) days.push('Tue');
    if (driver.availability.wednesday) days.push('Wed');
    if (driver.availability.thursday) days.push('Thu');
    if (driver.availability.friday) days.push('Fri');
    if (driver.availability.saturday) days.push('Sat');
    if (driver.availability.sunday) days.push('Sun');
    return days;
  };

  // Filter drivers based on search and filters
  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = !searchQuery || 
      driver.accountHolderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (driver.vehiclePlate && driver.vehiclePlate.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || 
      driver.verificationStatus.toLowerCase() === statusFilter.toLowerCase();
    
    const matchesService = serviceFilter === 'all' || 
      (serviceFilter === 'rideShare' && driver.serviceTypes.rideShare) ||
      (serviceFilter === 'foodDelivery' && driver.serviceTypes.foodDelivery) ||
      (serviceFilter === 'groceryDelivery' && driver.serviceTypes.groceryDelivery) ||
      (serviceFilter === 'packageDelivery' && driver.serviceTypes.packageDelivery);
    
    return matchesSearch && matchesStatus && matchesService;
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
          onClick={fetchDrivers}
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
          <h1 className="text-2xl font-bold text-white">Driver Management</h1>
          <p className="text-gray-400">Manage and oversee all driver accounts</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-400">
            {filteredDrivers.length} of {drivers.length} drivers
          </span>
          <Link
            href="/staff/dashboard/drivers/create"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Driver
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
              placeholder="Search drivers..."
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
              <option value="all">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Service Filter */}
          <div>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Services</option>
              <option value="rideShare">Ride Share</option>
              <option value="foodDelivery">Food Delivery</option>
              <option value="groceryDelivery">Grocery Delivery</option>
              <option value="packageDelivery">Package Delivery</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Drivers</p>
              <p className="text-2xl font-bold text-white">{drivers.length}</p>
            </div>
            <TruckIcon className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Approved</p>
              <p className="text-2xl font-bold text-green-400">
                {drivers.filter(d => d.verificationStatus === 'approved').length}
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
                {drivers.filter(d => d.verificationStatus === 'pending').length}
              </p>
            </div>
            <ClockIcon className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">With Vehicles</p>
              <p className="text-2xl font-bold text-purple-400">
                {drivers.filter(d => d.hasVehicle).length}
              </p>
            </div>
            <TruckIcon className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Drivers List */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="text-left p-4 text-gray-300 font-medium">Driver</th>
                <th className="text-left p-4 text-gray-300 font-medium">License</th>
                <th className="text-left p-4 text-gray-300 font-medium">Vehicle</th>
                <th className="text-left p-4 text-gray-300 font-medium">Services</th>
                <th className="text-left p-4 text-gray-300 font-medium">Status</th>
                <th className="text-left p-4 text-gray-300 font-medium">Availability</th>
                <th className="text-left p-4 text-gray-300 font-medium">Created</th>
                <th className="text-right p-4 text-gray-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredDrivers.map((driver) => (
                <tr key={driver._id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="p-4">
                    <div>
                      <h4 className="font-medium text-white">{driver.accountHolderName}</h4>
                      <div className="flex items-center text-sm text-gray-400 mt-1">
                        <IdentificationIcon className="w-4 h-4 mr-1" />
                        <span>Max: {driver.maxDeliveryDistance} km</span>
                      </div>
                      {driver.applicationRef && (
                        <div className="text-xs text-blue-400 mt-1">
                          App: {driver.applicationRef}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <div className="space-y-1">
                      <div className="text-sm text-gray-300">
                        <span className="font-medium">{driver.licenseNumber}</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {driver.licenseClass} • {driver.licenseState}
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <CalendarDaysIcon className="w-3 h-3 mr-1" />
                        Exp: {new Date(driver.licenseExpiry).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  
                  <td className="p-4">
                    {driver.hasVehicle ? (
                      <div className="space-y-1">
                        <div className="text-sm text-gray-300">
                          {driver.vehicleMake} {driver.vehicleModel}
                        </div>
                        <div className="text-xs text-gray-400">
                          {driver.vehicleYear} • {driver.vehiclePlate}
                        </div>
                        <div className="text-xs text-gray-500">
                          {driver.vehicleType}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No vehicle</span>
                    )}
                  </td>
                  
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {getServiceTypes(driver).map((service) => (
                        <span
                          key={service}
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-900/30 text-blue-400"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(driver.verificationStatus)}`}>
                      {getStatusIcon(driver.verificationStatus)}
                      <span className="ml-2 capitalize">{driver.verificationStatus.replace('_', ' ')}</span>
                    </span>
                  </td>
                  
                  <td className="p-4">
                    <div className="text-sm text-gray-300">
                      {getAvailableDays(driver).join(', ') || 'Not set'}
                    </div>
                  </td>
                  
                  <td className="p-4 text-sm text-gray-400">
                    {new Date(driver.createdAt).toLocaleDateString()}
                  </td>
                  
                  <td className="p-4">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        href={`/staff/dashboard/drivers/${driver._id}`}
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
          
          {filteredDrivers.length === 0 && (
            <div className="text-center py-12">
              <TruckIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No drivers found</h3>
              <p className="text-gray-400 text-sm">
                {drivers.length === 0
                  ? "No drivers have been registered yet."
                  : "Try adjusting your search or filter criteria."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 