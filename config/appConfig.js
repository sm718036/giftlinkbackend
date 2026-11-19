import dotenv from "dotenv";
dotenv.config();

export const appConfig = {
  dashboardUrl: process.env.DASHBOARD_URL,
  dbUrl: process.env.DATABASE_URL,
  JWTSecret: process.env.JWT_SECRET,
  port: process.env.PORT,
  resendApiKey: process.env.RESEND_API_KEY,
};
