import { drizzle } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"
import { schemaRelations } from "./relations"

const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle({ client: sql, relations: schemaRelations })

