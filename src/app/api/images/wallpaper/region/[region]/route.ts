import { NextRequest, NextResponse } from 'next/server';
import { getImagesInFolder } from '@/utils/cloudinaryUtils';

/**
 * GET handler for retrieving images from a specific region
 * @param request The incoming request
 * @param context Route parameters including the region 
 * @returns NextResponse with the images data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { region: string } }
) {
  try {
    const { region } = params;
    
    if (!region) {
      return NextResponse.json(
        {
          success: false,
          message: 'Region parameter is required'
        },
        { status: 400 }
      );
    }

    // Get query parameters for pagination
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');

    console.log(`Getting images for region: ${region}`);

    // Format the folder path correctly
    const folderPath = `home/${region}`;
    
    // Calculate pagination parameters
    const maxResults = limit ? parseInt(limit) : 20;
    const nextCursor = page && page !== '1' ? page : null;

    try {
      // Get images from the folder
      const result = await getImagesInFolder(folderPath, {
        maxResults,
        nextCursor
      });

      return NextResponse.json(
        {
          success: true,
          message: `Retrieved ${result.images.length} images from ${region} region`,
          data: {
            images: result.images,
            totalCount: result.totalCount,
            nextPage: result.nextCursor,
            region
          }
        },
        { status: 200 }
      );
    } catch (cloudinaryError: any) {
      console.error(`Cloudinary error: ${cloudinaryError.message || 'Unknown error'}`);
      
      // Check if it's a configuration or authentication error
      if (cloudinaryError.http_code === 401 || 
          (cloudinaryError.error && cloudinaryError.error.http_code === 401)) {
        return NextResponse.json(
          {
            success: false,
            message: 'Authentication error with image storage provider',
            error: 'Please check server configuration'
          },
          { status: 500 }
        );
      }
      
      throw cloudinaryError; // Let the outer catch handle other errors
    }
  } catch (error: any) {
    console.error(`Error retrieving region images: ${error.message || error}`);
    return NextResponse.json(
      {
        success: false,
        message: 'Error retrieving images',
        error: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
} 