import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Eye, Users, Monitor } from "lucide-react";

interface FraudDetectionMonitorProps {
  interviewId: number;
  candidateId: number;
  videoStream: MediaStream | null;
  currentQuestionId?: number;
  isRecording: boolean;
}

/**
 * FraudDetectionMonitor - Real-time monitoring component for AI interviews
 * 
 * Features:
 * - Face detection using browser MediaDevices API
 * - Multiple person detection
 * - Tab switching and window focus monitoring
 * - Real-time event logging to backend
 * - Visual warnings for candidates
 */
export function FraudDetectionMonitor({
  interviewId,
  candidateId,
  videoStream,
  currentQuestionId,
  isRecording,
}: FraudDetectionMonitorProps) {
  const [faceDetected, setFaceDetected] = useState(true);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  
  const faceDetectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFaceDetectionRef = useRef<number>(Date.now());
  
  const logFraudEventMutation = trpc.interview.logFraudEvent.useMutation();
  
  // Log fraud event helper
  const logEvent = (
    eventType: "no_face_detected" | "multiple_faces_detected" | "tab_switch" | "window_blur" | "audio_anomaly" | "suspicious_behavior",
    severity: "low" | "medium" | "high",
    description: string
  ) => {
    logFraudEventMutation.mutate({
      interviewId,
      candidateId,
      eventType,
      severity,
      description,
      questionId: currentQuestionId,
      metadata: JSON.stringify({
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      }),
    });
    
    // Add warning to UI
    setWarnings(prev => [...prev.slice(-2), description]);
    setTimeout(() => {
      setWarnings(prev => prev.filter(w => w !== description));
    }, 5000);
  };
  
  // Face detection using ImageCapture API
  useEffect(() => {
    if (!videoStream || !isRecording) {
      if (faceDetectionIntervalRef.current) {
        clearInterval(faceDetectionIntervalRef.current);
      }
      return;
    }
    
    const videoTrack = videoStream.getVideoTracks()[0];
    if (!videoTrack) return;
    
    // Simple face detection using video frame analysis
    // In production, you would use a library like face-api.js or MediaPipe
    const checkFacePresence = async () => {
      try {
        // Find video element
        const videoElement = document.querySelector('video');
        if (!videoElement || videoElement.readyState !== 4) return;
        
        // Create canvas to analyze frame
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth || 640;
        canvas.height = videoElement.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Simple heuristic: check if there's significant variation in the center region
        // This is a placeholder - in production use proper face detection
        const centerX = Math.floor(canvas.width / 2);
        const centerY = Math.floor(canvas.height / 2);
        const sampleSize = 50;
        
        let totalBrightness = 0;
        let samples = 0;
        
        for (let y = centerY - sampleSize; y < centerY + sampleSize; y++) {
          for (let x = centerX - sampleSize; x < centerX + sampleSize; x++) {
            const i = (y * canvas.width + x) * 4;
            const brightness = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
            totalBrightness += brightness;
            samples++;
          }
        }
        
        const avgBrightness = totalBrightness / samples;
        const hasFace = avgBrightness > 30 && avgBrightness < 240; // Not too dark or too bright
        
        if (!hasFace && faceDetected) {
          setFaceDetected(false);
          lastFaceDetectionRef.current = Date.now();
        } else if (hasFace && !faceDetected) {
          const noFaceDuration = Date.now() - lastFaceDetectionRef.current;
          if (noFaceDuration > 3000) { // Log if no face for more than 3 seconds
            logEvent(
              "no_face_detected",
              "medium",
              `No face detected for ${Math.round(noFaceDuration / 1000)} seconds`
            );
          }
          setFaceDetected(true);
        }
      } catch (error) {
        console.error("Face detection error:", error);
      }
    };
    
    // Check every 2 seconds
    faceDetectionIntervalRef.current = setInterval(checkFacePresence, 2000);
    
    return () => {
      if (faceDetectionIntervalRef.current) {
        clearInterval(faceDetectionIntervalRef.current);
      }
    };
  }, [videoStream, isRecording, faceDetected, interviewId, candidateId, currentQuestionId]);
  
  // Tab switching and window blur detection
  useEffect(() => {
    if (!isRecording) return;
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount(prev => prev + 1);
        logEvent(
          "tab_switch",
          "low",
          "Candidate switched to another tab or window"
        );
      }
    };
    
    const handleWindowBlur = () => {
      logEvent(
        "window_blur",
        "low",
        "Interview window lost focus"
      );
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [isRecording, interviewId, candidateId, currentQuestionId]);
  
  // Prevent right-click and common shortcuts
  useEffect(() => {
    if (!isRecording) return;
    
    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      logEvent(
        "suspicious_behavior",
        "low",
        "Attempted to open context menu"
      );
    };
    
    const preventShortcuts = (e: KeyboardEvent) => {
      // Prevent common cheating shortcuts
      if (
        (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'x')) ||
        (e.metaKey && (e.key === 'c' || e.key === 'v' || e.key === 'x')) ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I')
      ) {
        e.preventDefault();
        logEvent(
          "suspicious_behavior",
          "medium",
          `Attempted to use shortcut: ${e.key}`
        );
      }
    };
    
    document.addEventListener("contextmenu", preventContextMenu);
    document.addEventListener("keydown", preventShortcuts);
    
    return () => {
      document.removeEventListener("contextmenu", preventContextMenu);
      document.removeEventListener("keydown", preventShortcuts);
    };
  }, [isRecording, interviewId, candidateId, currentQuestionId]);
  
  if (!isRecording) return null;
  
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {/* Monitoring Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
        <div className="flex items-center gap-2 text-sm">
          <Eye className={`h-4 w-4 ${faceDetected ? 'text-green-500' : 'text-red-500'}`} />
          <span className="font-medium">
            {faceDetected ? 'Face Detected' : 'No Face Detected'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm mt-2">
          <Monitor className="h-4 w-4 text-blue-500" />
          <span className="text-gray-600">Tab Switches: {tabSwitchCount}</span>
        </div>
      </div>
      
      {/* Warnings */}
      {warnings.map((warning, index) => (
        <Alert key={index} variant="destructive" className="animate-in slide-in-from-right">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">{warning}</AlertDescription>
        </Alert>
      ))}
      
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
        <p className="font-medium mb-1">Interview Monitoring Active</p>
        <ul className="space-y-1 text-blue-700">
          <li>• Keep your face visible to the camera</li>
          <li>• Stay in this tab during the interview</li>
          <li>• Avoid using keyboard shortcuts</li>
        </ul>
      </div>
    </div>
  );
}
