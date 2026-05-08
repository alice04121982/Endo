import type { Metadata } from "next";
import { AI_DISCLAIMER } from "@/lib/llm/disclaimer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Endo — pelvic-health intelligence",
  description:
    "Longitudinal, clinician-grade record for endometriosis and adenomyosis. Decision support, NICE NG73 aligned. Not a diagnostic device.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="bg-background text-foreground min-h-screen flex flex-col">
        <main className="flex-1">{children}</main>
        <footer
          role="contentinfo"
          aria-label="Regulatory disclaimer"
          className="disclaimer-bar px-6 py-3"
        >
          <p className="max-w-7xl mx-auto">
            <span className="font-semibold">Decision support, not a diagnosis.</span>{" "}
            {AI_DISCLAIMER} Endo is regulated as Class IIa Software as a Medical
            Device under UK MDR 2002.
          </p>
        </footer>
      </body>
    </html>
  );
}
