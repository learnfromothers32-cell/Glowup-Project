export interface FaceAnalysisResult {
  faceShape: string;
  landmarks: Record<string, { x: number; y: number; z?: number }>;
  confidence: number;
}

export interface FaceAnalysisProvider {
  analyze(imagePath: string): Promise<FaceAnalysisResult>;
}

export interface HairSegmentationResult {
  mask: string;
  bounds: { x: number; y: number; width: number; height: number };
  confidence: number;
}

export interface HairSegmentationProvider {
  segment(imagePath: string): Promise<HairSegmentationResult>;
}

export interface GenerationResult {
  imageUrl: string;
  provider: string;
  metadata: Record<string, unknown>;
}

export interface HairstyleGenerationProvider {
  generate(params: {
    originalImage: string;
    hairstyleId: string;
    templateImage?: string;
    faceLandmarks?: Record<string, { x: number; y: number; z?: number }>;
    maskPath?: string;
  }): Promise<GenerationResult>;
}
