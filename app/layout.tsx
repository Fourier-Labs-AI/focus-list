import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const configuredBasePath = process.env.HARBOUR_BASE_PATH;
  const basePath = configuredBasePath && configuredBasePath !== "/"
    ? `/${configuredBasePath.replace(/^\/+|\/+$/g, "")}`
    : "";
  const imageUrl = `${protocol}://${host}${basePath}/og.png`;

  return {
    title: "Focus List — Personal Todo Workspace",
    description: "A focused workspace for capturing todos, clarifying details, and closing the loop.",
    openGraph: {
      title: "Focus List",
      description: "Capture. Clarify. Complete.",
      images: [{ url: imageUrl, width: 1200, height: 630, alt: "Focus List — Keep work moving" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Focus List",
      description: "Capture. Clarify. Complete.",
      images: [imageUrl],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
