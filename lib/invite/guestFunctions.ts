import type { Guest, WeddingConfig, WeddingFunction } from "@/types";

/** Only the functions this guest is invited to (all functions if the ids no longer match). */
export function functionsForGuest(config: WeddingConfig, guest?: Guest): WeddingFunction[] {
  if (!guest) return config.functions;
  const invited = config.functions.filter((f) => guest.invitedFunctionIds.includes(f.id));
  return invited.length ? invited : config.functions;
}
