import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MDI Dashboard",
  description: "Markdown-based Team Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
