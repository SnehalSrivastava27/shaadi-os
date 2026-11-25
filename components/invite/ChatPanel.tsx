"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Loader2, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Em, chip, darkPill, hatch } from "@/components/website/ui";
import { useShaadiStore } from "@/stores/useShaadiStore";
import type { InviteApiResponse } from "@/lib/invite/schema";
import { EDIT_EXAMPLES, QUICK_STARTS, functionSuggestions } from "@/lib/invite/suggestions";
import { cn } from "@/lib/utils";

export function ChatPanel() {
  const chat = useShaadiStore((s) => s.chat);
  const config = useShaadiStore((s) => s.config);
  const addChat = useShaadiStore((s) => s.addChat);
  const clearChat = useShaadiStore((s) => s.clearChat);
  const applyConfigPatch = useShaadiStore((s) => s.applyConfigPatch);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/invite")
      .then((r) => r.json())
      .then((d) => setMode(d.mode === "llm" ? `AI: ${d.provider}` : "Offline mode"))
      .catch(() => setMode("Offline mode"));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [chat.length, loading]);

  const send = async (raw: string) => {
    const message = raw.trim();
    if (!message || loading) return;
    setInput("");
    addChat({ role: "user", text: message });
    setLoading(true);
    try {
      // Only the current config + this request go to the server, not the chat history.
      const current = useShaadiStore.getState().config;
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ config: current, message }),
      });
      const data = (await res.json()) as InviteApiResponse & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Server error");
      if (data.error) {
        addChat({ role: "assistant", text: `That change didn't fit (${data.error}). I kept the previous version. Could you phrase it differently?`, error: true, source: data.source });
        toast.error("Change not applied", { description: data.error });
        return;
      }
      if (!data.patch || Object.keys(data.patch).length === 0) {
        addChat({ role: "assistant", text: data.reply, source: data.source, suggestions: data.suggestions });
        return;
      }
      const merged = applyConfigPatch(data.patch, data.summary);
      if (!merged.ok) {
        addChat({ role: "assistant", text: `That change didn't fit (${merged.error}). I kept the previous version.`, error: true, source: data.source });
        toast.error("Validation failed, kept the previous version", { description: merged.error });
        return;
      }
      addChat({ role: "assistant", text: data.reply, source: data.source, suggestions: data.suggestions });
      toast.success(data.summary || "Invite updated");
    } catch (e) {
      addChat({ role: "assistant", text: "Couldn't reach the server. Check your connection and try again.", error: true });
      toast.error(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const lastSuggestions = [...chat].reverse().find((m) => m.role === "assistant" && m.suggestions?.length)?.suggestions;
  const suggestions = (lastSuggestions ?? functionSuggestions(config)).filter((s) => {
    const name = s.replace(/^Add /, "").toLowerCase();
    return !config.functions.some((f) => f.name.toLowerCase() === name);
  });

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#ececec] bg-white shadow-[0_12px_30px_-24px_rgba(0,0,0,0.3)]">
      <div className="flex items-center justify-between border-b border-[#ececec] px-4 py-3">
        <p className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.01em]">
          <span className="flex size-7 items-center justify-center rounded-lg bg-[#7a1f2b]/10 text-[#7a1f2b]">
            <Sparkles className="size-3.5" />
          </span>
          Invite <Em>builder</Em>
        </p>
        <div className="flex items-center gap-1">
          {mode && <span className="rounded-full bg-[#f4f4f4] px-2 py-0.5 text-[10px] font-medium text-[#6b6b6b]">{mode}</span>}
          {chat.length > 0 && (
            <Button size="icon" variant="ghost" aria-label="Clear chat" onClick={clearChat} className="size-8 text-[#8a8a8a]">
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {chat.length === 0 && (
          <div className="grid gap-3 text-sm text-[#5f5f5f]">
            <p>Namaste! 🙏 Tell me about your wedding and I&apos;ll build the invite website. For example:</p>
            <blockquote className={cn("rounded-xl border border-[#ececec] px-4 py-3 text-[17px] leading-snug text-[#161616]", hatch)}>
              <Em>&ldquo;Riya and Arjun&apos;s wedding, 12 Dec, Jaipur. Rajasthani theme. Haldi, mehendi, sangeet and pheras.&rdquo;</Em>
            </blockquote>
            <p>Then ask for changes: &quot;make the colour maroon&quot;, &quot;move sangeet to 8 pm&quot;, &quot;show Hindi too&quot;.</p>
          </div>
        )}
        <div className="grid gap-3">
          {chat.map((m) => (
            <div key={m.id} className={cn("flex items-end gap-2", m.role === "user" && "flex-row-reverse")}>
              {m.role === "assistant" && (
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#7a1f2b]/10 text-[#7a1f2b]">
                  <Sparkles className="size-3" />
                </span>
              )}
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                  m.role === "user"
                    ? "rounded-br-md bg-[#262626] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_8px_16px_-12px_rgba(0,0,0,0.6)]"
                    : "rounded-bl-md border border-[#ececec] bg-[#f7f7f7] text-[#161616]",
                  m.error && "border-red-200 bg-red-50 text-red-900"
                )}
              >
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-[#8a8a8a]">
              <Loader2 className="size-4 animate-spin" /> Building your invite…
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>
      <div className="grid gap-2.5 border-t border-[#ececec] bg-[#fcfcfc] p-3">
        {suggestions.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold tracking-wider text-[#8a8a8a] uppercase">Rituals</span>
            {suggestions.map((s) => (
              <button key={s} onClick={() => send(s)} disabled={loading} className="rounded-full border border-[#7a1f2b]/20 bg-[#7a1f2b]/5 px-2.5 py-0.5 text-xs font-medium text-[#7a1f2b] transition hover:bg-[#7a1f2b]/10 disabled:opacity-50">
                + {s.replace(/^Add /, "")}
              </button>
            ))}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-end gap-2 rounded-2xl border border-[#e5e5e5] bg-white p-1.5 shadow-[0_8px_20px_-16px_rgba(0,0,0,0.4)] focus-within:border-[#c9c9c9]"
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What should I build or change? e.g. move sangeet to 8 pm"
            className="max-h-32 min-h-9 resize-none border-0 bg-transparent px-2 py-1.5 shadow-none focus-visible:ring-0"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
          />
          <button type="submit" disabled={loading || !input.trim()} aria-label="Send" className={cn(darkPill, "size-9 shrink-0 justify-center px-0")}>
            {loading ? <Loader2 className="animate-spin" /> : <ArrowUp />}
          </button>
        </form>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_STARTS.map((q) => (
            <button key={q.label} onClick={() => send(q.prompt)} disabled={loading} className={cn(chip, "bg-[#f7f7f7] font-semibold text-[#161616]")}>
              {q.label}
            </button>
          ))}
          {EDIT_EXAMPLES.map((q) => (
            <button key={q} onClick={() => send(q)} disabled={loading} className={chip}>
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
