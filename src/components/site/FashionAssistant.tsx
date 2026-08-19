import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MessageCircle, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { askFashionAssistant } from "@/lib/shop.functions";

type Message = { role: "user" | "assistant"; content: string };

const GREETING: Message = {
  role: "assistant",
  content:
    "Welcome to SWAMY TEX. Tell me the occasion, budget or fabric you love and I'll style you.",
};

export function FashionAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [draft, setDraft] = useState("");
  const ask = useServerFn(askFashionAssistant);

  const send = useMutation({
    mutationFn: async (history: Message[]) => ask({ data: { messages: history } }),
    onSuccess: (result) => setMessages((m) => [...m, { role: "assistant", content: result.reply }]),
    onError: (error: Error) =>
      setMessages((m) => [
        ...m,
        { role: "assistant", content: error.message || "I couldn't respond just now." },
      ]),
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || send.isPending) return;
    const next: Message[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setDraft("");
    send.mutate(next.filter((m) => m !== GREETING));
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open the fashion assistant"
          className="fixed bottom-5 right-5 z-50 flex h-14 items-center gap-2 rounded-full bg-gold-gradient px-5 text-sm font-semibold text-[oklch(0.16_0_0)] shadow-luxe"
        >
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">Style me</span>
          <MessageCircle className="h-4 w-4 sm:hidden" />
        </button>
      )}

      {open && (
        <div className="fixed inset-x-3 bottom-3 z-50 flex max-h-[70vh] flex-col overflow-hidden rounded-lg border border-border bg-card shadow-luxe sm:inset-x-auto sm:right-5 sm:w-96">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="eyebrow text-gold">Fashion assistant</p>
              <p className="font-display text-lg leading-tight">SWAMY TEX Atelier</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close assistant">
              <X />
            </Button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm">
            {messages.map((message, index) => (
              <div
                key={index}
                className={
                  message.role === "user"
                    ? "ml-auto max-w-[85%] rounded-lg bg-secondary px-3 py-2"
                    : "max-w-[90%] rounded-lg bg-card-elevated px-3 py-2"
                }
              >
                {message.content}
              </div>
            ))}
            {send.isPending && (
              <p className="max-w-[90%] rounded-lg bg-card-elevated px-3 py-2 text-muted-foreground">
                Styling your look…
              </p>
            )}
          </div>

          <form onSubmit={submit} className="flex items-center gap-2 border-t border-border p-3">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Silk saree for a reception under ₹15,000"
              aria-label="Message the fashion assistant"
              maxLength={1000}
            />
            <Button type="submit" variant="gold" size="icon" disabled={send.isPending} aria-label="Send">
              <Send />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
