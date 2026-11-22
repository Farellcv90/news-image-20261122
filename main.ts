// The World in One Day - Sunday 22 November 2026
// A newspaper front page drawn entirely in code. Node 22 stdlib only.
// Writes entry.png (1024x1024) to MAKEFUN_OUTPUT_DIR or /output.

import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const W = 1024;
const H = 1024;
const px = new Uint8Array(W * H * 3);

type RGB = [number, number, number];
const CREAM: RGB = [244, 239, 228];
const NAVY: RGB = [31, 42, 68];
const INK: RGB = [20, 20, 20];
const RED: RGB = [179, 35, 42];
const WHITE: RGB = [255, 255, 255];
const TAN: RGB = [216, 196, 160];
const SEA: RGB = [196, 216, 232];
const SKY: RGB = [168, 200, 226];
const GREY: RGB = [120, 128, 140];
const DGREY: RGB = [70, 76, 90];
const LGREY: RGB = [200, 200, 200];
const BLUE: RGB = [52, 96, 160];
const GREEN: RGB = [70, 130, 80];
const ORANGE: RGB = [230, 120, 40];
const YELLOW: RGB = [240, 200, 60];
const BROWN: RGB = [120, 84, 50];

function setPx(x: number, y: number, c: RGB): void {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2];
}

function fillRect(x: number, y: number, w: number, h: number, c: RGB): void {
  const x0 = Math.max(0, Math.floor(x));
  const y0 = Math.max(0, Math.floor(y));
  const x1 = Math.min(W, Math.floor(x + w));
  const y1 = Math.min(H, Math.floor(y + h));
  for (let yy = y0; yy < y1; yy++) {
    for (let xx = x0; xx < x1; xx++) setPx(xx, yy, c);
  }
}

function frameRect(x: number, y: number, w: number, h: number, c: RGB, t: number): void {
  fillRect(x, y, w, t, c);
  fillRect(x, y + h - t, w, t, c);
  fillRect(x, y, t, h, c);
  fillRect(x + w - t, y, t, h, c);
}

function fillCircle(cx: number, cy: number, r: number, c: RGB): void {
  const r2 = r * r;
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy <= r2) setPx(x, y, c);
    }
  }
}

function ringCircle(cx: number, cy: number, r: number, c: RGB, t: number): void {
  const r2 = r * r;
  const ri = Math.max(0, r - t);
  const ri2 = ri * ri;
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const dx = x - cx, dy = y - cy;
      const d = dx * dx + dy * dy;
      if (d <= r2 && d >= ri2) setPx(x, y, c);
    }
  }
}

function drawLine(x0: number, y0: number, x1: number, y1: number, c: RGB, t: number): void {
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
  const steps = Math.max(dx, dy, 1);
  for (let i = 0; i <= steps; i++) {
    const x = x0 + ((x1 - x0) * i) / steps;
    const y = y0 + ((y1 - y0) * i) / steps;
    fillRect(Math.round(x - t / 2), Math.round(y - t / 2), t, t, c);
  }
}

function fillPoly(pts: [number, number][], c: RGB): void {
  let minY = Infinity, maxY = -Infinity;
  for (const p of pts) { if (p[1] < minY) minY = p[1]; if (p[1] > maxY) maxY = p[1]; }
  for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
    const xs: number[] = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      if (a[1] === b[1]) continue;
      if ((y >= a[1] && y < b[1]) || (y >= b[1] && y < a[1])) {
        xs.push(a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1]));
      }
    }
    xs.sort((p, q) => p - q);
    for (let i = 0; i + 1 < xs.length; i += 2) {
      fillRect(Math.round(xs[i]), y, Math.round(xs[i + 1] - xs[i]) + 1, 1, c);
    }
  }
}

function flame(x: number, y: number, s: number): void {
  fillPoly([[x, y], [x + s * 0.5, y - s], [x + s, y]], ORANGE);
  fillPoly([[x + s * 0.25, y], [x + s * 0.5, y - s * 0.55], [x + s * 0.75, y]], YELLOW);
}

