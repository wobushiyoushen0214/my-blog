"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Tags,
  MessageSquare,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/posts", label: "文章管理", icon: FileText },
  { href: "/admin/categories", label: "分类管理", icon: FolderOpen },
  { href: "/admin/tags", label: "标签管理", icon: Tags },
  { href: "/admin/comments", label: "评论管理", icon: MessageSquare },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  return (
    <aside className="flex w-full shrink-0 flex-col border-b bg-card md:h-screen md:w-64 md:border-b-0 md:border-r">
      <div className="flex h-14 items-center justify-between border-b px-4 md:h-16">
        <Link
          href="/admin"
          className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <span className="flex size-6 items-center justify-center rounded-md bg-primary text-[13px] font-bold text-primary-foreground">
            L
          </span>
          <span className="text-sm font-semibold tracking-tight">Blog Admin</span>
        </Link>
        <ThemeToggle />
      </div>
      <nav className="flex gap-1 overflow-x-auto p-3 md:flex-1 md:flex-col md:overflow-visible md:p-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" suppressHydrationWarning />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="hidden space-y-2 border-t p-4 md:block">
        <Link
          href="/"
          className="flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <ChevronLeft className="h-4 w-4" suppressHydrationWarning />
          返回前台
        </Link>
        <button
          onClick={handleLogout}
          className="flex h-9 w-full items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <LogOut className="h-4 w-4" suppressHydrationWarning />
          退出登录
        </button>
      </div>
    </aside>
  );
}
