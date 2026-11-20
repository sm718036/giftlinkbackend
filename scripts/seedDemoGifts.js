/*jshint esversion: 8 */
/**
 * Seeds demo donors and gifts so the catalogue is never empty.
 *
 * Usage (from giftlinkbackend): npm run seed
 * Re-running is safe: existing demo gifts are left untouched and only
 * the missing ones are inserted.
 */
import bcryptjs from "bcryptjs";
import { connectToDatabase, closeDatabase, query } from "../util/db.js";

const DEMO_PASSWORD = "Giftlink123!";

const demoAccounts = [
  { firstName: "Priya", lastName: "Raman", email: "priya@giftlink.demo" },
  { firstName: "Daniel", lastName: "Okafor", email: "daniel@giftlink.demo" },
  { firstName: "Lena", lastName: "Fischer", email: "lena@giftlink.demo" },
];

const demoGifts = [
  {
    name: "Walnut bed frame",
    image: "/images/bed-frame.jpeg",
    description:
      "Solid walnut queen bed frame with a slatted base. Disassembles easily and all fixings are included.",
    ageInYears: 2,
    condition: "Like New",
    category: "Bedroom",
    address: "18 Cedar Street, San Francisco",
    zipCode: "94110",
    contactInfo: "priya@giftlink.demo",
    isTaken: false,
    ownerEmail: "priya@giftlink.demo",
  },
  {
    name: "Oak bookshelf",
    image: "/images/bookshelf1.jpeg",
    description:
      "Five-shelf oak bookcase, 180cm tall. One small chip at the back edge that is hidden against the wall.",
    ageInYears: 5,
    condition: "Older",
    category: "Office",
    address: "4 Larkspur Lane, San Francisco",
    zipCode: "94117",
    contactInfo: "daniel@giftlink.demo",
    isTaken: false,
    ownerEmail: "daniel@giftlink.demo",
  },
  {
    name: "Leather reading armchair",
    image: "/images/couch2.jpeg",
    description:
      "Comfortable leather armchair with wide arms. Honest wear on the seat, no tears and no smells.",
    ageInYears: 6,
    condition: "Older",
    category: "Living",
    address: "72 Alder Way, San Francisco",
    zipCode: "94114",
    contactInfo: "lena@giftlink.demo",
    isTaken: false,
    ownerEmail: "lena@giftlink.demo",
  },
  {
    name: "Ceramic table lamp",
    image: "/images/lamp.jpeg",
    description:
      "Hand-thrown ceramic lamp with a linen shade. Warm light, tested and working, bulb included.",
    ageInYears: 1,
    condition: "Like New",
    category: "Living",
    address: "18 Cedar Street, San Francisco",
    zipCode: "94110",
    contactInfo: "priya@giftlink.demo",
    isTaken: false,
    ownerEmail: "priya@giftlink.demo",
  },
  {
    name: "Extending dining table",
    image: "/images/dining-table.jpeg",
    description:
      "Seats four, extends to six with the leaf stored underneath. A few water marks on the top.",
    ageInYears: 7,
    condition: "Older",
    category: "Kitchen",
    address: "4 Larkspur Lane, San Francisco",
    zipCode: "94117",
    contactInfo: "daniel@giftlink.demo",
    isTaken: false,
    ownerEmail: "daniel@giftlink.demo",
  },
  {
    name: "Ergonomic desk chair",
    image: "/images/desk-chair.jpeg",
    description:
      "Adjustable height and lumbar support. Great for long work sessions, gas lift still firm.",
    ageInYears: 2,
    condition: "Like New",
    category: "Office",
    address: "72 Alder Way, San Francisco",
    zipCode: "94114",
    contactInfo: "lena@giftlink.demo",
    isTaken: false,
    ownerEmail: "lena@giftlink.demo",
  },
  {
    name: "Round side table",
    image: "/images/side-table.jpeg",
    description: "Unused round side table, 45cm across. Perfect next to a sofa or as a plant stand.",
    ageInYears: 0,
    condition: "New",
    category: "Living",
    address: "18 Cedar Street, San Francisco",
    zipCode: "94110",
    contactInfo: "priya@giftlink.demo",
    isTaken: false,
    ownerEmail: "priya@giftlink.demo",
  },
  {
    name: "Linen curtains",
    image: "/images/curtains1.jpeg",
    description:
      "Pair of lined linen curtains, 140 x 240cm. Freshly laundered and ready for a new window.",
    ageInYears: 3,
    condition: "Like New",
    category: "Bedroom",
    address: "4 Larkspur Lane, San Francisco",
    zipCode: "94117",
    contactInfo: "daniel@giftlink.demo",
    isTaken: false,
    ownerEmail: "daniel@giftlink.demo",
  },
  {
    name: "TV stand",
    image: "/images/tv-stand.jpeg",
    description:
      "Low media unit with two cupboards and a cable channel. Fits up to a 55 inch screen.",
    ageInYears: 4,
    condition: "Older",
    category: "Living",
    address: "72 Alder Way, San Francisco",
    zipCode: "94114",
    contactInfo: "lena@giftlink.demo",
    isTaken: false,
    ownerEmail: "lena@giftlink.demo",
  },
  {
    name: "Filing cabinet",
    image: "/images/filing-cabinet.jpeg",
    description:
      "Three-drawer metal filing cabinet with a working lock and key. A little scuffed on the base.",
    ageInYears: 8,
    condition: "Older",
    category: "Office",
    address: "18 Cedar Street, San Francisco",
    zipCode: "94110",
    contactInfo: "priya@giftlink.demo",
    isTaken: true,
    ownerEmail: "priya@giftlink.demo",
  },
];

async function seedUser(account, passwordHash) {
  const result = await query(
    `INSERT INTO users (first_name, last_name, email, password)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE
       SET first_name = EXCLUDED.first_name,
           last_name = EXCLUDED.last_name
     RETURNING id`,
    [account.firstName, account.lastName, account.email, passwordHash]
  );
  return result.rows[0].id;
}

async function seedGift(gift, ownerId) {
  const existing = await query("SELECT id FROM gifts WHERE posted_by = $1 AND name = $2", [
    ownerId,
    gift.name,
  ]);
  if (existing.rowCount) return false;

  await query(
    `INSERT INTO gifts
       (name, image, description, age_in_years, condition, category, posted_by,
        zip_code, address, contact_info, is_taken)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      gift.name,
      gift.image,
      gift.description,
      gift.ageInYears,
      gift.condition,
      gift.category,
      ownerId,
      gift.zipCode,
      gift.address,
      gift.contactInfo,
      gift.isTaken,
    ]
  );
  return true;
}

async function main() {
  await connectToDatabase();
  const passwordHash = await bcryptjs.hash(DEMO_PASSWORD, 10);

  const userIds = new Map();
  for (const account of demoAccounts) {
    userIds.set(account.email, await seedUser(account, passwordHash));
  }

  let inserted = 0;
  let skipped = 0;
  for (const gift of demoGifts) {
    const ownerId = userIds.get(gift.ownerEmail);
    const created = await seedGift(gift, ownerId);
    created ? inserted++ : skipped++;
  }

  const totals = await query("SELECT count(*)::int AS gifts FROM gifts");
  console.log(
    `Demo data ready: ${inserted} gift(s) added, ${skipped} already present, ` +
      `${totals.rows[0].gifts} gift(s) in total.`
  );
  console.log(`Demo donors can sign in with any @giftlink.demo email and password: ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error("Failed to seed demo gifts:", error.message);
    process.exitCode = 1;
  })
  .finally(() => closeDatabase());
