'use client'

import { useEffect, useState, useMemo } from 'react'
import { useUser } from '@/store/UserContext'
import { transactionApi, categoryApi, paymentSourceApi } from '@/services/api'
import { Transaction, Category, PaymentSource } from '@/types'
import Modal from '@/components/ui/Modal'
import formStyles from '@/components/ui/form.module.css'
import styles from './page.module.css'

// MUI Icons
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded'
import CreditCardRoundedIcon from '@mui/icons-material/CreditCardRounded'
import BoltRoundedIcon from '@mui/icons-material/BoltRounded'
import PaymentSourcesModal from '@/components/PaymentSourcesModal'
import BatchTransactionModal from '@/components/BatchTransactionModal'
import Skeleton from '@/components/ui/Skeleton'

const TYPE_LABELS: Record<string, string> = {
  FIXED: 'Fixo',
  VARIABLE: 'Variável',
  INSTALLMENT: 'Parcelado',
  ONE_TIME: 'Avulso',
  INCOME: 'Receita'
}

export default function TransactionsPage() {
  const { activeUser } = useUser()
  
  // Date State
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  // Data State
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [paymentSources, setPaymentSources] = useState<PaymentSource[]>([])
  const [loading, setLoading] = useState(true)

  // Filter State
  const [filterType, setFilterType] = useState<string>('ALL') // ALL, EXPENSE, INCOME
  const [sortOrder, setSortOrder] = useState<string>('DATE_DESC')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSourcesModalOpen, setIsSourcesModalOpen] = useState(false)
  const [batchModalSourceId, setBatchModalSourceId] = useState<string | null>(null)
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'VARIABLE', // FIXED, INSTALLMENT, VARIABLE, ONE_TIME
    categoryId: '',
    paymentSourceId: '',
    transactionDate: new Date().toISOString().split('T')[0],
    installmentsTotal: '1',
    installmentsPaid: '0'
  })

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    tx: Transaction | null
    isGrouped: boolean
  }>({ isOpen: false, tx: null, isGrouped: false })

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() + 1
  const monthName = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })

  useEffect(() => {
    if (!activeUser) return
    loadData()
  }, [activeUser, year, month])

  const loadData = async () => {
    try {
      setLoading(true)
      const [txRes, catRes, srcRes] = await Promise.all([
        transactionApi.getMonthly(activeUser!.id, year, month),
        categoryApi.list(),
        paymentSourceApi.listByUser(activeUser!.id)
      ])
      
      setTransactions(txRes)
      setCategories(catRes)
      setPaymentSources(srcRes)
      
      if (formData.categoryId === '' && catRes.length > 0) {
        setFormData(prev => ({ ...prev, categoryId: catRes[0].id }))
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month, 1))
  }

  const handleOpenNew = () => {
    setEditingId(null)
    setFormData({
      description: '',
      amount: '',
      type: 'VARIABLE',
      categoryId: categories.length > 0 ? categories[0].id : '',
      paymentSourceId: '',
      transactionDate: new Date().toISOString().split('T')[0],
      installmentsTotal: '1',
      installmentsPaid: '0'
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (tx: Transaction) => {
    setEditingId(tx.id)
    setFormData({
      description: tx.description,
      amount: tx.amount.toString(),
      type: tx.type,
      categoryId: tx.categoryId,
      paymentSourceId: tx.paymentSourceId || '',
      transactionDate: tx.transactionDate,
      installmentsTotal: tx.installmentsTotal?.toString() || '1',
      installmentsPaid: '0' // Doesn't matter in edit
    })
    setIsModalOpen(true)
  }

  const handleTogglePaid = async (tx: Transaction) => {
    try {
      await transactionApi.update(tx.id, { isPaid: !tx.isPaid })
      loadData()
    } catch (error) {
      console.error('Error toggling paid status:', error)
    }
  }

  const handleDelete = (tx: Transaction) => {
    const isGrouped = tx.installmentGroupId !== null && (tx.type === 'FIXED' || tx.type === 'INSTALLMENT')
    setDeleteModal({ isOpen: true, tx, isGrouped })
  }

  const confirmDelete = async (deleteGroup: boolean) => {
    if (!deleteModal.tx) return
    try {
      await transactionApi.delete(deleteModal.tx.id, deleteGroup)
      setDeleteModal({ isOpen: false, tx: null, isGrouped: false })
      loadData()
    } catch (error) {
      console.error('Error deleting transaction:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeUser) return

    try {
      const payload = {
        userId: activeUser.id,
        categoryId: formData.categoryId,
        paymentSourceId: formData.paymentSourceId || undefined,
        description: formData.description,
        amount: parseFloat(formData.amount.replace(',', '.')),
        type: formData.type as 'FIXED' | 'INSTALLMENT' | 'VARIABLE' | 'ONE_TIME',
        transactionDate: formData.transactionDate,
        installmentsTotal: formData.type === 'INSTALLMENT' ? parseInt(formData.installmentsTotal) : undefined,
        installmentsPaid: formData.type === 'INSTALLMENT' && !editingId ? parseInt(formData.installmentsPaid) : undefined
      }

      if (editingId) {
        await transactionApi.update(editingId, payload)
      } else {
        await transactionApi.create(payload)
      }
      
      setIsModalOpen(false)
      setFormData(prev => ({ ...prev, description: '', amount: '' }))
      loadData()
    } catch (error) {
      console.error('Error creating transaction:', error)
      alert('Erro ao criar lançamento.')
    }
  }

  const filteredTransactions = useMemo(() => {
    if (filterType === 'ALL') return transactions
    if (filterType === 'INCOME') return transactions.filter(t => t.categoryIsIncome)
    return transactions.filter(t => !t.categoryIsIncome)
  }, [transactions, filterType])

  const groupedTransactions = useMemo(() => {
    const normal: Transaction[] = []
    const cards: Record<string, { source: PaymentSource, transactions: Transaction[], total: number, allPaid: boolean }> = {}

    filteredTransactions.forEach(tx => {
      if (tx.paymentSourceId) {
        const source = paymentSources.find(s => s.id === tx.paymentSourceId)
        if (source?.type === 'CREDIT_CARD') {
          if (!cards[source.id]) {
            cards[source.id] = { source, transactions: [], total: 0, allPaid: true }
          }
          cards[source.id].transactions.push(tx)
          cards[source.id].total += tx.amount
          if (!tx.isPaid) cards[source.id].allPaid = false
          return
        }
      }
      normal.push(tx)
    })

    const sortFn = (a: Transaction, b: Transaction) => {
      if (sortOrder === 'INCOME_FIRST') {
        if (a.categoryIsIncome && !b.categoryIsIncome) return -1
        if (!a.categoryIsIncome && b.categoryIsIncome) return 1
        return new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
      }
      if (sortOrder === 'AMOUNT_DESC') {
        return b.amount - a.amount
      }
      if (sortOrder === 'AMOUNT_ASC') {
        return a.amount - b.amount
      }
      return new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
    }
    
    // Also sort transactions inside cards so they appear ordered when expanded
    const cardsArray = Object.values(cards)
    cardsArray.forEach(c => c.transactions.sort(sortFn))

    const displayItems: any[] = []
    
    normal.forEach(tx => {
      displayItems.push({
        type: 'NORMAL',
        id: tx.id,
        transaction: tx,
        date: tx.transactionDate,
        amount: tx.amount,
        isIncome: tx.categoryIsIncome
      })
    })

    cardsArray.forEach(c => {
      // Use the card's due date in the current viewing month for sorting purposes
      const dummyDate = new Date(year, month - 1, c.source.dueDay || 1).toISOString()
      displayItems.push({
        type: 'CARD',
        id: c.source.id,
        cardGroup: c,
        date: dummyDate,
        amount: c.total,
        isIncome: false
      })
    })

    displayItems.sort((a, b) => {
      if (sortOrder === 'INCOME_FIRST') {
        if (a.isIncome && !b.isIncome) return -1
        if (!a.isIncome && b.isIncome) return 1
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      }
      if (sortOrder === 'AMOUNT_DESC') {
        return b.amount - a.amount
      }
      if (sortOrder === 'AMOUNT_ASC') {
        return a.amount - b.amount
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })

    return displayItems
  }, [filteredTransactions, paymentSources, sortOrder, year, month])

  const toggleCardExpansion = (sourceId: string) => {
    setExpandedCards(prev => ({ ...prev, [sourceId]: !prev[sourceId] }))
  }

  const handlePayCardBill = async (sourceId: string, currentTransactions: Transaction[]) => {
    const anyUnpaid = currentTransactions.some(tx => !tx.isPaid)
    // If any is unpaid, we pay all. If all are paid, we un-pay all.
    const targetStatus = anyUnpaid
    
    try {
      await Promise.all(currentTransactions.map(tx => 
        tx.isPaid !== targetStatus ? transactionApi.update(tx.id, { isPaid: targetStatus }) : Promise.resolve()
      ))
      loadData()
    } catch (error) {
      console.error('Error updating card bill:', error)
    }
  }

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  if (!activeUser) return <div className={styles.loading}>Selecione um usuário</div>

  const renderTransactionRow = (tx: Transaction) => (
    <div key={tx.id} className={`${styles.txRow} ${tx.isPaid ? styles.paid : ''}`}>
      <div className={styles.txInfo}>
        <div className={styles.categoryDot} style={{ background: tx.categoryColor }} />
        <div className={styles.txDetails}>
          <div className={styles.txDesc}>{tx.description}</div>
          <div className={styles.txCat}>{tx.categoryName}</div>
        </div>
      </div>

      <div className={styles.sourceBadge}>
        {tx.paymentSourceName || '—'}
      </div>

      <div>
        <span className={`${styles.typeBadge} ${styles[tx.type]}`}>
          {TYPE_LABELS[tx.type] || tx.type}
        </span>
      </div>

      <div className={`${styles.txAmount} ${tx.categoryIsIncome ? styles.income : ''}`}>
        {tx.categoryIsIncome ? '+ ' : '- '}
        {formatCurrency(tx.amount)}
      </div>

      <div className={styles.txDate}>
        {formatDate(tx.transactionDate)}
      </div>

      <div className={styles.txActions}>
        <button 
          className={`${styles.iconBtn}`}
          onClick={(e) => { e.stopPropagation(); handleOpenEdit(tx); }}
          title="Editar"
        >
          <EditRoundedIcon style={{ fontSize: 18 }} />
        </button>
        <button 
          className={`${styles.iconBtn} ${tx.isPaid ? styles.paid : ''}`}
          onClick={(e) => { e.stopPropagation(); handleTogglePaid(tx); }}
          title={tx.isPaid ? 'Marcar como não pago' : 'Marcar como pago'}
        >
          {tx.isPaid ? <CheckCircleRoundedIcon /> : <CheckCircleOutlineRoundedIcon />}
        </button>
        <button 
          className={`${styles.iconBtn} ${styles.danger}`}
          onClick={(e) => { e.stopPropagation(); handleDelete(tx); }}
          title="Excluir"
        >
          <DeleteOutlineRoundedIcon />
        </button>
      </div>
    </div>
  )

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Lançamentos</h1>
          <p className={styles.subtitle}>Gerencie suas receitas e despesas mensais</p>
        </div>
        
        <div className={styles.headerRight}>
          <div className={styles.monthNav}>
            <button className={styles.navBtn} onClick={handlePrevMonth}>
              <ChevronLeftRoundedIcon />
            </button>
            <span className={styles.monthLabel}>
              {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
            </span>
            <button className={styles.navBtn} onClick={handleNextMonth}>
              <ChevronRightRoundedIcon />
            </button>
          </div>
          
          <button className={formStyles.btnSecondary} onClick={() => setIsSourcesModalOpen(true)} style={{ padding: '8px 16px', background: 'transparent' }}>
            <CreditCardRoundedIcon style={{ fontSize: 20 }} />
            Meus Cartões
          </button>
          <button className={styles.addBtn} onClick={handleOpenNew}>
            <AddRoundedIcon style={{ fontSize: 20 }} />
            Novo Lançamento
          </button>
        </div>
      </div>

      <div className={styles.filterBar}>
        <FilterListRoundedIcon style={{ color: 'var(--color-text-muted)', marginRight: 4 }} />
        <button 
          className={`${styles.filterPill} ${filterType === 'ALL' ? styles.active : ''}`}
          onClick={() => setFilterType('ALL')}
        >Todos</button>
        <button 
          className={`${styles.filterPill} ${filterType === 'EXPENSE' ? styles.active : ''}`}
          onClick={() => setFilterType('EXPENSE')}
        >Despesas</button>
        <button 
          className={`${styles.filterPill} ${filterType === 'INCOME' ? styles.active : ''}`}
          onClick={() => setFilterType('INCOME')}
        >Receitas</button>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Ordenar por:</span>
          <select 
            value={sortOrder} 
            onChange={(e) => setSortOrder(e.target.value)}
            className={formStyles.select}
            style={{ padding: '4px 28px 4px 12px', fontSize: '12px', minHeight: '32px', borderRadius: 'var(--radius-full)' }}
          >
            <option value="DATE_DESC">Data (Mais Recentes)</option>
            <option value="INCOME_FIRST">Entradas em cima</option>
            <option value="AMOUNT_DESC">Maiores Gastos</option>
            <option value="AMOUNT_ASC">Menores Gastos</option>
          </select>
        </div>
      </div>

      <div className={styles.listContainer}>
        <div className={styles.listHeader}>
          <span>Descrição</span>
          <span>Fonte</span>
          <span>Tipo</span>
          <span style={{ textAlign: 'right' }}>Valor</span>
          <span style={{ textAlign: 'center' }}>Data</span>
          <span style={{ textAlign: 'right' }}>Ações</span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[1, 2, 3, 4, 5].map(i => (
               <Skeleton key={i} style={{ height: '76px', borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className={styles.empty}>
            <ReceiptLongRoundedIcon className={styles.emptyIcon} style={{ fontSize: 48 }} />
            <div className={styles.emptyText}>Nenhum lançamento neste mês</div>
            <div className={styles.emptyHint}>Clique em "Novo Lançamento" para adicionar.</div>
          </div>
        ) : (
          <div className={styles.txList}>
            {groupedTransactions.map(item => {
              if (item.type === 'CARD') {
                const cardGroup = item.cardGroup;
                return (
                  <div key={`card-${cardGroup.source.id}`} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div 
                      className={`${styles.txRow} ${cardGroup.allPaid ? styles.paid : ''}`}
                      style={{ background: 'var(--color-surface)', cursor: 'pointer', border: `1px solid ${cardGroup.source.color}` }}
                      onClick={() => toggleCardExpansion(cardGroup.source.id)}
                    >
                      <div className={styles.txInfo}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: cardGroup.source.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                          <CreditCardRoundedIcon fontSize="small" />
                        </div>
                        <div className={styles.txDetails}>
                          <div className={styles.txDesc}>Fatura - {cardGroup.source.name}</div>
                          <div className={styles.txCat}>{cardGroup.transactions.length} lançamentos</div>
                        </div>
                      </div>

                      <div className={styles.sourceBadge}>{cardGroup.source.name}</div>
                      
                      <div>
                        <span className={`${styles.typeBadge} ${styles.VARIABLE}`}>Fatura</span>
                      </div>

                      <div className={`${styles.txAmount}`}>
                        - {formatCurrency(cardGroup.total)}
                      </div>

                      <div className={styles.txDate}>Venc. dia {cardGroup.source.dueDay}</div>

                      <div className={styles.txActions}>
                        <button 
                          className={`${styles.iconBtn}`}
                          onClick={(e) => { e.stopPropagation(); setBatchModalSourceId(cardGroup.source.id); }}
                          title="Lançamento Rápido em Lote"
                          style={{ color: 'var(--color-primary)' }}
                        >
                          <BoltRoundedIcon />
                        </button>
                        <button 
                          className={`${styles.iconBtn} ${cardGroup.allPaid ? styles.paid : ''}`}
                          onClick={(e) => { e.stopPropagation(); handlePayCardBill(cardGroup.source.id, cardGroup.transactions); }}
                          title={cardGroup.allPaid ? 'Marcar fatura como não paga' : 'Pagar fatura inteira'}
                        >
                          {cardGroup.allPaid ? <CheckCircleRoundedIcon /> : <CheckCircleOutlineRoundedIcon />}
                        </button>
                        <ChevronRightRoundedIcon style={{ transform: expandedCards[cardGroup.source.id] ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', color: 'var(--color-text-muted)' }} />
                      </div>
                    </div>
                    
                    {/* Expanded Card Transactions */}
                    {expandedCards[cardGroup.source.id] && (
                      <div style={{ paddingLeft: '24px', borderLeft: `2px solid ${cardGroup.source.color}`, display: 'flex', flexDirection: 'column', gap: '4px', marginLeft: '16px' }}>
                        {cardGroup.transactions.map((tx: Transaction) => renderTransactionRow(tx))}
                      </div>
                    )}
                  </div>
                )
              } else {
                return renderTransactionRow(item.transaction)
              }
            })}
          </div>
        )}
      </div>

      <PaymentSourcesModal 
        isOpen={isSourcesModalOpen} 
        onClose={() => setIsSourcesModalOpen(false)} 
        userId={activeUser.id}
        onPaymentSourcesChange={loadData}
      />

      <BatchTransactionModal 
        isOpen={batchModalSourceId !== null}
        onClose={() => setBatchModalSourceId(null)}
        userId={activeUser.id}
        paymentSource={paymentSources.find(s => s.id === batchModalSourceId) || null}
        categories={categories}
        onSuccess={loadData}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Editar Lançamento' : 'Novo Lançamento'}>
        <form onSubmit={handleSubmit} className={formStyles.form}>
          <div className={formStyles.field}>
            <label className={formStyles.label}>Descrição</label>
            <input 
              required
              type="text" 
              className={formStyles.input}
              placeholder="Ex: Aluguel, Mercado, Salário..."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className={formStyles.formRow}>
            <div className={formStyles.field}>
              <label className={formStyles.label}>
                {formData.type === 'INSTALLMENT' ? 'Valor da Parcela (R$)' : 'Valor (R$)'}
              </label>
              <input 
                required
                type="number" 
                step="0.01"
                min="0"
                className={formStyles.input}
                placeholder="0.00"
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: e.target.value})}
              />
            </div>
            <div className={formStyles.field}>
              <label className={formStyles.label}>Data da Compra/Recebimento</label>
              <input 
                required
                type="date" 
                className={formStyles.input}
                value={formData.transactionDate}
                onChange={e => setFormData({...formData, transactionDate: e.target.value})}
              />
            </div>
          </div>

          <div className={formStyles.formRow}>
            <div className={formStyles.field}>
              <label className={formStyles.label}>Tipo</label>
              <select 
                className={formStyles.select}
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
              >
                <option value="VARIABLE">Variável Mensal (ex: Energia)</option>
                <option value="FIXED">Fixo / Recorrente (ex: Salário, Assinatura)</option>
                <option value="ONE_TIME">Avulso / Único (ex: Freelance, Supermercado)</option>
                <option value="INSTALLMENT">Parcelado (ex: Celular novo)</option>
              </select>
            </div>
            
            {formData.type === 'INSTALLMENT' && (
              <div className={formStyles.field}>
                <label className={formStyles.label}>Qtd Parcelas</label>
                <input 
                  required
                  type="number" 
                  min="2"
                  max="48"
                  className={formStyles.input}
                  value={formData.installmentsTotal}
                  onChange={e => setFormData({...formData, installmentsTotal: e.target.value})}
                  disabled={!!editingId} // can't change total installments when editing
                />
              </div>
            )}
            
            {formData.type === 'INSTALLMENT' && !editingId && (
              <div className={formStyles.field}>
                <label className={formStyles.label}>Parcelas Já Pagas</label>
                <input 
                  required
                  type="number" 
                  min="0"
                  max={Math.max(1, (parseInt(formData.installmentsTotal) || 1) - 1)}
                  className={formStyles.input}
                  value={formData.installmentsPaid}
                  onChange={e => setFormData({...formData, installmentsPaid: e.target.value})}
                />
              </div>
            )}
          </div>

          <div className={formStyles.formRow}>
            <div className={formStyles.field}>
              <label className={formStyles.label}>Categoria</label>
              <select 
                className={formStyles.select}
                value={formData.categoryId}
                onChange={e => setFormData({...formData, categoryId: e.target.value})}
                required
              >
                {formData.type === 'INCOME' ? (
                  <optgroup label="Receitas">
                    {categories.filter(c => c.isIncome).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </optgroup>
                ) : (
                  <>
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
                  </>
                )}
              </select>
            </div>
            
            <div className={formStyles.field}>
              <label className={formStyles.label}>Fonte de Pagamento</label>
              <select 
                className={formStyles.select}
                value={formData.paymentSourceId}
                onChange={e => setFormData({...formData, paymentSourceId: e.target.value})}
              >
                <option value="">Nenhuma (Dinheiro/Pix)</option>
                {paymentSources.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={formStyles.actions}>
            <button type="button" className={formStyles.btnSecondary} onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className={formStyles.btnPrimary}>
              Salvar
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={deleteModal.isOpen} 
        onClose={() => setDeleteModal({ isOpen: false, tx: null, isGrouped: false })} 
        title="Excluir Lançamento"
      >
        <div style={{ padding: '0 8px 16px', color: 'var(--color-text)' }}>
          {deleteModal.isGrouped ? (
            <p>Este lançamento é <strong>{deleteModal.tx?.type === 'FIXED' ? 'recorrente' : 'parcelado'}</strong> e existe em vários meses.</p>
          ) : (
            <p>Tem certeza que deseja excluir o lançamento <strong>{deleteModal.tx?.description}</strong>?</p>
          )}
        </div>
        
        <div className={formStyles.actions} style={{ flexDirection: deleteModal.isGrouped ? 'column' : 'row', gap: '8px' }}>
          {deleteModal.isGrouped ? (
            <>
              <button type="button" className={formStyles.btnPrimary} style={{ background: 'var(--color-danger)', border: 'none' }} onClick={() => confirmDelete(true)}>
                Excluir TODOS os meses
              </button>
              <button type="button" className={formStyles.btnPrimary} style={{ background: 'transparent', color: 'var(--color-danger)', border: '1px solid var(--color-danger)' }} onClick={() => confirmDelete(false)}>
                Excluir SOMENTE este mês
              </button>
              <button type="button" className={formStyles.btnSecondary} onClick={() => setDeleteModal({ isOpen: false, tx: null, isGrouped: false })}>
                Cancelar
              </button>
            </>
          ) : (
            <>
              <button type="button" className={formStyles.btnSecondary} onClick={() => setDeleteModal({ isOpen: false, tx: null, isGrouped: false })}>
                Cancelar
              </button>
              <button type="button" className={formStyles.btnPrimary} style={{ background: 'var(--color-danger)', border: 'none' }} onClick={() => confirmDelete(false)}>
                Confirmar Exclusão
              </button>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}
