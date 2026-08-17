import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import MobileNav from '@/components/layout/MobileNav'
import { ThemeProvider } from '@/components/ThemeProvider'
import { RoleProvider } from '@/components/auth/RoleContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'EPP Control - DALUPEZMAR S.A.C.',
  description:
    'Sistema Mobile-First & PWA de Gestión, Entrega, Firmas Táctiles y Control de EPPs y Uniformes - DALUPEZMAR S.A.C.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192.png',
    shortcut: '/icons/icon-192.png',
    apple: '/icons/icon-512.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'EPP DALUPEZMAR',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0f172a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var origError = console.error;
                var origWarn = console.warn;
                console.error = function() {
                  var msg = (arguments[0] || '').toString();
                  if (msg.indexOf('bis_skin_checked') !== -1 || msg.indexOf('hydrated') !== -1 || msg.indexOf('Hydration') !== -1 || msg.indexOf('did not match') !== -1) {
                    return;
                  }
                  origError.apply(console, arguments);
                };
                console.warn = function() {
                  var msg = (arguments[0] || '').toString();
                  if (msg.indexOf('bis_skin_checked') !== -1 || msg.indexOf('hydrated') !== -1) {
                    return;
                  }
                  origWarn.apply(console, arguments);
                };
                if (typeof window !== 'undefined') {
                  window.addEventListener('error', function(e) {
                    if (e && e.message && (e.message.indexOf('bis_skin_checked') !== -1 || e.message.indexOf('hydration') !== -1)) {
                      e.stopImmediatePropagation();
                      e.preventDefault();
                    }
                  }, true);
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${inter.className} min-h-screen app-body transition-colors duration-200 antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <RoleProvider>
            <div className="flex min-h-screen flex-col md:flex-row" suppressHydrationWarning>
              <Sidebar />
              <div className="flex-1 flex flex-col md:ml-64 min-h-screen main-content-area transition-colors duration-200" suppressHydrationWarning>
                <Header />
                <main className="flex-1 pb-24 md:pb-8" suppressHydrationWarning>
                  {children}
                </main>
                <MobileNav />
              </div>
            </div>
          </RoleProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
