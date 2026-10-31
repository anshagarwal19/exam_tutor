import type { Metadata } from "next";
import { Fraunces, Inter, Caveat, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import AuthShell from "@/components/AuthShell";

const display = Fraunces({ subsets: ["latin"], variable: "--font-display", weight: ["400", "600", "700"] });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const hand = Caveat({ subsets: ["latin"], variable: "--font-hand" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Concept Compass: an exam tutor that knows what you understand",
  description: "Adaptive Class 10 Physics practice. Finds your gaps, maps the concepts underneath, and fixes the reasoning behind wrong answers.",
};

// Runs before first paint so the saved theme is applied without a flash.
const themeScript = `try{var t=localStorage.getItem('cc-theme');if(t==='dark'){document.documentElement.classList.add('dark')}else if(t==='sepia'){document.documentElement.classList.add('sepia')}else if(!t&&matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.classList.add('dark')}}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${sans.variable} ${hand.variable} ${mono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <AuthShell>{children}</AuthShell>
      </body>
    </html>
  );
}
