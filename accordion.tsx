import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, Home, LineChart, Menu, PieChart, Sparkles, Target, TrendingUp, GraduationCap, LogOut } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Logo, LogoIcon } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { ChatWidget } from "@/components/app/ChatWidget";

const navItems = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/market", label: "Market Intelligence", icon: Sparkles, short: "Market" },
  { to: "/invest", label: "Invest", icon: TrendingUp },
  { to: "/portfolio", label: "Portfolio", icon: PieChart },
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/learn", label: "Learn", icon: GraduationCap },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop top nav */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
          <Link to="/dashboard" className="shrink-0">
            <Logo size="md" />
          </Link>

          <nav className="hidden flex-1 items-center gap-1 md:flex">
            {navItems.map((item) => {
              const active = pathname === item.to || pathname.startsWith(item.to + "/");
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="hidden border-border bg-card sm:inline-flex"
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5 text-gold" />
              Ask FOVOZ AI
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
            <button
              type="button"
              className="ml-1 grid h-9 w-9 place-items-center rounded-md border border-border md:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-border/60 bg-card md:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-3 py-2">
              {navItems.map((item) => {
                const active = pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                      active ? "bg-primary/10 text-primary" : "text-foreground",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 md:pb-10">{children}</main>

      <ChatWidget />

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/95 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {navItems.slice(0, 4).map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2 py-2 text-[10px] font-medium",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {("short" in item ? item.short : item.label) as string}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium text-muted-foreground"
          >
            <LogoIcon size={16} />
            More
          </button>
        </div>
      </nav>
    </div>
  );
}