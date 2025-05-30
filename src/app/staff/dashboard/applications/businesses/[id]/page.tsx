'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeftIcon,
  BuildingOfficeIcon,
  UserIcon,
  CreditCardIcon,
  ClockIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  PhotoIcon,
  DocumentTextIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

interface BusinessApplication {
  _id: string;
  applicationRef: string;
  status: string;
  submissionDate: string;
  businessApplication: {
    businessName: string;
    businessCategory: string;
    businessIndustry: string;
    businessType: string;
    businessEmail: string;
    businessPhone: string;
    businessRegistrationNumber: string;
    businessAddress?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    taxId?: string;
    website?: string;
    description?: string;
    ownerInformation?: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      title: string;
    };
    bankingInformation?: {
      accountHolderName: string;
      bankName: string;
      accountNumber: string;
      routingNumber: string;
      accountType: string;
    };
    businessHours?: {
      monday: { open: string; close: string; closed: boolean };
      tuesday: { open: string; close: string; closed: boolean };
      wednesday: { open: string; close: string; closed: boolean };
      thursday: { open: string; close: string; closed: boolean };
      friday: { open: string; close: string; closed: boolean };
      saturday: { open: string; close: string; closed: boolean };
      sunday: { open: string; close: string; closed: boolean };
    };
    documents?: {
      businessLicense?: { 
        url: string; 
        originalName: string; 
        publicId?: string;
        uploadedAt?: string;
        _id?: string;
      };
      taxDocument?: { 
        url: string; 
        originalName: string; 
        publicId?: string;
        uploadedAt?: string;
        _id?: string;
      };
      ownerID?: { 
        url: string; 
        originalName: string; 
        publicId?: string;
        uploadedAt?: string;
        _id?: string;
      };
      bankStatement?: { 
        url: string; 
        originalName: string; 
        publicId?: string;
        uploadedAt?: string;
        _id?: string;
      };
      businessInsurance?: { 
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

export default function BusinessApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [application, setApplication] = useState<BusinessApplication | null>(null);
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
        setEditedData(app.businessApplication);
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
          <div className="w-12 h-12 rounded-full border-4 border-green-500 border-t-transparent animate-spin absolute top-0"></div>
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
          href="/staff/dashboard/applications/businesses"
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
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
            href="/staff/dashboard/applications/businesses"
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Business Application</h1>
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
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
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
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Add notes about this application review..."
          />
        </div>
        
        <button
          onClick={handleStatusUpdate}
          disabled={saving}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          <CheckIcon className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Update Status'}
        </button>
      </div>

      {/* Application Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Information */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <BuildingOfficeIcon className="w-5 h-5 mr-2" />
            Business Information
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">Business Name</label>
              <p className="text-white font-medium">{application.businessApplication.businessName}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Category</label>
              <p className="text-white">{application.businessApplication.businessCategory}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Industry</label>
              <p className="text-white">{application.businessApplication.businessIndustry}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Business Type</label>
              <p className="text-white">{application.businessApplication.businessType}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Registration Number</label>
              <p className="text-white">{application.businessApplication.businessRegistrationNumber}</p>
            </div>
            {application.businessApplication.taxId && (
              <div>
                <label className="text-sm text-gray-400">Tax ID</label>
                <p className="text-white">{application.businessApplication.taxId}</p>
              </div>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <PhoneIcon className="w-5 h-5 mr-2" />
            Contact Information
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">Email</label>
              <p className="text-white">{application.businessApplication.businessEmail}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Phone</label>
              <p className="text-white">{application.businessApplication.businessPhone}</p>
            </div>
            {application.businessApplication.website && (
              <div>
                <label className="text-sm text-gray-400">Website</label>
                <p className="text-white">{application.businessApplication.website}</p>
              </div>
            )}
          </div>
        </div>

        {/* Owner Information */}
        {application.businessApplication.ownerInformation && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <UserIcon className="w-5 h-5 mr-2" />
              Owner Information
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Name</label>
                <p className="text-white">
                  {application.businessApplication.ownerInformation.firstName} {application.businessApplication.ownerInformation.lastName}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Title</label>
                <p className="text-white">{application.businessApplication.ownerInformation.title}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Email</label>
                <p className="text-white">{application.businessApplication.ownerInformation.email}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Phone</label>
                <p className="text-white">{application.businessApplication.ownerInformation.phone}</p>
              </div>
            </div>
          </div>
        )}

        {/* Banking Information */}
        {application.businessApplication.bankingInformation && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <CreditCardIcon className="w-5 h-5 mr-2" />
              Banking Information
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Account Holder</label>
                <p className="text-white">{application.businessApplication.bankingInformation.accountHolderName}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Bank Name</label>
                <p className="text-white">{application.businessApplication.bankingInformation.bankName}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Account Number</label>
                <p className="text-white">****{application.businessApplication.bankingInformation.accountNumber.slice(-4)}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Routing Number</label>
                <p className="text-white">{application.businessApplication.bankingInformation.routingNumber}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Account Type</label>
                <p className="text-white">{application.businessApplication.bankingInformation.accountType}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Business Address */}
      {application.businessApplication.businessAddress && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <MapPinIcon className="w-5 h-5 mr-2" />
            Business Address
          </h3>
          <div className="text-white">
            <p>{application.businessApplication.businessAddress.street}</p>
            <p>
              {application.businessApplication.businessAddress.city}, {application.businessApplication.businessAddress.state} {application.businessApplication.businessAddress.zipCode}
            </p>
            <p>{application.businessApplication.businessAddress.country}</p>
          </div>
        </div>
      )}

      {/* Business Description */}
      {application.businessApplication.description && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Business Description</h3>
          <p className="text-gray-300">{application.businessApplication.description}</p>
        </div>
      )}

      {/* Business Hours */}
      {application.businessApplication.businessHours && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Business Hours</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(application.businessApplication.businessHours).map(([day, hours]) => (
              <div key={day} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0">
                <span className="text-gray-300 capitalize font-medium">{day}</span>
                <span className="text-white">
                  {hours.closed ? 'Closed' : `${hours.open} - ${hours.close}`}
                </span>
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
            {application.businessApplication.documents ? 
              `(${Object.keys(application.businessApplication.documents).length} total, ${Object.entries(application.businessApplication.documents).filter(([key, doc]) => doc?.url).length} with URLs)` 
              : '(No documents object)'}
          </span>
        </h3>
        
        {/* Debug section - remove this after fixing */}
        {application.businessApplication.documents && (
          <div className="mb-4 p-3 bg-gray-700 rounded text-xs text-gray-300">
            <strong>Debug Info:</strong>
            <pre className="mt-1 overflow-x-auto">
              {JSON.stringify(application.businessApplication.documents, null, 2)}
            </pre>
          </div>
        )}
        
        {application.businessApplication.documents && Object.keys(application.businessApplication.documents).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(application.businessApplication.documents).map(([docType, doc]) => {
              console.log('Processing business document:', docType, doc); // Debug log
              
              if (!doc || !doc.url) {
                console.log('Skipping business document - no doc or no URL:', docType); // Debug log
                return null;
              }
              
              return (
                <div key={docType} className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-white capitalize">
                      {docType.replace(/([A-Z])/g, ' $1').replace(/ID/g, 'ID').trim()}
                    </h4>
                    <span className="text-xs text-gray-400 bg-gray-600 px-2 py-1 rounded">
                      {docType.includes('license') ? '📜' : 
                       docType.includes('tax') ? '📊' : 
                       docType.includes('owner') && docType.includes('ID') ? '🪪' : 
                       docType.includes('bank') ? '🏦' : 
                       docType.includes('insurance') ? '🛡️' : '📄'}
                    </span>
                  </div>
                  
                  <div className="relative group">
                    <img 
                      src={doc.url} 
                      alt={doc.originalName || docType}
                      className="w-full h-32 object-cover rounded-lg mb-2 cursor-pointer hover:opacity-80 transition-opacity"
                      onError={(e) => {
                        console.error('Business image failed to load:', doc.url); // Debug log
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                      onLoad={() => {
                        console.log('Business image loaded successfully:', doc.url); // Debug log
                      }}
                      onClick={() => window.open(doc.url, '_blank')}
                    />
                    {/* Fallback for failed images */}
                    <div className="hidden w-full h-32 bg-gray-600 rounded-lg mb-2 items-center justify-center flex-col text-gray-400">
                      <PhotoIcon className="w-8 h-8 mb-1" />
                      <span className="text-xs">Document unavailable</span>
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
                        className="flex-1 text-center px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
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
              The business has not uploaded any documents yet.
            </p>
          </div>
        )}
      </div>

      {/* Application Timeline */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Application Timeline</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
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