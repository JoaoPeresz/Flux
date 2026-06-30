'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import CreditCardRoundedIcon from '@mui/icons-material/CreditCardRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import { useUser } from '@/store/UserContext'
import { timelineApi } from '@/services/api'
import type { MonthSummary, ProjectedItem } from '@/types'
import Skeleton from '@/components/ui/Skeleton'
import styles from './page.module.css'

const MONTHS = [
  'Jan','Fev','Mar','Abr','Mai','Jun',
  'Jul','Ago','Set','Out','Nov','Dez'
]

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function BalanceIndicator({ balance }: { balance: number }) {
  if (balance > 0)  return <TrendingUp size={16} color="var(--color-success)" />
  if (balance < 0)  return <TrendingDown size={16} color="var(--color-danger)" />
  return <Minus size={16} color="var(--color-text-muted)" />
}

export default function TimelinePage() {
  const { activeUser } = useUser()
  const [summaries, setSummaries] = useState<MonthSummary[]>([])
  const [selected, setSelected]   = useState<MonthSummary | null>(null)
  const [loading, setLoading]     = useState(false)
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!activeUser) return
    setLoading(true)
    timelineApi.get(activeUser.id, 12)
      .then(data => { setSummaries(data); setSelected(data[0] ?? null) })
      .finally(() => setLoading(false))
  }, [activeUser])

  const toggleCard = (sourceId: string) => {
    setExpandedCards(prev => ({ ...prev, [sourceId]: !prev[sourceId] }))
  }

  if (!activeUser) return <div className={styles.empty}>Selecione um usuário.</div>

  const grouped = selected ? selected.projectedItems.reduce((acc, item) => {
    if (item.paymentSourceType === 'CREDIT_CARD' && item.paymentSourceId) {
      if (!acc.cards[item.paymentSourceId]) {
        acc.cards[item.paymentSourceId] = {
          sourceId: item.paymentSourceId,
          sourceName: item.paymentSourceName || 'Cartão',
          color: item.paymentSourceColor || 'var(--color-primary)',
          dueDay: item.paymentSourceDueDay,
          total: 0,
          items: []
        }
      }
      acc.cards[item.paymentSourceId].items.push(item)
      acc.cards[item.paymentSourceId].total += item.amount
    } else {
      acc.normal.push(item)
    }
    return acc
  }, { normal: [] as ProjectedItem[], cards: {} as Record<string, any> }) : { normal: [], cards: {} }

  const cardGroups = Object.values(grouped.cards)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.title}>Prospecção dos próximos 12 meses</div>
        <div className={styles.subtitle}>
          Visualize suas contas fixas, parcelas e receitas ao longo do tempo.
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', gap: '24px', overflow: 'hidden', marginTop: '24px' }}>
          <div style={{ flex: '0 0 100px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} style={{ height: '90px', borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
               <Skeleton style={{ height: '36px', width: '200px' }} />
               <Skeleton style={{ height: '36px', width: '300px' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <Skeleton key={i} style={{ height: '64px', borderRadius: 'var(--radius-lg)' }} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Month strip */}
          <div className={styles.monthStrip}>
            {summaries.map(s => {
              const isPositive = s.balance >= 0
              return (
                <button
                  key={s.referenceMonth}
                  className={`${styles.monthCard} ${selected?.referenceMonth === s.referenceMonth ? styles.active : ''}`}
                  onClick={() => setSelected(s)}
                >
                  <div className={styles.monthName}>{MONTHS[s.month - 1]}</div>
                  <div className={styles.monthYear}>{s.year}</div>
                  <div className={`${styles.monthBalance} ${isPositive ? styles.positive : styles.negative}`}>
                    {formatBRL(s.balance)}
                  </div>
                  <BalanceIndicator balance={s.balance} />
                </button>
              )
            })}
          </div>

          {/* Detail panel */}
          {selected && (
            <div className={styles.detail}>
              <div className={styles.detailHeader}>
                <h2 className={styles.detailTitle}>
                  {MONTHS[selected.month - 1]} {selected.year}
                </h2>
                <div className={styles.detailSummary}>
                  <span className={styles.incomeTag}>↑ {formatBRL(selected.totalIncome)}</span>
                  <span className={styles.expenseTag}>↓ {formatBRL(selected.totalExpenses)}</span>
                  <span className={`${styles.balanceTag} ${selected.balance >= 0 ? styles.positive : styles.negative}`}>
                    Saldo: {formatBRL(selected.balance)}
                  </span>
                </div>
              </div>

              <div className={styles.itemList}>
                {selected.projectedItems.length === 0 ? (
                  <div className={styles.emptyDetail}>Nenhum lançamento previsto.</div>
                ) : (
                  <>
                    {/* Faturas de Cartão */}
                    {cardGroups.map((card: any) => (
                      <div key={card.sourceId} style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                        <div 
                          className={styles.projectedItem}
                          style={{ cursor: 'pointer', border: `1px solid ${card.color}` }}
                          onClick={() => toggleCard(card.sourceId)}
                        >
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                            <CreditCardRoundedIcon fontSize="small" />
                          </div>
                          
                          <div className={styles.itemInfo}>
                            <span className={styles.itemDesc}>Fatura - {card.sourceName}</span>
                            <span className={styles.itemCategory}>{card.items.length} itens</span>
                          </div>

                          <span className={styles.itemAmount} style={{ color: 'var(--color-text)' }}>
                            -{formatBRL(card.total)}
                          </span>

                          <div style={{ padding: '0 8px' }}>
                            <ChevronRightRoundedIcon style={{ transform: expandedCards[card.sourceId] ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', color: 'var(--color-text-muted)' }} />
                          </div>
                        </div>

                        {/* Detalhes do Cartão Expandidos */}
                        {expandedCards[card.sourceId] && (
                          <div style={{ paddingLeft: '16px', borderLeft: `2px solid ${card.color}`, display: 'flex', flexDirection: 'column', gap: '4px', marginLeft: '14px' }}>
                            {card.items.map((item: ProjectedItem, i: number) => (
                              <div key={`card-item-${i}`} className={styles.projectedItem} style={{ border: 'none', background: 'transparent' }}>
                                <div className={styles.itemDot} style={{ backgroundColor: item.categoryColor }} />
                                <div className={styles.itemInfo}>
                                  <span className={styles.itemDesc}>{item.description}</span>
                                  <span className={styles.itemCategory}>{item.categoryName}</span>
                                </div>
                                {item.installmentsTotal && (
                                  <span className={styles.installmentBadge}>
                                    {item.installmentNumber}/{item.installmentsTotal}x
                                  </span>
                                )}
                                <span className={styles.itemAmount}>
                                  -{formatBRL(item.amount)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Itens Normais (Não Cartão) */}
                    {grouped.normal.map((item, i) => (
                      <div key={`normal-item-${i}`} className={styles.projectedItem}>
                        <div
                          className={styles.itemDot}
                          style={{ backgroundColor: item.categoryColor }}
                        />
                        <div className={styles.itemInfo}>
                          <span className={styles.itemDesc}>{item.description}</span>
                          <span className={styles.itemCategory}>{item.categoryName}</span>
                        </div>
                        {item.installmentsTotal && (
                          <span className={styles.installmentBadge}>
                            {item.installmentNumber}/{item.installmentsTotal}x
                          </span>
                        )}
                        <span className={`${styles.itemAmount} ${item.categoryIsIncome ? styles.positive : ''}`}>
                          {!item.categoryIsIncome && '-'}{formatBRL(item.amount)}
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
