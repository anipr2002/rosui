import { SmoothScrollProvider } from "@/lib/smooth-scroll";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SmoothScrollProvider>
      <main>{children}</main>
    </SmoothScrollProvider>
  );
}
