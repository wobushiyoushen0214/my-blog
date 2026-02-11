"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      {open ? (
        <form onSubmit={handleSearch} className="flex items-center gap-1">
          <Input
            type="text"
            placeholder="搜索..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-36 h-8 text-sm bg-muted/50 border-border/50"
            autoFocus
            onBlur={() => {
              if (!query) setOpen(false);
            }}
          />
        </form>
      ) : (
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(true)}>
          <Search className="h-4 w-4" suppressHydrationWarning />
          <span className="sr-only">搜索</span>
        </Button>
      )}
    </div>
  );
}
