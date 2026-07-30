import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "PGadm — Plomería García",
    template: "%s | PGadm",
  },
  description: "PWA de gestión para Plomería García — multi-sucursal, multi-agente",
  manifest: "/manifest.json",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1e40af",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <header className="border-b border-gray-200 bg-white">
          <nav className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
            <span className="font-bold text-lg text-blue-700">PGadm</span>
            <span className="text-sm text-gray-500">Fundación técnica</span>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-gray-200 bg-gray-50 py-4 text-center text-xs text-gray-400">
          PGadm — Plomería García PWA &copy; {new Date().getFullYear()}
        </footer>
      </body>
    </html>
  );
}
