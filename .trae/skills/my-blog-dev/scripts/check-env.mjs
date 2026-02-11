const requiredKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SITE_URL",
];

const missing = requiredKeys.filter((key) => !process.env[key]);

if (missing.length > 0) {
  process.stderr.write(
    `Missing required environment variables:\n${missing.map((k) => `- ${k}`).join("\n")}\n`
  );
  process.exit(1);
}

process.stdout.write("All required environment variables are present.\n");
