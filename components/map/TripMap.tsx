"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import type { Position, Waypoint } from "@/types";
import { makeIcon } from "./icons";
import { useRoadRoute } from "./useRoadRoute";

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  const key = points.length ? `${points[0]}-${points.length > 1 ? points[points.length - 1] : ""}` : "";
  useEffect(() => {
    if (points.length > 1) map.fitBounds(points, { padding: [30, 30] });
    else if (points.length === 1) map.setView(points[0], 13);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map]);
  return null;
}

/** Task detail map: waypoints, full trail, and a moving marker for replay. */
export default function TripMap({
  waypoints,
  trail,
  cursor,
  color = "#16a34a",
}: {
  waypoints: Waypoint[];
  trail: Position[];
  cursor?: number; // index into trail during replay
  color?: string;
}) {
  const all = trail.map((p) => [p.lat, p.lng] as [number, number]);
  const shown = cursor !== undefined ? all.slice(0, cursor + 1) : all;
  const head = shown[shown.length - 1];
  const planned = useRoadRoute(waypoints);
  const fitPoints = [...waypoints.map((w) => [w.lat, w.lng] as [number, number]), ...all];
  return (
    <MapContainer center={[26.8467, 80.9462]} zoom={12} style={{ height: "100%", width: "100%" }}>
      <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <FitBounds points={fitPoints} />
      {waypoints.length > 1 && <Polyline positions={planned} pathOptions={{ color: "#F4A300", weight: 3, dashArray: "6 8", opacity: 0.9 }} />}
      {cursor !== undefined && all.length > 1 && <Polyline positions={all} pathOptions={{ color: "#9ca3af", weight: 3, dashArray: "4 6" }} />}
      {shown.length > 1 && <Polyline positions={shown} pathOptions={{ color: "#7A1F2B", weight: 5 }} />}
      {waypoints.map((w, i) => (
        <Marker key={i} position={[w.lat, w.lng]} icon={makeIcon({ glyph: i === 0 ? "pin" : "flag", color: "#F4A300", size: 28 })}>
          <Tooltip permanent direction="top" offset={[0, -14]}>
            {i === 0 ? "Pickup" : i === waypoints.length - 1 ? "Drop" : `Stop ${i}`}: {w.label}
          </Tooltip>
        </Marker>
      ))}
      {head && <Marker position={head} icon={makeIcon({ glyph: "car", color, size: 30, square: true })} zIndexOffset={1000} />}
    </MapContainer>
  );
}
