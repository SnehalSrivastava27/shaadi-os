"use client";

import { useEffect } from "react";
import { TICK_MS, useShaadiStore } from "@/stores/useShaadiStore";

/** Drives the live map: moves in-progress trips every 2 s and sends GPS heartbeats. */
export function SimulationEngine() {
  useEffect(() => {
    useShaadiStore.getState().heartbeat();
    const id = setInterval(() => useShaadiStore.getState().simulateTick(), TICK_MS);
    return () => clearInterval(id);
  }, []);
  return null;
}
