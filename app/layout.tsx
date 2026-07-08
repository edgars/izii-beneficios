import "./globals.css";

import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: {
    default: "IZII Developer Portal",
    template: "%s · IZII"
  },
  description: "Portal de APIs do Orquestrador de Benefícios IZII — documentação interativa e sandbox para integrações com operadoras de saúde."
};

export const viewport: Viewport = {
  themeColor: "#3A3D4A"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
