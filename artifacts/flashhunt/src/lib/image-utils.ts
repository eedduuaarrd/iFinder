export async function captureAndCompress(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  maxDimension = 1024,
  quality = 0.85,
): Promise<string> {
  const sw = video.videoWidth;
  const sh = video.videoHeight;
  if (!sw || !sh) throw new Error("Camera frame not ready");

  const scale = Math.min(1, maxDimension / Math.max(sw, sh));
  const tw = Math.round(sw * scale);
  const th = Math.round(sh * scale);

  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not available");

  ctx.drawImage(video, 0, 0, tw, th);
  return canvas.toDataURL("image/jpeg", quality);
}

export function vibrate(pattern: number | number[]): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // ignore
    }
  }
}
