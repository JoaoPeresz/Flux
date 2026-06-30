'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Target, AlertTriangle, ShieldCheck, Trash2, Edit2 } from 'lucide-react'
import { useUser } from '@/store/UserContext'
import { transactionApi, budgetApi } from '@/services/api'
import type { Transaction, Budget, RuleGroup } from '@/types'
import BudgetModal from '@/components/BudgetModal'
import RuleConfigModal from '@/components/RuleConfigModal'
import Skeleton from '@/components/ui/Skeleton'
import styles from './page.module.css'

const MONTHS = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
]

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function getProgressColor(percent: number, target: number) {
  if (percent > target) return 'var(--color-danger)'
  if (percent > target * 0.9) return 'var(--color-warning)'
  return 'var(--color-success)'
}

export default function DashboardPage() {
  const { activeUser } = useUser()
  const router = useRouter()
  const now = new Date()

  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [transactions, setTxs] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(false)
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false)
  const [isRuleConfigOpen, setIsRuleConfigOpen] = useState(false)

  const loadData = () => {
    if (!activeUser) return
    setLoading(true)
    Promise.all([
      transactionApi.getMonthly(activeUser.id, year, month),
      budgetApi.getMonthly(activeUser.id, year, month)
    ])
      .then(([txs, bdgs]) => { setTxs(txs); setBudgets(bdgs) })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [activeUser, year, month])

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const handleDeleteBudget = async (id: string) => {
    if (!confirm('Deseja realmente excluir este limite?')) return
    try {
      await budgetApi.delete(id)
      loadData()
    } catch (err) {
      console.error('Error deleting budget:', err)
      alert('Erro ao excluir limite.')
    }
  }

  const { totalIncome, totalExpenses, balance } = useMemo(() => {
    const totalIncome = transactions.filter(t => t.categoryIsIncome).reduce((s, t) => s + t.amount, 0)
    const totalExpenses = transactions.filter(t => !t.categoryIsIncome).reduce((s, t) => s + t.amount, 0)
    return { totalIncome, totalExpenses, balance: totalIncome - totalExpenses }
  }, [transactions])

  // 50/30/20 Rule Calculations (Now dynamic)
  const ruleStats = useMemo(() => {
    const stats = {
      NEEDS: { spent: 0, targetPct: activeUser?.rule1Percent ?? 50, name: activeUser?.rule1Name || 'Necessidades', desc: 'Contas, mercado, moradia' },
      WANTS: { spent: 0, targetPct: activeUser?.rule2Percent ?? 30, name: activeUser?.rule2Name || 'Desejos', desc: 'Lazer, compras, viagens' },
      SAVINGS: { spent: 0, targetPct: activeUser?.rule3Percent ?? 20, name: activeUser?.rule3Name || 'Poupança/Dívidas', desc: 'Investimentos, quitações' },
    }

    transactions.filter(t => !t.categoryIsIncome).forEach(t => {
      const group = t.categoryRuleGroup || 'NEEDS'
      if (stats[group]) {
        stats[group].spent += t.amount
      }
    })

    return stats
  }, [transactions, activeUser])

  if (!activeUser) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>👤</div>
        <div className={styles.emptyText}>Nenhum usuário encontrado. Crie um nas configurações.</div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.greeting}>Olá, {activeUser.name} 👋</div>
          <div className={styles.title}>Visão Geral do Mês</div>
        </div>

        <div className={styles.monthNav}>
          <button className={styles.navBtn} onClick={prevMonth}><ChevronLeft size={18} /></button>
          <span className={styles.monthLabel}>{MONTHS[month - 1]} {year}</span>
          <button className={styles.navBtn} onClick={nextMonth}><ChevronRight size={18} /></button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '24px' }}>
          <div className={styles.summaryGrid}>
            <Skeleton style={{ height: '110px', borderRadius: 'var(--radius-lg)' }} />
            <Skeleton style={{ height: '110px', borderRadius: 'var(--radius-lg)' }} />
            <Skeleton style={{ height: '110px', borderRadius: 'var(--radius-lg)' }} />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
            <div>
              <Skeleton style={{ height: '28px', width: '200px', marginBottom: '8px' }} />
              <Skeleton style={{ height: '16px', width: '300px' }} />
            </div>
            <Skeleton style={{ height: '36px', width: '150px', borderRadius: 'var(--radius-full)' }} />
          </div>

          <div className={styles.ruleGrid}>
            <Skeleton style={{ height: '200px', borderRadius: 'var(--radius-lg)' }} />
            <Skeleton style={{ height: '200px', borderRadius: 'var(--radius-lg)' }} />
            <Skeleton style={{ height: '200px', borderRadius: 'var(--radius-lg)' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
            <div>
              <Skeleton style={{ height: '28px', width: '250px', marginBottom: '8px' }} />
              <Skeleton style={{ height: '16px', width: '280px' }} />
            </div>
            <Skeleton style={{ height: '36px', width: '150px', borderRadius: 'var(--radius-full)' }} />
          </div>

          <div className={styles.budgetGrid}>
            <Skeleton style={{ height: '130px', borderRadius: 'var(--radius-lg)' }} />
            <Skeleton style={{ height: '130px', borderRadius: 'var(--radius-lg)' }} />
            <Skeleton style={{ height: '130px', borderRadius: 'var(--radius-lg)' }} />
          </div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryLabel}>Receitas Reais</div>
              <div className={`${styles.summaryValue} ${styles.income}`}>{formatBRL(totalIncome)}</div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryLabel}>Despesas Reais</div>
              <div className={`${styles.summaryValue} ${styles.expense}`}>{formatBRL(totalExpenses)}</div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryLabel}>Balanço</div>
              <div className={`${styles.summaryValue} ${balance >= 0 ? styles.balanced : styles.expense}`}>
                {formatBRL(balance)}
              </div>
            </div>
          </div>

          {/* 50/30/20 Rule Section */}
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Sua Regra de Gastos</h2>
              <div className={styles.sectionSubtitle}>Baseado na sua receita deste mês</div>
            </div>
            <button className={styles.actionBtn} onClick={() => setIsRuleConfigOpen(true)}>
              ⚙️ Configurar Regras
            </button>
          </div>

          <div className={styles.ruleGrid}>
            {(['NEEDS', 'WANTS', 'SAVINGS'] as RuleGroup[]).map(group => {
              const stat = ruleStats[group]
              const targetAmount = totalIncome > 0 ? (totalIncome * stat.targetPct) / 100 : 0
              const currentPct = totalIncome > 0 ? (stat.spent / totalIncome) * 100 : 0
              const progressColor = getProgressColor(currentPct, stat.targetPct)

              return (
                <div 
                  key={group} 
                  className={styles.ruleCard} 
                  onClick={() => router.push(`/transactions?filter=${group}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={styles.ruleHeader}>
                    <div className={styles.ruleName}>{stat.name}</div>
                    <div className={styles.ruleTargetBadge}>{stat.targetPct}%</div>
                  </div>
                  <div className={styles.ruleDesc}>{stat.desc}</div>

                  <div className={styles.ruleAmounts}>
                    <span className={styles.ruleSpent} style={{ color: progressColor }}>
                      {formatBRL(stat.spent)}
                    </span>
                    <span className={styles.ruleTargetAmount}>
                      / {formatBRL(targetAmount)}
                    </span>
                  </div>

                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{
                        width: `${Math.min(currentPct, 100)}%`,
                        backgroundColor: progressColor
                      }}
                    />
                    <div
                      className={styles.progressMarker}
                      style={{ left: `${stat.targetPct}%` }}
                      title={`Limite Ideal (${stat.targetPct}%)`}
                    />
                  </div>

                  <div className={styles.ruleFooter}>
                    {currentPct > stat.targetPct ? (
                      <span className={styles.ruleAlert}><AlertTriangle size={14} /> Acima do recomendado</span>
                    ) : (
                      <span className={styles.ruleOk}><ShieldCheck size={14} /> Dentro da meta</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Budgets Section */}
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Limites de Gastos (Budgets)</h2>
              <div className={styles.sectionSubtitle}>Controle limites por categoria específica</div>
            </div>
            <button className={styles.actionBtn} onClick={() => setIsBudgetModalOpen(true)}>
              <Target size={16} /> Definir Limites
            </button>
          </div>

          <div className={styles.budgetGrid}>
            {budgets.length === 0 ? (
              <div className={styles.emptyBudgets}>
                <Target size={32} style={{ color: 'var(--color-text-dim)', marginBottom: 12 }} />
                <p>Nenhum limite estipulado para este mês.</p>
                <button className={styles.textBtn} onClick={() => setIsBudgetModalOpen(true)}>
                  Criar meu primeiro limite
                </button>
              </div>
            ) : (
              budgets.map(b => {
                const percent = Math.min(b.percentUsed, 100)
                const isDanger = percent >= 100
                const isWarning = percent >= 80 && percent < 100

                return (
                  <div key={b.id} className={styles.budgetCard}>
                    <div className={styles.budgetHeader}>
                      <div className={styles.budgetName}>{b.categoryName}</div>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div className={styles.budgetPercent}>{b.percentUsed}%</div>
                        <button className={styles.iconBtn} onClick={() => setIsBudgetModalOpen(true)} title="Editar limites">
                          <Edit2 size={14} />
                        </button>
                        <button className={`${styles.iconBtn} ${styles.danger}`} onClick={() => handleDeleteBudget(b.id)} title="Excluir limite">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className={styles.budgetAmounts}>
                      <span className={styles.budgetSpent}>{formatBRL(b.spent)}</span>
                      <span className={styles.budgetLimit}>de {formatBRL(b.limitAmount)}</span>
                    </div>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{
                          width: `${percent}%`,
                          backgroundColor: isDanger ? 'var(--color-danger)' : isWarning ? 'var(--color-warning)' : 'var(--color-primary)'
                        }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </>
      )}

      {isBudgetModalOpen && activeUser && (
        <BudgetModal
          isOpen={isBudgetModalOpen}
          onClose={() => setIsBudgetModalOpen(false)}
          userId={activeUser.id}
          year={year}
          month={month}
          onSaved={loadData}
        />
      )}

      {isRuleConfigOpen && activeUser && (
        <RuleConfigModal
          isOpen={isRuleConfigOpen}
          onClose={() => setIsRuleConfigOpen(false)}
          user={activeUser}
          onSaved={() => {
            // we should ideally update the user in context, but reloading the page or forcing a reload works too
            // UserContext needs a refreshUser method, but for now we just let the Context handle itself or we reload
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}
