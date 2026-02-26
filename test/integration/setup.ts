import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { beforeAll, beforeEach } from "vitest";

const testDatabasePath = resolve(process.cwd(), "test", "test.db");
const migrationsFolder = resolve(process.cwd(), "drizzle");

process.env.DATABASE_URL = testDatabasePath;
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
process.env.BETTER_AUTH_SECRET ??= "integration-test-secret";

if (existsSync(testDatabasePath)) {
  rmSync(testDatabasePath);
}

const { db } = await import("@/db/client");
const { listings } = await import("@/db/schema");

beforeAll(async () => {
  migrate(db, { migrationsFolder });
});

beforeEach(async () => {
  await db.delete(listings);
});
