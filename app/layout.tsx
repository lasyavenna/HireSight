import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ghost Job Exposé | Stop Wasting Time on Fake Listings",
  description:
    "AI-powered tool that analyzes job postings and detects ghost jobs in seconds. Know before you apply.",
  openGraph: {
    title: "Ghost Job Exposé 👻",
    description: "Is that job posting actually real? Find out in seconds.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}
