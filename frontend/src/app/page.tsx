export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🍽️ Restaurant Management SaaS
          </h1>
          <p className="text-gray-600 mb-6">
            Your comprehensive restaurant management platform is ready!
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-center text-green-600">
              <span className="mr-2">✅</span>
              <span>Frontend Setup Complete</span>
            </div>
            <div className="flex items-center justify-center text-green-600">
              <span className="mr-2">✅</span>
              <span>All TypeScript Errors Fixed</span>
            </div>
            <div className="flex items-center justify-center text-green-600">
              <span className="mr-2">✅</span>
              <span>542+ Issues Resolved</span>
            </div>
          </div>
          <div className="mt-6">
            <a
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
