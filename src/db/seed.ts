import { auth } from "@/lib/auth";
import { db } from "./client";
import {
  account,
  listings,
  profiles,
  session,
  user,
  verification,
} from "./schema";

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

const seedUsers = [
  {
    name: "Bob Bobbity",
    email: "bob@test.com",
    image: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    name: "Alice Testford",
    email: "alice@test.com",
    image: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    name: "Charlie Example",
    email: "charlie@test.com",
    image: "https://randomuser.me/api/portraits/men/51.jpg",
  },
];

const sharedPassword = "Pa$$w0rd";

const seed = async () => {
  await db.delete(session);
  await db.delete(account);
  await db.delete(verification);
  await db.delete(profiles);
  await db.delete(user);
  await db.delete(listings);

  await db.insert(listings).values(seedListings);

  for (const seedUser of seedUsers) {
    await auth.api.signUpEmail({
      body: {
        name: seedUser.name,
        email: seedUser.email,
        password: sharedPassword,
        image: seedUser.image,
      },
    });
  }

  console.log(
    `Seeded ${seedListings.length} listings and ${seedUsers.length} auth users into SQLite database.`,
  );
  console.log(`Seeded user password: ${sharedPassword}`);
};

seed().catch((error: unknown) => {
  console.error("Failed to seed listings.", error);
  process.exit(1);
});
