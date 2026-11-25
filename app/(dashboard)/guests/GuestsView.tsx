"use client";

import { PlaneLanding, UsersRound, UtensilsCrossed } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/PageHeader";
import { GuestTable } from "@/components/guests/GuestTable";
import { CateringCards } from "@/components/guests/CateringCards";
import { Arrivals } from "@/components/guests/Arrivals";
import { useShaadiStore } from "@/stores/useShaadiStore";

export function GuestsView() {
  const guests = useShaadiStore((s) => s.guests);
  const arriving = guests.filter((g) => g.arrival).length;
  return (
    <>
      <PageHeader title="Guests" subtitle={`${guests.length} parivaar · RSVP, khana aur arrivals`} />
      <div className="px-3 pb-6 md:px-6">
        <Tabs defaultValue="guests">
          <TabsList>
            <TabsTrigger value="guests">
              <UsersRound /> Guests
            </TabsTrigger>
            <TabsTrigger value="catering">
              <UtensilsCrossed /> Catering
            </TabsTrigger>
            <TabsTrigger value="arrivals">
              <PlaneLanding /> Arrivals ({arriving})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="guests">
            <GuestTable />
          </TabsContent>
          <TabsContent value="catering">
            <CateringCards />
          </TabsContent>
          <TabsContent value="arrivals">
            <Arrivals />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
