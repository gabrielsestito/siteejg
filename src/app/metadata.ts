import type { Metadata, Viewport } from "next";

export const sharedMetadata: Metadata = {
  title: {
    template: "%s | EJG Cestas Básicas",
    default: "EJG Cestas Básicas",
  },
  description: "EJG Cestas Básicas - Qualidade e variedade para sua família",
  icons: {
    icon: [
      {
        url: "/logo.png",
        href: "/logo.png",
      },
    ],
  },
};

export const sharedViewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#16a34a',
}; 