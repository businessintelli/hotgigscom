import { useAuth } from "@/_core/hooks/useAuth";
import { EmailVerificationGuard } from "@/components/EmailVerificationGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { 
  Video, 
  Upload, 
  Play, 
  Trash2, 
  ArrowLeft, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Camera,
  Mic,
  RefreshCw
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function VideoIntroductionPage() {
  return (
    <EmailVerificationGuard>
      <VideoIntroductionContent />
    </EmailVerificationGuard>
  );
}

function VideoIntroductionContent() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const MAX_DURATION = 15 * 60; // 15 minutes in seconds

  // Fetch candidate profile
  const { data: candidate } = trpc.candidate.getByUserId.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  // Fetch existing video introduction
  const { data: videoIntro, refetch: refetchVideo, isLoading: loadingVideo } = trpc.resumeProfile.getVideoIntroduction.useQuery(
    { candidateId: candidate?.id || 0 },
    { enabled: !!candidate?.id }
  );

  // Upload mutation
  const uploadMutation = trpc.resumeProfile.uploadVideoIntroduction.useMutation({
    onSuccess: () => {
      toast.success("Video introduction uploaded successfully!");
      refetchVideo();
      setRecordedBlob(null);
      setRecordedUrl(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload video");
    },
  });

  // Delete mutation
  const deleteMutation = trpc.resumeProfile.deleteVideoIntroduction.useMutation({
    onSuccess: () => {
      toast.success("Video introduction deleted");
      refetchVideo();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete video");
    },
  });

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);
        setRecordedUrl(URL.createObjectURL(blob));
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= MAX_DURATION) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (error: any) {
      toast.error("Failed to access camera/microphone: " + error.message);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  // Upload recorded video
  const uploadVideo = async () => {
    if (!recordedBlob || !candidate?.id) return;

    setIsUploading(true);
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        await uploadMutation.mutateAsync({
          candidateId: candidate.id,
          videoData: base64,
          duration: recordingTime,
          mimeType: recordedBlob?.type || 'video/webm',
        });
        setIsUploading(false);
      };
      reader.readAsDataURL(recordedBlob);
    } catch (error) {
      setIsUploading(false);
    }
  };

  // Discard recording
  const discardRecording = () => {
    setRecordedBlob(null);
    setRecordedUrl(null);
    setRecordingTime(0);
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  if (loadingVideo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/candidate-dashboard")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Video Introduction</h1>
            <p className="text-gray-500">Record a video to introduce yourself to recruiters</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Tips Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Video className="h-5 w-5" />
              Tips for a Great Video Introduction
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700">
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-1 text-green-600" />
                <span>Keep it under 2-3 minutes for best engagement</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-1 text-green-600" />
                <span>Find a quiet, well-lit space with a clean background</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-1 text-green-600" />
                <span>Introduce yourself, your experience, and what you're looking for</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-1 text-green-600" />
                <span>Be authentic and let your personality shine through</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Current Video */}
        {videoIntro && !recordedUrl && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Your Current Video Introduction
              </CardTitle>
              <CardDescription>
                Duration: {formatTime(videoIntro.duration || 0)} • Uploaded {new Date(videoIntro.createdAt).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  src={videoIntro.videoUrl}
                  controls
                  className="w-full h-full"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => deleteMutation.mutate({ id: videoIntro?.id || 0 })}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Delete Video
                </Button>
                <Button onClick={startRecording}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Record New Video
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recording Interface */}
        {!videoIntro || recordedUrl ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                {recordedUrl ? "Preview Your Recording" : "Record Your Video"}
              </CardTitle>
              <CardDescription>
                {recordedUrl 
                  ? "Review your recording before uploading"
                  : "Maximum duration: 15 minutes"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Video Preview */}
              <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
                {recordedUrl ? (
                  <video
                    src={recordedUrl}
                    controls
                    className="w-full h-full"
                  />
                ) : (
                  <video
                    ref={videoRef}
                    muted
                    className="w-full h-full object-cover"
                  />
                )}
                
                {/* Recording indicator */}
                {isRecording && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span className="font-medium">{formatTime(recordingTime)}</span>
                  </div>
                )}
              </div>

              {/* Progress bar for recording */}
              {isRecording && (
                <div className="space-y-2">
                  <Progress value={(recordingTime / MAX_DURATION) * 100} />
                  <p className="text-sm text-gray-500 text-center">
                    {formatTime(MAX_DURATION - recordingTime)} remaining
                  </p>
                </div>
              )}

              {/* Controls */}
              <div className="flex justify-center gap-3">
                {!isRecording && !recordedUrl && (
                  <Button size="lg" onClick={startRecording} className="bg-red-600 hover:bg-red-700">
                    <Camera className="h-5 w-5 mr-2" />
                    Start Recording
                  </Button>
                )}

                {isRecording && (
                  <Button size="lg" onClick={stopRecording} variant="destructive">
                    <div className="w-4 h-4 bg-white rounded-sm mr-2" />
                    Stop Recording
                  </Button>
                )}

                {recordedUrl && (
                  <>
                    <Button variant="outline" onClick={discardRecording}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Discard
                    </Button>
                    <Button variant="outline" onClick={startRecording}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Re-record
                    </Button>
                    <Button 
                      onClick={uploadVideo} 
                      disabled={isUploading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      Upload Video
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Benefits Card */}
        <Card>
          <CardHeader>
            <CardTitle>Why Add a Video Introduction?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-1">3x More Views</h3>
                <p className="text-sm text-gray-600">Profiles with videos get 3x more recruiter views</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-1">Stand Out</h3>
                <p className="text-sm text-gray-600">Show your personality beyond your resume</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-1">Better Matches</h3>
                <p className="text-sm text-gray-600">Help recruiters find the right fit faster</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Import missing icons
import { TrendingUp, Users } from "lucide-react";
