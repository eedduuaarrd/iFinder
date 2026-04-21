import React, { useEffect, useRef, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetHuntItems, getGetHuntItemsQueryKey, getGetMyMosaicQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Camera as CameraIcon, X, Zap, AlertTriangle, Lightbulb, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";
import { captureAndCompress, vibrate } from "@/lib/image-utils";

type ValidationResult = {
  accepted: boolean;
  confidence: number;
  reason: string;
  detectedLabel?: string | null;
  detectedColor?: string | null;
  submission?: { pointsAwarded: number } | null;
};

type Phase = "framing" | "analyzing" | "success" | "rejected" | "error";

const ANALYSIS_LINES = [
  "SCANNING FRAME...",
  "DETECTING OBJECTS...",
  "VERIFYING TARGET...",
  "MEASURING CONFIDENCE...",
];

export default function CameraPage() {
  const [, params] = useRoute("/camera/:itemId");
  const itemId = params?.itemId ? parseInt(params.itemId, 10) : null;
  const [, setLocation] = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [phase, setPhase] = useState<Phase>("framing");
  const [analysisStep, setAnalysisStep] = useState(0);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data: items } = useGetHuntItems();
  const targetItem = items?.find((i) => i.id === itemId);
  const queryClient = useQueryClient();

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    let cancelled = false;
    async function setupCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 1280 } },
          audio: false,
        });
        if (cancelled) {
          mediaStream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = mediaStream;
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
      } catch {
        setError("CAMERA ACCESS DENIED. ENABLE IT IN YOUR BROWSER.");
        setPhase("error");
      }
    }
    setupCamera();
    return () => {
      cancelled = true;
      stopStream();
    };
  }, []);

  useEffect(() => {
    if (phase !== "analyzing") return;
    setAnalysisStep(0);
    const id = setInterval(() => {
      setAnalysisStep((s) => (s + 1) % ANALYSIS_LINES.length);
    }, 700);
    return () => clearInterval(id);
  }, [phase]);

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current || !targetItem) return;
    setError(null);
    setResult(null);

    let imageBase64: string;
    try {
      imageBase64 = await captureAndCompress(videoRef.current, canvasRef.current, 1024, 0.85);
    } catch (e: any) {
      setError(e?.message ?? "FAILED TO CAPTURE FRAME");
      setPhase("error");
      return;
    }

    setPreviewUrl(imageBase64);
    setPhase("analyzing");
    vibrate(20);
    stopStream();

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          huntItemId: targetItem.id,
          imageBase64,
        }),
      });

      const data: ValidationResult = await res.json().catch(() => ({
        accepted: false,
        confidence: 0,
        reason: "Server error",
      }));

      if (res.status === 400 && (data as any).error?.includes("Already")) {
        setError("ALREADY CAUGHT THIS ONE");
        setPhase("error");
        return;
      }

      if (data.accepted) {
        vibrate([40, 30, 80]);
        setResult(data);
        setPhase("success");

        confetti({
          particleCount: 140,
          spread: 80,
          origin: { y: 0.55 },
          colors: ["#CCFF00", "#8B5CF6", "#FFFFFF"],
        });
        setTimeout(() => {
          confetti({
            particleCount: 80,
            angle: 60,
            spread: 60,
            origin: { x: 0, y: 0.7 },
            colors: ["#CCFF00", "#FFFFFF"],
          });
          confetti({
            particleCount: 80,
            angle: 120,
            spread: 60,
            origin: { x: 1, y: 0.7 },
            colors: ["#8B5CF6", "#FFFFFF"],
          });
        }, 250);

        queryClient.invalidateQueries({ queryKey: getGetHuntItemsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMyMosaicQueryKey() });
      } else {
        vibrate([100, 50, 100]);
        setResult(data);
        setPhase("rejected");
      }
    } catch (err: any) {
      setError(err?.message ?? "CONNECTION FAILED");
      setPhase("error");
    }
  };

  const handleRetry = async () => {
    setResult(null);
    setError(null);
    setPreviewUrl(null);
    setPhase("framing");
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = mediaStream;
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch {
      setError("CAMERA ACCESS DENIED");
      setPhase("error");
    }
  };

  const handleClose = () => {
    stopStream();
    setLocation("/hunt");
  };

  if (!targetItem) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center text-primary font-mono">
        LOADING TARGET...
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="absolute top-0 inset-x-0 p-4 z-30 flex justify-between items-start gap-3 bg-gradient-to-b from-black/90 via-black/60 to-transparent">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase font-mono text-primary/80 tracking-widest mb-1">TARGET</div>
          <div className="bg-card/90 backdrop-blur border-2 border-primary px-3 py-2 inline-block max-w-full">
            <div className="text-primary font-mono font-bold uppercase tracking-wider text-sm truncate">
              {targetItem.name}
            </div>
            {targetItem.requiredColor && (
              <div className="text-[10px] uppercase font-mono text-secondary mt-0.5">
                COLOR: {targetItem.requiredColor}
              </div>
            )}
          </div>
          {targetItem.hint && (
            <div className="mt-2 flex items-start gap-1.5 text-[10px] text-muted-foreground font-mono">
              <Lightbulb className="w-3 h-3 mt-0.5 shrink-0 text-secondary" />
              <span className="line-clamp-2">{targetItem.hint}</span>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="rounded-none bg-black/70 text-white hover:bg-destructive hover:text-destructive-foreground border-2 border-foreground shrink-0 h-11 w-11"
          data-testid="button-close-camera"
        >
          <X className="w-6 h-6" />
        </Button>
      </div>

      <div className="relative flex-1 overflow-hidden bg-black">
        {phase === "error" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-destructive font-mono font-bold uppercase text-center p-6 gap-4">
            <AlertTriangle className="w-16 h-16" />
            <div className="text-xl">{error}</div>
            <Button onClick={handleClose} className="mt-4 rounded-none border-2 border-foreground bg-primary text-primary-foreground uppercase font-bold tracking-wider">
              GO BACK
            </Button>
          </div>
        ) : previewUrl && phase !== "framing" ? (
          <img src={previewUrl} className="absolute inset-0 w-full h-full object-cover" alt="captured" />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <canvas ref={canvasRef} className="hidden" />

        {phase === "framing" && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[20%] left-6 w-14 h-14 border-t-4 border-l-4 border-primary" />
            <div className="absolute top-[20%] right-6 w-14 h-14 border-t-4 border-r-4 border-primary" />
            <div className="absolute bottom-[28%] left-6 w-14 h-14 border-b-4 border-l-4 border-primary" />
            <div className="absolute bottom-[28%] right-6 w-14 h-14 border-b-4 border-r-4 border-primary" />
            <motion.div
              className="absolute left-6 right-6 h-0.5 bg-primary/80 shadow-[0_0_8px_2px_rgba(204,255,0,0.6)]"
              animate={{ top: ["20%", "72%", "20%"] }}
              transition={{ duration: 3, ease: "linear", repeat: Infinity }}
            />
          </div>
        )}

        <AnimatePresence>
          {phase === "analyzing" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-30 p-6"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
                className="mb-6"
              >
                <Zap className="w-20 h-20 text-primary" />
              </motion.div>
              <div className="text-primary font-mono text-xl font-bold uppercase tracking-widest h-7" data-testid="text-analysis-step">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={analysisStep}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                  >
                    {ANALYSIS_LINES[analysisStep]}
                  </motion.span>
                </AnimatePresence>
              </div>
              <div className="mt-4 text-[10px] font-mono uppercase text-muted-foreground tracking-widest">
                AI VISION ACTIVE
              </div>
            </motion.div>
          )}

          {phase === "success" && result && (
            <motion.div
              key="success"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center z-40 p-6 text-center"
            >
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", bounce: 0.55, duration: 0.7 }}
                className="bg-primary text-primary-foreground p-7 border-4 border-foreground shadow-[8px_8px_0px_0px_hsl(var(--foreground))] max-w-sm w-full"
              >
                <div className="text-[10px] font-mono uppercase tracking-widest mb-2">VERIFIED BY AI</div>
                <h2 className="text-3xl font-bold uppercase tracking-tighter mb-1">TARGET FOUND</h2>
                <p className="text-base font-mono mb-4 break-words">{targetItem.name}</p>
                <div className="inline-block bg-black text-primary font-mono text-3xl font-bold px-6 py-2 border-2 border-primary mb-3">
                  +{result.submission?.pointsAwarded ?? targetItem.points} PT
                </div>
                <div className="text-[10px] font-mono uppercase tracking-widest opacity-80">
                  CONFIDENCE: {Math.round(result.confidence * 100)}%
                </div>
              </motion.div>
              <Button
                onClick={handleClose}
                data-testid="button-continue"
                className="mt-8 rounded-none border-2 border-primary bg-black text-primary uppercase font-bold tracking-wider px-8 py-6 hover:bg-primary hover:text-primary-foreground"
              >
                CONTINUE HUNT →
              </Button>
            </motion.div>
          )}

          {phase === "rejected" && result && (
            <motion.div
              key="rejected"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-40 p-6 text-center"
            >
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", bounce: 0.4 }}
                className="bg-destructive text-destructive-foreground p-7 border-4 border-foreground shadow-[8px_8px_0px_0px_hsl(var(--foreground))] max-w-sm w-full"
              >
                <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
                <div className="text-[10px] font-mono uppercase tracking-widest mb-2">AI REJECTED THIS</div>
                <h2 className="text-2xl font-bold uppercase tracking-tighter mb-3">NOT VALID</h2>
                <p className="text-sm font-mono leading-relaxed break-words" data-testid="text-rejection-reason">
                  {result.reason}
                </p>
                <div className="mt-3 text-[10px] font-mono uppercase tracking-widest opacity-80">
                  CONFIDENCE: {Math.round(result.confidence * 100)}%
                </div>
              </motion.div>
              <div className="flex gap-3 mt-6 w-full max-w-sm">
                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="flex-1 rounded-none border-2 border-foreground bg-black text-foreground uppercase font-bold tracking-wider py-6 hover:bg-foreground hover:text-background"
                >
                  GIVE UP
                </Button>
                <Button
                  onClick={handleRetry}
                  data-testid="button-retry"
                  className="flex-1 rounded-none border-2 border-primary bg-primary text-primary-foreground uppercase font-bold tracking-wider py-6 hover:bg-primary/90"
                >
                  <RotateCcw className="w-4 h-4 mr-2" /> RETRY
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {phase === "framing" && (
        <div className="px-6 pt-3 pb-8 bg-black z-20 flex flex-col items-center gap-3">
          <div className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">
            FRAME THE TARGET. ONE SHOT.
          </div>
          <Button
            onClick={handleCapture}
            data-testid="button-capture"
            className="w-20 h-20 rounded-full bg-transparent border-4 border-primary p-1 hover:bg-primary/20 transition-all active:scale-95"
          >
            <div className="w-full h-full bg-primary rounded-full flex items-center justify-center">
              <CameraIcon className="w-8 h-8 text-primary-foreground" />
            </div>
          </Button>
        </div>
      )}
    </div>
  );
}
