import { query } from "../util/db.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const toGift = (row) => {
  if (!row) return null;

  return {
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
  };
};

// Maps the API field names to their database columns.
const COLUMN_MAP = {
  name: "name",
  image: "image",
  description: "description",
  ageInYears: "age_in_years",
  condition: "condition",
  category: "category",
  zipCode: "zip_code",
  address: "address",
  contactInfo: "contact_info",
  isTaken: "is_taken",
};

const buildFilters = ({ name, category, condition, ageInYears, postedBy }) => {
  const conditions = [];
  const values = [];

  if (name) {
    values.push(`%${name}%`);
    conditions.push(`name ILIKE $${values.length}`);
  }
  if (category) {
    values.push(category);
    conditions.push(`category = $${values.length}`);
  }
  if (condition) {
    values.push(condition);
    conditions.push(`condition = $${values.length}`);
  }
  if (ageInYears) {
    values.push(ageInYears);
    conditions.push(`age_in_years <= $${values.length}`);
  }
  if (postedBy) {
    values.push(postedBy);
    conditions.push(`posted_by = $${values.length}`);
  }

  return {
    clause: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "",
    values,
  };
};

const Gift = {
  isValidId(id) {
    return typeof id === "string" && UUID_PATTERN.test(id);
  },

  async findById(id) {
    const result = await query("SELECT * FROM gifts WHERE id = $1", [id]);
    return toGift(result.rows[0]);
  },

  async findPage({ filters = {}, limit = 10, offset = 0 } = {}) {
    const { clause, values } = buildFilters(filters);

    const countResult = await query(
      `SELECT COUNT(*)::int AS total_count FROM gifts ${clause}`,
      values
    );

    const dataResult = await query(
      `SELECT * FROM gifts ${clause}
       ORDER BY created_at DESC, id
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset]
    );

    return {
      totalCount: countResult.rows[0].total_count,
      gifts: dataResult.rows.map(toGift),
    };
  },

  async create({
    name,
    image,
    description,
    ageInYears,
    condition,
    category,
    postedBy,
    zipCode,
    address,
    contactInfo,
  }) {
    const result = await query(
      `INSERT INTO gifts
        (name, image, description, age_in_years, condition, category, posted_by, zip_code, address, contact_info)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        name,
        image ?? null,
        description,
        ageInYears,
        condition,
        category,
        postedBy,
        zipCode ?? null,
        address ?? null,
        contactInfo,
      ]
    );
    return toGift(result.rows[0]);
  },

  async updateById(id, updates) {
    const assignments = [];
    const values = [];

    for (const [field, column] of Object.entries(COLUMN_MAP)) {
      if (updates[field] === undefined) continue;
      values.push(updates[field]);
      assignments.push(`${column} = $${values.length}`);
    }

    if (!assignments.length) {
      return this.findById(id);
    }

    values.push(id);
    const result = await query(
      `UPDATE gifts
       SET ${assignments.join(", ")}, updated_at = now()
       WHERE id = $${values.length}
       RETURNING *`,
      values
    );
    return toGift(result.rows[0]);
  },

  async deleteById(id) {
    const result = await query(
      "DELETE FROM gifts WHERE id = $1 RETURNING id",
      [id]
    );
    return result.rowCount > 0;
  },
};

export default Gift;
