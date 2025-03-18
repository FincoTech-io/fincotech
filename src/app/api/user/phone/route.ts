import { NextRequest, NextResponse } from 'next/server';
import { userExistsByPhone } from '@/utils/db';

/**
 * @swagger
 * /api/user/phone?phone={phone}:
 *   get:
 *     summary: Check if a user with a specific phone number exists
 *     description: Returns true if a user with the given phone number exists, false otherwise
 *     tags:
 *       - User
 *     parameters:
 *       - in: query
 *         name: phone
 *         schema:
 *           type: string
 *         required: true
 *         description: Phone number to check
 *     responses:
 *       200:
 *         description: User existence check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exists:
 *                   type: boolean
 *                   description: True if user exists, false otherwise
 *       400:
 *         description: Bad request - missing phone parameter
 *       500:
 *         description: Server error
 */
export async function GET(request: NextRequest) {
  try {
    // Get the phone parameter from the URL
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    // Check if phone parameter is provided
    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Format the phone number (remove spaces, dashes, etc.)
    const formattedPhone = phone.replace(/[^0-9+]/g, '');

    // Check if user with this phone number exists
    const exists = await userExistsByPhone(formattedPhone);

    // Return the result
    return NextResponse.json({ exists });
  } catch (error) {
    console.error('Error checking user by phone:', error);
    return NextResponse.json(
      { error: 'Failed to check user existence' },
      { status: 500 }
    );
  }
}
