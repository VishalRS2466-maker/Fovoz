import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type ChatSessionSummary = {
  id: string;
  title: string;
  updated_at: string;
};

export type ChatMessageRow = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export const listChatSessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ChatSessionSummary[]> => {
    const { data, error } = await context.supabase
      .from("chat_sessions")
      .select("id, title, updated_at")
      .order("updated_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (data ?? []) as ChatSessionSummary[];
  });

export const getChatSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ sessionId: z.string().uuid() }).parse(input))
  .handler(
    async ({
      data,
      context,
    }): Promise<{ session: ChatSessionSummary; messages: ChatMessageRow[] } | null> => {
      const { data: session, error: sErr } = await context.supabase
        .from("chat_sessions")
        .select("id, title, updated_at")
        .eq("id", data.sessionId)
        .maybeSingle();
      if (sErr) throw new Error(sErr.message);
      if (!session) return null;

      const { data: msgs, error: mErr } = await context.supabase
        .from("chat_messages")
        .select("id, role, content, created_at")
        .eq("session_id", data.sessionId)
        .order("created_at", { ascending: true });
      if (mErr) throw new Error(mErr.message);

      return {
        session: session as ChatSessionSummary,
        messages: (msgs ?? []) as ChatMessageRow[],
      };
    },
  );

export const deleteChatSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ sessionId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("chat_sessions")
      .delete()
      .eq("id", data.sessionId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const renameChatSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ sessionId: z.string().uuid(), title: z.string().min(1).max(80) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("chat_sessions")
      .update({ title: data.title })
      .eq("id", data.sessionId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });