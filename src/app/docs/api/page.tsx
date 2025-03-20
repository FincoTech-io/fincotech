'use client';

import React, { useState } from 'react';
import { ApiEndpoint } from './components/ApiEndpoint';

export default function ApiDocumentation() {
  const [activeCategory, setActiveCategory] = useState<string | null>('all');

  // Define all API endpoints with their documentation
  const apiEndpoints = [
    // Authentication endpoints
    {
      category: 'authentication',
      endpoint: '/api/authentication/sign-in',
      method: 'POST',
      description: 'Authenticates a user and returns access and refresh tokens',
      requestBody: {
        phoneNumber: 'string (required) - The user\'s phone number',
        pin: 'string (required) - The user\'s PIN',
      },
      responseExample: {
        status: 'success',
        data: {
          accessToken: 'string - JWT access token',
          refreshToken: 'string - JWT refresh token',
          user: {
            _id: 'string - User ID',
            phoneNumber: 'string - User phone number',
            fullName: 'string - User full name',
          }
        }
      },
    },
    {
      category: 'authentication',
      endpoint: '/api/authentication/refresh',
      method: 'POST',
      description: 'Refreshes an expired access token using a valid refresh token',
      requestBody: {
        refreshToken: 'string (required) - The refresh token',
      },
      responseExample: {
        status: 'success',
        data: {
          accessToken: 'string - New JWT access token',
        }
      },
    },
    {
      category: 'authentication',
      endpoint: '/api/authentication/logout',
      method: 'POST',
      description: 'Logs out a user by invalidating their refresh token',
      requestBody: {
        refreshToken: 'string (required) - The refresh token to invalidate',
      },
      responseExample: {
        status: 'success',
        message: 'Logged out successfully',
      },
    },
    {
      category: 'authentication',
      endpoint: '/api/authentication/otp/send',
      method: 'POST',
      description: 'Sends an OTP code to the user\'s phone number for verification',
      requestBody: {
        phoneNumber: 'string (required) - The user\'s phone number',
      },
      responseExample: {
        status: 'success',
        message: 'OTP sent successfully',
      },
    },
    {
      category: 'authentication',
      endpoint: '/api/authentication/otp/verify',
      method: 'POST',
      description: 'Verifies an OTP code sent to the user\'s phone',
      requestBody: {
        phoneNumber: 'string (required) - The user\'s phone number',
        otp: 'string (required) - The OTP code received',
      },
      responseExample: {
        status: 'success',
        message: 'OTP verified successfully',
      },
    },
    
    // User endpoints
    {
      category: 'user',
      endpoint: '/api/user/register',
      method: 'POST',
      description: 'Registers a new user account',
      requestBody: {
        phoneNumber: 'string (required) - The user\'s phone number',
        fullName: 'string (required) - The user\'s full name',
        email: 'string (optional) - The user\'s email address',
        pin: 'string (required) - The user\'s PIN',
        security: 'object (required) - Security questions and answers',
        nationality: 'string (required) - The user\'s nationality',
        idType: 'string (required) - The user\'s ID type',
        idNumber: 'string (required) - The user\'s ID number',
      },
      responseExample: {
        status: 'success',
        data: {
          user: {
            _id: 'string - User ID',
            phoneNumber: 'string - User phone number',
            fullName: 'string - User full name',
          },
          accessToken: 'string - JWT access token',
          refreshToken: 'string - JWT refresh token',
        }
      },
    },
    {
      category: 'user',
      endpoint: '/api/user/exists',
      method: 'POST',
      description: 'Checks if a user exists with the given phone number',
      requestBody: {
        phoneNumber: 'string (required) - The phone number to check',
      },
      responseExample: {
        status: 'success',
        exists: 'boolean - Whether the user exists',
      },
    },
    {
      category: 'user',
      endpoint: '/api/user/profile',
      method: 'GET',
      description: 'Retrieves the authenticated user\'s profile information',
      headers: {
        Authorization: 'Bearer {accessToken} (required) - JWT access token',
      },
      responseExample: {
        status: 'success',
        data: {
          _id: 'string - User ID',
          phoneNumber: 'string - User phone number',
          fullName: 'string - User full name',
          email: 'string - User email',
          nationality: 'string - User nationality',
          walletId: 'string - User wallet ID',
        }
      },
    },
    
    // Wallet endpoints
    {
      category: 'wallet',
      endpoint: '/api/wallet/balance',
      method: 'GET',
      description: 'Retrieves the authenticated user\'s wallet balance',
      headers: {
        Authorization: 'Bearer {accessToken} (required) - JWT access token',
      },
      responseExample: {
        status: 'success',
        data: {
          balance: 'number - Wallet balance',
          currency: 'string - Currency code',
        }
      },
    },
    {
      category: 'wallet',
      endpoint: '/api/wallet/transactions',
      method: 'GET',
      description: 'Retrieves the authenticated user\'s transaction history',
      headers: {
        Authorization: 'Bearer {accessToken} (required) - JWT access token',
      },
      queryParams: {
        limit: 'number (optional) - Number of transactions to return',
        offset: 'number (optional) - Offset for pagination',
      },
      responseExample: {
        status: 'success',
        data: {
          transactions: 'array - List of transactions',
          count: 'number - Total number of transactions',
        }
      },
    },
    {
      category: 'wallet',
      endpoint: '/api/wallet/create',
      method: 'POST',
      description: 'Creates a new wallet for the authenticated user',
      headers: {
        Authorization: 'Bearer {accessToken} (required) - JWT access token',
      },
      requestBody: {
        currency: 'string (optional) - Currency code for the wallet',
      },
      responseExample: {
        status: 'success',
        data: {
          walletId: 'string - New wallet ID',
          balance: 'number - Initial wallet balance',
          currency: 'string - Currency code',
        }
      },
    },
    
    // Transaction endpoints
    {
      category: 'transaction',
      endpoint: '/api/transaction',
      method: 'POST',
      description: 'Creates a new transaction',
      headers: {
        Authorization: 'Bearer {accessToken} (required) - JWT access token',
      },
      requestBody: {
        amount: 'number (required) - Transaction amount',
        recipientPhone: 'string (required) - Recipient\'s phone number',
        description: 'string (optional) - Transaction description',
      },
      responseExample: {
        status: 'success',
        data: {
          transactionId: 'string - Transaction ID',
          amount: 'number - Transaction amount',
          status: 'string - Transaction status',
          timestamp: 'string - Transaction timestamp',
        }
      },
    },
    
    // Business endpoints
    {
      category: 'business',
      endpoint: '/api/business/register',
      method: 'POST',
      description: 'Registers a new business account',
      headers: {
        Authorization: 'Bearer {accessToken} (required) - JWT access token',
      },
      requestBody: {
        businessName: 'string (required) - Business name',
        businessType: 'string (required) - Business type',
        registrationNumber: 'string (required) - Business registration number',
        address: 'object (required) - Business address',
      },
      responseExample: {
        status: 'success',
        data: {
          businessId: 'string - Business ID',
          businessName: 'string - Business name',
          walletId: 'string - Business wallet ID',
        }
      },
    },
  ];

  // Filter endpoints by category
  const filteredEndpoints = activeCategory === 'all' 
    ? apiEndpoints 
    : apiEndpoints.filter(endpoint => endpoint.category === activeCategory);

  // Get unique categories
  const categories = ['all', ...new Set(apiEndpoints.map(endpoint => endpoint.category))];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">FincoTech API Documentation</h1>
        <p className="text-gray-600 mb-8">Version 1.0.0</p>

        {/* Category filters */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-3 text-gray-700">API Categories</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-md text-sm ${
                  activeCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Endpoints */}
        <div className="space-y-6">
          {filteredEndpoints.map((endpoint, index) => (
            <ApiEndpoint key={index} endpoint={endpoint} />
          ))}
        </div>
      </div>
    </div>
  );
} 