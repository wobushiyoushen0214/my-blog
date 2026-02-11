import Link from "next/link";
import { Rss } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">My Blog</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              分享技术、生活与思考。
              <br />
              用文字记录成长的每一步。
            </p>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">导航</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  首页
                </Link>
              </li>
              <li>
                <Link href="/category" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  分类
                </Link>
              </li>
              <li>
                <Link href="/tag" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  标签
                </Link>
              </li>
              <li>
                <Link href="/search" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  搜索
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">订阅</h3>
            <Link
              href="/rss.xml"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Rss className="h-4 w-4" />
              RSS Feed
            </Link>
          </div>
        </div>
        <div className="mt-10 border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} My Blog. All rights reserved.
          </p>
          <Link
            href="/admin"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            管理后台
          </Link>
        </div>
      </div>
    </footer>
  );
}
