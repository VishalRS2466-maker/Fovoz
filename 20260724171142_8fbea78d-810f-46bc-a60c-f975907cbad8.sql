import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { ComingSoon } from "@/components/app/ComingSoon";

export const Route = createFileRoute("/_authenticated/goals")({
  component: () => (
    <AppShell>
      <ComingSoon
        title="Goals"
        body="Emergency fund, home, retirement and custom goals. Arrives in Phase 3."
      />
    </AppShell>
  ),
  head: () => ({ meta: [{ title: "Goals — FOVOZ" }] }),
});