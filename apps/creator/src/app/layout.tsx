import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Instrument_Serif, JetBrains_Mono } from "next/font/google";

import "./globals.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-instrument-sans",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://rupakarsa.id"),
  title: {
    default: "Rupakarsa Creator — Dari karsa menjadi karya",
    template: "%s · Rupakarsa Creator",
  },
  description:
    "Ruang produksi visual berbasis AI untuk tim kreator: folder proyek, plan sinematik, render AI, dan token dalam satu workspace.",
  applicationName: "Rupakarsa Creator",
  keywords: [
    "Rupakarsa",
    "AI video generator",
    "AI image generator",
    "creator workspace",
    "Plan Mode",
    "Implement Mode",
  ],
  authors: [{ name: "Rupakarsa" }],
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://rupakarsa.id",
    siteName: "Rupakarsa Creator",
    title: "Rupakarsa Creator — Dari karsa menjadi karya",
    description:
      "Dari ide menjadi karya. Satu workspace untuk plan, render, dan kelola aset visual tim kreator.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rupakarsa Creator — Dari karsa menjadi karya",
    description:
      "Dari ide menjadi karya. Satu workspace untuk plan, render, dan kelola aset visual tim kreator.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#f3f0e8",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      className={`${instrumentSans.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-canvas font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
