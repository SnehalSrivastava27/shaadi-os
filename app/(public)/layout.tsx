import { StoreHydrator } from "@/components/StoreHydrator";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <StoreHydrator>{children}</StoreHydrator>;
}
