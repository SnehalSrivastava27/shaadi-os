import type { WeddingConfig, WeddingFunction } from "@/types";
import { weddingConfigSchema, type ConfigPatch } from "./schema";

export type MergeResult = { ok: true; config: WeddingConfig } | { ok: false; error: string };

/** Apply a JSON patch to the config and validate the result with zod. */
export function applyPatch(config: WeddingConfig, patch: ConfigPatch): MergeResult {
  const next: WeddingConfig = {
    ...config,
    ...(patch.brideName !== undefined && { brideName: patch.brideName }),
    ...(patch.groomName !== undefined && { groomName: patch.groomName }),
    ...(patch.city !== undefined && { city: patch.city }),
    ...(patch.theme !== undefined && { theme: patch.theme }),
    ...(patch.showHindi !== undefined && { showHindi: patch.showHindi }),
    palette: { ...config.palette, ...stripUndefined(patch.palette ?? {}) },
    welcomeMessage: { ...config.welcomeMessage, ...stripUndefined(patch.welcomeMessage ?? {}) },
    functions: config.functions,
    published: false,
  };

  let functions: Partial<WeddingFunction>[] = patch.replaceFunctions ? [] : [...config.functions];
  if (patch.removeFunctionIds?.length) {
    functions = functions.filter((f) => !patch.removeFunctionIds!.includes(f.id!));
  }
  for (const fp of patch.functions ?? []) {
    const idx = functions.findIndex((f) => f.id === fp.id);
    if (idx >= 0) functions[idx] = { ...functions[idx], ...stripUndefined(fp) };
    else functions.push(stripUndefined(fp));
  }
  functions.sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  next.functions = functions as WeddingFunction[];

  const parsed = weddingConfigSchema.safeParse(next);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: `${issue.path.join(".") || "config"}: ${issue.message}` };
  }
  return { ok: true, config: parsed.data };
}

function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}

/** Remove ```json fences and surrounding prose from an LLM response, then parse. */
export function parseJsonLoose(text: string): unknown {
  let t = text.trim();
  t = t.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");
  if (first > 0 || (last >= 0 && last < t.length - 1)) t = t.slice(first, last + 1);
  return JSON.parse(t);
}
