import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Sidebar } from "@/components/layout/Sidebar";
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
  title: "Cabridget | Macro Tracker",
  description: "High-level financial trajectory tracker",
};

// Root layout reads Settings from the database on every request; forcing
// dynamic rendering stops Next.js from trying to prerender routes that use
// this layout (e.g. /_not-found) at build time, when no database is reachable.
export const dynamic = "force-dynamic";

import { getSettings } from "@/actions/settings";
import { SettingsProvider } from "@/components/providers/SettingsProvider";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

import { ThemeProvider } from "@/components/providers/ThemeProvider";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSettings();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-[100dvh] antialiased`}
    >
      <body className="h-[100dvh] flex flex-col md:flex-row overflow-hidden selection:bg-primary/30 bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SettingsProvider settings={settings}>
            <Sidebar />
            
            <main className="flex-1 overflow-y-auto relative pb-24 md:pb-0">
              <div className="container mx-auto max-w-5xl p-4 md:p-8">
                {children}
              </div>
            </main>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
