import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { resend } from "@/lib/email";
import { VerificationEmail } from "@/components/verification-email";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      const { error } = await resend.emails.send({
        from: "planToDO <noreply@mail.andro42.qzz.io>",
        to: [user.email],
        subject: "Verify your email — planToDO",
        react: VerificationEmail({ name: user.name ?? "", url }),
      });

      if (error) {
        console.error("sendVerificationEmail failed:", error);
        throw new Error(error.message ?? "Failed to send verification email");
      }
    },
  },
});
