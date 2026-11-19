import { query } from "../util/db.js";

const toUser = (row, { includePassword = false } = {}) => {
  if (!row) return null;

  const user = {
    _id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  if (includePassword) user.password = row.password;

  return user;
};

const User = {
  async findById(id, { includePassword = false } = {}) {
    const result = await query("SELECT * FROM users WHERE id = $1", [id]);
    return toUser(result.rows[0], { includePassword });
  },

  async findByEmail(email, { includePassword = false } = {}) {
    const result = await query("SELECT * FROM users WHERE email = $1", [email]);
    return toUser(result.rows[0], { includePassword });
  },

  async create({ firstName, lastName, email, password }) {
    const result = await query(
      `INSERT INTO users (first_name, last_name, email, password)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [firstName, lastName, email, password]
    );
    return toUser(result.rows[0], { includePassword: true });
  },

  async updateById(id, { firstName, lastName }) {
    const result = await query(
      `UPDATE users
       SET first_name = $1, last_name = $2, updated_at = now()
       WHERE id = $3
       RETURNING *`,
      [firstName, lastName, id]
    );
    return toUser(result.rows[0]);
  },

  async updatePassword(id, password) {
    const result = await query(
      `UPDATE users
       SET password = $1, updated_at = now()
       WHERE id = $2
       RETURNING id`,
      [password, id]
    );
    return result.rowCount > 0;
  },
};

export default User;