// ---------- 5x7 bitmap font (uppercase) ----------
const FONT: Record<string, string[]> = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".####", "#....", "#....", "#....", "#....", "#....", ".####"],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  G: [".####", "#....", "#....", "#.###", "#...#", "#...#", ".###."],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: [".###.", "..#..", "..#..", "..#..", "..#..", "..#..", ".###."],
  J: ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  N: ["#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  Q: [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
  X: ["#...#", ".#.#.", "..#..", "..#..", "..#..", ".#.#.", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
  "0": [".###.", "#..##", "#.#.#", "##..#", "#...#", "#...#", ".###."],
  "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  "3": [".###.", "#...#", "....#", "..##.", "....#", "#...#", ".###."],
  "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  "5": ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  "6": [".###.", "#....", "#....", "####.", "#...#", "#...#", ".###."],
  "7": ["#####", "....#", "...#.", "..#..", "..#..", "..#..", "..#.."],
  "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  "9": [".###.", "#...#", "#...#", ".####", "....#", "....#", ".###."],
  ".": [".....", ".....", ".....", ".....", ".....", ".##..", ".##.."],
  ",": [".....", ".....", ".....", ".....", ".##..", ".##..", ".#..."],
  ":": [".....", ".##..", ".##..", ".....", ".##..", ".##..", "....."],
  "'": ["..#..", "..#..", ".#...", ".....", ".....", ".....", "....."],
  "-": [".....", ".....", ".....", "#####", ".....", ".....", "....."],
  "(": ["...#.", "..#..", ".#...", ".#...", ".#...", "..#..", "...#."],
  ")": [".#...", "..#..", "...#.", "...#.", "...#.", "..#..", ".#..."],
  "!": ["..#..", "..#..", "..#..", "..#..", "..#..", ".....", "..#.."],
  "?": [".###.", "#...#", "....#", "...#.", "..#..", ".....", "..#.."],
  "/": ["....#", "....#", "...#.", "..#..", ".#...", "#....", "#...."],
  "&": [".##..", "#..#.", "#.#..", ".#...", "#.#.#", "#..#.", ".##.#"],
  "%": ["##..#", "##.#.", "....#", "...#.", "..#..", ".#...", "#..##"],
  ";": [".....", ".##..", ".##..", ".....", ".##..", ".##..", ".#..."],
  " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
};

function charW(scale: number): number { return 6 * scale; }
function textW(s: string, scale: number): number { return s.length * charW(scale); }

function drawText(x: number, y: number, s: string, scale: number, c: RGB, bold: boolean): void {
  const up = s.toUpperCase();
  for (let i = 0; i < up.length; i++) {
    const g = FONT[up[i]] || FONT[" "];
    const gx = x + i * charW(scale);
    for (let r = 0; r < 7; r++) {
      for (let col = 0; col < 5; col++) {
        if (g[r][col] === "#") {
          fillRect(gx + col * scale, y + r * scale, scale, scale, c);
          if (bold) fillRect(gx + col * scale + 1, y + r * scale, scale, scale, c);
        }
      }
    }
  }
}

function wrap(s: string, maxChars: number): string[] {
  const words = s.toUpperCase().split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (cur === "") cur = w;
    else if (cur.length + 1 + w.length <= maxChars) cur += " " + w;
    else { lines.push(cur); cur = w; }
  }
  if (cur !== "") lines.push(cur);
  return lines;
}

function drawWrapped(x: number, y: number, s: string, scale: number, c: RGB, bold: boolean, maxChars: number, lineH: number, maxLines: number): number {
  const lines = wrap(s, maxChars).slice(0, maxLines);
  for (let i = 0; i < lines.length; i++) drawText(x, y + i * lineH, lines[i], scale, c, bold);
  return lines.length;
}

function numberBadge(x: number, y: number, n: number): void {
  fillCircle(x + 11, y + 11, 11, RED);
  const s = String(n);
  const w = textW(s, 1);
  drawText(Math.round(x + 11 - w / 2), y + 7, s, 1, WHITE, true);
}

// ---------- scenes ----------
function sceneRadar(x: number, y: number, w: number, h: number): void {
  fillRect(x, y, w, h, SKY);
  fillRect(x, y + h - 18, w, 18, TAN);
  // oil tanks
  fillRect(x + w - 95, y + h - 48, 38, 30, GREY);
  fillRect(x + w - 95, y + h - 54, 38, 7, DGREY);
  fillRect(x + w - 52, y + h - 44, 34, 26, GREY);
  fillRect(x + w - 52, y + h - 50, 34, 7, DGREY);
  flame(x + w - 88, y + h - 52, 22);
  flame(x + w - 44, y + h - 48, 18);
  // radar tower
  const tx = x + 52;
  drawLine(tx - 16, y + h - 18, tx, y + 22, DGREY, 4);
  drawLine(tx + 16, y + h - 18, tx, y + 22, DGREY, 4);
  drawLine(tx - 11, y + h - 38, tx + 11, y + h - 38, DGREY, 3);
  fillRect(tx - 24, y + 12, 48, 12, NAVY);
  fillRect(tx - 3, y + 24, 6, 8, NAVY);
  // drones
  for (const [dx, dy] of [[130, 20], [185, 34], [240, 16]] as [number, number][]) {
    drawLine(x + dx - 8, y + dy - 6, x + dx + 8, y + dy + 6, INK, 3);
    drawLine(x + dx - 8, y + dy + 6, x + dx + 8, y + dy - 6, INK, 3);
    fillCircle(x + dx, y + dy, 3, RED);
  }
}

function sceneClimate(x: number, y: number, w: number, h: number): void {
  fillRect(x, y, w, h, SKY);
  const cx = x + w / 2 - 30, cy = y + h / 2;
  fillCircle(cx, cy, 38, BLUE);
  fillCircle(cx - 12, cy - 8, 14, GREEN);
  fillCircle(cx + 14, cy + 10, 11, GREEN);
  fillCircle(cx + 6, cy - 18, 8, GREEN);
  ringCircle(cx, cy, 38, NAVY, 3);
  // clock
  const kx = x + w - 62, ky = y + 30;
  fillCircle(kx, ky, 20, WHITE);
  ringCircle(kx, ky, 20, NAVY, 3);
  drawLine(kx, ky, kx, ky - 13, INK, 3);
  drawLine(kx, ky, kx + 9, ky + 5, INK, 3);
  // gavel
  const gx = x + w - 70, gy = y + h - 34;
  fillRect(gx, gy, 44, 10, BROWN);
  fillRect(gx + 18, gy + 10, 8, 16, BROWN);
  fillRect(gx - 4, gy + 26, 52, 5, DGREY);
}

