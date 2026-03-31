import type { Metadata } from "next";
import "../index.css";
import { AppProviders } from "../providers";

export const metadata: Metadata = {
  title: "Social Commerce Feed",
  description: "Social storefront and merchant dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
