import { useState, useCallback, useRef, useEffect } from "react";
import { HAIRSTYLES } from "../data/hairstyles";
import type { Hairstyle } from "../data/hairstyles";

const CDN_LIB_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/vision_bundle.mjs";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/image_segmenter/hair_segmenter/float32/latest/hair_segmenter.tflite";
const WASM_CDN =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let visionLib: Promise<any> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getVisionLib(): Promise<any> {
  if (!visionLib) {
    visionLib = import(/* @vite-ignore */ CDN_LIB_URL);
  }
  return visionLib;
}

export interface HairTryOnState {
  activeHairstyle: Hairstyle;
  faceDetected: boolean;
  isRunning: boolean;
  modelLoaded: boolean;
  modelLoading: boolean;
  modelError: string | null;
  loadingTimedOut: boolean;
}

const MODEL_TIMEOUT_MS = 30000;

export function useHairTryOn() {
  const [activeHairstyle, setActiveHairstyle] = useState<Hairstyle>(HAIRSTYLES[0]);
  const [faceDetected, setFaceDetected] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [modelLoaded, setIsModelLoaded] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const segmenterRef = useRef<any>(null);
  const modelLoadingRef = useRef(false);
  const animRef = useRef<number>(0);
  const runningRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hairstyleRef = useRef<Hairstyle>(HAIRSTYLES[0]);
  const loadAttemptedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isProcessingRef = useRef(false);
  const lastFrameTimeRef = useRef(0);

  useEffect(() => {
    hairstyleRef.current = activeHairstyle;
  }, [activeHairstyle]);

  const loadModel = useCallback(async () => {
    if (loadAttemptedRef.current) return;
    loadAttemptedRef.current = true;

    setModelLoading(true);
    modelLoadingRef.current = true;
    setModelError(null);
    setLoadingTimedOut(false);

    timeoutRef.current = setTimeout(() => {
      if (modelLoadingRef.current) {
        setLoadingTimedOut(true);
        setModelError("Model download timed out. Check your connection.");
        setModelLoading(false);
      }
    }, MODEL_TIMEOUT_MS);

    try {
      const lib = await getVisionLib();
      const { FilesetResolver, ImageSegmenter } = lib;

      const vision = await FilesetResolver.forVisionTasks(WASM_CDN);

      const segmenter = await ImageSegmenter.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_URL,
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        outputConfidenceMasks: true,
        outputCategoryMask: false,
      });

      segmenterRef.current = segmenter;
      setIsModelLoaded(true);
      modelLoadingRef.current = false;
      setModelLoading(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setModelError(message || "Failed to load AI model");
      modelLoadingRef.current = false;
      setModelLoading(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  }, []);

  const retryLoad = useCallback(() => {
    loadAttemptedRef.current = false;
    setModelError(null);
    setLoadingTimedOut(false);
    loadModel();
  }, [loadModel]);

  const startTryOn = useCallback(
    (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
      if (runningRef.current) return;
      const segmenter = segmenterRef.current;
      if (!segmenter) return;

      runningRef.current = true;
      setIsRunning(true);
      videoRef.current = video;
      canvasRef.current = canvas;
      const ctx = canvas.getContext("2d");

      const tick = async () => {
        if (!runningRef.current || !videoRef.current || !canvasRef.current) return;
        const videoEl = videoRef.current;
        const cvs = canvasRef.current;

        if (videoEl.readyState < 2 || videoEl.videoWidth === 0) {
          animRef.current = requestAnimationFrame(tick);
          return;
        }

        cvs.width = videoEl.videoWidth;
        cvs.height = videoEl.videoHeight;

        ctx?.clearRect(0, 0, cvs.width, cvs.height);

        const now = performance.now();

        if (isProcessingRef.current) {
          animRef.current = requestAnimationFrame(tick);
          return;
        }

        if (now - lastFrameTimeRef.current < 50) {
          animRef.current = requestAnimationFrame(tick);
          return;
        }

        isProcessingRef.current = true;
        lastFrameTimeRef.current = now;

        try {
          const result = segmenter.segmentForVideo(videoEl, now);

          const confidenceMasks = result.confidenceMasks;
          if (!confidenceMasks || confidenceMasks.length === 0) {
            setFaceDetected(false);
            isProcessingRef.current = false;
            animRef.current = requestAnimationFrame(tick);
            return;
          }

          const hairMask = confidenceMasks[0];
          const maskData = hairMask.getAsFloat32Array();
          const maskW = hairMask.width;
          const maskH = hairMask.height;

          let minX = maskW, maxX = 0, minY = maskH, maxY = 0;
          let found = false;
          for (let y = 0; y < maskH; y++) {
            for (let x = 0; x < maskW; x++) {
              if (maskData[y * maskW + x] > 0.3) {
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
                found = true;
              }
            }
          }

          if (found) {
            setFaceDetected(true);
            const scaleX = cvs.width / maskW;
            const scaleY = cvs.height / maskH;
            const cx = ((minX + maxX) / 2) * scaleX;
            const cy = ((minY + maxY) / 2) * scaleY;
            const w = (maxX - minX) * scaleX * 1.3;
            const h = (maxY - minY) * scaleY * 1.5;

            hairstyleRef.current.render(ctx!, { cx, cy, w, h });
          } else {
            setFaceDetected(false);
          }
        } catch {
          setFaceDetected(false);
        }

        isProcessingRef.current = false;
        animRef.current = requestAnimationFrame(tick);
      };
      animRef.current = requestAnimationFrame(tick);
    },
    [],
  );

  const stopTryOn = useCallback(() => {
    runningRef.current = false;
    setIsRunning(false);
    cancelAnimationFrame(animRef.current);
    videoRef.current = null;
    canvasRef.current = null;
  }, []);

  const nextHairstyle = useCallback(() => {
    const idx = HAIRSTYLES.findIndex((h) => h.id === activeHairstyle.id);
    const next = HAIRSTYLES[(idx + 1) % HAIRSTYLES.length];
    setActiveHairstyle(next);
  }, [activeHairstyle]);

  const prevHairstyle = useCallback(() => {
    const idx = HAIRSTYLES.findIndex((h) => h.id === activeHairstyle.id);
    const prev = HAIRSTYLES[(idx - 1 + HAIRSTYLES.length) % HAIRSTYLES.length];
    setActiveHairstyle(prev);
  }, [activeHairstyle]);

  const selectHairstyle = useCallback((id: string) => {
    const hair = HAIRSTYLES.find((h) => h.id === id);
    if (hair) setActiveHairstyle(hair);
  }, []);

  useEffect(() => {
    return () => {
      runningRef.current = false;
      cancelAnimationFrame(animRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (segmenterRef.current) {
        segmenterRef.current.close();
        segmenterRef.current = null;
      }
    };
  }, []);

  return {
    activeHairstyle,
    faceDetected,
    isRunning,
    modelLoaded,
    modelLoading,
    modelError,
    loadingTimedOut,
    loadModel,
    retryLoad,
    startTryOn,
    stopTryOn,
    nextHairstyle,
    prevHairstyle,
    selectHairstyle,
    hairstyles: HAIRSTYLES,
  };
}