function scenePoland(x: number, y: number, w: number, h: number): void {
  fillRect(x, y, w, h, SKY);
  fillRect(x, y + h - 24, w, 24, GREEN);
  // missile streaks
  for (const [sx, sy] of [[40, 10], [120, 6], [200, 14]] as [number, number][]) {
    drawLine(x + sx, y + sy, x + sx + 60, y + sy + 42, WHITE, 4);
    drawLine(x + sx + 60, y + sy + 42, x + sx + 70, y + sy + 50, RED, 5);
  }
  // Polish flag
  const fx = x + 34, fy = y + h - 62;
  fillRect(fx, fy, 5, 40, DGREY);
  fillRect(fx + 5, fy, 46, 13, WHITE);
  fillRect(fx + 5, fy + 13, 46, 13, RED);
  frameRect(fx + 5, fy, 46, 26, INK, 1);
  // NATO star
  const nx = x + w - 58, ny = y + h - 48;
  fillCircle(nx, ny, 22, NAVY);
  fillPoly([[nx, ny - 17], [nx + 4, ny - 4], [nx + 17, ny], [nx + 4, ny + 4], [nx, ny + 17], [nx - 4, ny + 4], [nx - 17, ny], [nx - 4, ny - 4]], WHITE);
}

function sceneChart(x: number, y: number, w: number, h: number): void {
  fillRect(x, y, w, h, WHITE);
  frameRect(x, y, w, h, LGREY, 1);
  drawLine(x + 14, y + 8, x + 14, y + h - 10, INK, 3);
  drawLine(x + 14, y + h - 10, x + w - 10, y + h - 10, INK, 3);
  const pts: [number, number][] = [[x + 24, y + 12], [x + 66, y + 17], [x + 104, y + 13], [x + 142, y + 24], [x + 178, y + 33], [x + w - 30, y + h - 20]];
  for (let i = 0; i + 1 < pts.length; i++) drawLine(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], RED, 4);
  const ax = x + w - 30, ay = y + h - 20;
  fillPoly([[ax + 4, ay + 3], [ax - 14, ay], [ax - 3, ay - 12]], RED);
  fillRect(x + 30, y + h - 30, 16, 20, GREY);
  fillRect(x + 54, y + h - 24, 16, 14, GREY);
  fillRect(x + 78, y + h - 18, 16, 8, GREY);
}

function sceneKyiv(x: number, y: number, w: number, h: number): void {
  fillRect(x, y, w, h, DGREY);
  const base = y + h;
  const buildings: [number, number, number][] = [[6, 34, 34], [44, 44, 44], [92, 30, 30], [126, 48, 50], [178, 36, 38], [218, 30, 28]];
  for (const [bx, bw, bh] of buildings) {
    fillRect(x + bx, base - bh, bw, bh, INK);
    for (let wy = base - bh + 6; wy < base - 6; wy += 10) {
      for (let wx = x + bx + 5; wx < x + bx + bw - 6; wx += 10) fillRect(wx, wy, 5, 6, [60, 60, 60]);
    }
  }
  drawLine(x + 20, y + 6, x + 90, y + 34, ORANGE, 3);
  drawLine(x + 130, y + 4, x + 190, y + 28, ORANGE, 3);
  fillCircle(x + 92, y + 35, 5, YELLOW);
  fillCircle(x + 192, y + 29, 5, YELLOW);
}

function sceneSummit(x: number, y: number, w: number, h: number): void {
  fillRect(x, y, w, h, SKY);
  fillRect(x, y + h - 16, w, 16, TAN);
  const flags: RGB[][] = [[RED, WHITE, BLUE], [RED, YELLOW, RED], [WHITE, BLUE, RED]];
  for (let i = 0; i < 3; i++) {
    const fx = x + 24 + i * 74;
    fillRect(fx, y + 5, 4, 36, DGREY);
    for (let b = 0; b < 3; b++) fillRect(fx + 4, y + 5 + b * 8, 40, 8, flags[i][b]);
    frameRect(fx + 4, y + 5, 40, 24, INK, 1);
  }
  fillRect(x + 34, y + h - 30, w - 68, 9, BROWN);
  fillRect(x + 46, y + h - 21, 8, 8, BROWN);
  fillRect(x + w - 54, y + h - 21, 8, 8, BROWN);
}

