import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { ComingSoon } from "@/components/app/ComingSoon";

export const Route = createFileRoute("/_authenticated/learn")({
  component: () => (
    <AppShell>
      <ComingSoon
        title="Learn"
        body="Beginner to advanced financial concepts, and an optional AI tutor. Arrives in Phase 3."
      />
    </AppShell>
  ),
  head: () => ({ meta: [{ title: "Learn — FOVOZ" }] }),
});