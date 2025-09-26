import type { Metadata } from "next";
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
        {children}
      </body>
    </html>
  );
}