function sceneCyclone(x: number, y: number, w: number, h: number): void {
  fillRect(x, y, w, h, SEA);
  fillRect(x + w - 70, y, 70, h, TAN);
  const cx = x + 80, cy = y + h / 2;
  for (let r = 8; r <= 30; r += 7) {
    for (let a = 0; a < 44; a++) {
      const t = (a / 44) * Math.PI * 1.6 + r * 0.12;
      const sxp = Math.round(cx + Math.cos(t) * r);
      const syp = Math.round(cy + Math.sin(t) * r * 0.7);
      fillRect(sxp - 1, syp - 1, 3, 3, NAVY);
    }
  }
  fillCircle(cx, cy, 5, NAVY);
  // rescue boats
  for (const bx of [x + 150, x + 190]) {
    fillPoly([[bx, y + h - 18], [bx + 32, y + h - 18], [bx + 25, y + h - 8], [bx + 7, y + h - 8]], RED);
    fillRect(bx + 12, y + h - 27, 8, 9, WHITE);
    frameRect(bx + 12, y + h - 27, 8, 9, INK, 1);
  }
}

function sceneMexico(x: number, y: number, w: number, h: number): void {
  fillRect(x, y, w, h, SKY);
  fillRect(x, y + h - 14, w, 14, TAN);
  // handcuffs
  ringCircle(x + 42, y + 28, 16, DGREY, 5);
  ringCircle(x + 80, y + 28, 16, DGREY, 5);
  drawLine(x + 56, y + 22, x + 66, y + 22, DGREY, 4);
  // burning truck
  const tx = x + 120, ty = y + h - 36;
  fillRect(tx, ty, 62, 24, GREY);
  fillRect(tx + 62, ty + 6, 22, 18, DGREY);
  fillCircle(tx + 16, ty + 26, 8, INK);
  fillCircle(tx + 68, ty + 26, 8, INK);
  flame(tx + 10, ty, 24);
  flame(tx + 34, ty, 20);
}

function sceneQuake(x: number, y: number, w: number, h: number): void {
  fillRect(x, y, w, h, SKY);
  fillPoly([[x + 30, y + h - 16], [x + 90, y + 10], [x + 150, y + h - 16]], GREY);
  fillPoly([[x + 74, y + 26], [x + 90, y + 10], [x + 106, y + 26]], WHITE);
  fillPoly([[x + 120, y + h - 16], [x + 165, y + 26], [x + 210, y + h - 16]], DGREY);
  fillRect(x, y + h - 16, w, 16, BROWN);
  drawLine(x + 20, y + h - 8, x + 60, y + h - 12, INK, 3);
  drawLine(x + 60, y + h - 12, x + 100, y + h - 6, INK, 3);
  drawLine(x + 100, y + h - 6, x + 150, y + h - 12, INK, 3);
  drawLine(x + 150, y + h - 12, x + 200, y + h - 7, INK, 3);
}

function sceneBrazil(x: number, y: number, w: number, h: number): void {
  fillRect(x, y, w, h, DGREY);
  fillCircle(x + 50, y + 16, 16, GREY);
  fillCircle(x + 80, y + 12, 19, GREY);
  fillCircle(x + 170, y + 15, 17, GREY);
  fillCircle(x + 200, y + 11, 15, GREY);
  fillRect(x, y + h - 14, w, 14, GREEN);
  for (const hx of [x + 24, x + 92, x + 160]) {
    fillRect(hx, y + h - 36, 44, 22, WHITE);
    fillRect(hx + 8, y + h - 28, 10, 14, BROWN);
    drawLine(hx + 44, y + h - 38, hx + 66, y + h - 48, RED, 4);
  }
}

function sceneCourt(x: number, y: number, w: number, h: number): void {
  fillRect(x, y, w, h, SKY);
  fillRect(x, y + h - 12, w, 12, TAN);
  fillPoly([[x + 40, y + 22], [x + 120, y + 6], [x + 200, y + 22]], NAVY);
  fillRect(x + 40, y + 22, 160, 6, NAVY);
  for (let i = 0; i < 5; i++) fillRect(x + 52 + i * 30, y + 28, 10, 26, WHITE);
  fillRect(x + 40, y + 54, 160, 6, NAVY);
  // scales
  const sx = x + 120, sy = y + h - 14;
  drawLine(sx, sy - 26, sx, sy, INK, 3);
  drawLine(sx - 18, sy - 24, sx + 18, sy - 24, INK, 3);
  fillPoly([[sx - 26, sy - 12], [sx - 10, sy - 12], [sx - 18, sy - 24]], YELLOW);
  fillPoly([[sx + 10, sy - 12], [sx + 26, sy - 12], [sx + 18, sy - 24]], YELLOW);
}

function sceneSaudi(x: number, y: number, w: number, h: number): void {
  fillRect(x, y, w, h, SKY);
  fillRect(x, y + h - 12, w, 12, TAN);
  fillRect(x + 30, y + h - 48, 26, 36, GREY);
  fillRect(x + 66, y + h - 60, 30, 48, DGREY);
  fillRect(x + 106, y + h - 42, 24, 30, GREY);
  fillRect(x + 140, y + h - 54, 28, 42, DGREY);
  // shield dome
  for (let a = 0; a <= 72; a++) {
    const t = Math.PI + (a / 72) * Math.PI;
    const pxp = x + 100 + Math.cos(t) * 92;
    const pyp = y + h - 12 + Math.sin(t) * 58;
    fillRect(Math.round(pxp) - 2, Math.round(pyp) - 2, 5, 5, NAVY);
  }
  drawLine(x + 210, y + 6, x + 178, y + 26, RED, 4);
  fillCircle(x + 176, y + 28, 5, ORANGE);
}

