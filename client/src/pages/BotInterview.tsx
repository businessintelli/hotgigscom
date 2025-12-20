import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mic, MicOff, Video, VideoOff, Send, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function BotInterview() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const applicationId = params.applicationId ? parseInt(params.applicationId) : null;

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [textResponse, setTextResponse] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingType, setRecordingType] = useState<'audio' | 'video' | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);

  // Get or create session
  const { data: sessionData, isLoading: sessionLoading } = trpc.botInterview.getSessionByApplication.useQuery(
    { applicationId: applicationId! },
    { enabled: !!applicationId && sessionStarted }
  );

  const startSessionMutation = trpc.botInterview.startSession.useMutation({
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      setSessionStarted(true);
      toast({
        title: "Interview Started",
        description: "Your bot interview session has begun. Good luck!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const submitResponseMutation = trpc.botInterview.submitResponse.useMutation({
    onSuccess: () => {
      setTextResponse("");
      setCurrentQuestionIndex(prev => prev + 1);
      toast({
        title: "Response Submitted",
        description: "Your answer has been recorded.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const session = sessionData?.session;
  const questions = sessionData?.questions || [];
  const responses = sessionData?.responses || [];
  const currentQuestion = questions[currentQuestionIndex];

  const progress = session
    ? (session.questionsAnswered / session.totalQuestions) * 100
    : 0;

  const handleStartInterview = () => {
    if (!applicationId) return;

    // Get application details to extract candidateId and jobId
    // For now, we'll need to pass these from the parent component or fetch them
    // This is a simplified version
    startSessionMutation.mutate({
      applicationId,
      candidateId: 1, // TODO: Get from context or props
      jobId: 1, // TODO: Get from application data
      totalQuestions: 5,
    });
  };

  const handleSubmitTextResponse = () => {
    if (!sessionId || !currentQuestion || !textResponse.trim()) return;

    submitResponseMutation.mutate({
      sessionId,
      questionId: currentQuestion.id,
      candidateId: 1, // TODO: Get from context
      responseType: 'text',
      textResponse: textResponse.trim(),
    });
  };

  const handleStartRecording = (type: 'audio' | 'video') => {
    setRecordingType(type);
    setIsRecording(true);
    // TODO: Implement actual recording logic
    toast({
      title: "Recording Started",
      description: `${type === 'audio' ? 'Audio' : 'Video'} recording has started.`,
    });
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // TODO: Implement actual recording stop and upload logic
    toast({
      title: "Recording Stopped",
      description: "Processing your response...",
    });
    
    // Simulate upload and submission
    setTimeout(() => {
      if (sessionId && currentQuestion) {
        submitResponseMutation.mutate({
          sessionId,
          questionId: currentQuestion.id,
          candidateId: 1, // TODO: Get from context
          responseType: recordingType || 'audio',
          audioUrl: recordingType === 'audio' ? 'https://example.com/audio.mp3' : undefined,
          videoUrl: recordingType === 'video' ? 'https://example.com/video.mp4' : undefined,
        });
      }
      setRecordingType(null);
    }, 1000);
  };

  if (!applicationId) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Invalid Application</CardTitle>
            <CardDescription>No application ID provided.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!sessionStarted) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>AI-Powered Interview</CardTitle>
            <CardDescription>
              Welcome to your automated interview session. This interview will help us better understand your skills and experience.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">What to Expect:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>You'll be asked 5 questions about your skills and experience</li>
                <li>You can answer via text, audio, or video</li>
                <li>Take your time to provide thoughtful answers</li>
                <li>Your responses will be evaluated by our AI system</li>
                <li>The interview typically takes 15-20 minutes</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Tips for Success:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Find a quiet place with good lighting (if using video)</li>
                <li>Speak clearly and at a moderate pace</li>
                <li>Provide specific examples when possible</li>
                <li>Be honest and authentic in your responses</li>
              </ul>
            </div>

            <Button
              onClick={handleStartInterview}
              disabled={startSessionMutation.isPending}
              className="w-full"
              size="lg"
            >
              {startSessionMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting Interview...
                </>
              ) : (
                "Start Interview"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (sessionLoading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (session?.sessionStatus === 'completed') {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <CardTitle>Interview Completed!</CardTitle>
            </div>
            <CardDescription>
              Thank you for completing your interview. Your responses are being evaluated.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Questions Answered:</span>
                <span className="font-semibold">{session.questionsAnswered} / {session.totalQuestions}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-semibold">
                  {session.sessionDuration ? `${Math.round(session.sessionDuration / 60)} minutes` : 'N/A'}
                </span>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                We'll review your responses and get back to you within 2-3 business days. 
                You can check your application status in your dashboard.
              </p>
            </div>

            <Button
              onClick={() => navigate("/candidate/applications")}
              className="w-full"
            >
              Back to Applications
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Loading Questions...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <div className="space-y-6">
        {/* Progress Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-semibold">
                  Question {currentQuestionIndex + 1} of {session?.totalQuestions}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Current Question */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{currentQuestion.questionType}</Badge>
                  <Badge variant="secondary">{currentQuestion.difficulty}</Badge>
                </div>
                <CardTitle className="text-xl mt-2">{currentQuestion.questionText}</CardTitle>
                {currentQuestion.category && (
                  <CardDescription>Category: {currentQuestion.category}</CardDescription>
                )}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{currentQuestion.expectedDuration}s</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Text Response */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Answer</label>
              <Textarea
                value={textResponse}
                onChange={(e) => setTextResponse(e.target.value)}
                placeholder="Type your answer here..."
                rows={6}
                disabled={isRecording}
              />
              <Button
                onClick={handleSubmitTextResponse}
                disabled={!textResponse.trim() || submitResponseMutation.isPending || isRecording}
                className="w-full"
              >
                {submitResponseMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Answer
                  </>
                )}
              </Button>
            </div>

            {/* Recording Options */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or record your response</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => isRecording ? handleStopRecording() : handleStartRecording('audio')}
                disabled={submitResponseMutation.isPending || (isRecording && recordingType !== 'audio')}
              >
                {isRecording && recordingType === 'audio' ? (
                  <>
                    <MicOff className="mr-2 h-4 w-4" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    Record Audio
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => isRecording ? handleStopRecording() : handleStartRecording('video')}
                disabled={submitResponseMutation.isPending || (isRecording && recordingType !== 'video')}
              >
                {isRecording && recordingType === 'video' ? (
                  <>
                    <VideoOff className="mr-2 h-4 w-4" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Video className="mr-2 h-4 w-4" />
                    Record Video
                  </>
                )}
              </Button>
            </div>

            {isRecording && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                <div className="h-3 w-3 bg-red-600 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-red-900">
                  Recording {recordingType}... Click "Stop Recording" when finished
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Previous Responses */}
        {responses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Responses ({responses.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {responses.map((response, index) => (
                  <div key={response.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Question {index + 1}</span>
                      <Badge variant="outline" className="text-xs">
                        {response.responseType}
                      </Badge>
                    </div>
                    {response.duration && (
                      <span className="text-xs text-muted-foreground">{response.duration}s</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
