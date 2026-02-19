import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Smart Loss Control",
  description:
    "Protect your cooking oil business with smart inventory tracking and loss prevention",
}

export const viewport: Viewport = {
  themeColor: "#1a9a48",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
