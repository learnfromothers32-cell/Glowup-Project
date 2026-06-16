import type { FaceAnalysisProvider, FaceAnalysisResult } from '../types';
import logger from '../../utils/logger';
import { classifyFaceShape } from '../../utils/faceShapeClassifier';

export class MediaPipeFaceAnalysisProvider implements FaceAnalysisProvider {
  async analyze(imagePath: string): Promise<FaceAnalysisResult> {
    try {
      let sharp: any;
      try {
        sharp = (await import('sharp')).default;
      } catch {
        logger.warn('sharp not available, using fallback face shape detection');
        return { faceShape: 'oval', landmarks: {}, confidence: 0.3 };
      }

      const image = sharp(imagePath);
      const metadata = await image.metadata();
      const { width, height } = metadata;
      if (!width || !height) return { faceShape: 'oval', landmarks: {}, confidence: 0.3 };

      try {
        const buffer = await image.raw().toBuffer();
        const { FaceLandmarker, FilesetResolver } = await import(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/vision_bundle.mjs'
        );

        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm',
        );

        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'IMAGE',
          numFaces: 1,
        });

        const rgbChannels = metadata.channels ?? 3;
        const rgbaBuffer = Buffer.alloc(width * height * 4);
        for (let i = 0; i < width * height; i++) {
          rgbaBuffer[i * 4] = buffer[i * rgbChannels];
          rgbaBuffer[i * 4 + 1] = buffer[i * rgbChannels + 1];
          rgbaBuffer[i * 4 + 2] = buffer[i * rgbChannels + 2];
          rgbaBuffer[i * 4 + 3] = 255;
        }

        const imageData = { width, height, data: new Uint8ClampedArray(rgbaBuffer) };
        const result = landmarker.detect(imageData, { imageWidth: width, imageHeight: height });

        if (result.faceLandmarks?.[0]) {
          const lm = result.faceLandmarks[0];
          const classified = classifyFaceShape(
            lm.map((l: { x: number; y: number; z?: number }) => ({ x: l.x, y: l.y, z: l.z }))
          );

          return {
            faceShape: classified.faceShape,
            landmarks: lm.reduce(
              (acc: Record<string, { x: number; y: number; z?: number }>,
               l: { x: number; y: number; z?: number }, i: number) => {
                acc[String(i)] = { x: l.x, y: l.y, z: l.z };
                return acc;
              }, {}),
            confidence: classified.confidence,
          };
        }
      } catch (err) {
        logger.warn('Server-side MediaPipe unavailable, using dimension heuristic', {
          error: (err as Error).message,
        });
      }

      const hwRatio = height / width;
      let faceShape = 'oval';
      let confidence = 0.5;

      if (hwRatio > 1.5) {
        faceShape = 'oblong';
        confidence = 0.55;
      } else if (hwRatio < 1.2 && width / height > 0.85) {
        faceShape = 'round';
        confidence = 0.55;
      } else if (hwRatio < 1.3 && width / height > 0.8) {
        faceShape = 'square';
        confidence = 0.5;
      } else if (hwRatio >= 1.3 && hwRatio <= 1.5) {
        faceShape = 'oval';
        confidence = 0.6;
      }

      return { faceShape, landmarks: {}, confidence };
    } catch {
      return { faceShape: 'oval', landmarks: {}, confidence: 0.3 };
    }
  }
}
