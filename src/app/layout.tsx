import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Khmer Voice Generator",
  description: "Turn Khmer text into clear, natural speech.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
