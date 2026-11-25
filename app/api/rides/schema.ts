import { z } from "zod";

const place = z.object({ label: z.string().min(1).max(200), lat: z.number().optional(), lng: z.number().optional() });

export const quoteBody = z.object({
  provider: z.enum(["uber", "rapido"]),
  pickup: place,
  drop: place,
  peopleCount: z.number().int().min(1).max(20),
});

export const bookBody = quoteBody.extend({
  product: z.string().max(80).optional(),
  confirm: z.boolean(),
});
