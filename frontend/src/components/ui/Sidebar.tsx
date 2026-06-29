'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@/store/UserContext'
import styles from './Sidebar.module.css'

import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded'
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: <DashboardRoundedIcon fontSize="small" /> },
  { href: '/transactions', label: 'Lançamentos', icon: <ReceiptLongRoundedIcon fontSize="small" /> },
  { href: '/timeline', label: 'Prospecção', icon: <CalendarMonthRoundedIcon fontSize="small" /> },
  { href: '/categories', label: 'Categorias', icon: <CategoryRoundedIcon fontSize="small" /> },
  { href: '/reports', label: 'Relatórios', icon: <InsightsRoundedIcon fontSize="small" /> },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { activeUser, logout } = useUser()

  if (pathname === '/login' || pathname === '/register') return null


  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoText}>Flux</div>
        <div className={styles.logoSub}>CONTROLE FINANCEIRO</div>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className={`${styles.navItem} ${pathname.startsWith(href) ? styles.active : ''}`}
          >
            <div className={styles.navIcon}>{icon}</div>
            <span className={styles.navLabel}>{label}</span>
          </Link>
        ))}
      </nav>

      {/* User Info & Logout */}
      {activeUser && (
        <div className={styles.userSection}>
          <div className={styles.userSectionLabel}>
            <PersonRoundedIcon fontSize="small" />
            Perfil
          </div>
          <div className={styles.userChip}>
            <div
              className={styles.avatar}
              style={{ backgroundColor: activeUser.avatarColor }}
            >
              {activeUser.name.charAt(0).toUpperCase()}
            </div>
            <span className={styles.userName}>{activeUser.name}</span>
          </div>
          <button 
            className={styles.navItem} 
            style={{ color: 'var(--color-danger)', marginTop: '8px', padding: '8px 12px' }}
            onClick={logout}
          >
            <div className={styles.navIcon}><LogoutRoundedIcon fontSize="small" /></div>
            <span className={styles.navLabel}>Sair</span>
          </button>
        </div>
      )}
    </aside>
  )
}
