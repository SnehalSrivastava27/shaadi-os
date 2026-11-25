import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components / PPR is intentionally off: this is a client-heavy,
  // in-memory demo app (Leaflet maps + Zustand) and every page is dynamic.
  cacheComponents: false,
};

export default nextConfig;
