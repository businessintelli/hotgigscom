import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { ArrowLeft, TrendingUp, Users, Star, BarChart3, Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';

export default function FeedbackAnalytics() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch all applications with feedback
  const { data: applications = [], isLoading } = trpc.application.list.useQuery(
    undefined,
    { enabled: !!user?.id }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate analytics
  const applicationsWithFeedback = applications.filter((app: any) => 
    app.feedback && app.feedback.length > 0
  );

  const candidateStats = applications.map((app: any) => {
    const feedback = app.feedback || [];
    const ratings = feedback.filter((f: any) => f.rating).map((f: any) => f.rating);
    const avgRating = ratings.length > 0 
      ? ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length 
      : 0;
    
    // Calculate consensus (how close ratings are to each other)
    let consensus = 0;
    if (ratings.length > 1) {
      const variance = ratings.reduce((sum: number, r: number) => 
        sum + Math.pow(r - avgRating, 2), 0
      ) / ratings.length;
      consensus = Math.max(0, 100 - (variance * 25)); // Convert variance to percentage
    }

    return {
      id: app.id,
      candidateName: app.candidate?.fullName || 'Unknown',
      jobTitle: app.job?.title || 'Unknown',
      feedbackCount: feedback.length,
      avgRating: avgRating,
      consensus: consensus,
      feedback: feedback,
    };
  }).filter(stat => stat.feedbackCount > 0);

  // Sort by average rating
  const topRatedCandidates = [...candidateStats]
    .sort((a, b) => b.avgRating - a.avgRating)
    .slice(0, 10);

  // Calculate overall stats
  const totalFeedback = applicationsWithFeedback.reduce(
    (sum: number, app: any) => sum + (app.feedback?.length || 0), 0
  );
  const avgFeedbackPerCandidate = applicationsWithFeedback.length > 0
    ? totalFeedback / applicationsWithFeedback.length
    : 0;

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-blue-600';
    if (rating >= 2) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConsensusColor = (consensus: number) => {
    if (consensus >= 80) return 'bg-green-100 text-green-700';
    if (consensus >= 60) return 'bg-blue-100 text-blue-700';
    if (consensus >= 40) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-8">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => setLocation('/recruiter/applications')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Applications
          </Button>
          <h1 className="text-3xl font-bold mt-4">Feedback Analytics</h1>
          <p className="text-gray-600">Team consensus and candidate ratings overview</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalFeedback}</div>
              <p className="text-xs text-muted-foreground">
                Across {applicationsWithFeedback.length} candidates
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Feedback/Candidate</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgFeedbackPerCandidate.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">
                Team collaboration level
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Rated</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {topRatedCandidates.length > 0 ? topRatedCandidates[0].avgRating.toFixed(1) : '0'}★
              </div>
              <p className="text-xs text-muted-foreground">
                {topRatedCandidates.length > 0 ? topRatedCandidates[0].candidateName : 'No ratings yet'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Consensus</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {candidateStats.filter(s => s.consensus >= 80).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Candidates with team agreement
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Top Rated Candidates */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Top Rated Candidates</CardTitle>
            <CardDescription>Candidates with highest average team ratings</CardDescription>
          </CardHeader>
          <CardContent>
            {topRatedCandidates.length > 0 ? (
              <div className="space-y-4">
                {topRatedCandidates.map((stat, index) => (
                  <div 
                    key={stat.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setLocation('/recruiter/applications')}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold">
                        #{index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{stat.candidateName}</h3>
                        <p className="text-sm text-gray-600">{stat.jobTitle}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getRatingColor(stat.avgRating)}`}>
                          {stat.avgRating.toFixed(1)}★
                        </div>
                        <p className="text-xs text-gray-600">{stat.feedbackCount} reviews</p>
                      </div>
                      
                      {stat.feedbackCount > 1 && (
                        <Badge className={getConsensusColor(stat.consensus)}>
                          {stat.consensus.toFixed(0)}% consensus
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-600 py-8">
                No feedback data available yet. Start adding feedback to applications!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Consensus Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Team Consensus Analysis</CardTitle>
            <CardDescription>How aligned is your team on candidate evaluations?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {candidateStats
                .filter(stat => stat.feedbackCount > 1)
                .sort((a, b) => b.consensus - a.consensus)
                .slice(0, 10)
                .map((stat) => (
                  <div key={stat.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{stat.candidateName}</p>
                        <p className="text-sm text-gray-600">{stat.feedbackCount} team members reviewed</p>
                      </div>
                      <Badge className={getConsensusColor(stat.consensus)}>
                        {stat.consensus.toFixed(0)}% agreement
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          stat.consensus >= 80 ? 'bg-green-500' :
                          stat.consensus >= 60 ? 'bg-blue-500' :
                          stat.consensus >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${stat.consensus}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
