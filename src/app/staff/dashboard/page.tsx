export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl"></div>
        <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-8 text-white">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold mb-2">Welcome to Staff Portal</h1>
            <p className="text-blue-100 text-lg">
              Manage and review applications efficiently with our modern dashboard.
            </p>
          </div>
          <div className="absolute top-4 right-4 opacity-20">
            <div className="w-32 h-32 bg-white rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="group relative bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Driver Applications</h3>
              <p className="text-3xl font-bold text-blue-600 mb-1">--</p>
              <p className="text-sm text-gray-500">Total submissions</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <span className="text-2xl">🚗</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-b-xl"></div>
        </div>

        <div className="group relative bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Business Applications</h3>
              <p className="text-3xl font-bold text-green-600 mb-1">--</p>
              <p className="text-sm text-gray-500">Total submissions</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <span className="text-2xl">🏢</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-green-600 rounded-b-xl"></div>
        </div>

        <div className="group relative bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Pending Reviews</h3>
              <p className="text-3xl font-bold text-orange-600 mb-1">--</p>
              <p className="text-sm text-gray-500">Awaiting review</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center group-hover:bg-orange-200 transition-colors">
              <span className="text-2xl">⏳</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-600 rounded-b-xl"></div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="group relative bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6 text-left hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Review Driver Applications</h3>
                <p className="text-blue-100 text-sm">Manage driver onboarding requests</p>
              </div>
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <span className="text-xl">🚗</span>
              </div>
            </div>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-5 rounded-xl transition-opacity"></div>
          </button>

          <button className="group relative bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6 text-left hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Review Business Applications</h3>
                <p className="text-green-100 text-sm">Process merchant registration requests</p>
              </div>
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <span className="text-xl">🏢</span>
              </div>
            </div>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-5 rounded-xl transition-opacity"></div>
          </button>
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-gray-500 mb-2">Activity feed coming soon</p>
          <p className="text-sm text-gray-400">Track application status changes and staff actions</p>
        </div>
      </div>
    </div>
  );
} 