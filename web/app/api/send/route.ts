import { NextRequest } from "next/server";
import { VerificationEmail } from "@/components/verification-email";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email, name, url, subject } = await request.json();

    const { data, error } = await resend.emails.send({
      from: "planToDO <noreply@mail.andro42.qzz.io>",
      to: [email],
      subject: subject ?? "Verify your email — planToDO",
      react: VerificationEmail({ name: name ?? "", url }),
    });
    if (error) {
      return Response.json({
        error: error?.message ?? error?.name ?? `${error}`,
      }, { status: 500 });
    }

    return Response.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : `Unknown error: ${e}`;
    return Response.json({ error: msg }, { status: 500 });
  }
}
