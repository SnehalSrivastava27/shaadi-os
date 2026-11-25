"use client";

import "leaflet/dist/leaflet.css";
import { Fragment, useEffect, useMemo } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import { useShaadiStore } from "@/stores/useShaadiStore";
import { DISPLAY_COLORS, helperDisplayStatus, latestPositionsByDevice, vehicleDisplayStatus, formatDate, formatTime } from "@/lib/data";
import { HOME, PLACES } from "@/lib/seed";
import { googleMapsLink } from "@/lib/geo";
import { useNow } from "@/hooks/useNow";
import { makeIcon } from "./icons";
import { useRoadRoute } from "./useRoadRoute";
import type { Waypoint } from "@/types";

export type MapSelection = { type: "helper" | "vehicle"; id: string };

const LUCKNOW: [number, number] = [26.8467, 80.9462];

function FlyToFocus() {
  const map = useMap();
  const focus = useShaadiStore((s) => s.focus);
  useEffect(() => {
    if (focus) map.flyTo([focus.lat, focus.lng], focus.zoom ?? map.getZoom(), { duration: 0.8 });
  }, [focus, map]);
  return null;
}

/** Rest of the trip along real roads, from the waypoint just passed (one OSRM call per leg). */
function RemainingRoute({ points }: { points: Waypoint[] }) {
  const path = useRoadRoute(points);
  return <Polyline positions={path} pathOptions={{ color: "#F4A300", weight: 3, dashArray: "6 8", opacity: 0.9 }} />;
}

export default function LiveMap({ onSelect, className }: { onSelect?: (s: MapSelection) => void; className?: string }) {
  const helpers = useShaadiStore((s) => s.helpers);
  const vehicles = useShaadiStore((s) => s.vehicles);
  const positions = useShaadiStore((s) => s.positions);
  const tasks = useShaadiStore((s) => s.tasks);
  const config = useShaadiStore((s) => s.publishedConfig);
  const guests = useShaadiStore((s) => s.guests);
  const highlight = useShaadiStore((s) => s.highlightHelperId);
  const now = useNow(3000);

  const latest = useMemo(() => latestPositionsByDevice(positions), [positions]);
  const activeTrips = tasks.filter((t) => t.status === "in_progress");
  const offeredHelperIds = new Set(tasks.filter((t) => t.status === "offered").map((t) => t.assignedHelperId));
  const arrivalPoints = useMemo(() => {
    const map = new Map<string, { lat: number; lng: number; place: string; names: string[]; mode: string }>();
    for (const g of guests) {
      if (!g.arrival) continue;
      const key = `${g.arrival.lat.toFixed(4)},${g.arrival.lng.toFixed(4)}`;
      const cur = map.get(key) ?? { lat: g.arrival.lat, lng: g.arrival.lng, place: g.arrival.place, names: [], mode: g.arrival.mode };
      cur.names.push(g.name);
      map.set(key, cur);
    }
    return [...map.values()];
  }, [guests]);

  return (
    <MapContainer center={LUCKNOW} zoom={12} scrollWheelZoom className={className} style={{ height: "100%", width: "100%" }}>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <FlyToFocus />

      {/* Home */}
      <Marker position={[HOME.lat, HOME.lng]} icon={makeIcon({ glyph: "home", color: "#7A1F2B", size: 34, square: true, label: "Home" })}>
        <Popup>
          <strong>{HOME.label}</strong>
          <br />
          Default drop point
        </Popup>
      </Marker>

      {/* Venues */}
      {config.functions.map((f) => (
        <Marker key={f.id} position={[f.lat, f.lng]} icon={makeIcon({ glyph: "heart", color: "#C9A227", size: 28, square: true })}>
          <Tooltip direction="top" offset={[0, -14]}>{f.name}</Tooltip>
          <Popup>
            <strong>{f.name}</strong>
            <br />
            {f.venueName}
            <br />
            {formatDate(f.date)}, {formatTime(f.time)}
            <br />
            <a href={googleMapsLink(f)} target="_blank" rel="noreferrer">
              Open in Maps
            </a>
          </Popup>
        </Marker>
      ))}

      {/* Arrival points (stations, airport) */}
      {arrivalPoints.map((a) => (
        <Marker
          key={`${a.lat},${a.lng}`}
          position={[a.lat, a.lng]}
          icon={makeIcon({ glyph: a.mode === "flight" ? "plane" : "train", color: "#1D4E89", size: 30, square: true })}
        >
          <Tooltip direction="top" offset={[0, -14]}>{a.place}</Tooltip>
          <Popup>
            <strong>{a.place}</strong>
            <br />
            Arriving: {a.names.join(", ")}
          </Popup>
        </Marker>
      ))}
      {!arrivalPoints.some((a) => Math.abs(a.lat - PLACES.charbagh.lat) < 1e-3) && (
        <Marker position={[PLACES.charbagh.lat, PLACES.charbagh.lng]} icon={makeIcon({ glyph: "train", color: "#1D4E89", size: 30, square: true })} />
      )}

      {/* Trails + remaining route for live trips */}
      {activeTrips.map((t) => {
        const trail = positions
          .filter((p) => p.taskId === t.id && p.deviceType === "helper")
          .sort((a, b) => a.timestamp - b.timestamp)
          .map((p) => [p.lat, p.lng] as [number, number]);
        const remaining = t.sim ? t.sim.route.slice(t.sim.leg) : [];
        return (
          <Fragment key={t.id}>
            {trail.length > 1 && <Polyline positions={trail} pathOptions={{ color: "#7A1F2B", weight: 5, opacity: 0.85 }} />}
            {remaining.length > 1 && <RemainingRoute points={remaining} />}
            {t.waypoints.map((w, i) => (
              <Marker key={i} position={[w.lat, w.lng]} icon={makeIcon({ glyph: i === 0 ? "pin" : "flag", color: "#F4A300", size: 24 })}>
                <Tooltip>{`${i === 0 ? "Pickup" : "Drop"}: ${w.label}`}</Tooltip>
              </Marker>
            ))}
          </Fragment>
        );
      })}

      {/* Vehicles */}
      {vehicles.map((v) => {
        const p = latest.get(v.id);
        if (!p) return null;
        const driver = helpers.find((h) => h.id === v.driverHelperId);
        if (v.status === "in_use" && driver && !driver.locationSharing) return null;
        const status = vehicleDisplayStatus(v, p, now);
        return (
          <Marker
            key={v.id}
            position={[p.lat, p.lng]}
            icon={makeIcon({ glyph: "car", color: DISPLAY_COLORS[status], size: 26, square: true, offset: [14, -10] })}
            eventHandlers={{ click: () => onSelect?.({ type: "vehicle", id: v.id }) }}
            zIndexOffset={400}
          >
            <Tooltip direction="right" offset={[14, -10]}>{`${v.name} · ${v.plateNumber}`}</Tooltip>
          </Marker>
        );
      })}

      {/* Helpers (hidden when location sharing is off) */}
      {helpers
        .filter((h) => h.locationSharing)
        .map((h) => {
          const p = latest.get(h.id);
          if (!p) return null;
          const status = helperDisplayStatus(h, p, now);
          const pulse = highlight === h.id || offeredHelperIds.has(h.id);
          return (
            <Marker
              key={h.id}
              position={[p.lat, p.lng]}
              icon={makeIcon({ glyph: "person", color: DISPLAY_COLORS[status], size: 32, pulse, label: h.name })}
              eventHandlers={{ click: () => onSelect?.({ type: "helper", id: h.id }) }}
              zIndexOffset={pulse ? 1000 : 500}
            />
          );
        })}
    </MapContainer>
  );
}
