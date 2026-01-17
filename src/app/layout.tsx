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
const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Imagion";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} - AI Image Detector | Expose AI-Generated Images`,
    template: `%s | ${siteName}`,
  },
  description:
    "Imagion — expose synthetic content instantly. Detect if an image was created by AI (Midjourney, DALL-E, Stable Diffusion) or is a real photo. 100% private, runs locally in your browser.",
  keywords: [
    "AI image detector",
    "Imagion",
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
    "expose AI images",
  ],
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
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
    siteName,
    title: `${siteName} - AI Image Detector`,
    description:
      "Expose AI-generated images instantly. Reveal the truth behind any image. Free, private, and runs entirely in your browser.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Imagion - Expose AI-Generated Images",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} - AI Image Detector`,
    description:
      "Expose AI-generated images instantly. Reveal the truth behind any image. Free and 100% private.",
    images: ["/og-image.png"],
    creator: "@imagion_ai",
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
    name: siteName,
    description:
      "Imagion — expose synthetic content instantly. Detect if images were created by AI generators like Midjourney, DALL-E, or Stable Diffusion. Runs locally in your browser.",
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
      "Expose synthetic content",
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
          strategy="lazyOnload"
        />
        <Script id="google-analytics" strategy="lazyOnload">
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
