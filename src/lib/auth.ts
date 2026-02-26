import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "@/db/client";
import * as schema from "@/db/schema";

const betterAuthUrl = process.env.BETTER_AUTH_URL;
const betterAuthSecret = process.env.BETTER_AUTH_SECRET;

if (!betterAuthUrl) {
  throw new Error("BETTER_AUTH_URL is required.");
}

if (!betterAuthSecret) {
  throw new Error("BETTER_AUTH_SECRET is required.");
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
    camelCase: true,
  }),
  emailAndPassword: {
    enabled: true,
  },
  databaseHooks: {
    user: {
      create: {
        after: async (createdUser) => {
          const now = new Date();

          await db
            .insert(schema.profiles)
            .values({
              id: `prof_${createdUser.id}`,
              userId: createdUser.id,
              name: createdUser.name,
              image: createdUser.image,
              location: null,
              bio: null,
              createdAt: now,
              updatedAt: now,
            })
            .onConflictDoNothing({ target: schema.profiles.userId });
        },
      },
    },
  },
});
