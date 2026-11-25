"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, Send, Sparkles, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
        addChat({ role: "assistant", text: `Ye badlaav theek se nahi baitha (${data.error}). Pichla version hi rakha hai. Thoda alag tarike se boliye?`, error: true, source: data.source });
        toast.error("Badlaav apply nahi hua", { description: data.error });
        return;
      }
      if (!data.patch || Object.keys(data.patch).length === 0) {
        addChat({ role: "assistant", text: data.reply, source: data.source, suggestions: data.suggestions });
        return;
      }
      const merged = applyConfigPatch(data.patch, data.summary);
      if (!merged.ok) {
        addChat({ role: "assistant", text: `Ye badlaav theek se nahi baitha (${merged.error}). Pichla version hi rakha hai.`, error: true, source: data.source });
        toast.error("Validation fail hua, purana version rakha", { description: merged.error });
        return;
      }
      addChat({ role: "assistant", text: data.reply, source: data.source, suggestions: data.suggestions });
      toast.success(data.summary || "Invite update ho gaya");
    } catch (e) {
      addChat({ role: "assistant", text: "Server se baat nahi ho paayi. Internet check karke dobara try kijiye.", error: true });
      toast.error(e instanceof Error ? e.message : "Request fail");
    } finally {
      setLoading(false);
    }
  };

  const lastSuggestions = [...chat].reverse().find((m) => m.role === "assistant" && m.suggestions?.length)?.suggestions;
  const suggestions = (lastSuggestions ?? functionSuggestions(config)).filter((s) => {
    const name = s.replace(/ add karo$/, "").toLowerCase();
    return !config.functions.some((f) => f.name.toLowerCase() === name);
  });

  return (
    <div className="bg-card flex h-full min-h-0 flex-col rounded-xl border">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <p className="font-heading flex items-center gap-2 font-semibold">
          <Sparkles className="text-accent size-4" /> Invite builder
        </p>
        <div className="flex items-center gap-1">
          {mode && <Badge variant="outline" className="text-[10px]">{mode}</Badge>}
          {chat.length > 0 && (
            <Button size="icon" variant="ghost" aria-label="Clear chat" onClick={clearChat}>
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {chat.length === 0 && (
          <div className="text-muted-foreground grid gap-2 text-sm">
            <p>Namaste! 🙏 Apni shaadi ke baare mein batayiye, main invite website bana dunga. Jaise:</p>
            <p className="bg-muted rounded-lg p-3 italic">&quot;Riya aur Arjun ki shaadi, 12 Dec, Jaipur. Rajasthani theme. Haldi, mehendi, sangeet aur pheras.&quot;</p>
            <p>Phir badlaav boliye: &quot;colour maroon karo&quot;, &quot;sangeet 8 baje kar do&quot;, &quot;Hindi mein bhi dikhao&quot;.</p>
          </div>
        )}
        <div className="grid gap-3">
          {chat.map((m) => (
            <div key={m.id} className={cn("flex gap-2", m.role === "user" && "flex-row-reverse")}>
              <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-full", m.role === "user" ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground")}>
                {m.role === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
              </div>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                  m.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted rounded-tl-sm",
                  m.error && "border border-red-300 bg-red-50 text-red-900"
                )}
              >
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" /> Invite bana rahe hain…
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>
      <div className="grid gap-2 border-t p-3">
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <span className="text-muted-foreground self-center text-[11px]">Rasm suggestions:</span>
            {suggestions.map((s) => (
              <button key={s} onClick={() => send(s)} disabled={loading} className="bg-accent/15 hover:bg-accent/30 rounded-full border border-accent/50 px-2.5 py-0.5 text-xs">
                + {s.replace(/ add karo$/, "")}
              </button>
            ))}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-end gap-2"
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Kya banana ya badalna hai? e.g. sangeet 8 baje kar do"
            className="max-h-32 min-h-10 resize-none"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
          />
          <Button type="submit" size="icon" disabled={loading || !input.trim()} aria-label="Send">
            {loading ? <Loader2 className="animate-spin" /> : <Send />}
          </Button>
        </form>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_STARTS.map((q) => (
            <button key={q.label} onClick={() => send(q.prompt)} disabled={loading} className="bg-secondary text-secondary-foreground hover:bg-secondary/70 rounded-full px-2.5 py-1 text-xs font-medium">
              {q.label}
            </button>
          ))}
          {EDIT_EXAMPLES.map((q) => (
            <button key={q} onClick={() => send(q)} disabled={loading} className="hover:bg-muted rounded-full border px-2.5 py-1 text-xs">
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
