import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import { resend } from "@/lib/email"
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
    sendVerificationEmail: async ({user, url}, request) => {
      await resend.emails.send({
        from: "ptd <noreplay@mail.andro42.qzz.io>",
        to: user.email,
        subject: "Verify your email address",
        html: `<a href="${url}">Verify Email</a>`,
      })
    }
  },
});


