import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Video, VideoOff, Pause, Play, RotateCcw, Upload, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

interface VideoIntroductionProps {
  candidateId: number;
  existingVideo?: {
    id: number;
    videoUrl: string;
    duration: number;
    uploadedAt: Date;
  } | null;
  onUploadSuccess?: () => void;
}

const MAX_DURATION = 15 * 60; // 15 minutes in seconds

export default function VideoIntroduction({ candidateId, existingVideo, onUploadSuccess }: VideoIntroductionProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const uploadVideoMutation = trpc.resumeProfile.uploadVideoIntroduction.useMutation({
    onSuccess: () => {
      toast.success('Video introduction uploaded successfully!');
      stopRecording();
      if (onUploadSuccess) onUploadSuccess();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to upload video');
      setIsUploading(false);
    },
  });

  const deleteVideoMutation = trpc.resumeProfile.deleteVideoIntroduction.useMutation({
    onSuccess: () => {
      toast.success('Video introduction deleted');
      if (onUploadSuccess) onUploadSuccess();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete video');
    },
  });

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
      }
    };
  }, [recordedUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
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
        const url = URL.createObjectURL(blob);
        setRecordedUrl(url);

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 1;
          if (newDuration >= MAX_DURATION) {
            stopRecording();
            toast.info('Maximum recording duration reached (15 minutes)');
          }
          return newDuration;
        });
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to access camera/microphone. Please check permissions.');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      // Resume timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 1;
          if (newDuration >= MAX_DURATION) {
            stopRecording();
            toast.info('Maximum recording duration reached (15 minutes)');
          }
          return newDuration;
        });
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsRecording(false);
    setIsPaused(false);
  };

  const resetRecording = () => {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
    setRecordedBlob(null);
    setRecordedUrl(null);
    setDuration(0);
    chunksRef.current = [];
  };

  const handleUpload = async () => {
    if (!recordedBlob) return;

    setIsUploading(true);
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        
        await uploadVideoMutation.mutateAsync({
          candidateId,
          videoData: base64Data,
          duration,
          mimeType: 'video/webm',
        });
        
        setIsUploading(false);
        resetRecording();
      };
      reader.onerror = () => {
        toast.error('Failed to process video');
        setIsUploading(false);
      };
      reader.readAsDataURL(recordedBlob);
    } catch (error) {
      setIsUploading(false);
    }
  };

  const handleDelete = () => {
    if (existingVideo) {
      deleteVideoMutation.mutate({ id: existingVideo.id });
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (duration / MAX_DURATION) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Video Introduction
        </CardTitle>
        <CardDescription>
          Record a 15-minute video introduction to showcase your personality and communication skills
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing video display */}
        {existingVideo && !recordedUrl && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <Video className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium">Video Introduction Uploaded</p>
                  <p className="text-sm text-muted-foreground">
                    Duration: {formatDuration(existingVideo.duration)} • Uploaded {new Date(existingVideo.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(true)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Video Introduction?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete your video introduction. You can record a new one anytime.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            {/* Preview dialog */}
            {showPreview && (
              <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                <div className="bg-background rounded-lg max-w-4xl w-full p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Video Preview</h3>
                    <Button variant="ghost" onClick={() => setShowPreview(false)}>
                      Close
                    </Button>
                  </div>
                  <video
                    src={existingVideo.videoUrl}
                    controls
                    className="w-full rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recording interface */}
        {!existingVideo && (
          <div className="space-y-4">
            {/* Video preview */}
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
                src={recordedUrl || undefined}
              />
              {!isRecording && !recordedUrl && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <VideoOff className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Camera preview will appear here</p>
                  </div>
                </div>
              )}
              {isRecording && (
                <div className="absolute top-4 left-4">
                  <Badge variant="destructive" className="animate-pulse">
                    ● REC
                  </Badge>
                </div>
              )}
            </div>

            {/* Timer and progress */}
            {(isRecording || recordedUrl) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{formatDuration(duration)}</span>
                  <span className="text-muted-foreground">{formatDuration(MAX_DURATION)}</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-2">
              {!isRecording && !recordedUrl && (
                <Button onClick={startRecording} size="lg">
                  <Video className="mr-2 h-5 w-5" />
                  Start Recording
                </Button>
              )}

              {isRecording && !isPaused && (
                <>
                  <Button onClick={pauseRecording} variant="outline" size="lg">
                    <Pause className="mr-2 h-5 w-5" />
                    Pause
                  </Button>
                  <Button onClick={stopRecording} variant="destructive" size="lg">
                    Stop Recording
                  </Button>
                </>
              )}

              {isRecording && isPaused && (
                <>
                  <Button onClick={resumeRecording} size="lg">
                    <Play className="mr-2 h-5 w-5" />
                    Resume
                  </Button>
                  <Button onClick={stopRecording} variant="destructive" size="lg">
                    Stop Recording
                  </Button>
                </>
              )}

              {recordedUrl && !isUploading && (
                <>
                  <Button onClick={resetRecording} variant="outline" size="lg">
                    <RotateCcw className="mr-2 h-5 w-5" />
                    Re-record
                  </Button>
                  <Button onClick={handleUpload} size="lg">
                    <Upload className="mr-2 h-5 w-5" />
                    Upload Video
                  </Button>
                </>
              )}

              {isUploading && (
                <Button disabled size="lg">
                  Uploading...
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-medium mb-2">💡 Recording Tips</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Find a quiet, well-lit location</li>
            <li>• Look directly at the camera and speak clearly</li>
            <li>• Introduce yourself, your experience, and career goals</li>
            <li>• Explain what makes you unique and why recruiters should hire you</li>
            <li>• Maximum duration: 15 minutes</li>
            <li>• You can pause and resume recording</li>
            <li>• Preview your recording before uploading</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
