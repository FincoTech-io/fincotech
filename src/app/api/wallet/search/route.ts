import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import User from '@/models/User';
import { jwtVerify } from 'jose';
import Wallet from '@/models/Wallet';

/**
 * GET /api/wallet/search?query=searchterm
 * 
 * Searches for active and verified users that match the query string
 * Used to find users to add as contacts
 * 
 * @returns List of matching users (excluding sensitive information)
 */
export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header (for mobile apps)
    const authHeader = request.headers.get('Authorization');
    let token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;
    
    // Fallback to cookies (for web apps)
    if (!token) {
      token = request.cookies.get('auth_token')?.value || null;
    }

    // If no token, return unauthorized
    if (!token) {
      return NextResponse.json(
        { 
          success: false,
          error: 'No authentication token provided' 
        },
        { status: 401 }
      );
    }

    try {
      // Verify the token
      const secretKey = new TextEncoder().encode(
        process.env.JWT_SECRET as string
      );
      
      const { payload } = await jwtVerify(token, secretKey);
      
      // Extract userId from token payload
      const currentUserId = payload.userId as string;

      // Get search query from URL
      const { searchParams } = new URL(request.url);
      const query = searchParams.get('query');

      // If no query provided, return error
      if (!query || query.trim().length < 2) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Search query must be at least 2 characters' 
          },
          { status: 400 }
        );
      }

      // Connect to database
      await connectToDatabase();

      // Create a regex for case-insensitive search
      const searchRegex = new RegExp(query, 'i');

      // Build search query to match name, email, or phone number
      // Only include active and verified users
      const searchQuery = {
        $or: [
          { fullName: searchRegex },
          { email: searchRegex },
          { phoneNumber: searchRegex }
        ],
        _id: { $ne: currentUserId }, // Exclude current user
        isActive: true,              // Only active users
        isVerified: true             // Only verified users
      };

      // Search for users
      const users = await User.find(searchQuery)
        .select('_id fullName phoneNumber email profileImage')
        .limit(20)  // Limit results for performance
        .lean()
        .exec();

      // Get current user's wallet to check existing contacts
      const currentUserWallet = await Wallet.findOne({ userId: currentUserId }).lean();
      
      // Create a set of contact user IDs for fast lookup
      const contactUserIds = new Set();
      
      if (currentUserWallet && currentUserWallet.contacts) {
        currentUserWallet.contacts.forEach(contact => {
          // Handle both object IDs and string IDs
          const contactId = contact.userId ? 
            (typeof contact.userId === 'object' ? 
              contact.userId.toString() : 
              contact.userId) 
            : null;
          
          if (contactId) {
            contactUserIds.add(contactId);
          }
        });
      }

      // Process users for the response and add isContact flag
      const formattedUsers = users.map(user => {
        const userId = user._id.toString();
        return {
          userId: userId,
          fullName: user.fullName,
          phoneNumber: user.phoneNumber,
          email: user.email,
          profileImage: user.profileImage?.url || null,
          isContact: contactUserIds.has(userId)
        };
      });

      // Return search results
      return NextResponse.json({
        success: true,
        users: formattedUsers
      }, { status: 200 });
    } catch (error) {
      console.error('Error verifying token:', error);
      // Token is invalid
      const response = NextResponse.json(
        { 
          success: false,
          error: 'Invalid authentication token' 
        },
        { status: 401 }
      );
      
      // Only clear cookie if it exists (for web apps)
      if (request.cookies.get('auth_token')) {
        response.cookies.delete('auth_token');
      }
      
      return response;
    }
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
