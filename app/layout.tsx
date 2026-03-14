import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import StarfieldCanvas from "@/components/layout/StarfieldCanvas";
import NavBar from "@/components/menu/NavBar";

const geistMono = localFont({
  src: "../public/fonts/geist-mono-latin.woff2",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Neural Pulse",
  description: "Test your reflexes in deep space",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Neural Pulse",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#030014",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistMono.variable} antialiased font-mono`}>
        <StarfieldCanvas />
        <div className="relative z-10">{children}</div>
        <NavBar />
      </body>
    </html>
  );
}
