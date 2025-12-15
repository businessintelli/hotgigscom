import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, ThumbsUp, Users, Zap, MessageSquare, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

function RatingBar({ 
  label, 
  value, 
  icon: Icon,
  color = "bg-primary"
}: { 
  label: string; 
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
}) {
  const percentage = (value / 5) * 100;
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-gray-500" />
          <span className="font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-1">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          <span className="font-semibold">{value.toFixed(1)}</span>
        </div>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  subtitle,
  icon: Icon,
  trend,
  color = "bg-blue-100 text-blue-600"
}: { 
  title: string; 
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: "up" | "down" | "neutral";
  color?: string;
}) {
  return (
    <div className="p-4 rounded-lg border bg-white">
      <div className="flex items-start justify-between">
        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", color)}>
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
            trend === "up" && "bg-green-100 text-green-700",
            trend === "down" && "bg-red-100 text-red-700",
            trend === "neutral" && "bg-gray-100 text-gray-600"
          )}>
            {trend === "up" && <TrendingUp className="h-3 w-3" />}
            {trend === "down" && <TrendingDown className="h-3 w-3" />}
            {trend === "neutral" && <Minus className="h-3 w-3" />}
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-gray-500">{title}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

export function FeedbackAnalyticsWidget() {
  const { data: analytics, isLoading } = trpc.interview.getFeedbackAnalytics.useQuery();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics || analytics.totalFeedback === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Candidate Feedback
          </CardTitle>
          <CardDescription>
            Insights from candidate interview experiences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No feedback yet</p>
            <p className="text-sm mt-1">
              Feedback will appear here once candidates complete interviews
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getOverallTrend = () => {
    if (analytics.monthlyTrend.length < 2) return "neutral";
    const recent = analytics.monthlyTrend[analytics.monthlyTrend.length - 1]?.averageRating || 0;
    const previous = analytics.monthlyTrend[analytics.monthlyTrend.length - 2]?.averageRating || 0;
    if (recent > previous + 0.2) return "up";
    if (recent < previous - 0.2) return "down";
    return "neutral";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Candidate Feedback Analytics
        </CardTitle>
        <CardDescription>
          Aggregate insights from {analytics.totalFeedback} candidate interview experiences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Overall Rating"
            value={analytics.averageOverall.toFixed(1)}
            subtitle="out of 5 stars"
            icon={Star}
            trend={getOverallTrend()}
            color="bg-yellow-100 text-yellow-600"
          />
          <StatCard
            title="Would Recommend"
            value={`${analytics.recommendRate}%`}
            subtitle="of candidates"
            icon={ThumbsUp}
            color="bg-green-100 text-green-600"
          />
          <StatCard
            title="Total Responses"
            value={analytics.totalFeedback}
            subtitle="feedback submitted"
            icon={MessageSquare}
            color="bg-blue-100 text-blue-600"
          />
          <StatCard
            title="This Month"
            value={analytics.monthlyTrend[analytics.monthlyTrend.length - 1]?.count || 0}
            subtitle="new responses"
            icon={TrendingUp}
            color="bg-purple-100 text-purple-600"
          />
        </div>

        {/* Category Ratings */}
        <div className="p-4 bg-gray-50 rounded-lg space-y-4">
          <h4 className="font-semibold text-sm text-gray-700">Rating Breakdown</h4>
          <RatingBar
            label="Overall Experience"
            value={analytics.averageOverall}
            icon={Star}
            color="bg-yellow-500"
          />
          {analytics.averageInterviewer > 0 && (
            <RatingBar
              label="Interviewer"
              value={analytics.averageInterviewer}
              icon={Users}
              color="bg-blue-500"
            />
          )}
          {analytics.averageProcess > 0 && (
            <RatingBar
              label="Interview Process"
              value={analytics.averageProcess}
              icon={Zap}
              color="bg-purple-500"
            />
          )}
          {analytics.averageCommunication > 0 && (
            <RatingBar
              label="Communication"
              value={analytics.averageCommunication}
              icon={MessageSquare}
              color="bg-green-500"
            />
          )}
        </div>

        {/* Monthly Trend */}
        {analytics.monthlyTrend.length > 0 && (
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold text-sm text-gray-700 mb-3">Monthly Trend</h4>
            <div className="flex items-end gap-2 h-24">
              {analytics.monthlyTrend.map((month, index) => {
                const height = (month.averageRating / 5) * 100;
                const monthName = new Date(month.month + "-01").toLocaleDateString("en-US", { month: "short" });
                return (
                  <div key={month.month} className="flex-1 flex flex-col items-center gap-1">
                    <div 
                      className={cn(
                        "w-full rounded-t transition-all",
                        index === analytics.monthlyTrend.length - 1 
                          ? "bg-primary" 
                          : "bg-gray-300"
                      )}
                      style={{ height: `${height}%` }}
                      title={`${month.averageRating.toFixed(1)} avg (${month.count} responses)`}
                    />
                    <span className="text-xs text-gray-500">{monthName}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Feedback */}
        {analytics.recentFeedback.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-gray-700">Recent Feedback</h4>
            {analytics.recentFeedback.slice(0, 3).map((feedback) => (
              <div key={feedback.id} className="p-3 border rounded-lg bg-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            "h-4 w-4",
                            star <= feedback.overallRating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-200"
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">
                      {feedback.jobTitle}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(feedback.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {feedback.positiveAspects && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    "{feedback.positiveAspects}"
                  </p>
                )}
                {feedback.isAnonymous && (
                  <span className="text-xs text-gray-400 mt-1 inline-block">
                    Anonymous feedback
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
