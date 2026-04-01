import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/providers/query-provider";
import { EntriesProvider } from "@/lib/entries-store";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Endo | Endometriosis Support & Tracking",
  description:
    "Track symptoms, discover patterns, and feel empowered talking to your doctor. Evidence-based endometriosis support.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <QueryProvider>
          <EntriesProvider>
            <TooltipProvider>
              <AppShell>{children}</AppShell>
              <Toaster />
            </TooltipProvider>
          </EntriesProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
