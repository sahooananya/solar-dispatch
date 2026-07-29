import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required"),

  JWT_SECRET: z
    .string()
    .min(16, "JWT_SECRET must contain at least 16 characters"),

  JWT_EXPIRES_IN: z
    .string()
    .default("12h"),

  PORT: z.coerce
    .number()
    .int()
    .positive()
    .default(8001),

  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  CLIENT_URL: z
    .string()
    .default("http://localhost:3000"),

  LOG_LEVEL: z
    .string()
    .default("info"),

  AUTH_RATE_LIMIT_MAX_REQUESTS: z.coerce
    .number()
    .int()
    .positive()
    .default(100),
});

const parsedEnvironment = envSchema.safeParse(process.env);

if (!parsedEnvironment.success) {
  console.error(
    "Invalid environment variables:",
    parsedEnvironment.error.flatten().fieldErrors,
  );

  process.exit(1);
}

export const env = parsedEnvironment.data;