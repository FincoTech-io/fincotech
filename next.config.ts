/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['swagger-ui-react'],
  
  // API route configuration for handling large uploads
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Increase body size limit to 10MB
    },
    responseLimit: false,
  },
  
  // Enable experimental features for better performance
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
