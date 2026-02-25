import { sql } from "drizzle-orm";

import { db } from "./client";
import { listings } from "./schema";

const seedListings = [
  {
    id: "LST-001",
    title: "Mid-Century Lounge Chair",
    content:
      "Walnut frame with original leather upholstery in very good condition.",
    createdAt: new Date("2026-02-15T10:30:00.000Z"),
    image: "https://picsum.photos/id/1062/900/600",
  },
  {
    id: "LST-002",
    title: "Vintage Camera Set",
    content:
      "35mm analog camera with two prime lenses, case, and original manuals.",
    createdAt: new Date("2026-02-18T14:45:00.000Z"),
    image: "https://picsum.photos/id/250/900/600",
  },
  {
    id: "LST-003",
    title: "Abstract Canvas Painting",
    content:
      "Signed mixed-media artwork featuring bold geometric forms and color.",
    createdAt: new Date("2026-02-22T09:15:00.000Z"),
    image: "https://picsum.photos/id/1025/900/600",
  },
];

const seed = async () => {
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS listings (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      image TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);

  await db.delete(listings);
  await db.insert(listings).values(seedListings);

  console.log(`Seeded ${seedListings.length} listings into SQLite database.`);
};

seed().catch((error: unknown) => {
  console.error("Failed to seed listings.", error);
  process.exit(1);
});
