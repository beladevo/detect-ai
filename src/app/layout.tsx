import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Syne } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import HotjarProvider from "@/src/components/HotjarProvider";

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
    default: "AI-human detector - Free AI Image Detector | Detect AI-Generated Images",
    template: "%s | AI-human detector",
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
  authors: [{ name: "AI-human detector" }],
  creator: "AI-human detector",
  publisher: "AI-human detector",
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
    siteName: "AI-human detector",
    title: "AI-human detector - Free AI Image Detector",
    description:
      "Instantly detect if an image was created by AI or is a real photo. Free, private, and runs entirely in your browser.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AI-human detector - AI Image Detection Tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI-human detector - Free AI Image Detector",
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
    name: "AI-human detector",
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
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-C1ZGJ96FD8"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-C1ZGJ96FD8');
          `}
        </Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${displayFont.variable} ${bodyFont.variable} antialiased`}>
        <HotjarProvider />
        {children}
      </body>
    </html>
  );
}
