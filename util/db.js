import { Pool } from "pg";
import { appConfig } from "../config/appConfig.js";

const pool = new Pool({
  connectionString: appConfig.dbUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on("error", (err) =>
  console.error("Unexpected PostgreSQL pool error:", err.message)
);

const schema = `
  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS gifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    image TEXT,
    description TEXT NOT NULL,
    age_in_years INTEGER NOT NULL,
    condition TEXT NOT NULL,
    category TEXT NOT NULL,
    posted_by UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    zip_code TEXT,
    address TEXT,
    contact_info TEXT NOT NULL,
    is_taken BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  ALTER TABLE gifts ADD COLUMN IF NOT EXISTS address TEXT;
  ALTER TABLE gifts ADD COLUMN IF NOT EXISTS is_taken BOOLEAN NOT NULL DEFAULT false;

  CREATE INDEX IF NOT EXISTS gifts_posted_by_idx ON gifts (posted_by);
  CREATE INDEX IF NOT EXISTS gifts_created_at_idx ON gifts (created_at DESC);

  CREATE TABLE IF NOT EXISTS wishlist (
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    gift_id UUID NOT NULL REFERENCES gifts (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, gift_id)
  );

  CREATE INDEX IF NOT EXISTS wishlist_user_idx ON wishlist (user_id);
`;

export const query = (text, params) => pool.query(text, params);

export const closeDatabase = () => pool.end();

export const connectToDatabase = async () => {
  try {
    const client = await pool.connect();
    try {
      await client.query(schema);
    } finally {
      client.release();
    }
    console.log("PostgreSQL connected and schema is ready");
  } catch (error) {
    let message = `Could not connect to PostgreSQL: ${error.message}`;

    if (error.code === "ECONNREFUSED") {
      message = `Could not connect to PostgreSQL at the configured DATABASE_URL (connection refused). Is the database server running?`;
    } else if (error.code === "ENOTFOUND") {
      message = `Could not resolve the PostgreSQL host in DATABASE_URL. Check the host name in your .env file.`;
    } else if (error.code === "28P01") {
      message = `PostgreSQL rejected the credentials in DATABASE_URL (wrong username or password).`;
    } else if (error.code === "3D000") {
      message = `The PostgreSQL database named in DATABASE_URL does not exist. Create it first, then restart the server.`;
    } else if (error.code === "42501") {
      message = `The PostgreSQL user does not have permission to create the GiftLink tables.`;
    }

    console.error("Database startup error:", message);
    throw new Error(message);
  }
};
