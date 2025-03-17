import { NextResponse } from "next/server";

/**
 * @swagger
 * /:
 *   get:
 *     summary: API status endpoint
 *     description: Returns the status of the FincoTech API
 *     tags:
 *       - Status
 *     responses:
 *       200:
 *         description: API status information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Status'
 */
export async function GET() {
  return NextResponse.json({
    status: "success",
    message: "FincoTech API is running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
} 