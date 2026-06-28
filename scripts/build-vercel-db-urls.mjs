#!/usr/bin/env node
/**
 * Build Vercel DATABASE_URL + DIRECT_URL using Supabase pooler + postgres role.
 * Requires SUPABASE_POSTGRES_PASSWORD in .env (from Supabase Dashboard → Database).
 */
import fs from "node:fs";
import path from "node:path";

const PROJECT_REF = "fcwglkzfbnardhfymkah";
const POOLER_HOST = "aws-1-eu-north-1.pooler.supabase.com";

function loadEnvValue(key) {
  const envPath = path.join(process.cwd(), ".env");
  const text = fs.readFileSync(envPath, "utf8");
  const line = text.split("\n").find((l) => l.startsWith(`${key}=`));
  if (!line) return "";
  const raw = line.slice(key.length + 1).trim();
  if (raw.startsWith('"') && raw.endsWith('"')) return raw.slice(1, -1);
  return raw;
}

const password = loadEnvValue("SUPABASE_POSTGRES_PASSWORD");
if (!password) {
  throw new Error(
    "SUPABASE_POSTGRES_PASSWORD is empty. Copy the Database password from Supabase → Settings → Database into .env, then re-run this script."
  );
}

const poolUser = `postgres.${PROJECT_REF}`;

// Session pooler (5432) — works for this project's aws-1 tenant on Vercel/serverless.
const pool = new URL(`postgresql://${encodeURIComponent(poolUser)}@${POOLER_HOST}:5432/postgres`);
pool.password = password;
pool.searchParams.set("connection_limit", "1");

// Direct host for migrations / prisma db push when run against production.
const direct = new URL(`postgresql://postgres@db.${PROJECT_REF}.supabase.co:5432/postgres`);
direct.password = password;

process.stdout.write(`${pool.toString()}\n${direct.toString()}\n`);
