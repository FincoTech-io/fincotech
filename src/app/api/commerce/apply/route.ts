import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import Application from '@/models/Application';
import User from '@/models/User';
import mongoose from 'mongoose';
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
import { getAuthenticatedStaff, isAdmin, unauthorizedResponse, forbiddenResponse } from '@/utils/staffAuth';
import { createMerchantFromApplication } from '@/utils/merchantUtils';
import { createDriverFromApplication } from '@/utils/driverUtils';

// Configure the API route for longer timeout and larger body size
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds for Vercel Pro plans, 10 seconds for hobby

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('🚀 Starting application submission...');
    await connectToDatabase();
    
    const applicationData = await request.json();
    const { applicationType, applicantUserId, ...rawData } = applicationData;
    
    console.log(`📋 Application type: ${applicationType}, User ID: ${applicantUserId || 'N/A'}`);
    console.log(`📊 Raw data size: ${JSON.stringify(rawData).length} characters`);
    
    // Validate application type
    if (!applicationType || !['business', 'driver'].includes(applicationType)) {
      return NextResponse.json(
        { success: false, error: 'Valid application type (business or driver) is required' },
        { status: 400 }
      );
    }

    // Validate applicant user ID (now required)
    if (!applicantUserId) {
      return NextResponse.json(
        { success: false, error: 'Applicant user ID is required' },
        { status: 400 }
      );
    }

    // Validate that applicantUserId is a valid MongoDB ObjectId
    if (!/^[0-9a-fA-F]{24}$/.test(applicantUserId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid applicant user ID format' },
        { status: 400 }
      );
    }

    // Verify that the user exists before processing the application
    console.log('👤 Verifying user exists...');
    const applicantUser = await User.findById(applicantUserId);
    if (!applicantUser) {
      console.error(`❌ User with ID ${applicantUserId} not found`);
      return NextResponse.json({
        success: false,
        error: 'User not found',
        details: `No user found with ID: ${applicantUserId}`
      }, { status: 404 });
    }
    
    console.log(`✅ User verified: ${applicantUser.fullName} (${applicantUser.phoneNumber})`);

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
    console.log(`🔖 Generated application reference: ${applicationRef}`);

    let processedApplicationData;
    let validationResult;

    if (applicationType === 'business') {
      // Validate business application data
      console.log('🔍 Validating business application...');
      validationResult = validateBusinessApplication(data);
      
      if (!validationResult.isValid) {
        console.log('❌ Business validation failed:', validationResult.errors);
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
      console.log('📤 Processing business document uploads...');
      const documentFields = getBusinessDocumentFields();
      const cloudinaryFolder = getCloudinaryFolder('business');
      
      processedApplicationData = await processDocumentUploads(
        data, 
        documentFields, 
        cloudinaryFolder
      );

    } else if (applicationType === 'driver') {
      // Validate driver application data
      console.log('🔍 Validating driver application...');
      validationResult = validateDriverApplication(data);
      
      if (!validationResult.isValid) {
        console.log('❌ Driver validation failed:', validationResult.errors);
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
      console.log('📤 Processing driver document uploads...');
      const documentFields = getDriverDocumentFields();
      const cloudinaryFolder = getCloudinaryFolder('driver');
      
      processedApplicationData = await processDocumentUploads(
        data, 
        documentFields, 
        cloudinaryFolder
      );
    }

    // Create the application record
    console.log('💾 Creating application record...');
    const applicationDoc: any = {
      applicationType,
      applicantUserId: applicantUserId, // Now always present
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
    console.log('✅ Application saved to database');

    // Add application reference to user's document (always executed now)
    console.log('👤 Updating user document with application reference...');
    console.log(`User ID: ${applicantUserId}`);
    console.log(`Application ID: ${newApplication._id}`);
    console.log(`Application Ref: ${applicationRef}`);
    
    console.log(`✅ User found: ${applicantUser.fullName} (${applicantUser.phoneNumber})`);
    console.log(`Current applications count: ${applicantUser.applications?.length || 0}`);
    
    // Update user with application reference
    const updatedUser = await User.findByIdAndUpdate(
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
      { 
        new: true,
        runValidators: true // Ensure validation runs
      }
    );
    
    if (!updatedUser) {
      console.error(`❌ Failed to update user ${applicantUserId} - user not found during update`);
      return NextResponse.json({
        success: false,
        error: 'Failed to update user',
        details: 'User not found during update operation'
      }, { status: 404 });
    }
    
    console.log(`✅ Successfully added application reference to user ${applicantUserId}`);
    console.log(`New applications count: ${updatedUser.applications?.length || 0}`);
    
    // Verify the application was actually added
    const applicationAdded = updatedUser.applications?.some(
      app => app.applicationRef === applicationRef
    );
    
    if (!applicationAdded) {
      console.error(`❌ Application reference ${applicationRef} was not found in updated user document`);
      return NextResponse.json({
        success: false,
        error: 'Failed to add application reference',
        details: 'Application reference was not added to user document'
      }, { status: 500 });
    }
    
    console.log(`✅ Verified: Application reference ${applicationRef} successfully added to user document`);

    const endTime = Date.now();
    const processingTime = endTime - startTime;
    console.log(`🎉 Application submission completed in ${processingTime}ms`);

    return NextResponse.json({
      success: true,
      data: {
        applicationRef,
        applicationId: newApplication._id,
        status: 'Pending',
        submissionDate: newApplication.submissionDate,
        processingTime: `${processingTime}ms`,
        message: `${applicationType === 'business' ? 'Business' : 'Driver'} application submitted successfully`
      }
    }, { status: 201 });

  } catch (error: any) {
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    console.error(`❌ Error submitting application (after ${processingTime}ms):`, error);
    
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

    // Handle timeout errors
    if (error.message?.includes('timeout') || error.code === 'ETIMEOUT') {
      return NextResponse.json(
        { success: false, error: 'Request timeout - please try again with smaller images or check your connection' },
        { status: 504 }
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
    
    // Authenticate staff member
    const authResult = await getAuthenticatedStaff(request);
    if (!authResult) {
      return unauthorizedResponse('Staff authentication required');
    }
    
    const { staff } = authResult;
    
    // Check if staff member is Admin
    if (!isAdmin(staff.role)) {
      return forbiddenResponse('Only Admin users can modify applications');
    }
    
    const { applicationRef, status, reviewNotes, rejectionReason } = await request.json();
    
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
    
    // Set reviewedBy to the actual staff member's ObjectId
    application.reviewedBy = staff._id as any;
    application.reviewDate = new Date();
    
    if (status === 'Approved') {
      application.approvalDate = new Date();
      
      // Auto-create merchant if this is an approved business application
      if (application.applicationType === 'business' && application.businessApplication) {
        try {
          const merchantResult = await createMerchantFromApplication(
            application.businessApplication,
            application.applicantUserId.toString(),
            staff._id.toString(),
            application.applicationRef
          );
          
          if (merchantResult.success) {
            console.log(`✅ Merchant created successfully for application ${application.applicationRef}`);
            // Optionally add merchant info to response
            application.reviewNotes = (application.reviewNotes || '') + 
              `\n[Auto-created merchant account: ${merchantResult.merchant._id}]`;
          } else {
            console.error(`❌ Failed to create merchant for application ${application.applicationRef}:`, merchantResult.error);
            // Don't fail the approval, just log the error
            application.reviewNotes = (application.reviewNotes || '') + 
              `\n[Warning: Failed to auto-create merchant account: ${merchantResult.error}]`;
          }
        } catch (error) {
          console.error(`❌ Error during merchant creation for application ${application.applicationRef}:`, error);
          application.reviewNotes = (application.reviewNotes || '') + 
            `\n[Warning: Error during merchant account creation]`;
        }
      }
      
      // Auto-create driver if this is an approved driver application
      if (application.applicationType === 'driver' && application.driverApplication) {
        try {
          const driverResult = await createDriverFromApplication(
            application.driverApplication,
            application.applicantUserId.toString(),
            staff._id.toString(),
            application.applicationRef
          );
          
          if (driverResult.success) {
            console.log(`✅ Driver created successfully for application ${application.applicationRef}`);
            // Optionally add driver info to response
            application.reviewNotes = (application.reviewNotes || '') + 
              `\n[Auto-created driver account: ${driverResult.driver._id}]`;
          } else {
            console.error(`❌ Failed to create driver for application ${application.applicationRef}:`, driverResult.error);
            // Don't fail the approval, just log the error
            application.reviewNotes = (application.reviewNotes || '') + 
              `\n[Warning: Failed to auto-create driver account: ${driverResult.error}]`;
          }
        } catch (error) {
          console.error(`❌ Error during driver creation for application ${application.applicationRef}:`, error);
          application.reviewNotes = (application.reviewNotes || '') + 
            `\n[Warning: Error during driver account creation]`;
        }
      }
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
        rejectionDate: application.rejectionDate,
        reviewedBy: {
          staffId: staff._id,
          name: `${staff.firstName} ${staff.lastName}`,
          employeeNumber: staff.employeeNumber
        }
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