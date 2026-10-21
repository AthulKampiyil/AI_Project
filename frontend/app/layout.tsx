import type { Metadata } from "next";
import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/shell/Sidebar";
import { TopBar } from "@/components/shell/TopBar";
import { BottomNav } from "@/components/shell/BottomNav";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const interTight = Inter_Tight({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
  weight: ["600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Latent Studio — DCGAN Face Lab",
  description:
    "Scientific exploration of 100-dimensional latent space, facial feature vector arithmetic, geodesic Slerp morphing, and test-time GAN inversion.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${interTight.variable} ${jetbrainsMono.variable} dark antialiased`}
    >
      <body className="bg-[#07080D] text-[#EDEEF3] min-h-screen flex selection:bg-[#8B7CFF]/30 selection:text-white">
        {/* Left Desktop Rail */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          <TopBar />
          <main className="flex-1 p-4 lg:p-8 pb-24 lg:pb-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        <BottomNav />
      </body>
    </html>
  );
}
