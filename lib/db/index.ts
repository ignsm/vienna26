import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  // Defer the error until first use rather than crashing at boot — lets the
  // landing page render even when DATABASE_URL is not set yet.
  console.warn("DATABASE_URL is not set. DB-backed pages will fail until you set it in .env.local")
}

const client = postgres(connectionString ?? "postgres://placeholder/placeholder", {
  prepare: false,
  max: 5,
})

export const db = drizzle(client, { schema })
export * from "./schema"
