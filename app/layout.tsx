import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Gestión de turnos",
    template: "%s · Gestión de turnos",
  },
  description: "Panel operativo para reservas, canchas y torneos.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${jetBrainsMono.variable} h-full`}
    >
      <body className="min-h-dvh bg-canvas text-ink">{children}</body>
    </html>
  );
}
