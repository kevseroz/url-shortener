import { existsSync } from "node:fs";

// Locally, `neon env pull` writes the connection strings to .env.local.
// On Render there's no file: the variables are set in its dashboard.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set. Run \`npx neon@latest env pull\` or set it on your host.`);
  // pg 8.23+ warns on sslmode=require; Neon recommends verify-full (same encryption, also checks the certificate).
  return value.replace("sslmode=require", "sslmode=verify-full");
}
