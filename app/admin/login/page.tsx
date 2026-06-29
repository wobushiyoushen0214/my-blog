"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Loader2, LockKeyhole } from "lucide-react";

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
    <main className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-4xl items-center">
        <div className="w-full border bg-card">
          <div className="grid lg:grid-cols-[0.9fr_1fr]">
            <section className="border-b p-5 md:p-7 lg:border-b-0 lg:border-r">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <ArrowLeft className="h-4 w-4" suppressHydrationWarning />
                返回前台
              </Link>

              <div className="mt-10">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Admin
                </p>
                <h1 className="mt-2 font-serif text-4xl leading-none">
                  后台登录
                </h1>
                <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
                  使用管理员账号进入内容管理区。
                </p>
              </div>

              <div className="mt-10 divide-y divide-border/60 border-y border-border/70">
                <div className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 py-3 text-sm">
                  <span className="text-xs tabular-nums text-muted-foreground">
                    01
                  </span>
                  <span className="text-muted-foreground">文章、分类与标签</span>
                </div>
                <div className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 py-3 text-sm">
                  <span className="text-xs tabular-nums text-muted-foreground">
                    02
                  </span>
                  <span className="text-muted-foreground">评论审核与内容维护</span>
                </div>
              </div>
            </section>

            <section className="p-5 md:p-7">
              <div className="mb-6 flex items-start gap-3 border-b border-border/70 pb-4">
                <span className="flex size-9 shrink-0 items-center justify-center border bg-background text-muted-foreground">
                  <LockKeyhole className="h-4 w-4" suppressHydrationWarning />
                </span>
                <div>
                  <h2 className="text-base font-medium">登录凭据</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    请输入邮箱和密码。
                  </p>
                </div>
              </div>

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
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        suppressHydrationWarning
                      />
                      登录中...
                    </>
                  ) : (
                    "登录"
                  )}
                </Button>
              </form>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
