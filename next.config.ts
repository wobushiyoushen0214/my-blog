import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = (() => {
  if (!supabaseUrl) return null;
  try {
    return new URL(supabaseUrl).hostname;
  } catch {
    return null;
  }
})();

const supabaseHostnames = Array.from(
  new Set([supabaseHostname, "**.supabase.co"].filter(Boolean))
) as string[];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHostnames.flatMap((hostname) => [
      {
        protocol: "https",
        hostname,
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname,
        pathname: "/storage/v1/object/sign/**",
      },
    ]),
  },
};

export default nextConfig;
