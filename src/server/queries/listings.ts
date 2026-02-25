import { desc } from "drizzle-orm";

import { db } from "@/db/client";
import { listings } from "@/db/schema";

export const getListings = async () => {
  return db.select().from(listings).orderBy(desc(listings.createdAt));
};
