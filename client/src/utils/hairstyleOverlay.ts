import type { FaceGeometry } from "./hairstyleMediaPipe";
import { detectFaceOnImage, getDefaultGeometry } from "./hairstyleMediaPipe";
import { getRealHairstyleImage } from "../data/realHairstyleImages";

function getHairColor(): string {
  const colors = ["#1a1a1a", "#2d1f14", "#3d2b1f", "#1c1c1c", "#0d0d0d"];
  return colors[Math.floor(Math.random() * colors.length)];
}

function drawBuzzCut(ctx: CanvasRenderingContext2D, headTop: number, headCenter: number, headWidth: number) {
  ctx.beginPath();
  ctx.ellipse(headCenter, headTop + headWidth * 0.15, headWidth * 0.4, headWidth * 0.08, 0, Math.PI, 0);
  ctx.fill();
}

function drawLowFade(ctx: CanvasRenderingContext2D, headTop: number, headCenter: number, headWidth: number) {
  ctx.beginPath();
  ctx.ellipse(headCenter, headTop + headWidth * 0.1, headWidth * 0.42, headWidth * 0.12, 0, Math.PI * 0.9, Math.PI * 0.1);
  ctx.fill();
  const grad = ctx.createLinearGradient(headCenter - headWidth * 0.4, headTop, headCenter - headWidth * 0.4, headTop + headWidth * 0.3);
  grad.addColorStop(0, getHairColor());
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(headCenter - headWidth * 0.42, headTop + headWidth * 0.12, headWidth * 0.06, headWidth * 0.15, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(headCenter + headWidth * 0.42, headTop + headWidth * 0.12, headWidth * 0.06, headWidth * 0.15, 0.3, 0, Math.PI * 2);
  ctx.fill();
}

function drawAfro(ctx: CanvasRenderingContext2D, headTop: number, headCenter: number, headWidth: number) {
  ctx.beginPath();
  ctx.ellipse(headCenter, headTop - headWidth * 0.05, headWidth * 0.48, headWidth * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawDreadlocks(ctx: CanvasRenderingContext2D, headTop: number, headCenter: number, headWidth: number) {
  ctx.beginPath();
  ctx.ellipse(headCenter, headTop + headWidth * 0.02, headWidth * 0.35, headWidth * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    const x = headCenter + i * headWidth * 0.08;
    ctx.ellipse(x, headTop + headWidth * 0.6, headWidth * 0.03, headWidth * 0.5, i * 0.05, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTwists(ctx: CanvasRenderingContext2D, headTop: number, headCenter: number, headWidth: number) {
  ctx.beginPath();
  ctx.ellipse(headCenter, headTop, headWidth * 0.38, headWidth * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    const x = headCenter + i * headWidth * 0.09;
    ctx.ellipse(x, headTop + headWidth * 0.35, headWidth * 0.025, headWidth * 0.3, i * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBobCut(ctx: CanvasRenderingContext2D, headTop: number, headCenter: number, headWidth: number) {
  const bottomY = headTop + headWidth * 0.65;
  ctx.beginPath();
  ctx.moveTo(headCenter - headWidth * 0.45, headTop + headWidth * 0.1);
  ctx.quadraticCurveTo(headCenter - headWidth * 0.5, bottomY, headCenter - headWidth * 0.38, bottomY);
  ctx.lineTo(headCenter + headWidth * 0.38, bottomY);
  ctx.quadraticCurveTo(headCenter + headWidth * 0.5, bottomY, headCenter + headWidth * 0.45, headTop + headWidth * 0.1);
  ctx.closePath();
  ctx.fill();
}

function drawPixieCut(ctx: CanvasRenderingContext2D, headTop: number, headCenter: number, headWidth: number) {
  ctx.beginPath();
  ctx.ellipse(headCenter, headTop + headWidth * 0.05, headWidth * 0.25, headWidth * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(headCenter + headWidth * 0.2, headTop + headWidth * 0.05);
  ctx.lineTo(headCenter + headWidth * 0.35, headTop + headWidth * 0.25);
  ctx.lineTo(headCenter + headWidth * 0.25, headTop + headWidth * 0.08);
  ctx.closePath();
  ctx.fill();
}

function drawCurlyBob(ctx: CanvasRenderingContext2D, headTop: number, headCenter: number, headWidth: number) {
  for (let row = 0; row < 4; row++) {
    for (let col = -4; col <= 4; col++) {
      ctx.beginPath();
      const x = headCenter + col * headWidth * 0.08 + (row % 2) * headWidth * 0.04;
      const y = headTop + row * headWidth * 0.13;
      const r = headWidth * 0.04 + Math.random() * headWidth * 0.02;
      ctx.ellipse(x, y, r, r * 1.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawWolfCut(ctx: CanvasRenderingContext2D, headTop: number, headCenter: number, headWidth: number) {
  ctx.beginPath();
  ctx.ellipse(headCenter, headTop, headWidth * 0.4, headWidth * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  const grad = ctx.createLinearGradient(headCenter, headTop, headCenter, headTop + headWidth);
  grad.addColorStop(0, getHairColor());
  grad.addColorStop(0.4, getHairColor());
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  for (let i = -4; i <= 4; i++) {
    ctx.beginPath();
    const x = headCenter + i * headWidth * 0.07;
    const w = headWidth * 0.035 + Math.abs(i) * headWidth * 0.008;
    ctx.ellipse(x, headTop + headWidth * (0.2 + Math.abs(i) * 0.08), w, headWidth * (0.15 + Math.abs(i) * 0.04), i * 0.06, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawLongWaves(ctx: CanvasRenderingContext2D, headTop: number, headCenter: number, headWidth: number) {
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    const x = headCenter + i * headWidth * 0.1;
    const waveWidth = headWidth * 0.04 + Math.abs(i) * headWidth * 0.005;
    ctx.moveTo(x - waveWidth, headTop + headWidth * 0.08);
    for (let y = 0; y < 12; y++) {
      const wy = headTop + headWidth * 0.08 + y * headWidth * 0.05;
      const wx = x + Math.sin(y * 0.8 + i * 0.5) * headWidth * 0.03;
      ctx.lineTo(wx, wy);
    }
    ctx.lineWidth = waveWidth * 1.5;
    ctx.stroke();
  }
}

function drawBangs(ctx: CanvasRenderingContext2D, headTop: number, headCenter: number, headWidth: number) {
  ctx.beginPath();
  ctx.ellipse(headCenter, headTop + headWidth * 0.02, headWidth * 0.35, headWidth * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    const x = headCenter + i * headWidth * 0.08;
    ctx.moveTo(x - headWidth * 0.02, headTop + headWidth * 0.05);
    ctx.lineTo(x + headWidth * 0.01, headTop + headWidth * 0.35);
    ctx.lineWidth = headWidth * 0.02;
    ctx.stroke();
  }
}

function drawCurly(ctx: CanvasRenderingContext2D, headTop: number, headCenter: number, headWidth: number) {
  for (let row = 0; row < 5; row++) {
    for (let col = -4; col <= 4; col++) {
      ctx.beginPath();
      const x = headCenter + col * headWidth * 0.07 + (row % 2) * headWidth * 0.035;
      const y = headTop + row * headWidth * 0.1;
      ctx.arc(x, y, headWidth * 0.035, 0, Math.PI * 1.8);
      ctx.lineWidth = headWidth * 0.015;
      ctx.stroke();
    }
  }
}

function drawShortNatural(ctx: CanvasRenderingContext2D, headTop: number, headCenter: number, headWidth: number) {
  ctx.beginPath();
  ctx.ellipse(headCenter, headTop + headWidth * 0.02, headWidth * 0.35, headWidth * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 12; i++) {
    ctx.beginPath();
    const angle = (i / 12) * Math.PI;
    const x = headCenter + Math.cos(angle) * headWidth * 0.3;
    const y = headTop + Math.sin(angle) * headWidth * 0.1;
    ctx.ellipse(x, y, headWidth * 0.03, headWidth * 0.01, angle, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBraids(ctx: CanvasRenderingContext2D, headTop: number, headCenter: number, headWidth: number) {
  ctx.beginPath();
  ctx.ellipse(headCenter, headTop + headWidth * 0.05, headWidth * 0.35, headWidth * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    const x = headCenter + i * headWidth * 0.08;
    ctx.moveTo(x, headTop + headWidth * 0.05);
    ctx.lineTo(x - headWidth * 0.01, headTop + headWidth * 0.6);
    ctx.lineWidth = headWidth * 0.018;
    ctx.stroke();
    ctx.beginPath();
    const x2 = headCenter + i * headWidth * 0.08 + headWidth * 0.025;
    ctx.moveTo(x2, headTop + headWidth * 0.05);
    ctx.lineTo(x2 + headWidth * 0.01, headTop + headWidth * 0.6);
    ctx.lineWidth = headWidth * 0.012;
    ctx.stroke();
  }
}

function drawLocs(ctx: CanvasRenderingContext2D, headTop: number, headCenter: number, headWidth: number) {
  ctx.beginPath();
  ctx.ellipse(headCenter, headTop, headWidth * 0.35, headWidth * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    const x = headCenter + i * headWidth * 0.09;
    ctx.moveTo(x - headWidth * 0.01, headTop + headWidth * 0.05);
    const endY = headTop + headWidth * (0.3 + Math.abs(i) * 0.07);
    ctx.lineTo(x + headWidth * 0.005, endY);
    ctx.lineWidth = headWidth * 0.022;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.lineCap = "butt";
  }
}

const drawFunctions: Record<string, (ctx: CanvasRenderingContext2D, headTop: number, headCenter: number, headWidth: number) => void> = {
  "buzz-cut": drawBuzzCut,
  "low-fade": drawLowFade,
  "mid-fade": drawLowFade,
  "high-fade": drawLowFade,
  "taper-fade": drawLowFade,
  afro: drawAfro,
  dreadlocks: drawDreadlocks,
  twists: drawTwists,
  "bob-cut": drawBobCut,
  "pixie-cut": drawPixieCut,
  "curly-bob": drawCurlyBob,
  "wolf-cut": drawWolfCut,
  "long-waves": drawLongWaves,
  bangs: drawBangs,
  curly: drawCurly,
  "short-natural": drawShortNatural,
  braids: drawBraids,
  locs: drawLocs,
};

function getHairColorHex(slug: string): string {
  const colors: Record<string, string> = {
    "buzz-cut": "#1a1a1a",
    "low-fade": "#2d1f14",
    "mid-fade": "#1c1c1c",
    "high-fade": "#2a2a2a",
    "taper-fade": "#3d2b1f",
    afro: "#1a1a1a",
    dreadlocks: "#2d1f14",
    twists: "#1a1a1a",
    "bob-cut": "#1a1a1a",
    "pixie-cut": "#b8860b",
    "curly-bob": "#2d1f14",
    "wolf-cut": "#1c1c1c",
    "long-waves": "#1a1a1a",
    bangs: "#2d1f14",
    curly: "#1a1a1a",
    "short-natural": "#1c1c1c",
    braids: "#1a1a1a",
    locs: "#2d1f14",
  };
  return colors[slug] || "#1a1a1a";
}

function isValidImageUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:");
}

export function generateHairstylePreview(slug: string, size: number = 200, previewImage?: string): string {
  if (previewImage && isValidImageUrl(previewImage)) {
    return previewImage;
  }
  const mappedImage = getRealHairstyleImage(slug);
  if (mappedImage) {
    return mappedImage;
  }

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const cx = size / 2;
  const cy = size * 0.45;
  const r = size * 0.35;

  ctx.save();

  ctx.fillStyle = "#f5f5f5";
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = "#e8e4e0";
  ctx.beginPath();
  ctx.ellipse(cx, cy, r, r * 1.25, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ddd8d0";
  ctx.beginPath();
  ctx.ellipse(cx, cy - r * 0.1, r * 0.5, r * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();

  const headTop = size * 0.12;
  const headCenter = cx;
  const headWidth = size * 0.45;

  const baseColor = getHairColorHex(slug);
  ctx.fillStyle = baseColor;
  ctx.strokeStyle = baseColor;

  const drawFn = drawFunctions[slug];
  if (drawFn) {
    ctx.globalAlpha = 0.9;
    drawFn(ctx, headTop, headCenter, headWidth);
  }

  ctx.restore();

  return canvas.toDataURL("image/png");
}

async function compositeWithRealImage(
  ctx: CanvasRenderingContext2D,
  hairstyleSlug: string,
  headCenter: number,
  headTop: number,
  headWidth: number,
): Promise<void> {
  const realImageUrl = getRealHairstyleImage(hairstyleSlug);
  if (!realImageUrl) return;

  return new Promise((resolve) => {
    const hairImg = new Image();
    hairImg.crossOrigin = "anonymous";
    hairImg.onload = () => {
      ctx.save();
      ctx.globalAlpha = 0.85;

      const scale = headWidth / Math.max(hairImg.width, hairImg.height) * 1.5;
      const w = hairImg.width * scale;
      const h = hairImg.height * scale;

      const x = headCenter - w / 2;
      const y = headTop - h * 0.3;

      ctx.drawImage(hairImg, x, y, w, h);
      ctx.restore();
      resolve();
    };
    hairImg.onerror = () => resolve();
    hairImg.src = realImageUrl;
  });
}

function compositeWithShapes(
  ctx: CanvasRenderingContext2D,
  hairstyleSlug: string,
  headTop: number,
  headCenter: number,
  headWidth: number,
) {
  const baseColor = getHairColorHex(hairstyleSlug);
  ctx.fillStyle = baseColor;
  ctx.strokeStyle = baseColor;

  const drawFn = drawFunctions[hairstyleSlug];
  if (drawFn) {
    ctx.globalAlpha = 0.6;
    drawFn(ctx, headTop, headCenter, headWidth);
  } else {
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.ellipse(headCenter, headTop + headWidth * 0.05, headWidth * 0.38, headWidth * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

export async function compositeHairstyle(
  imageUrl: string,
  hairstyleSlug: string,
  faceGeometry?: FaceGeometry | null,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = async () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not supported")); return; }

      ctx.drawImage(img, 0, 0);

      let geo = faceGeometry ?? null;
      if (!geo) {
        try { geo = await detectFaceOnImage(img); } catch { }
      }
      if (!geo) {
        geo = getDefaultGeometry(img.width, img.height);
      }

      const headCenter = geo.headCenter.x * img.width;
      const headTop = geo.headTop * img.height;
      const headWidth = geo.headWidth * img.width;

      ctx.save();

      const realImageUrl = getRealHairstyleImage(hairstyleSlug);
      if (realImageUrl) {
        await compositeWithRealImage(ctx, hairstyleSlug, headCenter, headTop, headWidth);
        compositeWithShapes(ctx, hairstyleSlug, headTop, headCenter, headWidth);
      } else {
        compositeWithShapes(ctx, hairstyleSlug, headTop, headCenter, headWidth);
      }

      ctx.restore();

      const dataUrl = canvas.toDataURL("image/png");
      resolve(dataUrl);
    };
    img.onerror = () => reject(new Error("Failed to load image for compositing"));
    img.src = imageUrl;
  });
}
