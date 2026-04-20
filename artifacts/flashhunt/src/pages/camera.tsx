import React, { useEffect, useRef, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useSubmitHuntItem, useGetHuntItems, getGetHuntItemsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Camera as CameraIcon, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

export default function Camera() {
  const [, params] = useRoute("/camera/:itemId");
  const itemId = params?.itemId ? parseInt(params.itemId, 10) : null;
  const [, setLocation] = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: items } = useGetHuntItems();
  const targetItem = items?.find(i => i.id === itemId);
  
  const submitMutation = useSubmitHuntItem();
  const queryClient = useQueryClient();

  useEffect(() => {
    async function setupCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("CAMERA ACCESS DENIED");
      }
    }
    
    setupCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current || !targetItem) return;
    
    setCapturing(true);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const photoUrl = canvas.toDataURL('image/jpeg');
    
    // Simulate AI detection
    setTimeout(() => {
      submitMutation.mutate({
        data: {
          huntItemId: targetItem.id,
          photoUrl: "https://placeholder-url", // In real app, would upload to storage first
          detectedLabel: targetItem.cocoLabel,
          confidence: 0.95
        }
      }, {
        onSuccess: () => {
          setCapturing(false);
          setSuccess(true);
          
          // Trigger confetti
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#CCFF00', '#8B5CF6', '#FFFFFF']
          });
          
          queryClient.invalidateQueries({ queryKey: getGetHuntItemsQueryKey() });
          
          setTimeout(() => {
            setLocation("/hunt");
          }, 3000);
        },
        onError: () => {
          setCapturing(false);
          setError("DETECTION FAILED. TRY AGAIN.");
          setTimeout(() => setError(null), 3000);
        }
      });
    }, 2000);
  };

  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setLocation("/hunt");
  };

  if (!targetItem) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 inset-x-0 p-4 z-20 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <div className="bg-card/80 backdrop-blur border-2 border-primary px-3 py-1 text-primary font-mono font-bold uppercase tracking-widest text-sm">
          TARGET: {targetItem.name}
        </div>
        <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-none bg-black/50 text-white hover:bg-destructive hover:text-destructive-foreground">
          <X className="w-6 h-6" />
        </Button>
      </div>

      {/* Camera Feed */}
      <div className="relative flex-1 overflow-hidden bg-black">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center text-destructive font-mono font-bold uppercase text-xl p-4 text-center">
            {error}
          </div>
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

        {/* UI Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Target Brackets */}
          <div className="absolute top-1/4 left-8 w-16 h-16 border-t-4 border-l-4 border-primary"></div>
          <div className="absolute top-1/4 right-8 w-16 h-16 border-t-4 border-r-4 border-primary"></div>
          <div className="absolute bottom-1/4 left-8 w-16 h-16 border-b-4 border-l-4 border-primary"></div>
          <div className="absolute bottom-1/4 right-8 w-16 h-16 border-b-4 border-r-4 border-primary"></div>

          {/* Animated Scan Line */}
          {!capturing && !success && (
            <motion.div
              className="absolute left-8 right-8 h-0.5 bg-primary/80 shadow-[0_0_8px_2px_rgba(204,255,0,0.5)]"
              animate={{
                top: ["25%", "75%", "25%"],
              }}
              transition={{
                duration: 3,
                ease: "linear",
                repeat: Infinity,
              }}
            />
          )}
        </div>

        {/* Capturing State overlay */}
        <AnimatePresence>
          {capturing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-primary/20 backdrop-blur-sm flex flex-col items-center justify-center z-30"
            >
              <Zap className="w-16 h-16 text-primary animate-pulse mb-4" />
              <div className="text-primary font-mono text-2xl font-bold uppercase tracking-widest animate-pulse">
                ANALYZING...
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Overlay */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-40 p-6 text-center"
            >
              <motion.div 
                initial={{ y: 50 }} 
                animate={{ y: 0 }} 
                transition={{ type: "spring", bounce: 0.5 }}
                className="bg-primary text-primary-foreground p-8 border-4 border-foreground shadow-[8px_8px_0px_0px_hsl(var(--foreground))]"
              >
                <h2 className="text-4xl font-bold uppercase tracking-tighter mb-2">TARGET FOUND</h2>
                <p className="text-xl font-mono mb-6">{targetItem.name}</p>
                <div className="inline-block bg-black text-primary font-mono text-3xl font-bold px-6 py-2 border-2 border-primary">
                  +{targetItem.points} PT
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="p-8 bg-black z-20 flex justify-center pb-safe">
        <Button
          onClick={handleCapture}
          disabled={capturing || success || !!error}
          className="w-20 h-20 rounded-full bg-transparent border-4 border-primary p-1 hover:bg-primary/20 transition-all disabled:opacity-50"
        >
          <div className="w-full h-full bg-primary rounded-full flex items-center justify-center">
            <CameraIcon className="w-8 h-8 text-primary-foreground" />
          </div>
        </Button>
      </div>
    </div>
  );
}
