'use client'

import { useState, useEffect } from 'react'
import { budgetApi, categoryApi } from '@/services/api'
import { Category, Budget } from '@/types'
import Modal from '@/components/ui/Modal'
import formStyles from '@/components/ui/form.module.css'

interface BudgetModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  year: number
  month: number
  onSaved: () => void
}

export default function BudgetModal({ isOpen, onClose, userId, year, month, onSaved }: BudgetModalProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen && userId) {
      loadData()
    }
  }, [isOpen, userId, year, month])

  const loadData = async () => {
    setLoading(true)
    try {
      const [cats, bdgs] = await Promise.all([
        categoryApi.list(false), // Only expense categories
        budgetApi.getMonthly(userId, year, month)
      ])
      setCategories(cats)
      setBudgets(bdgs)
      
      const initialForm: Record<string, string> = {}
      bdgs.forEach(b => {
        initialForm[b.categoryId] = b.limitAmount.toString()
      })
      setFormData(initialForm)
    } catch (error) {
      console.error('Error loading budget data', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const monthStr = `${year}-${month.toString().padStart(2, '0')}-01`
      
      for (const catId of Object.keys(formData)) {
        const val = parseFloat(formData[catId])
        if (!isNaN(val) && val > 0) {
          await budgetApi.upsert({
            userId,
            categoryId: catId,
            referenceMonth: monthStr,
            limitAmount: val
          })
        }
      }
      onSaved()
      onClose()
    } catch (error) {
      console.error('Error saving budgets', error)
      alert('Erro ao salvar limites.')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Definir Limites (Mês Atual)">
      {loading ? (
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--color-text-dim)' }}>Carregando...</div>
      ) : (
        <form onSubmit={handleSubmit} className={formStyles.form}>
          <div style={{ marginBottom: 16, fontSize: 14, color: 'var(--color-text-dim)' }}>
            Defina o teto de gastos para as categorias desejadas. Deixe em branco se não quiser limite.
          </div>
          
          <div style={{ maxHeight: '60vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, paddingRight: 8 }}>
            {categories.map(cat => (
              <div key={cat.id} className={formStyles.field}>
                <label className={formStyles.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: cat.color }} />
                  {cat.name}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={formStyles.input}
                  placeholder="0.00"
                  value={formData[cat.id] || ''}
                  onChange={e => setFormData({ ...formData, [cat.id]: e.target.value })}
                />
              </div>
            ))}
          </div>

          <div className={formStyles.actions} style={{ marginTop: 24 }}>
            <button type="button" className={formStyles.btnSecondary} onClick={onClose}>Cancelar</button>
            <button type="submit" className={formStyles.btnPrimary}>Salvar Limites</button>
          </div>
        </form>
      )}
    </Modal>
  )
}
