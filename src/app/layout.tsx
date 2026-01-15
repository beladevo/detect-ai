import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Syne } from "next/font/google";
import "./globals.css";

const displayFont = Syne({
  variable: "--font-display",
  subsets: ["latin"],
});

const bodyFont = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://detectai.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "DetectAI - Free AI Image Detector | Detect AI-Generated Images",
    template: "%s | DetectAI",
  },
  description:
    "Free AI image detection tool. Instantly detect if an image was created by AI (Midjourney, DALL-E, Stable Diffusion) or is a real photo. 100% private, runs locally in your browser.",
  keywords: [
    "AI image detector",
    "detect AI generated images",
    "AI art detector",
    "deepfake detector",
    "Midjourney detector",
    "DALL-E detector",
    "Stable Diffusion detector",
    "fake image detector",
    "AI photo checker",
    "is this image AI",
    "AI vs real image",
    "synthetic image detection",
  ],
  authors: [{ name: "DetectAI" }],
  creator: "DetectAI",
  publisher: "DetectAI",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "DetectAI",
    title: "DetectAI - Free AI Image Detector",
    description:
      "Instantly detect if an image was created by AI or is a real photo. Free, private, and runs entirely in your browser.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DetectAI - AI Image Detection Tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DetectAI - Free AI Image Detector",
    description:
      "Instantly detect if an image was created by AI or is a real photo. Free and 100% private.",
    images: ["/og-image.png"],
    creator: "@detectai",
  },
  alternates: {
    canonical: siteUrl,
  },
  category: "Technology",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "DetectAI",
    description:
      "Free AI image detection tool that runs locally in your browser. Detect if images were created by AI generators like Midjourney, DALL-E, or Stable Diffusion.",
    url: siteUrl,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "AI-generated image detection",
      "Privacy-focused (runs locally)",
      "No image upload required",
      "Instant results",
      "Free to use",
    ],
  };

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${displayFont.variable} ${bodyFont.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
