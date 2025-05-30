'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeftIcon,
  TruckIcon,
  UserIcon,
  IdentificationIcon,
  CreditCardIcon,
  ClockIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  PhotoIcon,
  ChevronLeftIcon,
  CalendarIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface DriverApplication {
  _id: string;
  applicationRef: string;
  status: string;
  submissionDate: string;
  driverApplication: {
    accountHolderName: string;
    bankAccountNumber: string;
    bankName: string;
    routingNumber: string;
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
    vehicleColor?: string;
    vehicleCapacity?: string;
    vehicleVIN?: string;
    insuranceProvider?: string;
    insuranceExpiry?: string;
    serviceTypes?: {
      rideShare: boolean;
      foodDelivery: boolean;
      groceryDelivery: boolean;
      packageDelivery: boolean;
    };
    availability?: {
      monday: boolean;
      tuesday: boolean;
      wednesday: boolean;
      thursday: boolean;
      friday: boolean;
      saturday: boolean;
      sunday: boolean;
    };
    preferredHours?: {
      morning: boolean;
      afternoon: boolean;
      evening: boolean;
      lateNight: boolean;
    };
    maxDeliveryDistance?: string;
    backgroundCheckConsent: boolean;
    drivingRecordConsent: boolean;
    licensePhotoFront?: { 
      url: string; 
      originalName: string; 
      publicId?: string;
      uploadedAt?: string;
      _id?: string;
    };
    licensePhotoBack?: { 
      url: string; 
      originalName: string; 
      publicId?: string;
      uploadedAt?: string;
      _id?: string;
    };
    registrationPhoto?: { 
      url: string; 
      originalName: string; 
      publicId?: string;
      uploadedAt?: string;
      _id?: string;
    };
    insurancePhoto?: { 
      url: string; 
      originalName: string; 
      publicId?: string;
      uploadedAt?: string;
      _id?: string;
    };
    profilePhoto?: { 
      url: string; 
      originalName: string; 
      publicId?: string;
      uploadedAt?: string;
      _id?: string;
    };
  };
  applicantUserId: string;
  reviewNotes?: string;
  reviewedBy?: string;
  reviewDate?: string;
}

