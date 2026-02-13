import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import '../styles/adminator.scss'

export const metadata: Metadata = {
  title: 'Admin Panel',
  description: 'Panel de administración',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="app">
        <Script
          id="theme-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('adminator-theme');
                } catch (e) { var theme = null; }
                var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                var initial = theme === 'light' || theme === 'dark' ? theme : (prefersDark ? 'dark' : 'light');
                document.documentElement.setAttribute('data-theme', initial);
              })();
            `,
          }}
        />
        {children}
      </body>
    </html>
  )
}
