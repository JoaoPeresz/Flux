'use client'

import { useState, useEffect } from 'react'
import { userApi } from '@/services/api'
import { User, UpdateUserRulesRequest } from '@/types'
import Modal from '@/components/ui/Modal'
import formStyles from '@/components/ui/form.module.css'

interface RuleConfigModalProps {
  isOpen: boolean
  onClose: () => void
  user: User
  onSaved: (updatedUser: User) => void
}

export default function RuleConfigModal({ isOpen, onClose, user, onSaved }: RuleConfigModalProps) {
  const [formData, setFormData] = useState<UpdateUserRulesRequest>({
    rule1Name: '', rule1Percent: 0,
    rule2Name: '', rule2Percent: 0,
    rule3Name: '', rule3Percent: 0
  })
  
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        rule1Name: user.rule1Name || 'Necessidades',
        rule1Percent: user.rule1Percent || 50,
        rule2Name: user.rule2Name || 'Desejos',
        rule2Percent: user.rule2Percent || 30,
        rule3Name: user.rule3Name || 'Poupança/Dívidas',
        rule3Percent: user.rule3Percent || 20
      })
      setError('')
    }
  }, [user, isOpen])

  const totalPercent = formData.rule1Percent + formData.rule2Percent + formData.rule3Percent

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (totalPercent !== 100) {
      setError('A soma das porcentagens deve ser exatamente 100%.')
      return
    }

    try {
      setSaving(true)
      const updatedUser = await userApi.updateRules(user.id, formData)
      onSaved(updatedUser)
      onClose()
    } catch (err) {
      console.error('Failed to update rules:', err)
      setError('Erro ao salvar as configurações.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configurar Regras de Gastos">
      <form onSubmit={handleSubmit} className={formStyles.form}>
        <div style={{ marginBottom: 16, fontSize: 14, color: 'var(--color-text-dim)' }}>
          Personalize as porcentagens e nomes das 3 grandes áreas de gastos do seu orçamento.
        </div>

        {error && (
          <div style={{ color: 'var(--color-danger)', fontSize: 14, marginBottom: 16, fontWeight: 500 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 8, fontWeight: 600, fontSize: 14 }}>
          <div>Nome da Categoria</div>
          <div>Porcentagem (%)</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <input 
              required
              type="text" 
              className={formStyles.input}
              value={formData.rule1Name}
              onChange={e => setFormData({ ...formData, rule1Name: e.target.value })}
            />
            <input 
              required
              type="number" 
              className={formStyles.input}
              value={formData.rule1Percent}
              onChange={e => setFormData({ ...formData, rule1Percent: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <input 
              required
              type="text" 
              className={formStyles.input}
              value={formData.rule2Name}
              onChange={e => setFormData({ ...formData, rule2Name: e.target.value })}
            />
            <input 
              required
              type="number" 
              className={formStyles.input}
              value={formData.rule2Percent}
              onChange={e => setFormData({ ...formData, rule2Percent: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <input 
              required
              type="text" 
              className={formStyles.input}
              value={formData.rule3Name}
              onChange={e => setFormData({ ...formData, rule3Name: e.target.value })}
            />
            <input 
              required
              type="number" 
              className={formStyles.input}
              value={formData.rule3Percent}
              onChange={e => setFormData({ ...formData, rule3Percent: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div style={{ 
          marginTop: 16, 
          paddingTop: 16, 
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          fontWeight: 600,
          color: totalPercent === 100 ? 'var(--color-success)' : 'var(--color-danger)'
        }}>
          <span>Total:</span>
          <span>{totalPercent}%</span>
        </div>

        <div className={formStyles.actions} style={{ marginTop: 24 }}>
          <button type="button" className={formStyles.btnSecondary} onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" className={formStyles.btnPrimary} disabled={saving || totalPercent !== 100}>
            {saving ? 'Salvando...' : 'Salvar Regras'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
