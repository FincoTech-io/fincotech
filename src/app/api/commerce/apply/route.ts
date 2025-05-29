import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import Application from '@/models/Application';
import User from '@/models/User';
import {
  generateApplicationRef,
  validateBusinessApplication,
  validateDriverApplication,
  processDocumentUploads,
  getBusinessDocumentFields,
  getDriverDocumentFields,
  getCloudinaryFolder,
  sanitizeApplicationData,
  transformDriverData
} from '@/utils/applicationUtils';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const applicationData = await request.json();
    const { applicationType, applicantUserId, ...rawData } = applicationData;
    
    // Validate application type
    if (!applicationType || !['business', 'driver'].includes(applicationType)) {
      return NextResponse.json(
        { success: false, error: 'Valid application type (business or driver) is required' },
        { status: 400 }
      );
    }

    // Sanitize the data
    let data = sanitizeApplicationData(rawData);

    // Transform driver data if needed
    if (applicationType === 'driver') {
      data = transformDriverData(data);
    }

    // Get client information
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Generate application reference
    const applicationRef = generateApplicationRef(applicationType);

    let processedApplicationData;
    let validationResult;

    if (applicationType === 'business') {
      // Validate business application data
      validationResult = validateBusinessApplication(data);
      
      if (!validationResult.isValid) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Validation failed', 
            details: validationResult.errors 
          },
          { status: 400 }
        );
      }

      // Process business document uploads
      const documentFields = getBusinessDocumentFields();
      const cloudinaryFolder = getCloudinaryFolder('business');
      
      processedApplicationData = await processDocumentUploads(
        data, 
        documentFields, 
        cloudinaryFolder
      );

    } else if (applicationType === 'driver') {
      // Validate driver application data
      validationResult = validateDriverApplication(data);
      
      if (!validationResult.isValid) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Validation failed', 
            details: validationResult.errors 
          },
          { status: 400 }
        );
      }

      // Process driver document uploads
      const documentFields = getDriverDocumentFields();
      const cloudinaryFolder = getCloudinaryFolder('driver');
      
      processedApplicationData = await processDocumentUploads(
        data, 
        documentFields, 
        cloudinaryFolder
      );
    }

    // Create the application record
    const applicationDoc: any = {
      applicationType,
      applicantUserId: applicantUserId || null,
      applicationRef,
      status: 'Pending',
      submissionDate: new Date(),
      ipAddress: clientIP,
      userAgent,
      source: data.source || 'mobile_app'
    };

    // Add the appropriate application data
    if (applicationType === 'business') {
      applicationDoc.businessApplication = processedApplicationData;
    } else {
      applicationDoc.driverApplication = processedApplicationData;
    }

    const newApplication = new Application(applicationDoc);
    await newApplication.save();

    // Add application reference to user's document if user ID is provided
    if (applicantUserId) {
      try {
        await User.findByIdAndUpdate(
          applicantUserId,
          {
            $push: {
              applications: {
                applicationId: newApplication._id,
                applicationRef: applicationRef,
                applicationType: applicationType,
                status: 'Pending',
                submissionDate: newApplication.submissionDate
              }
            }
          },
          { new: true }
        );
        console.log(`Added application reference to user ${applicantUserId}`);
      } catch (userUpdateError) {
        console.error('Error updating user with application reference:', userUpdateError);
        // Don't fail the whole request if user update fails
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        applicationRef,
        applicationId: newApplication._id,
        status: 'Pending',
        submissionDate: newApplication.submissionDate,
        message: `${applicationType === 'business' ? 'Business' : 'Driver'} application submitted successfully`
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error submitting application:', error);
    
    // Handle specific validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, error: 'Database validation error', details: validationErrors },
        { status: 400 }
      );
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'Application with this reference already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit application' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const applicationRef = searchParams.get('applicationRef');
    const applicantUserId = searchParams.get('applicantUserId');
    const applicationType = searchParams.get('applicationType');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = parseInt(searchParams.get('skip') || '0');

    if (applicationRef) {
      // Get specific application by reference
      const application = await Application.findOne({ applicationRef }).lean();
      
      if (!application) {
        return NextResponse.json(
          { success: false, error: 'Application not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: application
      });
    }

    // Build query for multiple applications
    let query: any = {};
    if (applicantUserId) query.applicantUserId = applicantUserId;
    if (applicationType) query.applicationType = applicationType;
    if (status) query.status = status;

    const applications = await Application.find(query)
      .sort({ submissionDate: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v') // Exclude version field
      .lean();

    const total = await Application.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: {
        applications,
        pagination: {
          total,
          limit,
          skip,
          hasMore: skip + limit < total,
          currentPage: Math.floor(skip / limit) + 1,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error: any) {
    console.error('Error retrieving applications:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve applications' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { applicationRef, status, reviewNotes, rejectionReason, reviewedBy } = await request.json();
    
    if (!applicationRef) {
      return NextResponse.json(
        { success: false, error: 'Application reference is required' },
        { status: 400 }
      );
    }

    const validStatuses = ['Pending', 'In Review', 'Approved', 'Declined'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status. Valid statuses are: ' + validStatuses.join(', ') },
        { status: 400 }
      );
    }

    const application = await Application.findOne({ applicationRef });
    
    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      );
    }

    // Update application status and review information
    if (status) application.status = status;
    if (reviewNotes) application.reviewNotes = reviewNotes;
    if (rejectionReason) application.rejectionReason = rejectionReason;
    if (reviewedBy) application.reviewedBy = reviewedBy;
    
    application.reviewDate = new Date();
    
    if (status === 'Approved') {
      application.approvalDate = new Date();
    } else if (status === 'Declined') {
      application.rejectionDate = new Date();
    }

    await application.save();

    // Update user's application status if user exists
    if (application.applicantUserId && status) {
      try {
        await User.findByIdAndUpdate(
          application.applicantUserId,
          {
            $set: {
              'applications.$[elem].status': status
            }
          },
          {
            arrayFilters: [{ 'elem.applicationRef': applicationRef }],
            new: true
          }
        );
        console.log(`Updated application status in user document for ${applicationRef}`);
      } catch (userUpdateError) {
        console.error('Error updating user application status:', userUpdateError);
        // Don't fail the request if user update fails
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        applicationRef: application.applicationRef,
        status: application.status,
        reviewDate: application.reviewDate,
        approvalDate: application.approvalDate,
        rejectionDate: application.rejectionDate
      },
      message: 'Application updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating application:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update application' },
      { status: 500 }
    );
  }
} 