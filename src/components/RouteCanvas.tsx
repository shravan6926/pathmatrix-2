import { useEffect, useRef } from "react";

export interface CanvasNode {
  id: string;
  name?: string;
  x: number;
  y: number;
  kind: "source" | "destination" | "stop" | "pickup" | "drop";
  label?: string;
}

interface Props {
  nodes: CanvasNode[];
  route: { x: number; y: number }[];
  height?: number;
}

export function RouteCanvas({ nodes, route, height = 420 }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cvs = ref.current;
    if (!cvs) return;
    const dpr = window.devicePixelRatio || 1;
    const parent = cvs.parentElement!;
    const w = parent.clientWidth;
    cvs.width = w * dpr;
    cvs.height = height * dpr;
    cvs.style.width = `${w}px`;
    cvs.style.height = `${height}px`;
    const ctx = cvs.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, height);

    // grid background
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let gx = 0; gx < w; gx += 40) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, height);
      ctx.stroke();
    }
    for (let gy = 0; gy < height; gy += 40) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(w, gy);
      ctx.stroke();
    }

    const all = [...nodes, ...route.map((p) => ({ x: p.x, y: p.y }))];
    if (all.length === 0) return;
    const minX = Math.min(...all.map((n) => n.x));
    const maxX = Math.max(...all.map((n) => n.x));
    const minY = Math.min(...all.map((n) => n.y));
    const maxY = Math.max(...all.map((n) => n.y));
    const pad = 50;
    const sx = (x: number) => pad + ((x - minX) / Math.max(maxX - minX, 1)) * (w - 2 * pad);
    const sy = (y: number) => height - pad - ((y - minY) / Math.max(maxY - minY, 1)) * (height - 2 * pad);

    // route line
    if (route.length > 1) {
      ctx.strokeStyle = "oklch(0.82 0.18 190)";
      ctx.lineWidth = 2.5;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(sx(route[0].x), sy(route[0].y));
      for (let i = 1; i < route.length; i++) ctx.lineTo(sx(route[i].x), sy(route[i].y));
      ctx.stroke();

      // arrows midpoints
      for (let i = 1; i < route.length; i++) {
        const x1 = sx(route[i - 1].x);
        const y1 = sy(route[i - 1].y);
        const x2 = sx(route[i].x);
        const y2 = sy(route[i].y);
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const ang = Math.atan2(y2 - y1, x2 - x1);
        ctx.fillStyle = "oklch(0.82 0.18 190)";
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(mx - 8 * Math.cos(ang - 0.4), my - 8 * Math.sin(ang - 0.4));
        ctx.lineTo(mx - 8 * Math.cos(ang + 0.4), my - 8 * Math.sin(ang + 0.4));
        ctx.closePath();
        ctx.fill();
      }
    }

    // nodes
    for (const n of nodes) {
      const x = sx(n.x);
      const y = sy(n.y);
      const color =
        n.kind === "source"
          ? "oklch(0.85 0.19 130)"
          : n.kind === "destination"
            ? "oklch(0.7 0.22 25)"
            : n.kind === "pickup"
              ? "oklch(0.82 0.18 190)"
              : n.kind === "drop"
                ? "oklch(0.75 0.2 60)"
                : "oklch(0.85 0.14 300)";
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = "oklch(0.97 0.01 200)";
      ctx.font = "12px ui-sans-serif, system-ui";
      ctx.fillText(n.label ?? n.name ?? n.id, x + 12, y + 4);
    }
  }, [nodes, route, height]);

  return <canvas ref={ref} className="w-full rounded-lg border border-border bg-card" />;
}