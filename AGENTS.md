import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

type Msg = { role: "system" | "user" | "assistant"; content: string };

const SYSTEM_PROMPT = `You are FOVOZ AI, a calm, trustworthy, beginner-friendly financial guide for Indian investors. Explain concepts (stocks, mutual funds, SIPs, taxes, goals) simply and objectively. Use INR (₹). Never promise guaranteed returns or give personalized investment advice — encourage users to consider risk and consult a SEBI-registered advisor for major decisions. Be concise and warm.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        // Require the bearer token from the browser so we can act as the user.
        const authHeader = request.headers.get("authorization") ?? "";
        const token = authHeader.toLowerCase().startsWith("bearer ")
          ? authHeader.slice(7).trim()
          : "";
        if (!token) return new Response("Not authenticated", { status: 401 });

        const supabaseUrl = process.env.SUPABASE_URL;
        const supabasePublishable = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!supabaseUrl || !supabasePublishable) {
          return new Response("Missing Supabase config", { status: 500 });
        }
        const supabase = createClient(supabaseUrl, supabasePublishable, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: { headers: { Authorization: `Bearer ${token}` } },
        });

        const { data: userData, error: userErr } = await supabase.auth.getUser();
        if (userErr || !userData?.user) {
          return new Response("Not authenticated", { status: 401 });
        }
        const userId = userData.user.id;

        let body: { userMessage?: string; sessionId?: string | null };
        try {
          body = (await request.json()) as {
            userMessage?: string;
            sessionId?: string | null;
          };
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        const userMessage = typeof body.userMessage === "string" ? body.userMessage.trim() : "";
        if (!userMessage) return new Response("userMessage required", { status: 400 });
        if (userMessage.length > 4000)
          return new Response("Message too long", { status: 400 });

        // Ensure/verify session
        let sessionId: string | null = body.sessionId ?? null;
        if (sessionId) {
          const { data: existing, error } = await supabase
            .from("chat_sessions")
            .select("id")
            .eq("id", sessionId)
            .maybeSingle();
          if (error || !existing) sessionId = null;
        }
        if (!sessionId) {
          const title = userMessage.slice(0, 60);
          const { data: created, error } = await supabase
            .from("chat_sessions")
            .insert({ user_id: userId, title })
            .select("id")
            .single();
          if (error || !created) {
            return new Response(error?.message ?? "Failed to create session", { status: 500 });
          }
          sessionId = created.id;
        }

        // Load prior messages for context
        const { data: history } = await supabase
          .from("chat_messages")
          .select("role, content")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: true })
          .limit(40);

        // Persist the new user message
        await supabase
          .from("chat_messages")
          .insert({ session_id: sessionId, user_id: userId, role: "user", content: userMessage });

        const conversation: Msg[] = [
          { role: "system", content: SYSTEM_PROMPT },
          ...((history ?? []) as Msg[]),
          { role: "user", content: userMessage },
        ];

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Lovable-API-Key": key,
            "X-Lovable-AIG-SDK": "fetch",
          },
          body: JSON.stringify({
            model: "google/gemini-3.6-flash",
            stream: true,
            messages: conversation,
          }),
        });

        if (!upstream.ok || !upstream.body) {
          const text = await upstream.text().catch(() => "");
          if (upstream.status === 429)
            return new Response("Rate limited. Please try again shortly.", { status: 429 });
          if (upstream.status === 402)
            return new Response("AI credits exhausted. Please top up in workspace billing.", {
              status: 402,
            });
          return new Response(text || "AI gateway error", { status: 502 });
        }

        const reader = upstream.body.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let buffer = "";
        let assistantAccum = "";
        const capturedSessionId: string = sessionId as string;

        const stream = new ReadableStream<Uint8Array>({
          async pull(controller) {
            const { value, done } = await reader.read();
            if (done) {
              // Persist assistant response
              if (assistantAccum.trim().length > 0) {
                await supabase
                  .from("chat_messages")
                  .insert({
                    session_id: capturedSessionId,
                    user_id: userId,
                    role: "assistant",
                    content: assistantAccum,
                  });
                await supabase
                  .from("chat_sessions")
                  .update({ updated_at: new Date().toISOString() })
                  .eq("id", capturedSessionId);
              }
              controller.close();
              return;
            }
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data:")) continue;
              const data = trimmed.slice(5).trim();
              if (!data || data === "[DONE]") continue;
              try {
                const json = JSON.parse(data);
                const delta = json.choices?.[0]?.delta?.content;
                if (typeof delta === "string" && delta.length > 0) {
                  assistantAccum += delta;
                  controller.enqueue(encoder.encode(delta));
                }
              } catch {
                // ignore malformed line
              }
            }
          },
          cancel() {
            reader.cancel().catch(() => {});
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache",
            "X-Session-Id": capturedSessionId,
          },
        });
      },
    },
  },
});