"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import { makeIcon } from "./icons";

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(+e.latlng.lat.toFixed(5), +e.latlng.lng.toFixed(5)) });
  return null;
}

/** Mini map: tap to choose a custom pickup point. */
export default function PickerMap({
  value,
  onPick,
  center = [26.8467, 80.9462],
}: {
  value?: { lat: number; lng: number } | null;
  onPick: (lat: number, lng: number) => void;
  center?: [number, number];
}) {
  return (
    <MapContainer center={value ? [value.lat, value.lng] : center} zoom={12} style={{ height: "100%", width: "100%" }}>
      <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <ClickHandler onPick={onPick} />
      {value && <Marker position={[value.lat, value.lng]} icon={makeIcon({ glyph: "pin", color: "#7A1F2B", size: 30 })} />}
    </MapContainer>
  );
}
