"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

const LOGIN_ERROR_ID = "login-error";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const clearError = () => {
    if (errorMessage) setErrorMessage("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      const message = "登录失败，请检查邮箱和密码后重试。";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    router.push("/admin");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <ArrowLeft className="h-4 w-4" suppressHydrationWarning />
          返回前台
        </Link>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex size-9 items-center justify-center border bg-foreground text-sm font-bold text-background">
            L
          </div>
          <h1 className="font-serif text-3xl leading-none">后台登录</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            登录后可以管理文章、分类、标签和评论。
          </p>
        </div>
        <div className="border bg-card p-5">
          <form onSubmit={handleLogin} className="space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearError();
                }}
                placeholder="admin@example.com"
                autoComplete="email"
                disabled={loading}
                aria-invalid={Boolean(errorMessage)}
                aria-describedby={errorMessage ? LOGIN_ERROR_ID : undefined}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearError();
                }}
                placeholder="输入密码"
                autoComplete="current-password"
                disabled={loading}
                aria-invalid={Boolean(errorMessage)}
                aria-describedby={errorMessage ? LOGIN_ERROR_ID : undefined}
                required
              />
            </div>
            <div id={LOGIN_ERROR_ID} aria-live="polite" className="min-h-5">
              {errorMessage ? (
                <p className="border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {errorMessage}
                </p>
              ) : null}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" suppressHydrationWarning />
                  登录中...
                </>
              ) : (
                "登录"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
