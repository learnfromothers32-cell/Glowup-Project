export function generateHairMask(
  imageWidth: number,
  imageHeight: number,
  faceLandmarks?: { x: number; y: number }[] | null,
): string {
  const canvas = document.createElement("canvas");
  canvas.width = imageWidth;
  canvas.height = imageHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, imageWidth, imageHeight);

  ctx.fillStyle = "white";

  if (faceLandmarks && faceLandmarks.length >= 468) {
    const allX = faceLandmarks.map((l) => l.x);
    const allY = faceLandmarks.map((l) => l.y);
    const minX = Math.min(...allX);
    const maxX = Math.max(...allX);
    const minY = Math.min(...allY);
    const maxY = Math.max(...allY);

    const faceWidth = maxX - minX;
    const faceHeight = maxY - minY;
    const faceCenterX = (minX + maxX) / 2;
    const faceCenterY = (minY + maxY) / 2;

    const topY = Math.max(0, faceCenterY - faceHeight * 0.8);
    const bottomY = Math.min(1, faceCenterY - faceHeight * 0.05);
    const cx = faceCenterX * imageWidth;
    const cy = topY * imageHeight;
    const rx = faceWidth * 0.55 * imageWidth;
    const ry = ((bottomY - topY) * imageHeight) / 2;

    ctx.beginPath();
    ctx.ellipse(cx, cy + ry, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.ellipse(faceCenterX * imageWidth, faceCenterY * imageHeight, faceWidth * 0.48 * imageWidth, faceHeight * 0.5 * imageHeight, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  } else {
    ctx.beginPath();
    ctx.ellipse(imageWidth * 0.5, imageHeight * 0.12, imageWidth * 0.3, imageHeight * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(imageWidth * 0.2, imageHeight * 0.12, imageWidth * 0.6, imageHeight * 0.05);
  }

  return canvas.toDataURL("image/png");
}
