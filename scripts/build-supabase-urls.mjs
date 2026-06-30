#!/usr/bin/env node
/**
 * Build DATABASE_URL + DIRECT_URL for Vercel/serverless from local .env.
 * pact_app only works on Supabase direct host (db.*), not the pooler username format.
 */
import fs from "node:fs";
import path from "node:path";

function loadEnvValue(key) {
  const envPath = path.join(process.cwd(), ".env");
  const text = fs.readFileSync(envPath, "utf8");
  const line = text.split("\n").find((l) => l.startsWith(`${key}=`));
  if (!line) throw new Error(`${key} not found in .env`);
  return line.slice(key.length + 1).trim().replace(/^"|"$/g, "");
}

function withConnectionLimit(urlString) {
  const url = new URL(urlString);
  if (!url.searchParams.has("connection_limit")) {
    url.searchParams.set("connection_limit", "1");
  }
  return url.toString();
}

function resolveDirectUrl() {
  const direct = loadEnvValue("DIRECT_URL");
  const directUrl = new URL(direct);
  if (directUrl.hostname.startsWith("db.")) {
    return withConnectionLimit(direct);
  }

  const database = loadEnvValue("DATABASE_URL");
  const databaseUrl = new URL(database);
  if (databaseUrl.hostname.startsWith("db.")) {
    return withConnectionLimit(database);
  }

  throw new Error(
    "Expected pact_app direct Supabase URL (db.[ref].supabase.co) in DATABASE_URL or DIRECT_URL"
  );
}

const direct = resolveDirectUrl();
process.stdout.write(`${direct}\n${direct}\n`);
