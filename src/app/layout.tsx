import type { Metadata } from "next";
import { Actor, Geist_Mono } from "next/font/google";
import { TopNav } from "@/components/layout/TopNav";
import "./globals.css";

const actor = Actor({
  weight: "400",
  variable: "--font-actor",
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
      className={`${actor.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-[100dvh] selection:bg-primary/30 bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SettingsProvider settings={settings}>
            <div className="w-full md:max-w-[80%] mx-auto px-5 md:px-10 pt-8 pb-16">
              <TopNav />
              <main>{children}</main>
            </div>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
