"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      const ok = Boolean(data.session?.access_token);
      setAuthed(ok);
      setReady(true);
      if (!ok && pathname !== "/login") router.replace("/login");
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const ok = Boolean(session?.access_token);
      setAuthed(ok);
      setReady(true);
      if (!ok && pathname !== "/login") router.replace("/login");
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, [pathname, router, supabase]);

  if (!ready) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-300">
        正在加载...
      </div>
    );
  }

  if (!authed && pathname !== "/login") return null;

  return <>{children}</>;
}

