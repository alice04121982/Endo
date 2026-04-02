import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/providers/query-provider";
import { EntriesProvider } from "@/lib/entries-store";
import { CdssProvider } from "@/lib/cdss-store";
import { ClinicianProvider } from "@/lib/clinician-store";
import { ComplianceProvider } from "@/lib/compliance-store";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "EndoLink | Clinical Decision Support System",
  description:
    "Endometriosis risk stratification integrating biomarkers, lab investigations, and clinical history. NICE NG73 aligned.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} h-full antialiased`}
    >
      <body className="bg-background text-foreground">
        <QueryProvider>
          <EntriesProvider>
            <ClinicianProvider>
              <ComplianceProvider>
              <CdssProvider>
                <TooltipProvider>
                  {children}
                  <Toaster />
                </TooltipProvider>
              </CdssProvider>
              </ComplianceProvider>
            </ClinicianProvider>
          </EntriesProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
