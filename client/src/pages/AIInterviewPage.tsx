import { useEffect, useState, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Video, Mic, Square, Play, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import FraudDetectionMonitorV2 from "@/components/FraudDetectionMonitorV2";

/**
 * AI Interview Page - Candidate-facing interface for AI-powered interviews
 * Features:
 * - Video/audio recording
 * - Question-by-question interview flow
 * - Real-time recording status
 * - Automatic transcription and evaluation
 */
export default function AIInterviewPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const interviewId = parseInt(new URLSearchParams(search).get("id") || "0");
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedQuestions, setCompletedQuestions] = useState<Set<number>>(new Set());
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Fetch interview details
  const { data: interviewData, isLoading: loadingInterview } = trpc.interview.getFullInterview.useQuery(
    { interviewId },
    { enabled: interviewId > 0 }
  );
  
  const questions = interviewData?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((completedQuestions.size / questions.length) * 100) : 0;
  
  // Mutations
  const submitResponseMutation = trpc.interview.submitResponse.useMutation();
  const evaluateResponseMutation = trpc.interview.evaluateResponse.useMutation();
  
  // Start media stream
  const startMediaStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setMediaStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing media devices:", error);
      toast.error("Failed to access camera/microphone. Please check permissions.");
    }
  };
  
  // Stop media stream
  const stopMediaStream = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
  };
  
  // Start recording
  const startRecording = async () => {
    if (!mediaStream) {
      await startMediaStream();
      return;
    }
    
    try {
      const mediaRecorder = new MediaRecorder(mediaStream, {
        mimeType: "video/webm;codecs=vp9",
      });
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        setRecordedChunks(chunks);
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast.success("Recording started");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Failed to start recording");
    }
  };
  
  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      toast.success("Recording stopped");
    }
  };
  
  // Submit response
  const submitResponse = async () => {
    if (recordedChunks.length === 0 || !currentQuestion) {
      toast.error("Please record your response first");
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Create blob from chunks
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      
      // Convert blob to base64 for transmission
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const videoUrl = base64data; // In production, upload to S3
        
        // Submit response
        await submitResponseMutation.mutateAsync({
          interviewId,
          questionId: currentQuestion.id,
          videoUrl,
          duration: recordingTime,
        });
        
        // Mark question as completed
        setCompletedQuestions(prev => new Set([...Array.from(prev), currentQuestion.id]));
        
        // Clear recorded chunks
        setRecordedChunks([]);
        setRecordingTime(0);
        
        toast.success("Response submitted successfully");
        
        // Move to next question or finish
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
        } else {
          toast.success("Interview completed! Thank you.");
          setTimeout(() => {
            setLocation("/candidate/dashboard");
          }, 2000);
        }
      };
    } catch (error) {
      console.error("Error submitting response:", error);
      toast.error("Failed to submit response");
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };
  
  // Initialize media stream on mount
  useEffect(() => {
    startMediaStream();
    return () => {
      stopMediaStream();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  if (loadingInterview) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!interviewData || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Interview Not Found
            </CardTitle>
            <CardDescription>
              The interview you're looking for doesn't exist or hasn't been set up yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/candidate/dashboard")}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const candidateId = (interviewData as any)?.candidateId || 0;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      {/* Fraud Detection Monitor */}
      <FraudDetectionMonitorV2
        interviewId={interviewId}
        candidateId={candidateId}
        videoElement={videoRef.current}
        isActive={true}
      />
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>AI Interview</CardTitle>
                <CardDescription>
                  Answer each question to the best of your ability
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-lg">
                Question {currentQuestionIndex + 1} of {questions.length}
              </Badge>
            </div>
            <Progress value={progress} className="mt-4" />
          </CardHeader>
        </Card>
        
        {/* Video Preview */}
        <Card>
          <CardContent className="p-6">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              {isRecording && (
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                  <span className="font-mono">{formatTime(recordingTime)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Question Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="secondary">{currentQuestion?.questionType}</Badge>
              <span className="text-sm text-muted-foreground">
                Expected: {Math.floor((currentQuestion?.expectedDuration || 120) / 60)} min
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">{currentQuestion?.questionText}</p>
          </CardContent>
        </Card>
        
        {/* Controls */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-4">
              {!isRecording && recordedChunks.length === 0 && (
                <Button
                  size="lg"
                  onClick={startRecording}
                  className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                >
                  <Video className="mr-2 h-5 w-5" />
                  Start Recording
                </Button>
              )}
              
              {isRecording && (
                <Button
                  size="lg"
                  onClick={stopRecording}
                  variant="destructive"
                >
                  <Square className="mr-2 h-5 w-5" />
                  Stop Recording
                </Button>
              )}
              
              {!isRecording && recordedChunks.length > 0 && (
                <>
                  <Button
                    size="lg"
                    onClick={startRecording}
                    variant="outline"
                  >
                    <Video className="mr-2 h-5 w-5" />
                    Re-record
                  </Button>
                  <Button
                    size="lg"
                    onClick={submitResponse}
                    disabled={isProcessing}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-5 w-5" />
                        Submit Response
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
            
            {recordedChunks.length > 0 && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                Recording duration: {formatTime(recordingTime)}
              </p>
            )}
          </CardContent>
        </Card>
        
        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2">
          {questions.map((q, idx) => (
            <div
              key={q.id}
              className={`w-3 h-3 rounded-full ${
                completedQuestions.has(q.id)
                  ? "bg-green-500"
                  : idx === currentQuestionIndex
                  ? "bg-blue-500"
                  : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
