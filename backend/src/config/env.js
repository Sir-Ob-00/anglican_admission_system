import dotenv from "dotenv";

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/anglican-admission-system",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  jwtSecret: process.env.JWT_SECRET || "change_me_dev_secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 300),
  uploadMaxBytes: Number(process.env.UPLOAD_MAX_BYTES || 10 * 1024 * 1024),
  backupScheduleMinutes: Number(process.env.BACKUP_SCHEDULE_MINUTES || 0),
  bootstrapToken: process.env.BOOTSTRAP_TOKEN || "",
  trustProxy: process.env.TRUST_PROXY || "false",
  // Paystack configuration
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY || "",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
};
