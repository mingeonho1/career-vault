import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "이력 금고",
  description:
    "증명서를 한 번 올리면 AI가 이력 카드로 정리하고, 다음부턴 3초 복사로 꺼내 쓴다.",
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
