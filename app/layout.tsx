import React from 'react'
import type { Metadata, Viewport } from 'next'
import { DM_Mono } from 'next/font/google'
import { ToastProvider } from '@/components/toast-provider'
import './globals.css'

const dmMono = DM_Mono({ 
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic']
})

export const metadata: Metadata = {
  title: 'GooodCase',
  description: '管理你的图片和提示词，让创作更高效',
  keywords: ['图片管理', '提示词', 'AI', '创作工具'],
  authors: [{ name: 'zz' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className={`${dmMono.className} antialiased`}>
        <ToastProvider>
          <div className="min-h-screen bg-background text-foreground">
            {children}
          </div>
        </ToastProvider>
      </body>
    </html>
  )
}