function sceneShip(x: number, y: number, w: number, h: number): void {
  fillRect(x, y, w, h, SEA);
  fillRect(x, y, 26, h, TAN);
  fillRect(x + w - 26, y, 26, h, TAN);
  const sx = x + 70, sy = y + h - 30;
  fillPoly([[sx, sy], [sx + 110, sy], [sx + 96, sy + 14], [sx + 14, sy + 14]], DGREY);
  fillRect(sx + 16, sy - 16, 20, 16, RED);
  fillRect(sx + 40, sy - 16, 20, 16, BLUE);
  fillRect(sx + 64, sy - 16, 20, 16, GREY);
  flame(sx + 44, sy - 16, 22);
  flame(sx + 68, sy - 16, 18);
  drawLine(x + 40, y + h - 8, x + 80, y + h - 8, WHITE, 2);
  drawLine(x + 160, y + h - 8, x + 200, y + h - 8, WHITE, 2);
}

function sceneBoat(x: number, y: number, w: number, h: number): void {
  fillRect(x, y, w, h, SEA);
  drawLine(x + 10, y + h - 12, x + 60, y + h - 12, WHITE, 2);
  drawLine(x + 90, y + h - 10, x + 140, y + h - 10, WHITE, 2);
  drawLine(x + 170, y + h - 12, x + 220, y + h - 12, WHITE, 2);
  // capsized hull (upturned, keel showing)
  fillPoly([[x + 66, y + 34], [x + 186, y + 26], [x + 172, y + 10], [x + 82, y + 16]], BROWN);
  fillPoly([[x + 66, y + 34], [x + 186, y + 26], [x + 182, y + 32], [x + 72, y + 40]], DGREY);
  drawLine(x + 82, y + 16, x + 172, y + 10, INK, 3);
  drawLine(x + 120, y + 14, x + 134, y + h - 14, BROWN, 4);
  fillCircle(x + 58, y + 46, 6, WHITE);
  fillCircle(x + 198, y + 42, 6, WHITE);
}

function sceneCricket(x: number, y: number, w: number, h: number): void {
  fillRect(x, y, w, h, GREEN);
  fillRect(x + w / 2 - 16, y, 32, h, TAN);
  // bat
  fillPoly([[x + 70, y + h - 8], [x + 86, y + h - 8], [x + 104, y + 16], [x + 92, y + 12]], BROWN);
  drawLine(x + 98, y + 14, x + 112, y + 2, DGREY, 5);
  // ball + stumps
  fillCircle(x + 150, y + 26, 9, RED);
  drawLine(x + 144, y + 22, x + 156, y + 30, WHITE, 2);
  for (let i = 0; i < 3; i++) fillRect(x + 168 + i * 9, y + h - 34, 5, 26, YELLOW);
}

