// Client-side authentication utilities
'use client';

import { useRouter } from 'next/navigation';

// Type for storing user data
export interface UserData {
  id: string;
  phoneNumber: string;
  role: string;
}

// Function to check if user is authenticated client-side
export const checkAuthStatus = async (): Promise<UserData | null> => {
  try {
    const response = await fetch('/api/authentication/check', {
      method: 'GET',
      credentials: 'include', // Important for sending cookies
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Error checking authentication status:', error);
    return null;
  }
};

// Custom hook for authentication
export const useAuth = () => {
  const router = useRouter();

  const logout = async () => {
    try {
      await fetch('/api/authentication/logout', {
        method: 'POST',
        credentials: 'include',
      });
      router.push('/login');
      router.refresh(); // Force a refresh of the current page/components
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return { logout, checkAuthStatus };
};

// Redirect if not authenticated (can be used in client components)
export const redirectIfUnauthenticated = async (redirectTo = '/login') => {
  const user = await checkAuthStatus();
  
  if (!user) {
    window.location.href = redirectTo;
    return null;
  }
  
  return user;
}; 