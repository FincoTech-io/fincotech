export default function StaffLoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <span className="text-white font-bold text-xl">FT</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">FincoTech</h1>
          <p className="text-blue-200">Staff Portal Access</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-blue-200 mb-8">Sign in to access the staff dashboard</p>
            
            {/* Coming Soon Notice */}
            <div className="bg-blue-500/20 border border-blue-400/30 rounded-xl p-6 backdrop-blur-sm">
              <div className="w-12 h-12 bg-blue-500/30 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Authentication Coming Soon</h3>
              <p className="text-blue-200 text-sm mb-4">
                Login functionality will be implemented in the next phase of development.
              </p>
              <div className="space-y-2 text-left">
                <div className="flex items-center text-blue-200 text-sm">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></span>
                  Multi-factor authentication
                </div>
                <div className="flex items-center text-blue-200 text-sm">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></span>
                  Role-based access control
                </div>
                <div className="flex items-center text-blue-200 text-sm">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></span>
                  Session management
                </div>
              </div>
            </div>

            {/* Temporary Access */}
            <div className="mt-6">
              <a 
                href="/staff/dashboard"
                className="inline-flex items-center justify-center w-full px-6 py-3 text-base font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
              >
                <span className="mr-2">🚀</span>
                Access Dashboard (Demo)
              </a>
              <p className="text-blue-300 text-xs mt-2">
                Temporary access for development purposes
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-blue-300 text-sm">
            Secure • Reliable • Modern
          </p>
        </div>
      </div>
    </div>
  );
} 