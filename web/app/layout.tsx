import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "./theme-provider";

export const metadata: Metadata = {
  title: "PostHTML — upload HTML posts, get a shareable URL",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png" },
      { url: "/icon-180x180.png", sizes: "180x180", type: "image/png" },
    ],
  },
  themeColor: "#0a0a0a",
  openGraph: {
    title: "PostHTML",
    description: "Give AI agents the ability to upload, edit, and share HTML posts programmatically via CLI.",
    images: [{ url: "/og.svg", width: 1200, height: 630 }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-bg-base text-text-primary">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
