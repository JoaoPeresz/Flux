'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/store/UserContext'
import { userApi } from '@/services/api'
import Link from 'next/link'
import styles from './page.module.css'
import formStyles from '@/components/ui/form.module.css'

export default function LoginPage() {
  const router = useRouter()
  const { setActiveUser } = useUser()
  const [email, setEmail] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [slowLoading, setSlowLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setSlowLoading(false)

    const timeout = setTimeout(() => {
      setSlowLoading(true)
    }, 4000)

    try {
      const user = await userApi.login({ email, pin })
      clearTimeout(timeout)
      setActiveUser(user)
      router.push('/dashboard')
    } catch (err: any) {
      clearTimeout(timeout)
      setError(err.response?.data?.message || 'E-mail ou PIN incorretos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Flux</h1>
        <p className={styles.subtitle}>Acesse sua conta para continuar</p>
        
        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={formStyles.form}>
          <div className={formStyles.field}>
            <label className={formStyles.label}>E-mail</label>
            <input 
              required
              type="email"
              className={formStyles.input}
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className={formStyles.field}>
            <label className={formStyles.label}>PIN (4 dígitos)</label>
            <input 
              required
              type="password"
              maxLength={6}
              className={formStyles.input}
              placeholder="1234"
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
            />
          </div>

          <button type="submit" className={formStyles.btnPrimary} style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {slowLoading && (
          <div style={{ marginTop: '16px', fontSize: '13px', color: 'var(--color-warning)', background: 'var(--color-warning-bg)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
            ⏳ <strong>O servidor está acordando...</strong><br/>
            Como a API está hospedada em um plano gratuito (Render), o primeiro acesso pode levar até 1 minuto. Aguarde!
          </div>
        )}

        <p className={styles.footerText}>
          Não tem uma conta? <Link href="/register" className={styles.link}>Criar conta</Link>
        </p>
      </div>
    </div>
  )
}
