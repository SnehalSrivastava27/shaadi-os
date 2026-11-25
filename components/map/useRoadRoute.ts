import { useEffect, useState } from "react";
import { roadRoute, routeKey, type LatLng } from "@/lib/geo";

/** Road-following path for the given points; straight line until OSRM answers (or if it fails). */
export function useRoadRoute(points: LatLng[]): [number, number][] {
  const key = routeKey(points);
  const [route, setRoute] = useState<{ key: string; path: [number, number][] } | null>(null);
  useEffect(() => {
    let live = true;
    roadRoute(points).then((r) => live && setRoute({ key, path: r.path }));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return route?.key === key ? route.path : points.map((p) => [p.lat, p.lng]);
}
