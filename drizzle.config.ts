import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // generate에는 불필요, migrate/studio에서만 사용된다
    url: process.env.DATABASE_URL ?? "",
  },
});
