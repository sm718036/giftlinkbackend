import Gift from "../models/gift.model.js";

const sampleGifts = [
  {
    sampleKey: "wooden-bookshelf",
    name: "Wooden bookshelf",
    image: "/images/bookshelf2.jpeg",
    description:
      "A sample listing showing a sturdy wooden bookshelf ready for a new home.",
    ageInYears: 2,
    condition: "Like New",
    category: "Living",
  },
  {
    sampleKey: "desk-chair",
    name: "Comfortable desk chair",
    image: "/images/desk-chair.jpeg",
    description:
      "A sample listing showing an adjustable chair suitable for a home office.",
    ageInYears: 1,
    condition: "Like New",
    category: "Office",
  },
  {
    sampleKey: "coffee-table",
    name: "Round coffee table",
    image: "/images/coffee-table.jpeg",
    description:
      "A sample listing showing a pre-loved coffee table with plenty of life left.",
    ageInYears: 4,
    condition: "Older",
    category: "Living",
  },
];

export const seedSampleGifts = async () => {
  await Gift.bulkWrite(
    sampleGifts.map((gift) => ({
      updateOne: {
        filter: { sampleKey: gift.sampleKey },
        update: {
          $set: {
            ...gift,
            isSample: true,
            isTaken: false,
            contactInfo: "Sample gift — not available to claim",
            address: "Sample listing",
          },
        },
        upsert: true,
      },
    })),
  );
};
