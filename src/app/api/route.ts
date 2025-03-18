import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "success",
    message: "FincoTech API is running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
} 