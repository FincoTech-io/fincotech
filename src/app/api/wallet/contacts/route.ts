import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import { getContacts } from '@/utils/walletUtils';
import { jwtVerify } from 'jose';
import { IUser } from '@/models/User';
import { getAccessToken } from '@/utils/serverAuth';

/**
 * GET /api/wallet/contacts
 * 
 * Retrieves the contacts from the user's wallet
 * Authentication token can be provided in Authorization header or as a cookie
 * 
 * @returns List of contacts stored in the user's wallet
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
      const secretKey = new TextEncoder().encode(
        process.env.JWT_SECRET as string
      );
      
      const { payload } = await jwtVerify(token, secretKey);
      
      // Extract userId from token payload
      const userId = payload.userId as string;

      // Connect to database
      await connectToDatabase();

      // Get wallet contacts
      const contacts = await getContacts(userId);

      // If no wallet found
      if (contacts === null) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Wallet not found' 
          },
          { status: 404 }
        );
      }

      // Process contacts to include populated user data
      const formattedContacts = contacts.map((contact, index) => {
        // Check if userId is populated and has the expected properties
        const contactUser = typeof contact.userId === 'object' && contact.userId !== null 
          ? contact.userId 
          : { _id: contact.userId };
        
        return {
          contactId: contactUser._id,
          index, // Include index position to help identify contacts with null IDs
          fullName: (contactUser as IUser).fullName || 'Unknown',
          phoneNumber: (contactUser as IUser).phoneNumber || 'Unknown',
          email: (contactUser as IUser).email || 'Unknown',
          nickname: contact.nickname || '',
          lastTransactionDate: contact.lastTransactionDate || null,
          profileImage: (contactUser as IUser).profileImage || null
        };
      });

      // Return contacts data
      return NextResponse.json({
        success: true,
        contacts: formattedContacts
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
    console.error('Error fetching wallet contacts:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/wallet/contacts
 * 
 * Adds a new contact to the user's wallet
 * 
 * @returns The updated list of contacts
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
      const secretKey = new TextEncoder().encode(
        process.env.JWT_SECRET as string
      );
      
      const { payload } = await jwtVerify(token, secretKey);
      
      // Extract userId from token payload
      const userId = payload.userId as string;

      // Connect to database
      await connectToDatabase();

      // Get request body
      const { contactUserId, nickname } = await request.json();

      // Validate required fields
      if (!contactUserId) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Contact user ID is required' 
          },
          { status: 400 }
        );
      }

      // Import Wallet model here to avoid circular dependencies
      const Wallet = (await import('@/models/Wallet')).default;

      // Find user's wallet
      const wallet = await Wallet.findOne({ userId });
      if (!wallet) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Wallet not found' 
          },
          { status: 404 }
        );
      }

      // Check if contact already exists
      const existingContact = wallet.contacts.find(
        contact => contact.userId.toString() === contactUserId
      );

      if (existingContact) {
        // Update existing contact
        existingContact.nickname = nickname || existingContact.nickname;
        existingContact.lastTransactionDate = new Date();
      } else {
        // Add new contact
        wallet.contacts.push({
          userId: contactUserId,
          nickname: nickname || '',
          lastTransactionDate: new Date()
        });
      }

      // Save changes
      await wallet.save();

      // Get updated contacts
      const updatedContacts = await getContacts(userId);

      // Handle case where contacts couldn't be retrieved
      if (updatedContacts === null) {
        return NextResponse.json({
          success: true,
          message: 'Contact added successfully',
          contacts: []
        }, { status: 200 });
      }

      // Process contacts to include populated user data
      const formattedContacts = updatedContacts.map((contact, index) => {
        // Check if userId is populated and has the expected properties
        const contactUser = typeof contact.userId === 'object' && contact.userId !== null 
          ? contact.userId 
          : { _id: contact.userId };
        
        return {
          contactId: contactUser._id,
          index, // Include index position to help identify contacts with null IDs
          fullName: (contactUser as IUser).fullName || 'Unknown',
          phoneNumber: (contactUser as IUser).phoneNumber || 'Unknown',
          email: (contactUser as IUser).email || 'Unknown',
          nickname: contact.nickname || '',
          lastTransactionDate: contact.lastTransactionDate || null,
          profileImage: (contactUser as IUser).profileImage || null
        };
      });

      // Return updated contacts
      return NextResponse.json({
        success: true,
        contacts: formattedContacts
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
    console.error('Error adding wallet contact:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/wallet/contacts
 * 
 * Removes a contact from the user's wallet
 * 
 * @returns Success status
 */
export async function DELETE(request: NextRequest) {
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
      const secretKey = new TextEncoder().encode(
        process.env.JWT_SECRET as string
      );
      
      const { payload } = await jwtVerify(token, secretKey);
      
      // Extract userId from token payload
      const userId = payload.userId as string;

      // Connect to database
      await connectToDatabase();

      // Get contact ID or index from URL
      const { searchParams } = new URL(request.url);
      const contactUserId = searchParams.get('contactId');
      const contactIndex = searchParams.get('index') ? parseInt(searchParams.get('index')!) : null;

      // Import Wallet model here to avoid circular dependencies
      const Wallet = (await import('@/models/Wallet')).default;

      // Find user's wallet
      const wallet = await Wallet.findOne({ userId });
      if (!wallet) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Wallet not found' 
          },
          { status: 404 }
        );
      }

      // If we have a contactId, remove by ID; otherwise, if we have an index, remove by position
      if (contactUserId) {
        // Filter out the contact to be removed by ID
        wallet.contacts = wallet.contacts.filter(
          contact => contact.userId.toString() !== contactUserId
        );
      } else if (contactIndex !== null && !isNaN(contactIndex) && contactIndex >= 0 && contactIndex < wallet.contacts.length) {
        // Remove contact by index position
        wallet.contacts.splice(contactIndex, 1);
      } else {
        return NextResponse.json(
          { 
            success: false,
            error: 'Either contact ID or valid index is required' 
          },
          { status: 400 }
        );
      }

      // Save changes
      await wallet.save();

      // Return success
      return NextResponse.json({
        success: true,
        message: 'Contact removed successfully'
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
    console.error('Error removing wallet contact:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}


