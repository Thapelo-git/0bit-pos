import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import { PrismaClient } from "./generated/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// Re-export everything from generated client so consumers
// can import types directly from @repo/database
export * from "./generated/client.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("❌ [Database] DATABASE_URL is missing.");
}

const pool = new pg.Pool({
  connectionString,
  max: 3,                          // free tier: keep connections low
  idleTimeoutMillis: 10000,        // release idle connections quickly
  connectionTimeoutMillis: 15000,  // give more time on cold reconnect
  allowExitOnIdle: false,
});

// Prevent unhandled pool errors from crashing the process
pool.on("error", (err) => {
  console.error("[db-pool] idle client error:", err.message);
});

const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;