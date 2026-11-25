import { HelperView } from "./HelperView";

export default async function HelperPage({ params }: { params: Promise<{ helperId: string }> }) {
  const { helperId } = await params;
  return <HelperView helperId={helperId} />;
}
