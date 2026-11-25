// Minimal provider-agnostic LLM call (server only). Uses fetch so there are no
// SDK dependencies. Supports Gemini, OpenAI and Anthropic.

import "server-only";

export type LlmProvider = "gemini" | "openai" | "anthropic";

export interface LlmSettings {
  provider: LlmProvider;
  apiKey: string;
  model: string;
}

const DEFAULT_MODELS: Record<LlmProvider, string> = {
  gemini: "gemini-2.5-flash",
  openai: "gpt-4o-mini",
  anthropic: "claude-sonnet-5-5",
};

export function getLlmSettings(): LlmSettings | null {
  const explicit = process.env.LLM_PROVIDER?.toLowerCase() as LlmProvider | undefined;
  const keys: Record<LlmProvider, string | undefined> = {
    gemini: process.env.GEMINI_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
  };
  const provider = explicit && explicit in keys ? explicit : (Object.keys(keys) as LlmProvider[]).find((p) => keys[p]);
  if (!provider) return null;
  const apiKey = process.env.LLM_API_KEY || keys[provider];
  if (!apiKey) return null;
  return { provider, apiKey, model: process.env.LLM_MODEL || DEFAULT_MODELS[provider] };
}

export async function callLlm(settings: LlmSettings, system: string, user: string, signal?: AbortSignal): Promise<string> {
  const { provider, apiKey, model } = settings;
  if (provider === "openai") {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal,
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  }
  if (provider === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal,
      headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model, max_tokens: 4096, system, messages: [{ role: "user", content: user }] }),
    });
    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data = await res.json();
    return (data.content ?? []).filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("");
  }
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      signal,
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { temperature: 0.3, responseMimeType: "application/json" },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
}
