import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { ComingSoon } from "@/components/app/ComingSoon";

export const Route = createFileRoute("/_authenticated/invest")({
  component: () => (
    <AppShell>
      <ComingSoon
        title="Invest"
        body="Explore stocks, mutual funds, ETFs, bonds and index funds. Simulated investing arrives in Phase 2."
      />
    </AppShell>
  ),
  head: () => ({ meta: [{ title: "Invest — FOVOZ" }] }),
});