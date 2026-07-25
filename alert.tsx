import { Sparkles } from "lucide-react";

export function ComingSoon({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto max-w-2xl py-16 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Sparkles className="h-6 w-6" />
      </div>
      <h1 className="mt-5 font-display text-3xl tracking-tight">{title}</h1>
      <p className="mt-3 text-muted-foreground">{body}</p>
      <p className="mt-6 inline-block rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
        Phase 1 shipped · more coming soon
      </p>
    </div>
  );
}