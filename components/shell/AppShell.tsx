"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bike, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav";
import { useShaadiStore } from "@/stores/useShaadiStore";
import { Badge } from "@/components/ui/badge";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentUser = useShaadiStore((s) => s.currentUser);
  const helpers = useShaadiStore((s) => s.helpers);
  const config = useShaadiStore((s) => s.publishedConfig);
  const tasks = useShaadiStore((s) => s.tasks);
  const me = currentUser.role === "helper" ? helpers.find((h) => h.id === currentUser.helperId) : undefined;
  const myOffers = me ? tasks.filter((t) => t.assignedHelperId === me.id && t.status === "offered").length : 0;

  return (
    <div className="flex min-h-screen w-full">
      {/* Desktop sidebar */}
      <aside className="bg-sidebar text-sidebar-foreground sticky top-0 hidden h-screen w-60 shrink-0 flex-col md:flex">
        <div className="mandala-bg px-5 py-6">
          <Link href="/" className="block">
            <p className="font-heading text-2xl font-bold tracking-wide text-[#FFF1D6]">Shaadi OS</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-[#F4D58D]">
              {config.brideName} <Heart className="size-3 fill-current" /> {config.groomName} · {config.city}
            </p>
          </Link>
        </div>
        <div className="paisley-border" />
        <nav data-tour="nav" className="flex flex-1 flex-col gap-1 p-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive(pathname, item.href) ? "bg-accent text-accent-foreground" : "hover:bg-white/10"
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
          {me && (
            <Link
              href={`/helper/${me.id}`}
              className={cn(
                "mt-2 flex items-center gap-3 rounded-lg border border-white/20 px-3 py-2 text-sm font-medium",
                pathname.startsWith("/helper") ? "bg-accent text-accent-foreground" : "hover:bg-white/10"
              )}
            >
              <Bike className="size-4" />
              Meri duty
              {myOffers > 0 && <Badge variant="accent" className="ml-auto">{myOffers}</Badge>}
            </Link>
          )}
        </nav>
        <Link href="/?tour=1" className="mx-3 mb-2 rounded-lg border border-white/20 px-3 py-2 text-xs text-[#FFF1D6] hover:bg-white/10">
          🎓 Tutorial dekho
        </Link>
        <Link href="/welcome" className="mx-3 mb-3 rounded-lg border border-[#F4A300]/40 px-3 py-2 text-xs text-[#F4D58D] hover:bg-white/10">
          ✨ Shaadi OS kya hai?
        </Link>
        <div className="border-t border-white/10 p-4 text-xs text-[#F4D58D]">
          Logged in as <span className="font-semibold text-white">{me ? me.name : "Organizer"}</span>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <header className="mandala-bg sticky top-0 z-[900] flex items-center justify-between px-4 py-3 text-[#FFF1D6] md:hidden">
          <Link href="/" className="font-heading text-xl font-bold">
            Shaadi OS
          </Link>
          {me ? (
            <Link href={`/helper/${me.id}`} className="flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
              <Bike className="size-3.5" /> Meri duty {myOffers > 0 && `(${myOffers})`}
            </Link>
          ) : (
            <span className="text-xs text-[#F4D58D]">
              {config.brideName} ♥ {config.groomName}
            </span>
          )}
        </header>
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="bg-card fixed inset-x-0 bottom-0 z-[900] grid grid-cols-5 border-t pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_10px_rgba(0,0,0,0.06)] md:hidden">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium", active ? "text-primary" : "text-muted-foreground")}
            >
              <item.icon className={cn("size-5", active && "text-primary")} />
              {item.short}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
