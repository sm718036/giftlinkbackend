import { query } from "../util/db.js";

const toGift = (row) => ({
  _id: row.id,
  name: row.name,
  image: row.image,
  description: row.description,
  ageInYears: row.age_in_years,
  condition: row.condition,
  category: row.category,
  postedBy: row.posted_by,
  zipCode: row.zip_code,
  address: row.address,
  contactInfo: row.contact_info,
  isTaken: row.is_taken,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const Wishlist = {
  async listByUser(userId) {
    const result = await query(
      `SELECT g.*
       FROM wishlist w
       JOIN gifts g ON g.id = w.gift_id
       WHERE w.user_id = $1
       ORDER BY w.created_at DESC`,
      [userId]
    );
    return result.rows.map(toGift);
  },

  async add(userId, giftId) {
    const result = await query(
      `INSERT INTO wishlist (user_id, gift_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, gift_id) DO NOTHING
       RETURNING gift_id`,
      [userId, giftId]
    );
    return result.rowCount > 0;
  },

  async remove(userId, giftId) {
    const result = await query(
      "DELETE FROM wishlist WHERE user_id = $1 AND gift_id = $2 RETURNING gift_id",
      [userId, giftId]
    );
    return result.rowCount > 0;
  },
};

export default Wishlist;
