import dotenv from "dotenv";
dotenv.config();

const requiredEnvironmentVariables = ["DASHBOARD_URL", "MONGO_URL", "JWT_SECRET"];
const missingEnvironmentVariables = requiredEnvironmentVariables.filter(
  (name) => !process.env[name]?.trim()
);

if (missingEnvironmentVariables.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvironmentVariables.join(", ")}`
  );
}

export const appConfig = {
  dashboardUrl: process.env.DASHBOARD_URL,
  dbUrl: process.env.MONGO_URL,
  JWTSecret: process.env.JWT_SECRET,
  port: process.env.PORT,
};
