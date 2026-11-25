import { ClipboardList, Globe, LayoutDashboard, Settings, Users } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/", label: "Control Room", short: "Control", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", short: "Tasks", icon: ClipboardList },
  { href: "/guests", label: "Guests", short: "Guests", icon: Users },
  { href: "/website", label: "Website", short: "Website", icon: Globe },
  { href: "/settings", label: "Settings", short: "Settings", icon: Settings },
] as const;
