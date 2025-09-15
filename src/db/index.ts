import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema/schema";
import * as userSchema from "./schema/auth-schema";

export const getDB = () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  const client = createClient({ url: databaseUrl });
  return drizzle(
    client,

    {
      schema: {
        ...schema,
        ...userSchema,
      },
    }
  );
};

// Export schema for use in other files
export * from "./schema/schema";
export * from "./schema/auth-schema";
