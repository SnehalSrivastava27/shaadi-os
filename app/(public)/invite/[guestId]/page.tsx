import type { Metadata } from "next";
import { InvitePage } from "./InvitePage";

export const metadata: Metadata = {
  title: "Aapko sadar aamantrit kiya jaata hai | Shaadi OS",
  description: "Shubh Vivah: personal wedding invitation and RSVP",
};

export default async function Page({ params }: { params: Promise<{ guestId: string }> }) {
  const { guestId } = await params;
  return <InvitePage guestId={guestId} />;
}
