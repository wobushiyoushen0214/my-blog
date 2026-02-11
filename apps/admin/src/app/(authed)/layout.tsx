import { AuthGate } from "@/components/AuthGate";

export const dynamic = "force-dynamic";

export default function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGate>{children}</AuthGate>;
}
