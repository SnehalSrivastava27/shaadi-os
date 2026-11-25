import { AppShell } from "@/components/shell/AppShell";
import { StoreHydrator } from "@/components/StoreHydrator";
import { SimulationEngine } from "@/components/SimulationEngine";
import { FallbackDialog } from "@/components/tasks/FallbackDialog";
import { GuestMessageDialog } from "@/components/tasks/GuestMessageDialog";
import { WhatsAppAgent } from "@/components/whatsapp/WhatsAppAgent";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreHydrator>
      <SimulationEngine />
      <WhatsAppAgent />
      <AppShell>{children}</AppShell>
      <FallbackDialog />
      <GuestMessageDialog />
    </StoreHydrator>
  );
}
