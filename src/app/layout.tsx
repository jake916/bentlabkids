import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bentlabkidstv Web Dashboard",
  description: "Bentlab Kids TV Administration Portal",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="icon" href="/icon.png" sizes="any" />
      </head>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
