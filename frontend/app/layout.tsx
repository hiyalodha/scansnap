import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ScanSnap — Instant Food Intelligence",
  description: "Scan any food barcode for instant nutrition insights powered by AI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}