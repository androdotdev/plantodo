import * as React from "react";

export function VerificationEmail({ name, url }: { name: string; url: string }) {
  return (
    <table
      role="presentation"
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      style={{ background: "#f5f5f5", padding: "40px 0" }}
    >
      <tbody>
        <tr>
          <td align="center">
            <table
              role="presentation"
              width={480}
              cellPadding={0}
              cellSpacing={0}
              style={{
                background: "#ffffff",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <tbody>
                <tr>
                  <td style={{ padding: "40px 36px 0" }}>
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 700,
                        color: "#18181b",
                        letterSpacing: "-0.3px",
                      }}
                    >
                      planToDO
                    </div>
                    <p
                      style={{
                        margin: "16px 0 0",
                        fontSize: 15,
                        lineHeight: 1.6,
                        color: "#52525b",
                      }}
                    >
                      Hi {name || "there"},
                    </p>
                    <p
                      style={{
                        margin: "8px 0 0",
                        fontSize: 15,
                        lineHeight: 1.6,
                        color: "#52525b",
                      }}
                    >
                      Click the button below to verify your email and start using planToDO.
                    </p>
                    <table
                      role="presentation"
                      cellPadding={0}
                      cellSpacing={0}
                      style={{ margin: "28px 0" }}
                    >
                      <tbody>
                        <tr>
                          <td align="center">
                            <a
                              href={url}
                              target="_blank"
                              style={{
                                display: "inline-block",
                                padding: "12px 28px",
                                background: "#18181b",
                                color: "#ffffff",
                                fontSize: 14,
                                fontWeight: 600,
                                borderRadius: 8,
                                textDecoration: "none",
                              }}
                            >
                              Verify email
                            </a>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        lineHeight: 1.5,
                        color: "#a1a1aa",
                      }}
                    >
                      Or paste this link in your browser:
                    </p>
                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: 13,
                        lineHeight: 1.5,
                        color: "#6366f1",
                        wordBreak: "break-all",
                      }}
                    >
                      {url}
                    </p>
                    <hr
                      style={{
                        border: "none",
                        borderTop: "1px solid #e4e4e7",
                        margin: "28px 0 0",
                      }}
                    />
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "16px 36px 32px" }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        color: "#a1a1aa",
                      }}
                    >
                      If you did not create this account, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  );
}
