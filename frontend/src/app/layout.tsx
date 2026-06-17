import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";

export const metadata: Metadata = {
  title: "KursAI - AI Business Assistant UMKM",
  description: "AI Business Assistant untuk UMKM Indonesia. Catat transaksi, kelola stok, buat invoice dengan AI.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0F1117",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <PwaInstallPrompt />
        </ThemeProvider>
      </body>
    </html>
  );
}
