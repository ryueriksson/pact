import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function databaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return undefined;

  // Recommended for Supabase pooler + Vercel serverless
  if (url.includes("pgbouncer=true") && !url.includes("connection_limit=")) {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}connection_limit=1`;
  }

  return url;
}

const prisma =
  globalThis.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: databaseUrl()
      ? {
          db: { url: databaseUrl() },
        }
      : undefined,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export { prisma };
