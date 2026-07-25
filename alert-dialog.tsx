import { Sparkles, X, Send, Loader2, History, Plus, Trash2, ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  deleteChatSession,
  getChatSession,
  listChatSessions,
  type ChatSessionSummary,
} from "@/lib/chat-sessions.functions";

type Msg = { role: "user" | "assistant"; content: string };

const GREETING: Msg = {
  role: "assistant",
  content:
    "Namaste 🙏 I'm FOVOZ AI. Ask me about SIPs, mutual funds, taxes, or how to start investing. I explain concepts — never guarantee returns.",
};

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"chat" | "history">("chat");
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open && view === "chat") setTimeout(() => inputRef.current?.focus(), 50);
  }, [open, view, sessionId]);

  const refreshSessions = useCallback(async () => {
    try {
      const rows = await listChatSessions();
      setSessions(rows);
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (open) void refreshSessions();
  }, [open, refreshSessions]);

  function newChat() {
    setSessionId(null);
    setMessages([GREETING]);
    setView("chat");
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  async function openSession(id: string) {
    setLoadingHistory(true);
    try {
      const result = await getChatSession({ data: { sessionId: id } });
      if (!result) {
        toast.error("Session not found");
        return;
      }
      setSessionId(result.session.id);
      setMessages(
        result.messages.length > 0
          ? result.messages.map((m) => ({ role: m.role, content: m.content }))
          : [GREETING],
      );
      setView("chat");
    } catch (e) {
      toast.error("Could not load conversation");
    } finally {
      setLoadingHistory(false);
    }
  }

  async function removeSession(id: string) {
    try {
      await deleteChatSession({ data: { sessionId: id } });
      setSessions((s) => s.filter((x) => x.id !== id));
      if (sessionId === id) newChat();
    } catch {
      toast.error("Could not delete");
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setMessages((m) => [...m, { role: "user", content: text }, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = {
            role: "assistant",
            content: "⚠️ Please sign in to chat.",
          };
          return copy;
        });
        return;
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userMessage: text, sessionId }),
      });

      if (!res.ok || !res.body) {
        const errText = (await res.text().catch(() => "")) || "Something went wrong.";
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: `⚠️ ${errText}` };
          return copy;
        });
        return;
      }

      const newId = res.headers.get("X-Session-Id");
      if (newId && newId !== sessionId) setSessionId(newId);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
      void refreshSessions();
    } catch {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = {
          role: "assistant",
          content: "⚠️ Network error. Please try again.",
        };
        return copy;
      });
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-elegant transition hover:opacity-95 md:bottom-6"
          aria-label="Open FOVOZ AI chat"
        >
          <Sparkles className="h-4 w-4 text-gold" />
          <span className="text-sm font-medium">Ask FOVOZ AI</span>
        </button>
      )}

      {open && (
        <div className="fixed inset-x-0 bottom-0 z-50 flex justify-end px-2 pb-2 md:inset-auto md:bottom-6 md:right-6">
          <div className="flex h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-elegant md:h-[560px]">
            <div className="flex items-center justify-between border-b border-border/60 bg-primary px-3 py-3 text-primary-foreground">
              <div className="flex items-center gap-2">
                {view === "history" ? (
                  <button
                    type="button"
                    onClick={() => setView("chat")}
                    aria-label="Back"
                    className="rounded p-1 hover:bg-white/10"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                ) : (
                  <Sparkles className="h-4 w-4 text-gold" />
                )}
                <div>
                  <div className="text-sm font-semibold tracking-wide">
                    {view === "history" ? "Saved conversations" : "FOVOZ AI"}
                  </div>
                  <div className="text-[11px] opacity-80">
                    {view === "history" ? `${sessions.length} saved` : "Financial guide · not advice"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {view === "chat" && (
                  <>
                    <button
                      type="button"
                      onClick={newChat}
                      aria-label="New chat"
                      className="rounded p-1 hover:bg-white/10"
                      title="New chat"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setView("history");
                        void refreshSessions();
                      }}
                      aria-label="History"
                      className="rounded p-1 hover:bg-white/10"
                      title="History"
                    >
                      <History className="h-4 w-4" />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close chat"
                  className="rounded p-1 hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {view === "history" ? (
              <div className="flex-1 overflow-y-auto p-2">
                {sessions.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    No saved conversations yet. Start chatting to build history.
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {sessions.map((s) => (
                      <li
                        key={s.id}
                        className={cn(
                          "group flex items-center gap-2 rounded-lg border border-transparent px-2 py-2 hover:border-border hover:bg-muted/60",
                          sessionId === s.id && "border-primary/30 bg-muted/40",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => openSession(s.id)}
                          className="flex-1 truncate text-left"
                          disabled={loadingHistory}
                        >
                          <div className="truncate text-sm font-medium">{s.title}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {new Date(s.updated_at).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSession(s.id)}
                          aria-label="Delete conversation"
                          className="rounded p-1.5 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-4">
                {loadingHistory && (
                  <div className="flex justify-center py-4 text-xs text-muted-foreground">
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" /> Loading conversation…
                  </div>
                )}
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={cn("flex w-full", m.role === "user" ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed",
                        m.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground",
                      )}
                    >
                      {m.content || (
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" /> Thinking…
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {view === "chat" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex items-end gap-2 border-t border-border/60 bg-background p-3"
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder="Ask about SIPs, taxes, goals…"
                className="max-h-32 min-h-[40px] flex-1 resize-none rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                disabled={loading}
              />
              <Button type="submit" size="icon" disabled={loading || !input.trim()}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}