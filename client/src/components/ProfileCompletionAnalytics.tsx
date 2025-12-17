import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { TrendingUp, Users, CheckCircle, AlertCircle } from "lucide-react";

export function ProfileCompletionAnalytics() {
  const { data: stats, isLoading } = trpc.profileAnalytics.getCompletionStats.useQuery();
  const { data: correlation } = trpc.profileAnalytics.getCompletionCorrelation.useQuery();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile Completion Analytics</CardTitle>
          <CardDescription>Loading analytics data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          Profile Completion Analytics
        </CardTitle>
        <CardDescription>
          Track candidate profile completion rates and their impact on placement success
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Total Candidates</p>
            </div>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {stats.totalCandidates}
            </p>
          </div>

          <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <p className="text-xs font-medium text-green-600 dark:text-green-400">Complete (100%)</p>
            </div>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
              {stats.completedProfiles}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              {stats.totalCandidates > 0 
                ? Math.round((stats.completedProfiles / stats.totalCandidates) * 100) 
                : 0}% of total
            </p>
          </div>

          <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400">Partial (50-99%)</p>
            </div>
            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
              {stats.partialProfiles}
            </p>
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
              {stats.totalCandidates > 0 
                ? Math.round((stats.partialProfiles / stats.totalCandidates) * 100) 
                : 0}% of total
            </p>
          </div>

          <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <p className="text-xs font-medium text-red-600 dark:text-red-400">Incomplete (&lt;50%)</p>
            </div>
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">
              {stats.incompleteProfiles}
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              {stats.totalCandidates > 0 
                ? Math.round((stats.incompleteProfiles / stats.totalCandidates) * 100) 
                : 0}% of total
            </p>
          </div>
        </div>

        {/* Average Completion */}
        <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 rounded-lg">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Average Profile Completion
          </p>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                  style={{ width: `${stats.averageCompletion}%` }}
                />
              </div>
            </div>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.averageCompletion}%
            </p>
          </div>
        </div>

        {/* Correlation with Success */}
        {correlation && correlation.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Profile Completion vs. Placement Success Rate
            </h4>
            <div className="space-y-3">
              {correlation.map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-24 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {item.range}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                        <div 
                          className={`h-full flex items-center justify-end px-2 text-xs font-medium text-white transition-all duration-500 ${
                            item.successRate >= 75 ? 'bg-green-500' :
                            item.successRate >= 50 ? 'bg-yellow-500' :
                            item.successRate >= 25 ? 'bg-orange-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${item.successRate}%` }}
                        >
                          {item.successRate > 10 && `${item.successRate}%`}
                        </div>
                      </div>
                      <div className="w-20 text-sm text-gray-600 dark:text-gray-400">
                        {item.successfulPlacements}/{item.applications}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {item.candidates} candidates, {item.applications} applications
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 italic">
              * Success rate = (Hired + Offer) / Total Applications
            </p>
          </div>
        )}

        {/* Insights */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            💡 Key Insights
          </p>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Candidates with complete profiles are more likely to be placed successfully</li>
            <li>• Encourage candidates to complete their profiles for better job matching</li>
            <li>• Automated reminders are sent at 3 and 7 days for incomplete profiles</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
