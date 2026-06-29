import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import { paymentSourceApi } from '@/services/api'
import { PaymentSource, CreatePaymentSourceRequest } from '@/types'
import formStyles from '@/components/ui/form.module.css'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import CreditCardRoundedIcon from '@mui/icons-material/CreditCardRounded'

interface Props {
  isOpen: boolean
  onClose: () => void
  userId: string
  onPaymentSourcesChange: () => void // trigger reload on parent
}

export default function PaymentSourcesModal({ isOpen, onClose, userId, onPaymentSourcesChange }: Props) {
  const [sources, setSources] = useState<PaymentSource[]>([])
  const [loading, setLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState<Omit<CreatePaymentSourceRequest, 'userId'>>({
    name: '',
    type: 'CREDIT_CARD', // Default to credit card since it's the most complex
    closingDay: 25,
    dueDay: 5,
    color: '#6C63FF',
    icon: 'credit-card'
  })

  useEffect(() => {
    if (isOpen && userId) {
      loadSources()
    }
  }, [isOpen, userId])

  const loadSources = async () => {
    setLoading(true)
    try {
      const data = await paymentSourceApi.listByUser(userId)
      setSources(data)
    } catch (error) {
      console.error('Failed to load payment sources', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta fonte?')) return
    try {
      await paymentSourceApi.delete(id)
      loadSources()
      onPaymentSourcesChange()
    } catch (error) {
      console.error('Failed to delete payment source', error)
      alert('Erro ao excluir. Pode haver lançamentos vinculados a esta fonte.')
    }
  }

  const handleEdit = (source: PaymentSource) => {
    setEditingId(source.id)
    setFormData({
      name: source.name,
      type: source.type as any,
      closingDay: source.closingDay || 25,
      dueDay: source.dueDay || 5,
      color: source.color,
      icon: source.icon
    })
    setIsAdding(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        closingDay: formData.type === 'CREDIT_CARD' ? Number(formData.closingDay) : undefined,
        dueDay: formData.type === 'CREDIT_CARD' ? Number(formData.dueDay) : undefined,
      }
      
      if (editingId) {
        await paymentSourceApi.update(editingId, payload)
      } else {
        await paymentSourceApi.create({ ...payload, userId })
      }
      
      setIsAdding(false)
      setEditingId(null)
      loadSources()
      onPaymentSourcesChange()
      setFormData({
        name: '',
        type: 'CREDIT_CARD',
        closingDay: 25,
        dueDay: 5,
        color: '#6C63FF',
        icon: 'credit-card'
      })
    } catch (error) {
      console.error('Failed to save payment source', error)
      alert('Erro ao salvar fonte de pagamento.')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gerenciar Cartões e Contas">
      <div style={{ padding: '0 8px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {loading ? (
          <p style={{ color: 'var(--color-text-muted)' }}>Carregando...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sources.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                Nenhum cartão ou conta cadastrada.
              </p>
            ) : (
              sources.map(s => (
                <div key={s.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px', background: 'var(--color-surface)', borderRadius: '8px',
                  border: '1px solid var(--color-border)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      width: 32, height: 32, borderRadius: '50%', background: s.color, 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' 
                    }}>
                      <CreditCardRoundedIcon fontSize="small" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{s.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        {s.type === 'CREDIT_CARD' 
                          ? `Fechamento dia ${s.closingDay} • Venc. dia ${s.dueDay}`
                          : 'Conta padrão'
                        }
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button 
                      onClick={() => handleEdit(s)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '4px' }}
                      title="Editar"
                    >
                      <EditRoundedIcon />
                    </button>
                    <button 
                      onClick={() => handleDelete(s.id)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: '4px' }}
                      title="Excluir"
                    >
                      <DeleteOutlineRoundedIcon />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {!isAdding ? (
          <button 
            type="button" 
            className={formStyles.btnSecondary} 
            onClick={() => {
              setEditingId(null)
              setFormData({ name: '', type: 'CREDIT_CARD', closingDay: 25, dueDay: 5, color: '#6C63FF', icon: 'credit-card' })
              setIsAdding(true)
            }}
            style={{ marginTop: '8px' }}
          >
            + Adicionar Nova Fonte
          </button>
        ) : (
          <form onSubmit={handleSubmit} className={formStyles.form} style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
            <h4 style={{ color: 'var(--color-text)', marginBottom: '8px' }}>
              {editingId ? 'Editar Fonte' : 'Nova Fonte'}
            </h4>
            
            <div className={formStyles.field}>
              <label className={formStyles.label}>Nome</label>
              <input 
                required type="text" className={formStyles.input} placeholder="Ex: Cartão Nubank"
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className={formStyles.formRow}>
              <div className={formStyles.field}>
                <label className={formStyles.label}>Tipo</label>
                <select 
                  className={formStyles.select} value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value as PaymentSourceType})}
                >
                  <option value="CREDIT_CARD">Cartão de Crédito</option>
                  <option value="DEBIT">Cartão de Débito</option>
                  <option value="PIX">Pix / Conta Corrente</option>
                </select>
              </div>
              <div className={formStyles.field}>
                <label className={formStyles.label}>Cor</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="color" className={formStyles.input} style={{ padding: '2px', height: '42px', width: '42px', cursor: 'pointer' }}
                    value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})}
                  />
                  <input 
                    type="text" className={formStyles.input} style={{ flex: 1 }} placeholder="#000000"
                    value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {formData.type === 'CREDIT_CARD' && (
              <div className={formStyles.formRow}>
                <div className={formStyles.field}>
                  <label className={formStyles.label}>Dia de Fechamento</label>
                  <input 
                    required type="number" min="1" max="28" className={formStyles.input}
                    value={formData.closingDay} onChange={e => setFormData({...formData, closingDay: Number(e.target.value)})}
                  />
                </div>
                <div className={formStyles.field}>
                  <label className={formStyles.label}>Dia de Vencimento</label>
                  <input 
                    required type="number" min="1" max="28" className={formStyles.input}
                    value={formData.dueDay} onChange={e => setFormData({...formData, dueDay: Number(e.target.value)})}
                  />
                </div>
              </div>
            )}

            <div className={formStyles.actions} style={{ marginTop: '16px' }}>
              <button type="button" className={formStyles.btnSecondary} onClick={() => {
                setIsAdding(false)
                setEditingId(null)
              }}>Cancelar</button>
              <button type="submit" className={formStyles.btnPrimary}>Salvar</button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  )
}
