import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors, handleOptions } from "../src/lib/cors";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;
  applyCors(req, res);

  res.status(200).json({
    ok: true,
    now: new Date().toISOString(),
  });
}

