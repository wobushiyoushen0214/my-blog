export function mustGetEnv(name: string) {
  const value = process.env[name];
  if (!value || value.trim().length === 0) throw new Error(`Missing ${name}`);
  return value;
}

export function getOptionalEnv(name: string) {
  const value = process.env[name];
  if (!value || value.trim().length === 0) return null;
  return value;
}

