import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { Montagu_Slab, Quicksand } from "next/font/google"
import "./globals.css";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Load Montagu Slab for headings
const montaguSlab = Montagu_Slab({
  variable: "--font-montagu-slab",
  subsets: ["latin"],
})

// Load Quicksand for body text
const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "NEO",
  description: "Meet NEO, your AI-powered personal coach",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${montaguSlab.variable} ${quicksand.variable} font-sans antialiased dark`}
      >
        <Toaster position="top-center" />
        {process.env.NODE_ENV !== "production" ? (
          <div className="fixed bottom-4 right-4 z-50">
            <Link
              href="/lab"
              className="rounded-md border border-border bg-background/90 px-3 py-1 text-sm font-medium shadow-md backdrop-blur transition hover:bg-background"
            >
              Prompt Lab
            </Link>
          </div>
        ) : null}
        {children}
      </body>
    </html>
  );
}
