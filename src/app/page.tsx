import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="text-4xl font-bold text-center font-sans mb-8">FincoTech - Website Under Construction</div>
      
      {/* API Documentation Link */}
      <Link 
        href="/docs/api" 
        className="px-6 py-3 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 transition-colors"
      >
        View API Documentation
      </Link>
    </div>
  );
}
