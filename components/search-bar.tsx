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
            placeholder="搜索文章..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-40 h-8 text-sm"
            autoFocus
            onBlur={() => {
              if (!query) setOpen(false);
            }}
          />
        </form>
      ) : (
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
          <Search className="h-5 w-5" />
          <span className="sr-only">搜索</span>
        </Button>
      )}
    </div>
  );
}
