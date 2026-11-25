import { NextResponse } from "next/server";
import { z } from "zod";
import { weddingConfigSchema, configPatchSchema, type InviteApiResponse } from "@/lib/invite/schema";
import { applyPatch, parseJsonLoose } from "@/lib/invite/merge";
import { parseWithRules } from "@/lib/invite/ruleParser";
import { functionSuggestions } from "@/lib/invite/suggestions";
import { INVITE_SYSTEM_PROMPT } from "@/lib/invite/prompt";
import { callLlm, getLlmSettings } from "@/lib/invite/llm";

const bodySchema = z.object({
  config: weddingConfigSchema,
  message: z.string().min(1).max(2000),
});

const llmOutputSchema = z.object({
  patch: configPatchSchema,
  summary: z.string().default("Updated invite"),
  reply: z.string().default("Done!"),
});

export async function POST(req: Request) {
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request: both config and message are required." }, { status: 400 });
  }
  const { config, message } = body;

  // Only the current state + the change request is sent, never the chat history.
  const settings = getLlmSettings();
  if (settings) {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const userPrompt = `Today is ${today}.\nCurrent WeddingConfig:\n${JSON.stringify(config)}\n\nUser request: ${message}`;
      const raw = await callLlm(settings, INVITE_SYSTEM_PROMPT, userPrompt, AbortSignal.timeout(25_000));
      const parsed = llmOutputSchema.parse(parseJsonLoose(raw));
      const merged = applyPatch(config, parsed.patch);
      const res: InviteApiResponse = {
        patch: parsed.patch,
        summary: parsed.summary.slice(0, 80),
        reply: parsed.reply,
        suggestions: merged.ok ? functionSuggestions(merged.config) : [],
        source: "llm",
        ...(merged.ok ? {} : { error: merged.error }),
      };
      return NextResponse.json(res);
    } catch (err) {
      console.warn("[invite] LLM failed, using rule-based parser:", err instanceof Error ? err.message : err);
    }
  }

  const rules = parseWithRules(config, message);
  const res: InviteApiResponse = { ...rules, source: "rules" };
  return NextResponse.json(res);
}

export async function GET() {
  const s = getLlmSettings();
  return NextResponse.json({ provider: s?.provider ?? null, model: s?.model ?? null, mode: s ? "llm" : "rules" });
}
