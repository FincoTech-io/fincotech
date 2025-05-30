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
  PhotoIcon
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
    documents?: {
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

  useEffect(() => {
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
    if (!application) return;
    
    try {
      setSaving(true);
      const response = await fetch('/api/commerce/apply', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationRef: application.applicationRef,
          status: statusUpdate,
          reviewNotes: reviewNotes,
          reviewedBy: 'Staff Member' // In real app, this would be the logged-in staff member
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
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
          href="/staff/dashboard/applications/drivers"
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
            href="/staff/dashboard/applications/drivers"
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

      {/* Status Update Section */}
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

      {/* Documents */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <PhotoIcon className="w-5 h-5 mr-2" />
          Uploaded Documents
          {/* Debug info */}
          <span className="ml-2 text-xs text-gray-400">
            {application.driverApplication.documents ? 
              `(${Object.keys(application.driverApplication.documents).length} total, ${Object.entries(application.driverApplication.documents).filter(([key, doc]) => doc?.url).length} with URLs)` 
              : '(No documents object)'}
          </span>
        </h3>
        
        {/* Debug section - remove this after fixing */}
        {application.driverApplication.documents && (
          <div className="mb-4 p-3 bg-gray-700 rounded text-xs text-gray-300">
            <strong>Debug Info:</strong>
            <pre className="mt-1 overflow-x-auto">
              {JSON.stringify(application.driverApplication.documents, null, 2)}
            </pre>
          </div>
        )}
        
        {application.driverApplication.documents && Object.keys(application.driverApplication.documents).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(application.driverApplication.documents).map(([docType, doc]) => {
              console.log('Processing document:', docType, doc); // Debug log
              
              if (!doc || !doc.url) {
                console.log('Skipping document - no doc or no URL:', docType); // Debug log
                return null;
              }
              
              return (
                <div key={docType} className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-white capitalize">
                      {docType.replace(/([A-Z])/g, ' $1').replace(/photo/gi, 'Photo').trim()}
                    </h4>
                    <span className="text-xs text-gray-400 bg-gray-600 px-2 py-1 rounded">
                      {docType.includes('license') ? '🪪' : 
                       docType.includes('registration') ? '📋' : 
                       docType.includes('insurance') ? '🛡️' : 
                       docType.includes('profile') ? '👤' : '📄'}
                    </span>
                  </div>
                  
                  <div className="relative group">
                    <img 
                      src={doc.url} 
                      alt={doc.originalName || docType}
                      className="w-full h-32 object-cover rounded-lg mb-2 cursor-pointer hover:opacity-80 transition-opacity"
                      onError={(e) => {
                        console.error('Image failed to load:', doc.url); // Debug log
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                      onLoad={() => {
                        console.log('Image loaded successfully:', doc.url); // Debug log
                      }}
                      onClick={() => window.open(doc.url, '_blank')}
                    />
                    {/* Fallback for failed images */}
                    <div className="hidden w-full h-32 bg-gray-600 rounded-lg mb-2 items-center justify-center flex-col text-gray-400">
                      <PhotoIcon className="w-8 h-8 mb-1" />
                      <span className="text-xs">Image unavailable</span>
                    </div>
                    
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="text-white text-sm font-medium bg-black bg-opacity-50 px-3 py-1 rounded-full">
                        Click to enlarge
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-xs text-gray-400 truncate" title={doc.originalName}>
                      📎 {doc.originalName || 'Document'}
                    </p>
                    {doc.uploadedAt && (
                      <p className="text-xs text-gray-500">
                        📅 {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                    )}
                    <div className="flex space-x-2">
                      <a 
                        href={doc.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1 text-center px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        View Full Size
                      </a>
                      <button
                        onClick={() => navigator.clipboard.writeText(doc.url)}
                        className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
                        title="Copy URL"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
              <PhotoIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-medium text-white mb-2">No Documents Uploaded</h4>
            <p className="text-gray-400 text-sm">
              The applicant has not uploaded any documents yet.
            </p>
          </div>
        )}
      </div>

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