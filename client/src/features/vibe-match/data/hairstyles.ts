export type HairCategory = "short" | "medium" | "long" | "curly" | "protective";

export interface FaceBounds {
  cx: number;
  cy: number;
  w: number;
  h: number;
}

export interface Hairstyle {
  id: string;
  name: string;
  category: HairCategory;
  preview: string;
  render: (ctx: CanvasRenderingContext2D, b: FaceBounds) => void;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawHairShape(
  ctx: CanvasRenderingContext2D,
  points: [number, number][],
  color: string,
  shadowColor: string
) {
  if (points.length < 3) return;
  ctx.save();
  ctx.shadowColor = shadowColor;
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i][0], points[i][1]);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function gradientFill(
  ctx: CanvasRenderingContext2D,
  points: [number, number][],
  topColor: string,
  bottomColor: string
) {
  if (points.length < 3) return;
  const minY = Math.min(...points.map((p) => p[1]));
  const maxY = Math.max(...points.map((p) => p[1]));
  const grad = ctx.createLinearGradient(0, minY, 0, maxY);
  grad.addColorStop(0, topColor);
  grad.addColorStop(1, bottomColor);
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.3)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 3;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i][0], points[i][1]);
  }
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();
}

export const HAIRSTYLES: Hairstyle[] = [
  {
    id: "buzz-cut",
    name: "Buzz Cut",
    category: "short",
    preview: "#3a3a3a",
    render(ctx, b) {
      const top = b.cy - b.h * 0.55;
      const bottom = b.cy - b.h * 0.15;
      const left = b.cx - b.w * 0.45;
      const right = b.cx + b.w * 0.45;
      const mid = b.cy - b.h * 0.35;
      const pts: [number, number][] = [
        [left, mid],
        [left, bottom],
        [right, bottom],
        [right, mid],
        [b.cx + b.w * 0.3, top],
        [b.cx, top - b.h * 0.05],
        [b.cx - b.w * 0.3, top],
      ];
      drawHairShape(ctx, pts, "#2a2a2a", "rgba(0,0,0,0.3)");
    },
  },
  {
    id: "short-afro",
    name: "Short Afro",
    category: "short",
    preview: "#4a3728",
    render(ctx, b) {
      const top = b.cy - b.h * 0.7;
      const bottom = b.cy - b.h * 0.1;
      const left = b.cx - b.w * 0.55;
      const right = b.cx + b.w * 0.55;
      const pts: [number, number][] = [];
      for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        const angle = Math.PI * t + Math.PI * 0.5;
        const rx = b.w * 0.55 + Math.sin(angle * 3) * b.w * 0.04;
        const ry = b.h * 0.35 + Math.sin(angle * 4) * b.h * 0.03;
        const x = b.cx + Math.cos(angle) * rx;
        const y = (bottom + (top - bottom) * (1 - t)) + Math.sin(angle * 5) * b.h * 0.02;
        pts.push([x, y]);
      }
      if (pts.length >= 3) {
        gradientFill(ctx, pts, "#5c4231", "#3a2a1c");
      }
    },
  },
  {
    id: "bob",
    name: "Bob Cut",
    category: "medium",
    preview: "#8b7355",
    render(ctx, b) {
      const top = b.cy - b.h * 0.55;
      const chinY = b.cy + b.h * 0.15;
      const left = b.cx - b.w * 0.5;
      const right = b.cx + b.w * 0.5;
      const sideL = b.cx - b.w * 0.65;
      const sideR = b.cx + b.w * 0.65;
      const pts: [number, number][] = [
        [sideL, b.cy - b.h * 0.2],
        [sideL - b.w * 0.05, b.cy],
        [sideL - b.w * 0.02, chinY],
        [b.cx - b.w * 0.15, chinY + b.h * 0.1],
        [b.cx, chinY + b.h * 0.12],
        [b.cx + b.w * 0.15, chinY + b.h * 0.1],
        [sideR + b.w * 0.02, chinY],
        [sideR + b.w * 0.05, b.cy],
        [sideR, b.cy - b.h * 0.2],
        [right, top],
        [b.cx + b.w * 0.3, top - b.h * 0.08],
        [b.cx, top - b.h * 0.1],
        [b.cx - b.w * 0.3, top - b.h * 0.08],
        [left, top],
      ];
      gradientFill(ctx, pts, "#a08868", "#6b5a42");
    },
  },
  {
    id: "long-straight",
    name: "Long Straight",
    category: "long",
    preview: "#d4a574",
    render(ctx, b) {
      const top = b.cy - b.h * 0.55;
      const shoulderY = b.cy + b.h * 0.55;
      const topLeft = b.cx - b.w * 0.45;
      const topRight = b.cx + b.w * 0.45;
      const pts: [number, number][] = [
        [topLeft - b.w * 0.2, b.cy - b.h * 0.15],
        [topLeft - b.w * 0.25, b.cy + b.h * 0.1],
        [topLeft - b.w * 0.2, shoulderY + b.h * 0.1],
        [b.cx - b.w * 0.1, shoulderY + b.h * 0.2],
        [b.cx, shoulderY + b.h * 0.22],
        [b.cx + b.w * 0.1, shoulderY + b.h * 0.2],
        [topRight + b.w * 0.2, shoulderY + b.h * 0.1],
        [topRight + b.w * 0.25, b.cy + b.h * 0.1],
        [topRight + b.w * 0.2, b.cy - b.h * 0.15],
        [topRight, top],
        [b.cx + b.w * 0.25, top - b.h * 0.1],
        [b.cx, top - b.h * 0.12],
        [b.cx - b.w * 0.25, top - b.h * 0.1],
        [topLeft, top],
      ];
      gradientFill(ctx, pts, "#d4a574", "#8b6b4e");
    },
  },
  {
    id: "curly",
    name: "Curly",
    category: "curly",
    preview: "#6b4a32",
    render(ctx, b) {
      const top = b.cy - b.h * 0.65;
      const bottom = b.cy + b.h * 0.35;
      const left = b.cx - b.w * 0.6;
      const right = b.cx + b.w * 0.6;
      const pts: [number, number][] = [];
      for (let i = 0; i <= 30; i++) {
        const t = i / 30;
        const angle = Math.PI * t + Math.PI * 0.3;
        const wobble = Math.sin(angle * 6 + t * 3) * b.w * 0.06;
        const x = b.cx + Math.cos(angle) * (b.w * 0.55 + wobble);
        const y = top + (bottom - top) * t + Math.sin(angle * 5) * b.h * 0.03;
        pts.push([x, y]);
      }
      if (pts.length >= 3) {
        gradientFill(ctx, pts, "#7a5538", "#4a3020");
      }
    },
  },
  {
    id: "ponytail",
    name: "Ponytail",
    category: "long",
    preview: "#c49464",
    render(ctx, b) {
      const top = b.cy - b.h * 0.5;
      const shoulderY = b.cy + b.h * 0.5;
      const left = b.cx - b.w * 0.45;
      const right = b.cx + b.w * 0.45;

      const sides: [number, number][] = [
        [left - b.w * 0.15, b.cy - b.h * 0.1],
        [left - b.w * 0.2, b.cy + b.h * 0.1],
        [left - b.w * 0.15, shoulderY],
      ];
      gradientFill(ctx, sides, "#c49464", "#8b6b4e");

      const rightSides: [number, number][] = [
        [right + b.w * 0.15, b.cy - b.h * 0.1],
        [right + b.w * 0.2, b.cy + b.h * 0.1],
        [right + b.w * 0.15, shoulderY],
      ];
      gradientFill(ctx, rightSides, "#c49464", "#8b6b4e");

      const tailEndX = b.cx + b.w * 0.5;
      const tailEndY = b.cy - b.h * 0.45;
      const tail: [number, number][] = [
        [b.cx - b.w * 0.08, b.cy - b.h * 0.3],
        [b.cx + b.w * 0.08, b.cy - b.h * 0.3],
        [tailEndX + b.w * 0.15, tailEndY],
        [tailEndX + b.w * 0.05, tailEndY - b.h * 0.1],
        [tailEndX - b.w * 0.05, tailEndY - b.h * 0.1],
        [tailEndX - b.w * 0.15, tailEndY],
      ];
      gradientFill(ctx, tail, "#c49464", "#8b6b4e");
    },
  },
  {
    id: "braids",
    name: "Braids",
    category: "protective",
    preview: "#2a1a0a",
    render(ctx, b) {
      const top = b.cy - b.h * 0.55;
      const bottom = b.cy + b.h * 0.3;
      const patterns = 6;
      for (let p = 0; p < patterns; p++) {
        const xOff = (p - patterns / 2 + 0.5) * (b.w * 0.12);
        const pts: [number, number][] = [];
        for (let i = 0; i <= 12; i++) {
          const t = i / 12;
          const zigzag = Math.sin(t * Math.PI * 3) * b.w * 0.03;
          const x = b.cx + xOff + zigzag;
          const y = top + (bottom - top) * t;
          pts.push([x, y]);
        }
        if (pts.length >= 3) {
          const pts2: [number, number][] = pts.map(([x, y]) => [x + b.w * 0.02, y]);
          const combined = [...pts, ...pts2.reverse()];
          drawHairShape(ctx, combined, p % 2 === 0 ? "#2a1a0a" : "#3a2a1a", "rgba(0,0,0,0.2)");
        }
      }
    },
  },
  {
    id: "pixie",
    name: "Pixie Cut",
    category: "short",
    preview: "#b8946a",
    render(ctx, b) {
      const top = b.cy - b.h * 0.5;
      const mid = b.cy - b.h * 0.2;
      const left = b.cx - b.w * 0.45;
      const right = b.cx + b.w * 0.45;

      const pts: [number, number][] = [
        [left - b.w * 0.05, mid],
        [left - b.w * 0.1, mid + b.h * 0.05],
        [left - b.w * 0.05, mid + b.h * 0.15],
        [right + b.w * 0.05, mid + b.h * 0.15],
        [right + b.w * 0.1, mid + b.h * 0.05],
        [right + b.w * 0.05, mid],
        [right, top],
        [b.cx + b.w * 0.2, top - b.h * 0.1],
        [b.cx, top - b.h * 0.15],
        [b.cx - b.w * 0.2, top - b.h * 0.1],
        [left, top],
      ];
      gradientFill(ctx, pts, "#c8a078", "#8b7050");
    },
  },
  {
    id: "mohawk",
    name: "Mohawk",
    category: "short",
    preview: "#d94a4a",
    render(ctx, b) {
      const top = b.cy - b.h * 0.7;
      const bottom = b.cy - b.h * 0.2;
      const stripW = b.w * 0.15;

      const pts: [number, number][] = [
        [b.cx - stripW, bottom],
        [b.cx - stripW * 0.6, bottom - b.h * 0.05],
        [b.cx - stripW * 0.4, top + b.h * 0.1],
        [b.cx - stripW * 0.3, top],
        [b.cx, top - b.h * 0.05],
        [b.cx + stripW * 0.3, top],
        [b.cx + stripW * 0.4, top + b.h * 0.1],
        [b.cx + stripW * 0.6, bottom - b.h * 0.05],
        [b.cx + stripW, bottom],
      ];
      gradientFill(ctx, pts, "#e06060", "#a03030");
    },
  },
  {
    id: "man-bun",
    name: "Man Bun",
    category: "medium",
    preview: "#5a4a3a",
    render(ctx, b) {
      const bunY = b.cy - b.h * 0.55;
      const bunR = b.w * 0.12;
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.3)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 2;
      ctx.beginPath();
      ctx.arc(b.cx, bunY, bunR, 0, Math.PI * 2);
      ctx.fillStyle = "#5a4a3a";
      ctx.fill();
      ctx.restore();

      const pts: [number, number][] = [
        [b.cx - b.w * 0.45, b.cy - b.h * 0.2],
        [b.cx - b.w * 0.45, b.cy - b.h * 0.1],
        [b.cx - b.w * 0.35, b.cy],
        [b.cx - b.w * 0.2, b.cy + b.h * 0.05],
        [b.cx + b.w * 0.2, b.cy + b.h * 0.05],
        [b.cx + b.w * 0.35, b.cy],
        [b.cx + b.w * 0.45, b.cy - b.h * 0.1],
        [b.cx + b.w * 0.45, b.cy - b.h * 0.2],
      ];
      gradientFill(ctx, pts, "#6a5a4a", "#3a2a1a");
    },
  },
  {
    id: "box-braids",
    name: "Box Braids",
    category: "protective",
    preview: "#1a0a00",
    render(ctx, b) {
      const top = b.cy - b.h * 0.55;
      const bottom = b.cy + b.h * 0.4;
      const rows = 8;
      for (let r = 0; r < rows; r++) {
        const xOff = (r - rows / 2 + 0.5) * (b.w * 0.1);
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.15)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 1;
        ctx.beginPath();
        ctx.moveTo(b.cx + xOff, top);
        ctx.lineTo(b.cx + xOff + b.w * 0.02, bottom);
        ctx.lineTo(b.cx + xOff + b.w * 0.04, bottom);
        ctx.lineTo(b.cx + xOff + b.w * 0.02, top);
        ctx.closePath();
        ctx.fillStyle = r % 2 === 0 ? "#1a0a00" : "#2a1a0a";
        ctx.fill();
        ctx.restore();
      }
    },
  },
  {
    id: "side-part",
    name: "Side Part",
    category: "medium",
    preview: "#9a7a5a",
    render(ctx, b) {
      const top = b.cy - b.h * 0.5;
      const bottom = b.cy + b.h * 0.2;
      const partX = b.cx - b.w * 0.1;
      const left: [number, number][] = [
        [b.cx - b.w * 0.5, b.cy - b.h * 0.25],
        [b.cx - b.w * 0.55, bottom],
        [partX - b.w * 0.02, bottom + b.h * 0.05],
        [partX, top - b.h * 0.05],
        [b.cx - b.w * 0.35, top - b.h * 0.08],
        [b.cx - b.w * 0.5, top],
      ];
      gradientFill(ctx, left, "#b09070", "#7a6040");
      const right: [number, number][] = [
        [partX, top - b.h * 0.08],
        [b.cx + b.w * 0.55, b.cy - b.h * 0.25],
        [b.cx + b.w * 0.58, bottom],
        [partX + b.w * 0.02, bottom + b.h * 0.05],
      ];
      gradientFill(ctx, right, "#a08060", "#6a5030");
    },
  },
];

export const getHairstyleById = (id: string) => HAIRSTYLES.find((h) => h.id === id);
