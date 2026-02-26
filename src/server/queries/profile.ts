import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { profiles } from "@/db/schema";

export const getCurrentProfile = async (userId: string) => {
  return db.query.profiles.findFirst({
    where: eq(profiles.userId, userId),
  });
};
