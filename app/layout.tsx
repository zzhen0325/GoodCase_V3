import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Poppins, Roboto_Mono } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { FirebaseProvider } from '@/components/firebase-provider';
import { DataProvider } from '@/components/shared/DataContext';
import { VersionInfoComponent } from '@/components/version-info';
import { ToastProvider } from '@/components/toast-provider';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'GooodCase',
  description: '管理你的图片和提示词，让创作更高效',
  keywords: ['图片管理', '提示词', 'AI', '创作工具'],
  authors: [{ name: 'zz' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body
        className={`${poppins.variable} ${robotoMono.variable} font-sans antialiased`}
      >
        <FirebaseProvider>
          <DataProvider>
            <ToastProvider>
              <div className="min-h-screen bg-background text-foreground">
                {children}
              </div>
              <Toaster />
              <VersionInfoComponent />
            </ToastProvider>
          </DataProvider>
        </FirebaseProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                let scrollTimeout;
                
                function handleScroll(element) {
                  element.classList.add('scrolling');
                  clearTimeout(scrollTimeout);
                  scrollTimeout = setTimeout(() => {
                    element.classList.remove('scrolling');
                  }, 1000);
                }
                
                function addScrollListeners() {
                  // 为所有可滚动元素添加监听器
                  const scrollableElements = document.querySelectorAll('.custom-scrollbar, [class*="overflow-"]');
                  scrollableElements.forEach(element => {
                    element.addEventListener('scroll', () => handleScroll(element), { passive: true });
                  });
                  
                  // 为 body 添加监听器
                  document.body.addEventListener('scroll', () => handleScroll(document.body), { passive: true });
                  window.addEventListener('scroll', () => handleScroll(document.documentElement), { passive: true });
                }
                
                // DOM 加载完成后添加监听器
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', addScrollListeners);
                } else {
                  addScrollListeners();
                }
                
                // 监听动态添加的元素
                const observer = new MutationObserver(() => {
                  addScrollListeners();
                });
                observer.observe(document.body, { childList: true, subtree: true });
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