// ---------- world map ----------
const MAP_LON: [number, number][] = [
  [-168, 66], [-140, 70], [-125, 71], [-110, 68], [-95, 69], [-85, 66], [-80, 62], [-78, 58], [-85, 55], [-90, 52], [-95, 49], [-97, 46], [-92, 46], [-89, 43], [-87, 42], [-84, 40], [-80, 38], [-76, 35], [-76, 31], [-81, 26], [-84, 30], [-89, 30], [-94, 29], [-97, 26], [-97, 22], [-95, 19], [-90, 21], [-87, 21], [-88, 16], [-83, 9], [-79, 9], [-82, 8], [-86, 12], [-90, 14], [-95, 16], [-100, 18], [-105, 20], [-108, 23], [-110, 24], [-112, 29], [-117, 33], [-122, 37], [-124, 43], [-124, 48], [-130, 54], [-135, 58], [-150, 60], [-158, 58], [-165, 60], [-168, 66],
];
const MAP_SAM: [number, number][] = [
  [-79, 9], [-75, 11], [-70, 12], [-62, 10], [-55, 6], [-50, 0], [-44, -3], [-35, -8], [-39, -13], [-40, -21], [-48, -26], [-52, -33], [-58, -35], [-62, -39], [-65, -41], [-67, -46], [-69, -50], [-71, -54], [-74, -52], [-74, -46], [-73, -40], [-71, -33], [-70, -25], [-70, -18], [-75, -15], [-77, -12], [-79, -8], [-80, -4], [-80, 1], [-77, 4], [-79, 9],
];
const MAP_EUR: [number, number][] = [
  [-10, 37], [-9, 43], [-2, 44], [-5, 48], [0, 49], [2, 51], [5, 53], [8, 54], [8, 57], [10, 59], [5, 60], [5, 62], [10, 64], [14, 67], [18, 69], [25, 71], [31, 70], [40, 68], [45, 68], [50, 69], [60, 69], [68, 69], [75, 72], [85, 73], [100, 77], [110, 74], [120, 73], [130, 72], [140, 72], [150, 70], [160, 70], [170, 67], [178, 65], [178, 62], [162, 60], [156, 52], [150, 59], [142, 54], [142, 50], [140, 46], [135, 45], [132, 43], [127, 40], [122, 38], [120, 34], [122, 31], [120, 27], [114, 23], [108, 19], [108, 15], [109, 12], [106, 9], [103, 5], [100, 6], [98, 10], [97, 16], [94, 17], [92, 21], [89, 22], [86, 20], [80, 15], [77, 8], [73, 16], [72, 20], [68, 23], [66, 25], [61, 25], [57, 27], [56, 26], [52, 26], [50, 29], [48, 30], [50, 24], [55, 24], [59, 22], [58, 20], [55, 17], [52, 15], [48, 14], [44, 12], [43, 12], [42, 15], [40, 20], [38, 24], [35, 28], [34, 31], [36, 36], [33, 36], [30, 36], [27, 37], [27, 40], [30, 41], [33, 42], [35, 42], [38, 41], [40, 41], [41, 43], [40, 46], [38, 47], [35, 46], [33, 45], [30, 46], [28, 45], [24, 45], [20, 44], [19, 42], [15, 40], [16, 38], [16, 40], [12, 44], [8, 44], [7, 44], [3, 43], [3, 42], [0, 40], [-2, 37], [-6, 36], [-10, 37],
];
const MAP_AFR: [number, number][] = [
  [-6, 35], [-10, 31], [-15, 27], [-17, 21], [-17, 15], [-12, 8], [-8, 5], [-4, 5], [2, 6], [6, 4], [9, 4], [13, -1], [12, -6], [13, -12], [12, -18], [14, -23], [16, -29], [18, -33], [20, -35], [26, -34], [31, -29], [32, -26], [35, -24], [36, -20], [36, -16], [39, -11], [40, -6], [41, -2], [42, 0], [48, 5], [51, 11], [48, 11], [44, 11], [43, 12], [40, 15], [38, 18], [37, 22], [35, 24], [33, 27], [32, 31], [30, 31], [25, 32], [20, 32], [15, 32], [11, 34], [10, 37], [5, 37], [0, 36], [-6, 35],
];
const MAP_OCE: [number, number][] = [
  [113, -22], [114, -28], [115, -34], [118, -35], [124, -33], [130, -32], [134, -33], [136, -35], [138, -35], [140, -38], [145, -38], [147, -38], [150, -37], [153, -30], [153, -27], [151, -24], [149, -20], [146, -19], [145, -15], [142, -11], [142, -14], [141, -17], [136, -15], [135, -12], [132, -11], [129, -14], [126, -14], [122, -17], [117, -20], [113, -22],
];
const MAP_NZ: [number, number][] = [
  [173, -35], [176, -38], [178, -38], [176, -40], [174, -41], [174, -42], [172, -44], [169, -46], [167, -46], [168, -44], [171, -42], [173, -40], [173, -35],
];

function proj(lon: number, lat: number, mx: number, my: number, mw: number, mh: number): [number, number] {
  const x = mx + ((lon + 180) / 360) * mw;
  const y = my + ((90 - lat) / 180) * mh;
  return [x, y];
}

function drawContinent(pts: [number, number][], mx: number, my: number, mw: number, mh: number): void {
  const proj2 = pts.map((p) => proj(p[0], p[1], mx, my, mw, mh)) as [number, number][];
  fillPoly(proj2, TAN);
}

function drawMap(mx: number, my: number, mw: number, mh: number): void {
  fillRect(mx, my, mw, mh, SEA);
  drawContinent(MAP_LON, mx, my, mw, mh);
  drawContinent(MAP_SAM, mx, my, mw, mh);
  drawContinent(MAP_EUR, mx, my, mw, mh);
  drawContinent(MAP_AFR, mx, my, mw, mh);
  drawContinent(MAP_OCE, mx, my, mw, mh);
  drawContinent(MAP_NZ, mx, my, mw, mh);
  frameRect(mx, my, mw, mh, NAVY, 2);
  // [story, lon, lat, dx px, dy px] - small nudges keep clustered dots readable
  const spots: [number, number, number, number, number][] = [
    [1, 50, 26, 4, -8], [2, 30.7, 36.9, -6, 7], [3, 19, 52, -7, -4], [4, -74, 40.7, 0, 0], [5, 30.5, 50.4, 7, -6],
    [6, 114, 22.5, 0, 0], [7, 85.8, 19.3, -6, 6], [8, -107.4, 25, 0, 0], [9, -75, -12, 0, 0], [10, -53, -30, 0, 0],
    [11, 96, 21, 7, -6], [12, 46.7, 24.6, -8, 7], [13, 56.5, 26.5, 9, 6], [14, 6, 4.7, 0, 0], [15, 174.8, -41.3, -9, 0],
  ];
  for (const [n, lon, lat, dx, dy] of spots) {
    const [px0, py0] = proj(lon, lat, mx, my, mw, mh);
    const x = px0 + dx, y = py0 + dy;
    fillCircle(x, y, 9, RED);
    ringCircle(x, y, 9, WHITE, 1);
    const s = String(n);
    const w = textW(s, 1);
    drawText(Math.round(x - w / 2), Math.round(y - 3), s, 1, WHITE, true);
  }
}

