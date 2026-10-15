import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TataDana — Catat Keuangan Semudah Chat Langsung dari Telegram",
  description:
    "TataDana adalah aplikasi manajemen keuangan pribadi yang terintegrasi dengan Telegram Bot. Catat pemasukan, pengeluaran, dan scan struk langsung dari chat Telegram.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${jakarta.variable} scroll-smooth`}>
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🍊</text></svg>" />
      </head>
      <body className="font-sans antialiased bg-white text-zinc-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
