import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyClass",
  description: "Platform pembelajaran digital MyClass.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
