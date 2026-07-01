import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      try {
        const res = await fetch(`${process.env.BETTER_AUTH_URL}/api/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            name: user.name ?? "",
            url,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => null);
          console.error("sendVerificationEmail failed", res.status, err);
        }
      } catch (e) {
        console.error("sendVerificationEmail error", e);
      }
    },
  },
});
