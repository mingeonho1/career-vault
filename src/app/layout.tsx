import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MVP Factory",
  description: "주말마다 하나씩 배포하는 MVP",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
