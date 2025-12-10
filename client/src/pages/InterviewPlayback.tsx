import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Play, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  XCircle,
  Clock,
  User,
  Briefcase,
  Star,
  AlertCircle,
  ChevronLeft,
  Download
} from "lucide-react";

export default function InterviewPlayback() {
  const [, setLocation] = useLocation();
  const [selectedInterview, setSelectedInterview] = useState<number | null>(null);
  
  // Fetch all completed AI interviews
  const { data: interviews, isLoading } = trpc.interview.listByRecruiter.useQuery();
  
  // Filter for AI interviews that are completed
  const aiInterviews = interviews?.filter(
    (item) => item.interview.type === "ai-interview" && item.interview.status === "completed"
  ) || [];
  
  // Fetch detailed interview data with questions and responses
  const { data: interviewDetails } = trpc.interview.getWithResponses.useQuery(
    { interviewId: selectedInterview! },
    { enabled: !!selectedInterview }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading interviews...</p>
        </div>
      </div>
    );
  }

  if (aiInterviews.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <Button
          variant="ghost"
          onClick={() => setLocation("/recruiter/dashboard")}
          className="mb-6"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle>No Completed AI Interviews</CardTitle>
            <CardDescription>
              AI interview recordings and evaluations will appear here once candidates complete their interviews.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/recruiter/interviews")}>
              Schedule an Interview
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If an interview is selected, show the detailed view
  if (selectedInterview && interviewDetails) {
    const { interview, questions, responses } = interviewDetails;
    
    // Calculate overall score
    const responsesWithScores = responses.filter(r => r.aiScore !== null);
    const averageScore = responsesWithScores.length > 0
      ? responsesWithScores.reduce((sum, r) => sum + (r.aiScore || 0), 0) / responsesWithScores.length
      : 0;
    
    const getScoreColor = (score: number) => {
      if (score >= 80) return "text-green-600";
      if (score >= 60) return "text-yellow-600";
      return "text-red-600";
    };
    
    const getScoreBadge = (score: number) => {
      if (score >= 80) return <Badge className="bg-green-600">Excellent</Badge>;
      if (score >= 60) return <Badge className="bg-yellow-600">Good</Badge>;
      return <Badge variant="destructive">Needs Improvement</Badge>;
    };

    return (
      <div className="container mx-auto py-8 max-w-7xl">
        <Button
          variant="ghost"
          onClick={() => setSelectedInterview(null)}
          className="mb-6"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Interview List
        </Button>

        {/* Interview Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">
                  AI Interview Evaluation
                </CardTitle>
                <CardDescription className="space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Candidate: {interviewDetails.interview.candidateName || "Unknown"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    <span>Position: {interviewDetails.interview.jobTitle || "Unknown"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Completed: {new Date(interviewDetails.interview.scheduledAt).toLocaleDateString()}</span>
                  </div>
                </CardDescription>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-muted-foreground mb-1">Overall Score</div>
                <div className={`text-4xl font-bold ${getScoreColor(averageScore)}`}>
                  {averageScore.toFixed(0)}%
                </div>
                <div className="mt-2">{getScoreBadge(averageScore)}</div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Questions and Responses */}
        <div className="space-y-6">
          {questions.map((question, index) => {
            const response = responses.find(r => r.questionId === question.id);
            
            if (!response) {
              return (
                <Card key={question.id}>
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">Question {index + 1}</Badge>
                      <Badge>{question.questionType}</Badge>
                    </div>
                    <CardTitle className="text-lg">{question.questionText}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                      <p>No response recorded</p>
                    </div>
                  </CardContent>
                </Card>
              );
            }
            
            return (
              <Card key={question.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">Question {index + 1}</Badge>
                        <Badge>{question.questionType}</Badge>
                      </div>
                      <CardTitle className="text-lg">{question.questionText}</CardTitle>
                    </div>
                    
                    {response?.aiScore !== null && (
                      <div className="text-right ml-4">
                        <div className="text-sm text-muted-foreground">Score</div>
                        <div className={`text-2xl font-bold ${getScoreColor(response.aiScore || 0)}`}>
                          {response.aiScore}%
                        </div>
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent>
                  {!response ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                      <p>No response recorded</p>
                    </div>
                  ) : (
                    <Tabs defaultValue="transcript" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="transcript">
                          <FileText className="h-4 w-4 mr-2" />
                          Transcript
                        </TabsTrigger>
                        <TabsTrigger value="evaluation">
                          <Star className="h-4 w-4 mr-2" />
                          Evaluation
                        </TabsTrigger>
                        <TabsTrigger value="recording">
                          <Play className="h-4 w-4 mr-2" />
                          Recording
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="transcript" className="space-y-4">
                        {response.transcription ? (
                          <div className="bg-muted p-4 rounded-lg">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {response.transcription}
                            </p>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                            <p>Transcription in progress...</p>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Duration: {response.duration}s</span>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="evaluation" className="space-y-4">
                        {response.aiEvaluation ? (
                          <>
                            <div>
                              <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <Star className="h-4 w-4" />
                                Overall Evaluation
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {response.aiEvaluation}
                              </p>
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-semibold mb-2 flex items-center gap-2 text-green-600">
                                  <TrendingUp className="h-4 w-4" />
                                  Strengths
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {response.strengths || "N/A"}
                                </p>
                              </div>
                              
                              <div>
                                <h4 className="font-semibold mb-2 flex items-center gap-2 text-red-600">
                                  <TrendingDown className="h-4 w-4" />
                                  Areas for Improvement
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {response.weaknesses || "N/A"}
                                </p>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4" />
                                Recommendations
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {response.recommendations || "N/A"}
                              </p>
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                            <p>AI evaluation in progress...</p>
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="recording" className="space-y-4">
                        {response.videoUrl ? (
                          <div className="space-y-4">
                            <video
                              controls
                              className="w-full rounded-lg bg-black"
                              src={response.videoUrl}
                            >
                              Your browser does not support video playback.
                            </video>
                            <Button variant="outline" className="w-full" asChild>
                              <a href={response.videoUrl} download>
                                <Download className="h-4 w-4 mr-2" />
                                Download Video
                              </a>
                            </Button>
                          </div>
                        ) : response.audioUrl ? (
                          <div className="space-y-4">
                            <audio
                              controls
                              className="w-full"
                              src={response.audioUrl}
                            >
                              Your browser does not support audio playback.
                            </audio>
                            <Button variant="outline" className="w-full" asChild>
                              <a href={response.audioUrl} download>
                                <Download className="h-4 w-4 mr-2" />
                                Download Audio
                              </a>
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                            <p>No recording available</p>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Final Recommendation */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Final Recommendation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Performance</span>
                <span className={`text-lg font-bold ${getScoreColor(averageScore)}`}>
                  {averageScore.toFixed(1)}%
                </span>
              </div>
              
              <Progress value={averageScore} className="h-2" />
              
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm">
                  {averageScore >= 80 && (
                    <>
                      <CheckCircle2 className="inline h-4 w-4 mr-2 text-green-600" />
                      <strong>Strong Candidate:</strong> This candidate demonstrated excellent performance across all questions. 
                      Consider moving forward with the next stage of the interview process.
                    </>
                  )}
                  {averageScore >= 60 && averageScore < 80 && (
                    <>
                      <AlertCircle className="inline h-4 w-4 mr-2 text-yellow-600" />
                      <strong>Moderate Candidate:</strong> This candidate showed good potential with some areas for improvement. 
                      Consider a follow-up interview to assess specific skills in more detail.
                    </>
                  )}
                  {averageScore < 60 && (
                    <>
                      <XCircle className="inline h-4 w-4 mr-2 text-red-600" />
                      <strong>Needs Improvement:</strong> This candidate's responses indicate gaps in key areas. 
                      Review the detailed evaluations to determine if additional training or a different role might be more suitable.
                    </>
                  )}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button className="flex-1">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Move to Next Stage
                </Button>
                <Button variant="outline" className="flex-1">
                  <FileText className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
                <Button variant="outline">
                  <User className="h-4 w-4 mr-2" />
                  Contact Candidate
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Interview list view
  return (
      <div className="container mx-auto py-8">
      <Button
        variant="ghost"
        onClick={() => setLocation("/recruiter/dashboard")}
        className="mb-6"
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Interview Playback</h1>
        <p className="text-muted-foreground">
          Review completed AI interviews with transcriptions and AI evaluations
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Interviews</CardDescription>
            <CardTitle className="text-3xl">{aiInterviews.length}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg. Score</CardDescription>
            <CardTitle className="text-3xl">
              {aiInterviews.length > 0 ? "N/A" : "0"}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Strong Candidates</CardDescription>
            <CardTitle className="text-3xl text-green-600">0</CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Needs Review</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">
              {aiInterviews.length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Interview List */}
      <div className="space-y-4">
        {aiInterviews.map((item) => (
          <Card
            key={item.interview.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedInterview(item.interview.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="mb-2">
                    {item.candidate?.title || "Unknown Candidate"}
                  </CardTitle>
                  <CardDescription className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      <span>{item.job?.title || "Unknown Position"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>
                        Completed: {new Date(item.interview.scheduledAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CardDescription>
                </div>
                
                <Button variant="outline">
                  <Play className="h-4 w-4 mr-2" />
                  Review Interview
                </Button>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
