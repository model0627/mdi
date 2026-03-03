import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MDI Dashboard",
  description: "Markdown-based Team Dashboard",
  openGraph: {
    title: "MDI Dashboard",
    description: "팀 작업과 현황을 한눈에 — Markdown-based Team Dashboard",
    url: "https://mdi-gamma.vercel.app",
    siteName: "MDI Dashboard",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "MDI Dashboard — Pixel Office",
      },
    ],
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "MDI Dashboard",
    description: "팀 작업과 현황을 한눈에 — Markdown-based Team Dashboard",
    images: ["/opengraph-image"],
  },
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
