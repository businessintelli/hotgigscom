import { useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line
} from 'recharts';
import { TrendingUp, TrendingDown, Users, Target, Award, Brain } from "lucide-react";

export default function TestAnalytics() {
  const [, params] = useRoute("/recruiter/test-analytics/:testId");
  const testId = params?.testId ? parseInt(params.testId) : 0;

  const { data: analytics, isLoading } = trpc.skillsTesting.getTestAnalytics.useQuery(
    { testId },
    { enabled: !!testId }
  );

  if (isLoading || !analytics) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="p-12 text-center">
            <p>Loading analytics...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { test, statistics, topPerformers } = analytics;

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{test.testName} - Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive performance analysis and candidate insights
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalAttempts}</div>
            <p className="text-xs text-muted-foreground">
              Candidates who completed this test
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.avgScore.toFixed(1)}%</div>
            <Progress value={statistics.avgScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.passRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Passing score: {test.passingScore}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Range</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.minScore.toFixed(0)} - {statistics.maxScore.toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Min to Max scores
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="distribution" className="w-full">
        <TabsList>
          <TabsTrigger value="distribution">Score Distribution</TabsTrigger>
          <TabsTrigger value="top-performers">Top Performers</TabsTrigger>
        </TabsList>

        <TabsContent value="distribution" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Score Distribution</CardTitle>
              <CardDescription>
                How candidates performed across different score ranges
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={statistics.scoreRanges}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="hsl(var(--primary))" name="Number of Candidates" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="top-performers" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
              <CardDescription>
                Highest scoring candidates on this test
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPerformers.map((performer: any, index: number) => (
                  <div
                    key={performer.assignment.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 font-bold">
                        {index + 1}
                      </div>
                      <Avatar>
                        <AvatarFallback>
                          {(performer.user.name || performer.user.email).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{performer.user.name || performer.user.email}</h3>
                        <p className="text-sm text-muted-foreground">
                          Completed: {new Date(performer.assignment.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold">{performer.assignment.score?.toFixed(1)}%</div>
                        <Badge 
                          variant={performer.assignment.score >= test.passingScore ? "default" : "destructive"}
                        >
                          {performer.assignment.score >= test.passingScore ? "Passed" : "Failed"}
                        </Badge>
                      </div>
                      {index === 0 && (
                        <Award className="h-6 w-6 text-yellow-500" />
                      )}
                    </div>
                  </div>
                ))}
                {topPerformers.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No completed attempts yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
