'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DocsPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/docs/api');
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-600">Redirecting to API documentation...</p>
    </div>
  );
} 