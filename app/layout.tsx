import type { Metadata, Viewport } from "next";
import { RootProvider } from "fumadocs-ui/provider/next";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import "./globals.css";
import LocalFont from "next/font/local";
import { Toaster } from "@/components/ui/sonner";
import ConvexClientProvider from "@/app/ConvexClientProvider";

export const metadata: Metadata = {
  title: "ROSUI",
  description: "ROS 2 Dashboard",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${montreal.variable} antialiased overflow-x-hidden`}>
          <RootProvider
            theme={{
              enabled: false,
            }}
          >
            <ConvexClientProvider>{children}</ConvexClientProvider>
          </RootProvider>
          <Toaster richColors />
        </body>
      </html>
    </ClerkProvider>
  );
}
