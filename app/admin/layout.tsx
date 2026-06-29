"use client";

import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/admin/sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <AdminSidebar />
      <main className="min-w-0 flex-1 overflow-y-auto px-4 py-5 md:p-6">
        <div className="mx-auto w-full max-w-[1320px]">{children}</div>
      </main>
    </div>
  );
}
