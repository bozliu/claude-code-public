import type { Metadata } from "next";
import { IBM_Plex_Mono, Sora } from "next/font/google";
import type { ReactNode } from "react";

import { SiteFooter } from "../components/site-chrome";
import { getSiteData } from "../lib/site-data";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sans",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://public-rouge-one.vercel.app"),
  title: "Claude Code Unpacked",
  description:
    "A source-backed explorer for the reverse-engineered Claude Code repo: agent loop, architecture, tools, commands, memory, and hidden features.",
  applicationName: "Claude Code Unpacked",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Claude Code Unpacked",
    description:
      "Trace the agent loop, architecture, tools, and memory system from the source.",
    images: ["/repo-assets/architecture-layers.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Claude Code Unpacked",
    description:
      "Trace the reverse-engineered Claude Code repo from the source.",
    images: ["/repo-assets/architecture-layers.png"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const siteData = await getSiteData();

  return (
    <html className={`${sora.variable} ${mono.variable}`} lang="en">
      <body>
        <div className="page-shell">
          <main>{children}</main>
          <SiteFooter githubRepoUrl={siteData.githubRepoUrl} />
        </div>
      </body>
    </html>
  );
}
