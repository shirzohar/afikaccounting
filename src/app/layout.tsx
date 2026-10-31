import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Geist_Mono, Heebo } from "next/font/google";
import { MobileTabBar, MobileTabBarView } from "@/components/layout/continue";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { PageViewTracker } from "@/components/layout/page-view-tracker";
import { SearchPalette } from "@/components/layout/search";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { SITE_URL } from "@/lib/env";
import { site } from "@/lib/site";
import "./globals.css";

// Heebo covers Hebrew and Latin; numbers in tables use Geist Mono.
const heebo = Heebo({ variable: "--font-heebo", subsets: ["hebrew", "latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${site.name} — ${site.tagline}`, template: `%s · ${site.name}` },
  description: site.description,
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#050a17" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning className={`${heebo.variable} ${geistMono.variable} h-full`}>
      {/* Extensions such as Grammarly add attributes to <body> before React loads. */}
      <body suppressHydrationWarning className="flex min-h-full flex-col">
        <ThemeProvider>
          <a
            href="#main"
            className="sr-only z-50 rounded-lg bg-accent px-4 py-2 text-accent-fg focus:not-sr-only focus:fixed focus:top-3 focus:start-3"
          >
            דילוג לתוכן
          </a>
          <Navbar />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
          <Suspense fallback={<MobileTabBarView />}>
            <MobileTabBar />
          </Suspense>
          <SearchPalette />
          <Suspense fallback={null}>
            <PageViewTracker />
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
