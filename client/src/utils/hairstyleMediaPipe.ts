let faceLandmarker: any = null;
let initPromise: Promise<any> | null = null;

let FilesetResolver: any;
let FaceLandmarkerClass: any;

const MEDIAPIPE_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18";
const WASM_URL = `${MEDIAPIPE_CDN}/wasm`;
const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task";

async function loadMediaPipe() {
  if (!FilesetResolver) {
    const mod = await import(`${MEDIAPIPE_CDN}/vision_bundle.mjs`);
    FilesetResolver = mod.FilesetResolver;
    FaceLandmarkerClass = mod.FaceLandmarker;
  }
}

export async function getFaceLandmarker(): Promise<any> {
  if (faceLandmarker) return faceLandmarker;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    await loadMediaPipe();
    const vision = await FilesetResolver.forVisionTasks(WASM_URL);
    faceLandmarker = await FaceLandmarkerClass.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: MODEL_URL,
        delegate: "GPU",
      },
      runningMode: "IMAGE",
      numFaces: 1,
      minFaceDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    return faceLandmarker;
  })();

  return initPromise;
}

export interface FaceGeometry {
  headCenter: { x: number; y: number };
  headTop: number;
  headWidth: number;
  foreheadCenter: { x: number; y: number };
  jawWidth: number;
  faceHeight: number;
  confidence: number;
}

const FOREHEAD_LANDMARKS = [9, 10, 151, 108, 69, 67, 109, 299, 337];
const JAW_LANDMARKS = [152, 175, 150, 149, 176, 148, 58, 172, 136, 214, 210, 212, 213, 200];

export function extractFaceGeometry(result: any): FaceGeometry | null {
  const landmarks = result.faceLandmarks?.[0];
  if (!landmarks || landmarks.length < 468) return null;

  const allX = landmarks.map((l: any) => l.x);
  const allY = landmarks.map((l: any) => l.y);
  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const minY = Math.min(...allY);
  const maxY = Math.max(...allY);

  const faceWidth = maxX - minX;
  const faceHeight = maxY - minY;
  const faceCenterX = (minX + maxX) / 2;
  const faceCenterY = (minY + maxY) / 2;

  const foreheadY = FOREHEAD_LANDMARKS.reduce((sum, i) => sum + (landmarks[i]?.y ?? minY), 0) / FOREHEAD_LANDMARKS.length;
  const foreheadX = FOREHEAD_LANDMARKS.reduce((sum, i) => sum + (landmarks[i]?.x ?? faceCenterX), 0) / FOREHEAD_LANDMARKS.length;

  const jawPoints = JAW_LANDMARKS.map((i: number) => landmarks[i]).filter(Boolean);
  const jawLeftX = Math.min(...jawPoints.map((l: any) => l.x));
  const jawRightX = Math.max(...jawPoints.map((l: any) => l.x));
  const jawWidth = jawRightX - jawLeftX;

  const headTop = Math.max(0, minY - faceHeight * 0.15);
  const headWidth = faceWidth * 1.1;

  return {
    headCenter: { x: faceCenterX, y: faceCenterY },
    headTop,
    headWidth,
    foreheadCenter: { x: foreheadX, y: foreheadY },
    jawWidth,
    faceHeight,
    confidence: 0.9,
  };
}

export async function detectFaceOnImage(image: HTMLImageElement | HTMLCanvasElement): Promise<FaceGeometry | null> {
  try {
    const landmarker = await getFaceLandmarker();
    const result = landmarker.detect(image, {
      imageWidth: image instanceof HTMLCanvasElement ? image.width : image.naturalWidth,
      imageHeight: image instanceof HTMLCanvasElement ? image.height : image.naturalHeight,
    });
    return extractFaceGeometry(result);
  } catch (err) {
    console.warn("MediaPipe face detection failed:", err);
    return null;
  }
}

export function getDefaultGeometry(_imageWidth: number, _imageHeight: number): FaceGeometry {
  return {
    headCenter: { x: 0.5, y: 0.35 },
    headTop: 0.05,
    headWidth: 0.38,
    foreheadCenter: { x: 0.5, y: 0.2 },
    jawWidth: 0.25,
    faceHeight: 0.5,
    confidence: 0,
  };
}
