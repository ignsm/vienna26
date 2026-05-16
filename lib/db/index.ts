import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.warn("DATABASE_URL is not set. DB-backed pages will fail until you set it in .env.local")
}

// Cache the postgres client across hot-reloads in dev to avoid leaking
// connection pools every time a module is touched. In production each
// serverless instance gets a fresh module load anyway.
const globalForPg = globalThis as unknown as {
  __pgClient?: ReturnType<typeof postgres>
}

const client =
  globalForPg.__pgClient ??
  postgres(connectionString ?? "postgres://placeholder/placeholder", {
    prepare: false,
    max: 3,
    idle_timeout: 20,
    connect_timeout: 10,
  })

if (process.env.NODE_ENV !== "production") {
  globalForPg.__pgClient = client
}

export const db = drizzle(client, { schema })
export * from "./schema"
