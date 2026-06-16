import type { HairstyleGenerationProvider, GenerationResult } from '../providers/types';
import { TemplateOverlayProvider } from '../providers/hairstyleGeneration/TemplateOverlayProvider';
import { DiffusionHairstyleProvider } from '../providers/hairstyleGeneration/DiffusionHairstyleProvider';
import { appConfig } from '../config/app';

let provider: HairstyleGenerationProvider;

function createProvider(): HairstyleGenerationProvider {
  if (appConfig.hfToken) {
    return new DiffusionHairstyleProvider();
  }
  return new TemplateOverlayProvider();
}

export function getProvider(): HairstyleGenerationProvider {
  if (!provider) {
    provider = createProvider();
  }
  return provider;
}

export const setGenerationProvider = (p: HairstyleGenerationProvider) => {
  provider = p;
};

export const generateHairstylePreview = async (params: {
  originalImage: string;
  hairstyleId: string;
  templateImage?: string;
  faceLandmarks?: Record<string, { x: number; y: number; z?: number }>;
  maskPath?: string;
}): Promise<GenerationResult> => {
  return getProvider().generate(params);
};
