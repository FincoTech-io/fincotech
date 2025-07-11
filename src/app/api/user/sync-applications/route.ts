import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import User from '@/models/User';
import Application from '@/models/Application';
import { getAccessToken, verifyAccessToken } from '@/utils/serverAuth';

/**
 * POST /api/user/sync-applications
 * 
 * Syncs applications from the applications collection to the authenticated user's document
 * Authentication token required in Authorization header or as a cookie
 * 
 * @returns Sync results
 */
export async function POST(request: NextRequest) {
  try {
    // Get token
    const token = getAccessToken(request);

    // If no token, return unauthorized
    if (!token) {
      return NextResponse.json({ 
        authenticated: false,
        message: 'No authentication token provided'
      }, { status: 401 });
    }

    try {
      // Verify the token
      const payload = await verifyAccessToken(token);
      
      // Extract userId from token payload
      const userId = payload?.userId as string;

      // Connect to database
      await connectToDatabase();

      console.log(`🔧 Starting application sync for user: ${userId}`);

      // Get user
      const user = await User.findById(userId);
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }

      console.log(`👤 User found: ${user.fullName} (${user.phoneNumber})`);
      console.log(`Current applications in user document: ${user.applications?.length || 0}`);

      // Get all applications for this user from the applications collection
      const applications = await Application.find({ applicantUserId: userId })
        .select('_id applicationRef applicationType status submissionDate')
        .lean();

      console.log(`📋 Found ${applications.length} applications in applications collection`);

      if (applications.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No applications found for this user',
          data: {
            userApplications: user.applications?.length || 0,
            databaseApplications: 0,
            synced: 0
          }
        });
      }

      // Get current application refs in user document
      const existingRefs = new Set(
        (user.applications || []).map(app => app.applicationRef)
      );

      // Find applications that need to be added to user document
      const applicationsToAdd = applications.filter(
        app => !existingRefs.has(app.applicationRef)
      );

      console.log(`🔄 Need to sync ${applicationsToAdd.length} applications to user document`);

      if (applicationsToAdd.length > 0) {
        // Prepare application references for user document
        const applicationRefs = applicationsToAdd.map(app => ({
          applicationId: app._id,
          applicationRef: app.applicationRef,
          applicationType: app.applicationType,
          status: app.status,
          submissionDate: app.submissionDate
        }));

        // Add missing applications to user document
        const updatedUser = await User.findByIdAndUpdate(
          userId,
          {
            $push: {
              applications: { $each: applicationRefs }
            }
          },
          { new: true, runValidators: true }
        );

        console.log(`✅ Successfully synced ${applicationsToAdd.length} applications to user document`);
        console.log(`New total applications in user document: ${updatedUser?.applications?.length || 0}`);

        return NextResponse.json({
          success: true,
          message: `Successfully synced ${applicationsToAdd.length} applications`,
          data: {
            userApplicationsBefore: user.applications?.length || 0,
            userApplicationsAfter: updatedUser?.applications?.length || 0,
            databaseApplications: applications.length,
            synced: applicationsToAdd.length,
            syncedApplications: applicationsToAdd.map(app => app.applicationRef)
          }
        });
      } else {
        return NextResponse.json({
          success: true,
          message: 'All applications are already synced',
          data: {
            userApplications: user.applications?.length || 0,
            databaseApplications: applications.length,
            synced: 0
          }
        });
      }

    } catch (error) {
      console.error('Error verifying token:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

  } catch (error: any) {
    console.error('❌ Error syncing applications:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to sync applications' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/user/sync-applications
 * 
 * Checks the sync status between user document and applications collection
 * Authentication token required in Authorization header or as a cookie
 * 
 * @returns Sync status information
 */
export async function GET(request: NextRequest) {
  try {
    // Get token
    const token = getAccessToken(request);

    // If no token, return unauthorized
    if (!token) {
      return NextResponse.json({ 
        authenticated: false,
        message: 'No authentication token provided'
      }, { status: 401 });
    }

    try {
      // Verify the token
      const payload = await verifyAccessToken(token);
      
      // Extract userId from token payload
      const userId = payload?.userId as string;

      // Connect to database
      await connectToDatabase();

      // Get user with applications
      const user = await User.findById(userId)
        .select('fullName phoneNumber applications')
        .lean();

      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }

      // Get applications from applications collection
      const databaseApplications = await Application.find({ applicantUserId: userId })
        .select('_id applicationRef applicationType status submissionDate')
        .lean();

      // Compare and find discrepancies
      const userAppRefs = new Set(
        (user.applications || []).map(app => app.applicationRef)
      );
      
      const dbAppRefs = new Set(
        databaseApplications.map(app => app.applicationRef)
      );

      const missingFromUser = databaseApplications.filter(
        app => !userAppRefs.has(app.applicationRef)
      );

      const extraInUser = (user.applications || []).filter(
        app => !dbAppRefs.has(app.applicationRef)
      );

      return NextResponse.json({
        success: true,
        data: {
          user: {
            id: user._id,
            fullName: user.fullName,
            phoneNumber: user.phoneNumber
          },
          userApplications: user.applications?.length || 0,
          databaseApplications: databaseApplications.length,
          isInSync: missingFromUser.length === 0 && extraInUser.length === 0,
          discrepancies: {
            missingFromUser: missingFromUser.length,
            extraInUser: extraInUser.length,
            missingApplications: missingFromUser.map(app => app.applicationRef),
            extraApplications: extraInUser.map(app => app.applicationRef)
          },
          userApplicationsList: user.applications || [],
          databaseApplicationsList: databaseApplications
        }
      });

    } catch (error) {
      console.error('Error verifying token:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

  } catch (error: any) {
    console.error('❌ Error checking application sync:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to check applications' },
      { status: 500 }
    );
  }
} 