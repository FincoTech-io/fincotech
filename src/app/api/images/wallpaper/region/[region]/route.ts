import { getImagesInFolder } from '@/utils/cloudinaryUtils';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ region: string }> }
) {
  try {
    // Await the params Promise
    const resolvedParams = await params;
    const region = resolvedParams.region;
    
    // Get query parameters
    const url = new URL(request.url);
    const page = url.searchParams.get('page');
    const limit = url.searchParams.get('limit');
    
    // Format the folder path and set pagination
    const folderPath = `home/${region}`;
    const maxResults = limit ? parseInt(limit) : 20;
    const nextCursor = page && page !== '1' ? page : null;
    
    // Get images from the folder
    const result = await getImagesInFolder(folderPath, {
      maxResults,
      nextCursor
    });
    
    // Return successful response
    return new Response(
      JSON.stringify({
        success: true,
        message: `Retrieved ${result.images.length} images from ${region} region`,
        data: {
          images: result.images,
          totalCount: result.totalCount,
          nextPage: result.nextCursor,
          region
        }
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error: any) {
    console.error(`Error retrieving region images: ${error.message || error}`);
    
    // Return error response
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Error retrieving images',
        error: error.message || 'Unknown error'
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
} 