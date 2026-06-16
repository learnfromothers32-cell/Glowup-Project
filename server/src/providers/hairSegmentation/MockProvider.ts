import type { HairSegmentationProvider, HairSegmentationResult } from '../types';

export class MockHairSegmentationProvider implements HairSegmentationProvider {
  async segment(imagePath: string): Promise<HairSegmentationResult> {
    return {
      mask: '',
      bounds: { x: 0, y: 0, width: 0, height: 0 },
      confidence: 0
    };
  }
}
