'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/store/UserContext'
import { userApi } from '@/services/api'
import Link from 'next/link'
import styles from '../login/page.module.css'
import formStyles from '@/components/ui/form.module.css'

export default function RegisterPage() {
  const router = useRouter()
  const { setActiveUser } = useUser()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await userApi.register({ name, email, pin, avatarColor: '#6C63FF' })
      setActiveUser(user)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar conta. Tente outro e-mail.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Flux</h1>
        <p className={styles.subtitle}>Crie sua conta gratuitamente</p>
        
        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={formStyles.form}>
          <div className={formStyles.field}>
            <label className={formStyles.label}>Seu Nome</label>
            <input 
              required
              type="text"
              className={formStyles.input}
              placeholder="Ex: João Silva"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

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
            <label className={formStyles.label}>Criar PIN (4 dígitos)</label>
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
            {loading ? 'Criando...' : 'Criar Conta'}
          </button>
        </form>

        <p className={styles.footerText}>
          Já tem uma conta? <Link href="/login" className={styles.link}>Entrar</Link>
        </p>
      </div>
    </div>
  )
}
