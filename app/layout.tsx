import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MedicalDisclaimerFooter } from "@/components/medical-disclaimer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: "LungLens — Chest X-ray education companion",
  description:
    "Understand your chest X-ray with educational guides and AI attention maps. Not a medical device; not a diagnosis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans min-h-screen flex flex-col`}>
        <div className="flex-1">{children}</div>
        <MedicalDisclaimerFooter />
      </body>
    </html>
  );
}
