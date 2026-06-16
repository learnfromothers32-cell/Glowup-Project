interface ShapeRange {
  hwRatioMin?: number;
  hwRatioMax?: number;
  jawRatioMin?: number;
  jawRatioMax?: number;
  foreheadJawRatio?: number;
  foreheadJawRatioMin?: number;
  foreheadJawRatioMax?: number;
}

const SHAPE_RANGES: Record<string, ShapeRange> = {
  oval: { hwRatioMin: 1.3, hwRatioMax: 1.5, jawRatioMax: 0.85, foreheadJawRatioMin: 1.05, foreheadJawRatioMax: 1.2 },
  round: { hwRatioMax: 1.2, jawRatioMin: 0.85, foreheadJawRatio: 1.0 },
  square: { hwRatioMax: 1.2, jawRatioMin: 0.9, foreheadJawRatio: 1.0 },
  heart: { hwRatioMin: 1.3, jawRatioMax: 0.8, foreheadJawRatioMin: 1.2 },
  diamond: { hwRatioMin: 1.3, hwRatioMax: 1.5, jawRatioMin: 0.8, jawRatioMax: 0.9, foreheadJawRatioMin: 0.9, foreheadJawRatioMax: 1.05 },
  oblong: { hwRatioMin: 1.5, jawRatioMin: 0.85 },
};

export type FaceShape = keyof typeof SHAPE_RANGES;

export interface FaceMetrics {
  faceHeight: number;
  faceWidth: number;
  jawWidth: number;
  foreheadWidth: number;
  cheekboneWidth: number;
}

export interface ClassificationResult {
  faceShape: FaceShape;
  confidence: number;
  metrics: FaceMetrics;
}

const LANDMARK_IDS = {
  chin: 152,
  foreheadTop: 10,
  jawLeft: 58,
  jawRight: 288,
  cheekLeft: 234,
  cheekRight: 454,
  templeLeft: 33,
  templeRight: 263,
};

function euclidean(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function classifyFaceShape(
  landmarks: { x: number; y: number; z?: number }[]
): ClassificationResult {
  const chin = landmarks[LANDMARK_IDS.chin];
  const foreheadTop = landmarks[LANDMARK_IDS.foreheadTop];
  const jawLeft = landmarks[LANDMARK_IDS.jawLeft];
  const jawRight = landmarks[LANDMARK_IDS.jawRight];
  const cheekLeft = landmarks[LANDMARK_IDS.cheekLeft];
  const cheekRight = landmarks[LANDMARK_IDS.cheekRight];
  const templeLeft = landmarks[LANDMARK_IDS.templeLeft];
  const templeRight = landmarks[LANDMARK_IDS.templeRight];

  const faceHeight = euclidean(foreheadTop, chin);
  const faceWidth = euclidean(cheekLeft, cheekRight);
  const jawWidth = euclidean(jawLeft, jawRight);
  const foreheadWidth = euclidean(templeLeft, templeRight);
  const cheekboneWidth = faceWidth;

  const hwRatio = faceHeight / faceWidth;
  const jawRatio = jawWidth / faceWidth;
  const foreheadJawRatio = foreheadWidth / jawWidth;

  const metrics: FaceMetrics = {
    faceHeight,
    faceWidth,
    jawWidth,
    foreheadWidth,
    cheekboneWidth,
  };

  let bestShape: FaceShape = 'oval';
  let bestScore = 0;

  for (const [shape, range] of Object.entries(SHAPE_RANGES)) {
    let score = 0;
    const maxScore = 4;

    if (range.hwRatioMin !== undefined && range.hwRatioMax !== undefined) {
      if (hwRatio >= range.hwRatioMin && hwRatio <= range.hwRatioMax) score++;
    } else if (range.hwRatioMin !== undefined) {
      if (hwRatio >= range.hwRatioMin) score++;
    } else if (range.hwRatioMax !== undefined) {
      if (hwRatio <= range.hwRatioMax) score++;
    }

    if (range.jawRatioMin !== undefined && range.jawRatioMax !== undefined) {
      if (jawRatio >= range.jawRatioMin && jawRatio <= range.jawRatioMax) score++;
    } else if (range.jawRatioMin !== undefined) {
      if (jawRatio >= range.jawRatioMin) score++;
    } else if (range.jawRatioMax !== undefined) {
      if (jawRatio <= range.jawRatioMax) score++;
    }

    if (range.foreheadJawRatio !== undefined) {
      if (Math.abs(foreheadJawRatio - range.foreheadJawRatio) < 0.1) score++;
    } else if (range.foreheadJawRatioMin !== undefined && range.foreheadJawRatioMax !== undefined) {
      if (foreheadJawRatio >= range.foreheadJawRatioMin && foreheadJawRatio <= range.foreheadJawRatioMax) score++;
    } else if (range.foreheadJawRatioMin !== undefined) {
      if (foreheadJawRatio >= range.foreheadJawRatioMin) score++;
    } else if (range.foreheadJawRatioMax !== undefined) {
      if (foreheadJawRatio <= range.foreheadJawRatioMax) score++;
    }

    const normalizedScore = score / maxScore;
    if (normalizedScore > bestScore) {
      bestScore = normalizedScore;
      bestShape = shape as FaceShape;
    }
  }

  return {
    faceShape: bestShape,
    confidence: Math.round(bestScore * 100) / 100,
    metrics,
  };
}
