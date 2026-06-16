import type { HairstyleGenerationProvider, GenerationResult } from '../types';

export class TemplateOverlayProvider implements HairstyleGenerationProvider {
  async generate(params: {
    originalImage: string;
    hairstyleId: string;
    templateImage?: string;
    faceLandmarks?: Record<string, { x: number; y: number; z?: number }>;
    maskPath?: string;
  }): Promise<GenerationResult> {
    const imageUrl = params.templateImage || params.originalImage;

    return {
      imageUrl,
      provider: 'template-overlay',
      metadata: {
        hairstyleId: params.hairstyleId,
        originalImage: params.originalImage
      }
    };
  }
}
