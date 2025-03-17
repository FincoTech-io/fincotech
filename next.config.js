/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  // Enable webpack configuration for TypeScript path aliases
  webpack: (config) => {
    // This helps ensure that TypeScript path aliases work correctly
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './src'),
    };

    return config;
  },
  // Ensure we can use SVG files
  images: {
    dangerouslyAllowSVG: true
  }
};

module.exports = nextConfig; 