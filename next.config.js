/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  // Enable webpack configuration for TypeScript path aliases
  webpack: (config, { isServer }) => {
    // This helps ensure that TypeScript path aliases work correctly
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './src'),
    };
    
    // Return the modified config
    return config;
  },
  // Ensure we can use SVG files
  images: {
    dangerouslyAllowSVG: true
  },
  // Add support for TypeScript path mapping
  experimental: {
    esmExternals: 'loose',
    outputFileTracingRoot: path.join(__dirname, '../../'),
  },
};

module.exports = nextConfig; 