import type { FaceAnalysisProvider, FaceAnalysisResult } from '../providers/types';
import { MediaPipeFaceAnalysisProvider } from '../providers/faceAnalysis/MediaPipeProvider';

let provider: FaceAnalysisProvider = new MediaPipeFaceAnalysisProvider();

export const setFaceAnalysisProvider = (p: FaceAnalysisProvider) => {
  provider = p;
};

export const analyzeFace = async (imagePath: string): Promise<FaceAnalysisResult> => {
  return provider.analyze(imagePath);
};
