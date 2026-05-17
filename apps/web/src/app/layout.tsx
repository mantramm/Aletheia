import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aletheia — CI for Company Truth",
  description:
    "Aletheia turns scattered startup signals into claims, tests them against reality, and writes the evidence back to Notion.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased overflow-x-hidden w-full max-w-full">
        {children}
      </body>
    </html>
  );
}
