/**
 * Cloudinary Configuration
 * Provides utilities for image upload, retrieval, and management
 */

import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';
import { Request } from 'express';

dotenv.config();

// Validate that required environment variables are set
const requiredEnvVars = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`ERROR: Missing required environment variable ${varName}`);
  }
});

// Log the configured cloud name for debugging
console.log(`Cloudinary configured with cloud name: ${process.env.CLOUDINARY_CLOUD_NAME}`);

// Configure Cloudinary with proper error handling
try {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
} catch (error) {
  console.error('Error configuring Cloudinary:', error);
}

interface StorageDimensions {
  width: number;
  height: number;
}

interface GetImagesOptions {
  maxResults?: number;
  nextCursor?: string | null;
}

interface ImageResource {
  publicId: string;
  url: string;
  format: string;
  width: number;
  height: number;
  createdAt: string;
  tags: string[];
  context: Record<string, any>;
}

interface GetImagesResult {
  images: ImageResource[];
  totalCount: number;
  nextCursor: string | null;
}

// Adding custom params type for CloudinaryStorage
interface CloudinaryStorageParams {
  folder: string;
  allowed_formats: string[];
  transformation: Array<Record<string, any>>;
  public_id: (req: Request, file: Express.Multer.File) => string;
}

// Create storage configurations for different image types
const createStorageConfig = (folder: string, dimensions: StorageDimensions = { width: 500, height: 500 }) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: `fincotech/${folder}`,
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
      transformation: [{ width: dimensions.width, height: dimensions.height, crop: 'limit' }],
      // Add unique filename
      public_id: (req: Request, file: Express.Multer.File) => {
        const fileName = file.originalname.split('.')[0];
        return `${fileName}-${Date.now()}`;
      }
    } as CloudinaryStorageParams
  });
};

// Configure storage for profile images (smaller size)
const profileImageStorage = createStorageConfig('profiles', { width: 300, height: 300 });

// Configure storage for app images (larger size)
const appImageStorage = createStorageConfig('app', { width: 1200, height: 1200 });

// Create multer upload instances
const uploadProfileImage = multer({ 
  storage: profileImageStorage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Accept only image files
    if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/i)) {
      return cb(new Error('Only image files are allowed!'));
    }
    cb(null, true);
  }
});

const uploadAppImage = multer({ 
  storage: appImageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/i)) {
      return cb(new Error('Only image files are allowed!'));
    }
    cb(null, true);
  }
});

/**
 * Delete an image from Cloudinary
 * @param {string} publicId - The public ID of the image to delete
 * @returns {Promise<Object>} Result of deletion operation
 */
const deleteImage = async (publicId: string): Promise<any> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
};

/**
 * Generate a Cloudinary URL with transformations
 * @param {string} publicId - The public ID of the image
 * @param {Object} options - Transformation options
 * @returns {string} Transformed image URL
 */
const getImageUrl = (publicId: string, options: Record<string, any> = {}): string => {
  return cloudinary.url(publicId, options);
};

/**
 * Get all images from a specific folder in Cloudinary
 * @param {string} folderPath - The folder path to search in (e.g., 'home/zimbabwe')
 * @param {object} options - Additional options for the search
 * @param {number} options.maxResults - Maximum number of results to return (default: 100)
 * @param {string} options.nextCursor - Cursor for pagination
 * @returns {Promise<object>} - The search results with images array and next_cursor if available
 */
const getImagesInFolder = async (folderPath: string, options: GetImagesOptions = {}): Promise<GetImagesResult> => {
  try {
    console.log(`Retrieving images from folder: ${folderPath}`);
    
    // Use the direct listing API method
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: folderPath,
      max_results: options.maxResults || 100,
      next_cursor: options.nextCursor || undefined
    });
    
    console.log(`Successfully found ${result.resources?.length || 0} images in ${folderPath}`);
    
    return {
      images: result.resources.map((resource: any) => ({
        publicId: resource.public_id,
        url: resource.secure_url || resource.url,
        format: resource.format,
        width: resource.width,
        height: resource.height,
        createdAt: resource.created_at,
        tags: resource.tags || [],
        context: resource.context || {},
      })),
      totalCount: result.resources.length,
      nextCursor: result.next_cursor
    };
  } catch (error: any) {
    console.error('Error retrieving images from Cloudinary folder:', error);
    
    // Add more detailed error logging
    if (error.error && error.error.message) {
      console.error(`Cloudinary API error: ${error.error.message}`);
    }
    
    // Try the search API as fallback
    try {
      console.log('Trying search API as fallback...');
      // Use a simpler expression that should work better
      const searchResult = await cloudinary.search
        .expression(`folder=${folderPath}*`)  // Simpler expression without escaping
        .sort_by('created_at', 'desc')
        .max_results(options.maxResults || 100)
        .next_cursor(options.nextCursor || undefined)
        .execute();
      
      console.log(`Found ${searchResult.resources?.length || 0} images using search API`);
      
      return {
        images: searchResult.resources.map((resource: any) => ({
          publicId: resource.public_id,
          url: resource.secure_url || resource.url,
          format: resource.format,
          width: resource.width,
          height: resource.height,
          createdAt: resource.created_at,
          tags: resource.tags || [],
          context: resource.context || {},
        })),
        totalCount: searchResult.total_count || searchResult.resources.length,
        nextCursor: searchResult.next_cursor
      };
    } catch (fallbackError) {
      console.error('Fallback search method also failed:', fallbackError);
      throw error; // Throw the original error
    }
  }
};

// Export all functions
export {
  uploadProfileImage,
  uploadAppImage,
  cloudinary,
  deleteImage,
  getImageUrl,
  getImagesInFolder
}; 