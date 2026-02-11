import type { VercelRequest, VercelResponse } from "@vercel/node";

export function sendJson(res: VercelResponse, status: number, body: unknown) {
  res.status(status).json(body);
}

export function sendError(res: VercelResponse, status: number, message: string) {
  sendJson(res, status, { error: message });
}

export async function readJsonBody(req: VercelRequest) {
  if (!req.body) return null;
  if (typeof req.body === "string") return JSON.parse(req.body) as unknown;
  return req.body as unknown;
}