// ---------- layout ----------
function fillBg(): void {
  for (let i = 0; i < W * H; i++) {
    px[i * 3] = CREAM[0]; px[i * 3 + 1] = CREAM[1]; px[i * 3 + 2] = CREAM[2];
  }
}

interface Story { n: number; kicker: string; head: string; deck: string; scene: (x: number, y: number, w: number, h: number) => void }

const LEADS: Story[] = [
  { n: 1, kicker: "MIDDLE EAST - GULF", head: "Iran widens strikes on Bahrain and Kuwait", deck: "Bases and industrial site hit Sunday; US hits Hormuz launchers", scene: sceneRadar },
  { n: 2, kicker: "CLIMATE - COP31", head: "Climate talks deadlocked in overtime", deck: "Antalya deadline passes Sunday; fossil-fuel row blocks deal", scene: sceneClimate },
  { n: 3, kicker: "EUROPE - POLAND", head: "Russian missiles land in Poland", deck: "Two missiles and a drone fell Friday; NATO calls grave violation", scene: scenePoland },
];

const FEATURED: Story[] = [
  { n: 4, kicker: "MARKETS - WALL STREET", head: "Wall Street slides into correction", deck: "S and P falls 3.7 percent Friday; Nasdaq loses 5.28 percent", scene: sceneChart },
  { n: 5, kicker: "EUROPE - UKRAINE", head: "Russia pounds Kyiv bridges and grid", deck: "Over 110 missiles, 400 drones Friday; eight killed", scene: sceneKyiv },
  { n: 6, kicker: "ASIA - DIPLOMACY", head: "Shenzhen summit ends with little agreed", deck: "Trump, Xi and Putin pledge nuclear talks; few results", scene: sceneSummit },
  { n: 7, kicker: "ASIA - WEATHER", head: "Cyclone Akvan recovery under way", deck: "Landfall near Gopalpur Friday; 300000 evacuated", scene: sceneCyclone },
  { n: 8, kicker: "AMERICAS - MEXICO", head: "Mexico captures cartel boss Chapo Isidro", deck: "FBI top-10 fugitive taken Friday night; 11 killed", scene: sceneMexico },
  { n: 9, kicker: "AMERICAS - PERU", head: "Strong quake shakes Peru Andes", deck: "Magnitude 6.9 Friday night felt in Lima; no damage reported", scene: sceneQuake },
  { n: 10, kicker: "AMERICAS - BRAZIL", head: "Supercell flattens Brazil town", deck: "114 km/h winds rip 5000 roofs Friday; cleanup Sunday", scene: sceneBrazil },
  { n: 11, kicker: "LAW - JUSTICE", head: "Myanmar genocide ruling sparks calls", deck: "ICJ 9-6 verdict Thursday; France seeks UN action Sunday", scene: sceneCourt },
  { n: 12, kicker: "MIDDLE EAST - SAUDI", head: "Saudi intercepts Houthi missiles", deck: "Three destroyed over Riyadh; coalition strikes Hodeidah", scene: sceneSaudi },
  { n: 13, kicker: "MIDDLE EAST - HORMUZ", head: "Tankers hit in Strait of Hormuz", deck: "Mines and fires reported; Gulf flows at risk Sunday", scene: sceneShip },
  { n: 14, kicker: "AFRICA - NIGERIA", head: "Funeral boat capsizes in Nigeria", deck: "Bayelsa sinking Friday; search continues Sunday, AP reports", scene: sceneBoat },
  { n: 15, kicker: "SPORT - CRICKET", head: "India pile runs in Wellington Test", deck: "India 629 for 6 lead NZ 368 on day four Sunday", scene: sceneCricket },
];

const ALSO: string[] = [
  "16. Estonia to close border with Russia",
  "17. Drones hit Russian cargo ship in Baltic",
  "18. Bolsonaro taken to ICU in Brasilia",
  "19. France protesters rally sixth weekend",
  "20. Israel coalition talks open in Jerusalem",
  "21. West Bank man shot dead, officials say",
  "22. Congo Ebola fight hampered, groups say",
  "23. Modi opens Nitish Setu bridge in Bihar",
  "24. Japanese forces to train in India",
  "25. Crude oil futures fall over 3 percent",
  "26. Nvidia falls 14 percent on probe report",
  "27. Australia break England T20 streak",
  "28. Zelensky hometown missile kills two",
  "29. AI model claims Riemann proof; unchecked",
  "30. Pakistan forces kill 15 militants",
  "31. Prince William backs forest insurance",
  "32. Air India extends Jeddah flight halt",
  "33. Kyiv heat restored in districts",
  "34. G20 AI registry proposal debated",
  "35. Britain to send 1000 drones to Ukraine",
];

function drawLead(s: Story, x: number, y: number, w: number, h: number): void {
  fillRect(x, y, w, h, WHITE);
  frameRect(x, y, w, h, INK, 2);
  const sceneH = 92;
  s.scene(x + 3, y + 3, w - 6, sceneH);
  numberBadge(x + 5, y + 5, s.n);
  let cy = y + sceneH + 8;
  drawText(x + 8, cy, s.kicker, 1, RED, true);
  cy += 12;
  const headChars = Math.floor((w - 16) / charW(2));
  const used = drawWrapped(x + 8, cy, s.head, 2, INK, true, headChars, 17, 2);
  cy += used * 17 + 3;
  const deckChars = Math.floor((w - 16) / charW(1));
  drawWrapped(x + 8, cy, s.deck, 1, DGREY, false, deckChars, 10, 2);
}

