import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Navigation } from "@/components/navigation"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "Language Reader - Изучение языка через чтение",
  description: "Интерактивное приложение для чтения книг с функциями изучения языка",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <div className="min-h-screen bg-background">
          <Suspense fallback={<div>Loading...</div>}>
            <Navigation />
          </Suspense>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
        </div>
        <Analytics />
      </body>
    </html>
  )
}
