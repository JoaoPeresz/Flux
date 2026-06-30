import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import { transactionApi } from '@/services/api'
import { Category, PaymentSource } from '@/types'
import formStyles from '@/components/ui/form.module.css'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import AddRoundedIcon from '@mui/icons-material/AddRounded'

interface Props {
  isOpen: boolean
  onClose: () => void
  userId: string
  paymentSource: PaymentSource | null
  categories: Category[]
  onSuccess: () => void
}

interface BatchRow {
  id: string
  description: string
  amount: string
  transactionDate: string
  categoryId: string
}

export default function BatchTransactionModal({ isOpen, onClose, userId, paymentSource, categories, onSuccess }: Props) {
  const [rows, setRows] = useState<BatchRow[]>([])
  const [loading, setLoading] = useState(false)

  // Initialize with one empty row
  useEffect(() => {
    if (isOpen) {
      setRows([{
        id: crypto.randomUUID(),
        description: '',
        amount: '',
        transactionDate: new Date().toISOString().split('T')[0],
        categoryId: categories.length > 0 ? categories[0].id : ''
      }])
    }
  }, [isOpen, categories])

  const handleAddRow = () => {
    setRows(prev => [
      ...prev, 
      {
        id: crypto.randomUUID(),
        description: '',
        amount: '',
        transactionDate: prev.length > 0 ? prev[prev.length - 1].transactionDate : new Date().toISOString().split('T')[0],
        categoryId: categories.length > 0 ? categories[0].id : ''
      }
    ])
  }

  const handleRemoveRow = (id: string) => {
    setRows(prev => prev.filter(r => r.id !== id))
  }

  const handleChange = (id: string, field: keyof BatchRow, value: string) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !paymentSource) return

    // Filter out rows that are completely empty (no description and no amount)
    const validRows = rows.filter(r => r.description.trim() !== '' || r.amount.trim() !== '')
    
    if (validRows.length === 0) {
      alert('Preencha ao menos uma linha.')
      return
    }

    setLoading(true)
    try {
      const promises = validRows.map(row => {
        return transactionApi.create({
          userId,
          categoryId: row.categoryId,
          paymentSourceId: paymentSource.id,
          description: row.description,
          amount: parseFloat(row.amount.replace(',', '.')),
          type: 'ONE_TIME', // default to ONE_TIME for batch items
          transactionDate: row.transactionDate,
          installmentsTotal: 1
        })
      })

      await Promise.all(promises)
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error in batch create:', error)
      alert('Erro ao salvar os lançamentos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Lançamentos Rápidos - ${paymentSource?.name}`}>
      <form onSubmit={handleSubmit} style={{ padding: '0 8px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '-8px' }}>
          Adicione múltiplos lançamentos de uma vez para o cartão <strong>{paymentSource?.name}</strong>. Todos serão salvos como despesas avulsas.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '50vh', overflowY: 'auto', paddingRight: '4px' }}>
          {rows.map((row, index) => (
            <div key={row.id} style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--color-surface)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', fontWeight: 600, color: 'var(--color-text-muted)', width: '20px' }}>
                {index + 1}.
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    required type="text" className={formStyles.input} placeholder="Descrição (ex: Uber)"
                    value={row.description} onChange={e => handleChange(row.id, 'description', e.target.value)}
                    style={{ flex: 2 }}
                  />
                  <input 
                    required type="number" step="0.01" min="0" className={formStyles.input} placeholder="R$ 0,00"
                    value={row.amount} onChange={e => handleChange(row.id, 'amount', e.target.value)}
                    style={{ flex: 1 }}
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    required type="date" className={formStyles.input}
                    value={row.transactionDate} onChange={e => handleChange(row.id, 'transactionDate', e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <select 
                    required className={formStyles.select}
                    value={row.categoryId} onChange={e => handleChange(row.id, 'categoryId', e.target.value)}
                    style={{ flex: 2 }}
                  >
                    {categories.filter(c => c.isIncome).length > 0 && (
                      <optgroup label="Receitas">
                        {categories.filter(c => c.isIncome).map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label="Necessidades (50%)">
                      {categories.filter(c => !c.isIncome && c.ruleGroup === 'NEEDS').map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Desejos / Lazer (30%)">
                      {categories.filter(c => !c.isIncome && c.ruleGroup === 'WANTS').map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Poupança / Investimentos (20%)">
                      {categories.filter(c => !c.isIncome && c.ruleGroup === 'SAVINGS').map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>
              
              <button 
                type="button" onClick={() => handleRemoveRow(row.id)}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: '4px', alignSelf: 'flex-start', marginTop: '4px' }}
                title="Remover linha"
              >
                <DeleteOutlineRoundedIcon />
              </button>
            </div>
          ))}
        </div>

        <button 
          type="button" 
          className={formStyles.btnSecondary} 
          onClick={handleAddRow}
          style={{ width: 'fit-content', border: '1px dashed var(--color-border)' }}
        >
          <AddRoundedIcon fontSize="small" /> Adicionar Linha
        </button>

        <div className={formStyles.actions} style={{ marginTop: '16px' }}>
          <button type="button" className={formStyles.btnSecondary} onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button type="submit" className={formStyles.btnPrimary} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Todos'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
