import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Portal Gym",
  description: "Benchmark platform for browser automation validation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
