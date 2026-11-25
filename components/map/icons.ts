// Custom divIcon markers (avoids Leaflet's broken default icon images in bundlers).
import L from "leaflet";

const svg = (inner: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;

export const GLYPHS = {
  person: svg('<circle cx="12" cy="7" r="4"/><path d="M5.5 21a6.5 6.5 0 0 1 13 0"/>'),
  car: svg(
    '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-2.7-3.6A2 2 0 0 0 13.7 6H7.5a2 2 0 0 0-1.7 1L4 10l-1.6.5A2 2 0 0 0 1 12.4V16c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M9 17h6"/>'
  ),
  home: svg('<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>'),
  heart: svg('<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>'),
  train: svg('<rect x="4" y="3" width="16" height="15" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 18-2 3"/><path d="m16 18 2 3"/>'),
  plane: svg(
    '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>'
  ),
  pin: svg('<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>'),
  flag: svg('<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>'),
};

export type Glyph = keyof typeof GLYPHS;

const cache = new Map<string, L.DivIcon>();

export function makeIcon(opts: { glyph: Glyph; color: string; size?: number; square?: boolean; pulse?: boolean; offset?: [number, number]; label?: string }): L.DivIcon {
  const { glyph, color, size = 30, square = false, pulse = false, offset = [0, 0], label } = opts;
  const key = JSON.stringify(opts);
  const cached = cache.get(key);
  if (cached) return cached;
  const labelHtml = label
    ? `<span style="position:absolute;top:${size + 2}px;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:10px;font-weight:600;background:rgba(255,253,248,.92);color:#2b1416;padding:0 4px;border-radius:4px;box-shadow:0 1px 2px rgba(0,0,0,.2)">${label}</span>`
    : "";
  const icon = L.divIcon({
    className: "so-marker",
    html: `<div class="so-pin ${square ? "so-pin-square" : ""} ${pulse ? "so-pulse" : ""}" style="width:${size}px;height:${size}px;background:${color}">${GLYPHS[glyph]}${labelHtml}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2 - offset[0], size / 2 - offset[1]],
    popupAnchor: [0, -size / 2],
  });
  cache.set(key, icon);
  return icon;
}
