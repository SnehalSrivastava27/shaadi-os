import type { Metadata } from "next";
import { InvitePage } from "./InvitePage";

export const metadata: Metadata = {
  title: "You're Invited | Shaadi OS",
  description: "Personal wedding invitation and RSVP",
};

export default async function Page({ params }: { params: Promise<{ guestId: string }> }) {
  const { guestId } = await params;
  return <InvitePage guestId={guestId} />;
}
