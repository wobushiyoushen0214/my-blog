import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import Link from "next/link";

const links = [
  {
    name: "示例友链",
    url: "https://example.com",
    description: "把你的友链信息补到 app/links/page.tsx 里",
  },
];

export default async function LinksPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-[1440px] px-4 md:px-6 py-12 md:py-16">
        <div className="max-w-3xl">
          <h1 className="text-2xl md:text-3xl font-bold mb-3">友链</h1>
          <p className="text-muted-foreground mb-10">
            欢迎互换友链：站点名称、链接、简介（可选）
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {links.map((item) => (
              <div key={item.url} className="rounded-lg border p-5">
                <div className="font-medium mb-1">
                  <Link
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline"
                  >
                    {item.name}
                  </Link>
                </div>
                {item.description && (
                  <div className="text-sm text-muted-foreground">
                    {item.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
