import { db } from "@/lib/db/client";

export const getPublicListings = async () => {
  return db.query.listings.findMany({
    where: (listing, { ne }) => ne(listing.status, "Draft"),
    with: {
      images: {
        where: (images, { eq }) => eq(images.isMain, true),
        orderBy: (images, { desc: orderDesc }) => [orderDesc(images.createdAt)],
      },
      seller: true,
    },
    orderBy: (listing, { desc }) => [desc(listing.createdAt)],
  });
};
