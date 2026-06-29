import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { UserProvider } from '@/store/UserContext'
import Sidebar from '@/components/ui/Sidebar'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Flux — Controle Financeiro',
  description: 'Organize suas finanças com visão mensal e prospecção futura.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body suppressHydrationWarning>
        <UserProvider>
          <div className="app-shell">
            <Sidebar />
            <main className="main-content">
              {children}
            </main>
          </div>
        </UserProvider>

        <style>{`
          .app-shell {
            display: flex;
            min-height: 100vh;
          }
          .main-content {
            flex: 1;
            padding: 32px;
            overflow-y: auto;
            background: var(--color-bg);
          }
          @media (max-width: 768px) {
            .app-shell {
              flex-direction: column;
            }
            .main-content {
              padding: 16px 14px 80px;
            }
          }
        `}</style>
      </body>
    </html>
  )
}
