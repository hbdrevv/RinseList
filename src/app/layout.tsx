import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RinseList - Clean Your Email List",
  description:
    "Remove suppressed contacts and invalid email addresses from your contact list before uploading to Klaviyo. Client-side processing - your data never leaves your browser.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
