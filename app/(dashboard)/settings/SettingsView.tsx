"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MapPinOff, RotateCcw, ShieldCheck, UserCog } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PageHeader } from "@/components/PageHeader";
import { WhatsAppCard } from "@/components/whatsapp/WhatsAppCard";
import { useShaadiStore } from "@/stores/useShaadiStore";
import { initials } from "@/lib/utils";

export function SettingsView() {
  const router = useRouter();
  const helpers = useShaadiStore((s) => s.helpers);
  const currentUser = useShaadiStore((s) => s.currentUser);
  const setCurrentUser = useShaadiStore((s) => s.setCurrentUser);
  const setSharing = useShaadiStore((s) => s.setHelperSharing);
  const setStatus = useShaadiStore((s) => s.setHelperStatus);
  const resetDemo = useShaadiStore((s) => s.resetDemo);

  const loginValue = currentUser.role === "organizer" ? "organizer" : currentUser.helperId;

  return (
    <>
      <PageHeader title="Settings" subtitle="Location sharing, login aur demo data" />
      <div className="grid gap-4 px-3 pb-8 md:px-6 lg:grid-cols-2">
        <Card className="lg:row-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="text-primary size-5" /> Location sharing
            </CardTitle>
            <CardDescription className="bg-secondary text-secondary-foreground rounded-md px-3 py-2 text-sm">
              Location sirf shaadi ke dinon mein, sirf aapki permission se.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-1">
            {helpers.map((h, i) => (
              <div key={h.id}>
                {i > 0 && <Separator className="my-2" />}
                <div className="flex items-center gap-3">
                  <Avatar className="size-9">
                    <AvatarFallback>{initials(h.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <Label htmlFor={`share-${h.id}`} className="font-medium">
                      {h.name}
                    </Label>
                    <p className="text-muted-foreground truncate text-xs">{h.relation}</p>
                  </div>
                  <Select
                    value={h.status}
                    onValueChange={(v) => {
                      setStatus(h.id, v as typeof h.status);
                      toast(`${h.name}: ${v === "free" ? "free" : v === "busy" ? "busy" : "unavailable"}`);
                    }}
                  >
                    <SelectTrigger size="sm" className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">🟢 Free</SelectItem>
                      <SelectItem value="busy">🟡 Busy</SelectItem>
                      <SelectItem value="unavailable">🔴 Unavailable</SelectItem>
                    </SelectContent>
                  </Select>
                  <Switch
                    id={`share-${h.id}`}
                    checked={h.locationSharing}
                    onCheckedChange={(on) => {
                      setSharing(h.id, on);
                      toast(on ? `${h.name} ki location ab map par dikhegi` : `${h.name} ki location band: map aur auto-assign se hata diya`);
                    }}
                    aria-label={`Location sharing for ${h.name}`}
                  />
                </div>
                {!h.locationSharing && (
                  <p className="text-muted-foreground mt-1 ml-12 flex items-center gap-1 text-xs">
                    <MapPinOff className="size-3" /> Map se chhupa hai, auto-assign skip karega
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="text-primary size-5" /> Login as
            </CardTitle>
            <CardDescription>Demo ke liye organizer ya kisi helper ke roop mein app dekhiye.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Select
              value={loginValue}
              onValueChange={(v) => {
                if (v === "organizer") {
                  setCurrentUser({ role: "organizer" });
                  toast.success("Ab aap Organizer hain");
                } else {
                  setCurrentUser({ role: "helper", helperId: v });
                  const h = helpers.find((x) => x.id === v);
                  toast.success(`Ab aap ${h?.name} hain`, { description: "Unka task view khul raha hai" });
                  router.push(`/helper/${v}`);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="organizer">👑 Organizer (Riya ke papa)</SelectItem>
                {helpers.map((h) => (
                  <SelectItem key={h.id} value={h.id}>
                    {h.name} · {h.relation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              Current: <Badge variant="secondary">{currentUser.role === "organizer" ? "Organizer" : helpers.find((h) => h.id === loginValue)?.name}</Badge>
            </p>
          </CardContent>
        </Card>

        <WhatsAppCard />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="text-primary size-5" /> Reset demo data
            </CardTitle>
            <CardDescription>Saare tasks, RSVPs, invite versions aur positions wapas seed data par.</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <RotateCcw /> Reset demo data
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Pakka reset karein?</DialogTitle>
                  <DialogDescription>Aapke saare badlaav mit jaayenge aur Riya-Arjun ka seed data wapas aa jayega.</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="ghost">Nahi</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        resetDemo();
                        toast.success("Demo data reset ho gaya");
                      }}
                    >
                      Haan, reset karo
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
