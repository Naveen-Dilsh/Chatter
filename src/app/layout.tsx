import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito, Abhaya_Libre } from "next/font/google";
import "./globals.css";

// Friendly rounded display font for headings + a warm, readable body font.
const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

// Nunito/Fredoka have no Sinhala glyphs, so Sinhala text falls through to this.
// Abhaya Libre = the classical Sinhala serif (FM Abhaya revival) — Latin stays
// in Nunito/Fredoka because they sit earlier in the font stack.
const abhayaLibre = Abhaya_Libre({
  variable: "--font-sinhala",
  subsets: ["sinhala"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Kapruu — Your Kapruka Shopping Companion",
  description:
    "Chat with Kapruu to discover flowers, cakes, chocolates and gifts from Kapruka — delivered across Sri Lanka.",
  openGraph: {
    title: "Kapruu — Your Kapruka Shopping Companion",
    description:
      "Chat with Kapruu to discover flowers, cakes, chocolates and gifts from Kapruka — delivered across Sri Lanka.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#fff7ea",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fredoka.variable} ${nunito.variable} ${abhayaLibre.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
