import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import * as faceapi from "face-api.js";

interface FraudDetectionMonitorProps {
  interviewId: number;
  candidateId: number;
  videoElement: HTMLVideoElement | null;
  isActive: boolean;
}

/**
 * Advanced Fraud Detection Monitor using face-api.js
 * Features:
 * - Multi-person detection
 * - Face landmark detection
 * - Confidence scoring
 * - Real-time monitoring
 */
export default function FraudDetectionMonitorV2({
  interviewId,
  candidateId,
  videoElement,
  isActive,
}: FraudDetectionMonitorProps) {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceCount, setFaceCount] = useState(0);
  const [detectionConfidence, setDetectionConfidence] = useState(0);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastEventTimeRef = useRef<Record<string, number>>({});
  
  const logFraudEventMutation = trpc.interview.logFraudEvent.useMutation();
  
  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/";
        
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        
        setModelsLoaded(true);
        console.log("[FraudDetection] face-api.js models loaded successfully");
      } catch (error) {
        console.error("[FraudDetection] Failed to load models:", error);
        toast.error("Failed to initialize face detection");
      }
    };
    
    loadModels();
  }, []);
  
  // Log fraud event with debouncing
  const logEvent = async (
    eventType: "no_face_detected" | "multiple_faces_detected" | "tab_switch" | "window_blur" | "audio_anomaly" | "suspicious_behavior",
    severity: "low" | "medium" | "high",
    details: string,
    metadata?: Record<string, any>
  ) => {
    const now = Date.now();
    const lastTime = lastEventTimeRef.current[eventType] || 0;
    
    // Debounce: only log if 5 seconds have passed since last event of same type
    if (now - lastTime < 5000) {
      return;
    }
    
    lastEventTimeRef.current[eventType] = now;
    
    try {
      await logFraudEventMutation.mutateAsync({
        interviewId,
        candidateId,
        eventType,
        severity,
        description: details,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
      });
    } catch (error) {
      console.error("[FraudDetection] Failed to log event:", error);
    }
  };
  
  // Perform face detection
  const detectFaces = async () => {
    if (!videoElement || !modelsLoaded || !isActive) {
      return;
    }
    
    try {
      const detections = await faceapi
        .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();
      
      const faceCount = detections.length;
      setFaceCount(faceCount);
      
      // Calculate average confidence
      const avgConfidence = detections.length > 0
        ? detections.reduce((sum, d) => sum + d.detection.score, 0) / detections.length
        : 0;
      setDetectionConfidence(Math.round(avgConfidence * 100));
      
      // Check for fraud scenarios
      if (faceCount === 0) {
        await logEvent(
          "no_face_detected" as any,
          "high",
          "No face detected in video frame",
          { confidence: avgConfidence }
        );
      } else if (faceCount > 1) {
        await logEvent(
          "multiple_faces_detected" as any,
          "high",
          `Multiple persons detected: ${faceCount} faces`,
          { faceCount, confidence: avgConfidence }
        );
        toast.error(`⚠️ Multiple persons detected (${faceCount} faces)`, {
          duration: 3000,
        });
      } else if (avgConfidence < 0.5) {
        await logEvent(
          "suspicious_behavior" as any,
          "medium",
          "Low face detection confidence",
          { confidence: avgConfidence }
        );
      }
    } catch (error) {
      console.error("[FraudDetection] Face detection error:", error);
    }
  };
  
  // Monitor tab/window focus
  useEffect(() => {
    if (!isActive) return;
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
      logEvent(
        "tab_switch" as any,
        "medium",
        "Candidate switched tabs or minimized window",
        { timestamp: new Date().toISOString() }
      );
        toast.warning("⚠️ Tab switch detected");
      }
    };
    
    const handleBlur = () => {
      logEvent(
        "window_blur" as any,
        "low",
        "Window lost focus",
        { timestamp: new Date().toISOString() }
      );
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [isActive, interviewId]);
  
  // Start face detection loop
  useEffect(() => {
    if (!modelsLoaded || !isActive || !videoElement) {
      return;
    }
    
    // Run detection every 3 seconds
    detectionIntervalRef.current = setInterval(() => {
      detectFaces();
    }, 3000);
    
    // Initial detection
    detectFaces();
    
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [modelsLoaded, isActive, videoElement]);
  
  if (!isActive) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 min-w-[200px]">
      <div className="text-sm font-semibold mb-2 flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        Fraud Detection Active
      </div>
      
      <div className="space-y-2 text-xs text-gray-600">
        <div className="flex justify-between">
          <span>Models:</span>
          <span className={modelsLoaded ? "text-green-600" : "text-yellow-600"}>
            {modelsLoaded ? "Loaded" : "Loading..."}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Faces Detected:</span>
          <span className={
            faceCount === 0 ? "text-red-600" :
            faceCount === 1 ? "text-green-600" :
            "text-red-600 font-bold"
          }>
            {faceCount}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Confidence:</span>
          <span className={
            detectionConfidence >= 70 ? "text-green-600" :
            detectionConfidence >= 50 ? "text-yellow-600" :
            "text-red-600"
          }>
            {detectionConfidence}%
          </span>
        </div>
      </div>
      
      {faceCount > 1 && (
        <div className="mt-2 text-xs text-red-600 font-semibold border-t pt-2">
          ⚠️ Multiple persons detected!
        </div>
      )}
      
      {faceCount === 0 && modelsLoaded && (
        <div className="mt-2 text-xs text-red-600 font-semibold border-t pt-2">
          ⚠️ No face detected!
        </div>
      )}
    </div>
  );
}
