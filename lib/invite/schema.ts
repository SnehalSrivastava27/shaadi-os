import { z } from "zod";
import type { WeddingConfig } from "@/types";

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Colour must be a hex code like #7A1F2B");

export const themeSchema = z.enum(["mandap", "rajasthani", "punjabi", "south-indian", "bengali", "modern"]);

export const weddingFunctionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Function name is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be HH:mm"),
  venueName: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  dressCode: z.string().optional(),
  description: z.string().optional(),
});

export const storyChapterSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(80),
  caption: z.string().max(400),
  date: z.string().max(40).optional(),
  photoId: z.string().max(60).optional(),
  // Only our own bundled images: no arbitrary external URLs on a public invite.
  photoUrl: z.string().regex(/^\/story\/[a-z0-9-]+\.(?:jpg|webp|png)$/).optional(),
  scene: z.enum(["chai", "rings", "haldi", "mehendi"]),
});

export const weddingConfigSchema = z.object({
  id: z.string().min(1),
  brideName: z.string().min(1, "Bride's name is required"),
  groomName: z.string().min(1, "Groom's name is required"),
  city: z.string().min(1),
  theme: themeSchema,
  palette: z.object({ primary: hex, accent: hex, background: hex }),
  welcomeMessage: z.object({ en: z.string().min(1), hi: z.string().min(1) }),
  functions: z.array(weddingFunctionSchema).min(1, "At least one function is required"),
  published: z.boolean(),
  showHindi: z.boolean().optional(),
  story: z.array(storyChapterSchema).max(12).optional(),
}) satisfies z.ZodType<WeddingConfig>;

/**
 * A JSON patch for the config. Only changed fields are present.
 * - palette / welcomeMessage are merged key by key
 * - functions are upserted by id (partial objects allowed for existing ids)
 * - removeFunctionIds deletes functions; replaceFunctions swaps the whole list
 */
export const configPatchSchema = z
  .object({
    brideName: z.string().min(1).optional(),
    groomName: z.string().min(1).optional(),
    city: z.string().min(1).optional(),
    theme: themeSchema.optional(),
    palette: z.object({ primary: hex.optional(), accent: hex.optional(), background: hex.optional() }).optional(),
    welcomeMessage: z.object({ en: z.string().optional(), hi: z.string().optional() }).optional(),
    showHindi: z.boolean().optional(),
    functions: z.array(weddingFunctionSchema.partial().extend({ id: z.string().min(1) })).optional(),
    removeFunctionIds: z.array(z.string()).optional(),
    replaceFunctions: z.boolean().optional(),
    /** Replaces the whole story (chapters are small; photos are stored separately). */
    story: z.array(storyChapterSchema).max(12).optional(),
  })
  .strip();

export type ConfigPatch = z.infer<typeof configPatchSchema>;

export interface InviteApiResponse {
  patch: ConfigPatch;
  summary: string;
  reply: string;
  suggestions: string[];
  source: "llm" | "rules";
  error?: string;
}
