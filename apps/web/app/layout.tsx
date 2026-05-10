import { Geist_Mono, Outfit } from "next/font/google";

import "@workspace/ui/globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@workspace/ui/lib/utils";
import { SolanaProvider } from "@/components/provider/solana-provider";
import { TooltipProvider } from "@workspace/ui/components/tooltip";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" });

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        outfit.variable
      )}
    >
      <script
        async
        crossOrigin="anonymous"
        src="https://tweakcn.com/live-preview.min.js"
      />
      <body>
        <TooltipProvider>
          <SolanaProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </SolanaProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
