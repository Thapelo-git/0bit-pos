import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/shared/context/AuthContext";
import { ThemeProvider } from "@/shared/context/ThemeContext";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "kasiFix — Marketplace",
  description: "South Africa's local service marketplace",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
