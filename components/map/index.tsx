"use client";

// Every Leaflet component is loaded on the client only (Leaflet touches `window`).
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

function MapLoading() {
  return (
    <div className="bg-muted flex h-full w-full items-center justify-center text-muted-foreground">
      <Loader2 className="mr-2 size-4 animate-spin" /> Loading map…
    </div>
  );
}

export const LiveMap = dynamic(() => import("./LiveMap"), { ssr: false, loading: MapLoading });
export const PickerMap = dynamic(() => import("./PickerMap"), { ssr: false, loading: MapLoading });
export const TripMap = dynamic(() => import("./TripMap"), { ssr: false, loading: MapLoading });
export type { MapSelection } from "./LiveMap";
