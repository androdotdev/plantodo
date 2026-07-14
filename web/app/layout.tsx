import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PostHTML — upload HTML plans, get a shareable URL",
  icons: {
    icon: "/icon.svg",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "PostHTML",
    description: "Give AI agents the ability to upload, edit, and share HTML plans programmatically via CLI.",
    images: [{ url: "/og.svg", width: 1200, height: 630 }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-bg-base text-text-primary">
        {children}
      </body>
    </html>
  );
}