function drawFeatured(s: Story, x: number, y: number, w: number, h: number): void {
  fillRect(x, y, w, h, WHITE);
  frameRect(x, y, w, h, INK, 1);
  const sceneH = 50;
  s.scene(x + 2, y + 2, w - 4, sceneH);
  numberBadge(x + 4, y + 4, s.n);
  let cy = y + sceneH + 6;
  drawText(x + 6, cy, s.kicker, 1, RED, true);
  cy += 11;
  const headChars = Math.floor((w - 12) / charW(2));
  const used = drawWrapped(x + 6, cy, s.head, 2, INK, true, headChars, 15, 3);
  cy += used * 15 + 2;
  const deckChars = Math.floor((w - 12) / charW(1));
  drawWrapped(x + 6, cy, s.deck, 1, DGREY, false, deckChars, 10, 3);
}

function render(): void {
  fillBg();
  const margin = 16;
  const usable = W - margin * 2;

  // Masthead
  fillRect(0, 0, W, 110, NAVY);
  drawText(margin, 10, "THE WORLD IN ONE DAY", 2, WHITE, true);
  const right = "35 STORIES - 6 CONTINENTS - ONE DAY";
  drawText(W - margin - textW(right, 2), 10, right, 2, WHITE, false);
  const date = "SUNDAY 22 NOVEMBER 2026";
  drawText(Math.round((W - textW(date, 5)) / 2), 34, date, 5, WHITE, true);
  fillRect(0, 110, W, 5, RED);

  // Leads
  const leadY = 123;
  const leadH = 196;
  const gap = 8;
  const leadW = Math.floor((usable - gap * 2) / 3);
  for (let i = 0; i < 3; i++) {
    drawLead(LEADS[i], margin + i * (leadW + gap), leadY, leadW, leadH);
  }

  // Featured grid 4x3
  const gridY = leadY + leadH + 8;
  const cellH = 138;
  const cellW = Math.floor((usable - gap * 3) / 4);
  for (let i = 0; i < 12; i++) {
    const col = i % 4;
    const row = Math.floor(i / 4);
    drawFeatured(FEATURED[i], margin + col * (cellW + gap), gridY + row * (cellH + gap), cellW, cellH);
  }

  // Bottom band
  const bandY = gridY + 3 * cellH + 2 * gap + 10;
  const bandH = 206;
  const mapW = 440;
  fillRect(margin, bandY, mapW, bandH, WHITE);
  frameRect(margin, bandY, mapW, bandH, INK, 2);
  drawText(margin + 8, bandY + 7, "WHERE IT HAPPENED", 2, NAVY, true);
  drawMap(margin + 6, bandY + 26, mapW - 12, bandH - 52);
  drawText(margin + 8, bandY + bandH - 18, "Numbered dots mark stories 1-15.", 1, DGREY, false);

  const alsoX = margin + mapW + 10;
  const alsoW = W - margin - alsoX;
  fillRect(alsoX, bandY, alsoW, bandH, WHITE);
  frameRect(alsoX, bandY, alsoW, bandH, INK, 2);
  drawText(alsoX + 8, bandY + 7, "ALSO ON SUNDAY 22 NOVEMBER", 2, NAVY, true);
  const colW = Math.floor((alsoW - 20) / 2);
  for (let i = 0; i < ALSO.length; i++) {
    const col = i < 10 ? 0 : 1;
    const row = i % 10;
    const ax = alsoX + 8 + col * (colW + 6);
    const ay = bandY + 30 + row * 18;
    const item = ALSO[i];
    const dot = item.indexOf(".");
    const num = item.slice(0, dot + 1);
    const rest = item.slice(dot + 2);
    drawText(ax, ay, num, 1, RED, true);
    const maxChars = Math.floor((colW - 24) / charW(1));
    drawWrapped(ax + 24, ay, rest, 1, INK, false, maxChars, 10, 2);
  }

  // Footer
  const foot = "Every story happened or was first reported on Sunday 22 November 2026. Disputed claims are attributed. Sources: AP, Reuters, AFP, BBC, Al Jazeera, UN News. Original drawings.";
  const footChars = Math.floor(usable / charW(1));
  const lines = wrap(foot, footChars);
  let fy = bandY + bandH + 8;
  for (const ln of lines) {
    drawText(Math.round((W - textW(ln, 1)) / 2), fy, ln, 1, DGREY, false);
    fy += 11;
  }
}

// ---------- PNG encoder ----------
const CRC_TABLE = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c;
}
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}

function encodePNG(): Buffer {
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    const rowStart = y * (1 + W * 3);
    raw[rowStart] = 0;
    raw.set(px.subarray(y * W * 3, (y + 1) * W * 3), rowStart + 1);
  }
  const idat = deflateSync(raw, { level: 9 });
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

render();
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "entry.png"), encodePNG());
