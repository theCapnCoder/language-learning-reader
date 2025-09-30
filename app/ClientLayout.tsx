"use client"

import type React from "react"

import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Navigation } from "@/components/navigation"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import "./globals.css"

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const searchParams = useSearchParams()

  return (
    <html lang="ru">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <div className="min-h-screen bg-background">
          <Suspense fallback={<div>Loading...</div>}>
            <Navigation searchParams={searchParams} />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
          </Suspense>
        </div>
        <Analytics />
      </body>
    </html>
  )
}
