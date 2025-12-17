import { useState, useEffect, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock, Code, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function TakeTest() {
  const [, params] = useRoute("/candidate/take-test/:assignmentId");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const assignmentId = params?.assignmentId ? parseInt(params.assignmentId) : 0;
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState("javascript");

  // Get assignment details
  const { data: assignments = [] } = trpc.skillsTesting.getMyAssignedTests.useQuery();
  const assignment = assignments.find((a: any) => a.assignment.id === assignmentId);
  
  // Get test details with questions
  const { data: testData, isLoading } = trpc.skillsTesting.getTestDetails.useQuery(
    { testId: assignment?.test.id || 0 },
    { enabled: !!assignment?.test.id }
  );

  const startTestMutation = trpc.skillsTesting.startTest.useMutation({
    onSuccess: () => {
      setHasStarted(true);
      toast({
        title: "Test Started",
        description: "Good luck! Your responses will be auto-saved.",
      });
    },
  });

  const saveResponseMutation = trpc.skillsTesting.saveTestResponse.useMutation();

  const submitTestMutation = trpc.skillsTesting.submitTest.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Test Submitted",
        description: `You scored ${data.score.toFixed(1)}% (${data.correctAnswers}/${data.totalQuestions} correct)`,
      });
      navigate("/candidate/dashboard");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Timer countdown
  useEffect(() => {
    if (!hasStarted || !testData) return;
    
    const duration = testData.test.duration * 60; // Convert minutes to seconds
    setTimeRemaining(duration);

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [hasStarted, testData]);

  // Auto-save responses
  const autoSaveResponse = useCallback((questionId: number, response: string) => {
    if (!hasStarted) return;
    
    saveResponseMutation.mutate({
      assignmentId,
      questionId,
      response,
      questionType: testData?.test.testType === 'coding' ? 'coding' : 'text',
    });
  }, [assignmentId, hasStarted, testData]);

  // Debounced auto-save
  useEffect(() => {
    if (!testData?.questions[currentQuestionIndex]) return;
    
    const questionId = testData.questions[currentQuestionIndex].id;
    const response = responses[questionId];
    
    if (!response) return;

    const timeoutId = setTimeout(() => {
      autoSaveResponse(questionId, response);
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timeoutId);
  }, [responses, currentQuestionIndex, testData, autoSaveResponse]);

  const handleStartTest = () => {
    startTestMutation.mutate({ assignmentId });
  };

  const handleResponseChange = (questionId: number, value: string) => {
    setResponses((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < (testData?.questions.length || 0) - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmitTest = () => {
    submitTestMutation.mutate({ assignmentId });
    setIsSubmitDialogOpen(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading || !testData || !assignment) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="p-12 text-center">
            <p>Loading test...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = testData.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / testData.questions.length) * 100;
  const answeredCount = Object.keys(responses).length;

  // Pre-test screen
  if (!hasStarted) {
    return (
      <div className="container py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{testData.test.testName}</CardTitle>
            <CardDescription>{testData.test.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-semibold">{testData.test.duration} minutes</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <Code className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Questions</p>
                  <p className="font-semibold">{testData.questions.length}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Test Type</h3>
              <Badge variant="outline" className="capitalize">
                {testData.test.testType.replace("-", " ")}
              </Badge>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Your responses will be automatically saved</li>
                  <li>The test will auto-submit when time expires</li>
                  <li>You can navigate between questions freely</li>
                  <li>Avoid switching tabs or minimizing the window</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Button 
              onClick={handleStartTest} 
              size="lg" 
              className="w-full"
              disabled={startTestMutation.isPending}
            >
              {startTestMutation.isPending ? "Starting..." : "Start Test"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Test execution screen
  return (
    <div className="container py-8 max-w-5xl">
      {/* Header with timer */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{testData.test.testName}</h1>
          <p className="text-muted-foreground">
            Question {currentQuestionIndex + 1} of {testData.questions.length}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Clock className={`h-5 w-5 ${timeRemaining < 300 ? 'text-destructive' : 'text-muted-foreground'}`} />
            <span className={timeRemaining < 300 ? 'text-destructive' : ''}>
              {formatTime(timeRemaining)}
            </span>
          </div>
          <Badge variant="outline">
            {answeredCount}/{testData.questions.length} answered
          </Badge>
        </div>
      </div>

      {/* Progress bar */}
      <Progress value={progress} className="mb-6" />

      {/* Question card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">
            Question {currentQuestionIndex + 1}
          </CardTitle>
          <CardDescription className="whitespace-pre-wrap">
            {currentQuestion.questionText}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {testData.test.testType === 'coding' ? (
            // Code editor for coding questions
            <div className="space-y-4">
              {currentQuestion.codeTemplate && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted px-4 py-2 text-sm font-medium">
                    Template Code
                  </div>
                  <SyntaxHighlighter
                    language={codeLanguage}
                    style={vscDarkPlus}
                    customStyle={{ margin: 0, borderRadius: 0 }}
                  >
                    {currentQuestion.codeTemplate}
                  </SyntaxHighlighter>
                </div>
              )}
              <div>
                <Label htmlFor="code-response">Your Solution</Label>
                <Textarea
                  id="code-response"
                  value={responses[currentQuestion.id] || currentQuestion.codeTemplate || ""}
                  onChange={(e) => handleResponseChange(currentQuestion.id, e.target.value)}
                  placeholder="Write your code here..."
                  rows={15}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Auto-saving... Last saved: {saveResponseMutation.isPending ? "Saving..." : "Saved"}
                </p>
              </div>
            </div>
          ) : testData.test.testType === 'personality' ? (
            // Radio buttons for personality questions
            <RadioGroup
              value={responses[currentQuestion.id] || ""}
              onValueChange={(value) => handleResponseChange(currentQuestion.id, value)}
            >
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="r1" />
                  <Label htmlFor="r1">Strongly Disagree</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="2" id="r2" />
                  <Label htmlFor="r2">Disagree</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="3" id="r3" />
                  <Label htmlFor="r3">Neutral</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="4" id="r4" />
                  <Label htmlFor="r4">Agree</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="5" id="r5" />
                  <Label htmlFor="r5">Strongly Agree</Label>
                </div>
              </div>
            </RadioGroup>
          ) : (
            // Text area for other question types
            <div>
              <Label htmlFor="text-response">Your Answer</Label>
              <Textarea
                id="text-response"
                value={responses[currentQuestion.id] || ""}
                onChange={(e) => handleResponseChange(currentQuestion.id, e.target.value)}
                placeholder="Type your answer here..."
                rows={8}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Auto-saving... Last saved: {saveResponseMutation.isPending ? "Saving..." : "Saved"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="flex gap-2">
          {currentQuestionIndex === testData.questions.length - 1 ? (
            <Button onClick={() => setIsSubmitDialogOpen(true)}>
              Submit Test
            </Button>
          ) : (
            <Button onClick={handleNextQuestion}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      {/* Submit confirmation dialog */}
      <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Test?</DialogTitle>
            <DialogDescription>
              You have answered {answeredCount} out of {testData.questions.length} questions.
              Are you sure you want to submit your test? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSubmitDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitTest} disabled={submitTestMutation.isPending}>
              {submitTestMutation.isPending ? "Submitting..." : "Submit Test"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
