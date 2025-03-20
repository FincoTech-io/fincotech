import { NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest) {
    return NextResponse.json(
        { success: true, message: 'Fees fetched successfully' },
        { status: 200 }
    );
} 