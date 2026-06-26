import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import pkg from "bcryptjs";
const { hash } = pkg;
import { PrismaClient } from "../generated/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("❌ DATABASE_URL missing from .env");

  const pool    = new pg.Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma  = new PrismaClient({ adapter } as any);

  try {
    console.log("🌱 Seeding database...");

    await prisma.systemSetting.upsert({
      where:  { key: "registration_mode" },
      update: {},
      create: { key: "registration_mode", value: "INVITE_ONLY" },
    });

    await prisma.systemSetting.upsert({
      where:  { key: "app_name" },
      update: {},
      create: { key: "app_name", value: "My App" },
    });

    const password   = await hash("SuperAdmin123!", 12);
    const superAdmin = await prisma.user.upsert({
      where:  { email: "superadmin@example.com" },
      update: { password },
      create: {
        email:         "superadmin@example.com",
        password,
        role:          "SUPER_ADMIN",
        accountStatus: "ACTIVE",
        firstName:     "Super",
        lastName:      "Admin",
        displayName:   "Super Admin",
      },
    });

    // Demo admin — separate account so reviewers have a stable login
    const demoPassword = await hash("Demo@Admin1", 12);
    const demoAdmin    = await prisma.user.upsert({
      where:  { email: "admin@kasifix.demo" },
      update: { password: demoPassword },
      create: {
        email:         "admin@kasifix.demo",
        password:      demoPassword,
        role:          "ADMIN",
        accountStatus: "ACTIVE",
        firstName:     "Demo",
        lastName:      "Admin",
        displayName:   "Demo Admin",
      },
    }); 

    console.log(`✅ Super admin: ${superAdmin.email}  →  SuperAdmin123!`);
    console.log(`✅ Demo admin:  ${demoAdmin.email}  →  Demo@Admin1`);
    console.log(`\n   Both passwords reset to defaults on every deploy.`);
  } catch (error: any) {
    console.error("❌ Seed error:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
