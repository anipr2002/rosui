import type { Metadata } from "next";
import "./globals.css";
import LocalFont from "next/font/local";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "ROSUI",
  description: "ROS 2 Dashboard",
};

const montreal = LocalFont({
  src: "./montreal.otf",
  variable: "--font-montreal",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${montreal.variable} antialiased`}>
        {children}
        <Toaster richColors />
      </body>
    </html>
  );
}