export default function DriverApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [application, setApplication] = useState<DriverApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>({});
  const [statusUpdate, setStatusUpdate] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [saving, setSaving] = useState(false);
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
    
    if (params.id) {
      fetchApplication();
    }
  }, [params.id]);

  const fetchApplication = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/commerce/apply?applicationRef=${params.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch application');
      }

      const data = await response.json();
      if (data.success && data.data) {
        const app = data.data;
        setApplication(app);
        setEditedData(app.driverApplication);
        setStatusUpdate(app.status);
        setReviewNotes(app.reviewNotes || '');
      } else {
        throw new Error('Application not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch application');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!application || !staffUser) return;
    
    try {
      setSaving(true);
      const token = localStorage.getItem('staff-token');
      
      const response = await fetch('/api/commerce/apply', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          applicationRef: application.applicationRef,
          status: statusUpdate,
          reviewNotes: reviewNotes,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }

      const result = await response.json();
      if (result.success) {
        setApplication({ ...application, status: statusUpdate, reviewNotes });
        alert('Status updated successfully!');
      }
    } catch (err) {
      alert('Failed to update status: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setSaving(false);
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

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <ClockIcon className="w-4 h-4" />;
      case 'in review':
        return <EyeIcon className="w-4 h-4" />;
      case 'approved':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'declined':
        return <XCircleIcon className="w-4 h-4" />;
      default:
        return <ClockIcon className="w-4 h-4" />;
    }
  };

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

  if (error || !application) {
    return (
      <div className="bg-red-900/20 border border-red-700 rounded-xl p-6">
        <h3 className="text-red-300 font-semibold mb-2">Error</h3>
        <p className="text-red-400 text-sm mb-4">{error || 'Application not found'}</p>
        <Link
          href="/management/dashboard/applications/drivers"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back to Applications
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/management/dashboard/applications/drivers"
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Driver Application</h1>
            <p className="text-gray-400">{application.applicationRef}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
            {getStatusIcon(application.status)}
            <span className="ml-2">{application.status}</span>
          </span>
        </div>
      </div>

      {/* Review & Status */}
      {staffUser?.role === 'Admin' ? (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Review & Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={statusUpdate}
                onChange={(e) => setStatusUpdate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Pending">Pending</option>
                <option value="In Review">In Review</option>
                <option value="Approved">Approved</option>
                <option value="Declined">Declined</option>
              </select>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Review Notes</label>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add notes about this application review..."
            />
          </div>
          
          <button
            onClick={handleStatusUpdate}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <CheckIcon className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Update Status'}
          </button>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Review & Status</h3>
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 mr-2" />
              <p className="text-yellow-400">
                Only Admin users can modify application status. Your current role: {staffUser?.role || 'Unknown'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Application Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <UserIcon className="w-5 h-5 mr-2" />
              Personal Information
            </h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">Account Holder Name</label>
              <p className="text-white">{application.driverApplication.accountHolderName}</p>
            </div>

            {application.driverApplication.profilePhoto?.url && (
              <div className="mt-4">
                <label className="text-sm text-gray-400 mb-2 block">Profile Photo</label>
                <div className="w-24 h-24">
                  <img 
                    src={application.driverApplication.profilePhoto.url} 
                    alt="Profile Photo"
                    className="w-full h-full object-cover rounded-full cursor-pointer hover:opacity-80 transition-opacity border-2 border-gray-600"
                    onClick={() => window.open(application.driverApplication.profilePhoto?.url || '', '_blank')}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Banking Information */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <CreditCardIcon className="w-5 h-5 mr-2" />
            Banking Information
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">Bank Name</label>
              <p className="text-white">{application.driverApplication.bankName}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Account Number</label>
              <p className="text-white">****{application.driverApplication.bankAccountNumber.slice(-4)}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Routing Number</label>
              <p className="text-white">{application.driverApplication.routingNumber}</p>
            </div>
          </div>
        </div>

        {/* License Information */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <IdentificationIcon className="w-5 h-5 mr-2" />
            Driver License
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">License Number</label>
              <p className="text-white">{application.driverApplication.licenseNumber}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Expiry Date</label>
              <p className="text-white">{application.driverApplication.licenseExpiry}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">State</label>
              <p className="text-white">{application.driverApplication.licenseState}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Class</label>
              <p className="text-white">{application.driverApplication.licenseClass}</p>
            </div>

            {(application.driverApplication.licensePhotoFront?.url || application.driverApplication.licensePhotoBack?.url) && (
              <div className="mt-4">
                <label className="text-sm text-gray-400 mb-2 block">License Photos</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {application.driverApplication.licensePhotoFront?.url && (
                    <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                      <p className="text-xs text-gray-400 mb-2">Front</p>
                      <img 
                        src={application.driverApplication.licensePhotoFront.url} 
                        alt="License Front"
                        className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => window.open(application.driverApplication.licensePhotoFront?.url || '', '_blank')}
                      />
                    </div>
                  )}
                  {application.driverApplication.licensePhotoBack?.url && (
                    <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                      <p className="text-xs text-gray-400 mb-2">Back</p>
                      <img 
                        src={application.driverApplication.licensePhotoBack.url} 
                        alt="License Back"
                        className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => window.open(application.driverApplication.licensePhotoBack?.url || '', '_blank')}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Vehicle Information */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <TruckIcon className="w-5 h-5 mr-2" />
            Vehicle Information
          </h3>
          
          {application.driverApplication.hasVehicle ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Vehicle</label>
                <p className="text-white">
                  {application.driverApplication.vehicleYear} {application.driverApplication.vehicleMake} {application.driverApplication.vehicleModel}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Type</label>
                <p className="text-white">{application.driverApplication.vehicleType}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">License Plate</label>
                <p className="text-white">{application.driverApplication.vehiclePlate}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Color</label>
                <p className="text-white">{application.driverApplication.vehicleColor}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Capacity</label>
                <p className="text-white">{application.driverApplication.vehicleCapacity} passengers</p>
              </div>

              {(application.driverApplication.registrationPhoto?.url || application.driverApplication.insurancePhoto?.url) && (
                <div className="mt-4">
                  <label className="text-sm text-gray-400 mb-2 block">Vehicle Documents</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {application.driverApplication.registrationPhoto?.url && (
                      <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                        <p className="text-xs text-gray-400 mb-2">Registration</p>
                        <img 
                          src={application.driverApplication.registrationPhoto.url} 
                          alt="Vehicle Registration"
                          className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => window.open(application.driverApplication.registrationPhoto?.url || '', '_blank')}
                        />
                      </div>
                    )}
                    {application.driverApplication.insurancePhoto?.url && (
                      <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                        <p className="text-xs text-gray-400 mb-2">Insurance</p>
                        <img 
                          src={application.driverApplication.insurancePhoto.url} 
                          alt="Insurance Document"
                          className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => window.open(application.driverApplication.insurancePhoto?.url || '', '_blank')}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-400">No vehicle information provided</p>
          )}
        </div>
      </div>

      {/* Service Types */}
      {application.driverApplication.serviceTypes && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Service Types</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(application.driverApplication.serviceTypes).map(([service, enabled]) => (
              <div key={service} className={`p-3 rounded-lg border ${enabled ? 'bg-green-900/30 border-green-700 text-green-400' : 'bg-gray-700 border-gray-600 text-gray-400'}`}>
                <p className="text-sm capitalize">{service.replace(/([A-Z])/g, ' $1').trim()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Availability */}
      {application.driverApplication.availability && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Availability</h3>
          <div className="grid grid-cols-7 gap-2">
            {Object.entries(application.driverApplication.availability).map(([day, available]) => (
              <div key={day} className={`p-2 rounded-lg text-center border ${available ? 'bg-blue-900/30 border-blue-700 text-blue-400' : 'bg-gray-700 border-gray-600 text-gray-400'}`}>
                <p className="text-xs capitalize">{day.slice(0, 3)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Application Timeline */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Application Timeline</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <div>
              <p className="text-white text-sm">Application Submitted</p>
              <p className="text-gray-400 text-xs">{new Date(application.submissionDate).toLocaleString()}</p>
            </div>
          </div>
          {application.reviewDate && (
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <div>
                <p className="text-white text-sm">Last Reviewed</p>
                <p className="text-gray-400 text-xs">{new Date(application.reviewDate).toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 