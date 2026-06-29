// ── Shared types matching the backend DTOs ─────────────────────────────────

export type TransactionType = 'FIXED' | 'INSTALLMENT' | 'VARIABLE' | 'ONE_TIME' | 'INCOME'
export type PaymentSourceType = 'CREDIT_CARD' | 'DEBIT' | 'CASH' | 'PIX' | 'BOLETO' | 'AUTO_DEBIT'
export type RuleGroup = 'NEEDS' | 'WANTS' | 'SAVINGS'

export interface User {
  id: string
  name: string
  avatarColor: string
  rule1Name: string
  rule1Percent: number
  rule2Name: string
  rule2Percent: number
  rule3Name: string
  rule3Percent: number
}

export interface CreateUserRequest {
  name: string
  avatarColor?: string
}

export interface UpdateUserRulesRequest {
  rule1Name: string
  rule1Percent: number
  rule2Name: string
  rule2Percent: number
  rule3Name: string
  rule3Percent: number
}

export interface Category {
  id: string
  name: string
  icon: string
  color: string
  isIncome: boolean
  ruleGroup: RuleGroup
}

export interface PaymentSource {
  id: string
  userId: string
  name: string
  type: PaymentSourceType
  closingDay?: number
  dueDay?: number
  color: string
  icon: string
}

export interface Transaction {
  id: string
  userId: string
  categoryId: string
  categoryName: string
  categoryColor: string
  categoryIcon: string
  categoryIsIncome: boolean
  categoryRuleGroup: RuleGroup
  paymentSourceId: string | null
  paymentSourceName: string | null
  description: string
  amount: number
  transactionDate: string   // ISO date
  competenceDate: string    // ISO date
  type: TransactionType
  installmentGroupId: string | null
  installmentNumber: number | null
  installmentsTotal: number | null
  recurrenceEndDate: string | null
  isShared: boolean
  isPaid: boolean
  notes: string | null
}

export interface Budget {
  id: string
  userId: string
  categoryId: string
  categoryName: string
  referenceMonth: string
  limitAmount: number
  spent: number
  remaining: number
  percentUsed: number
}

export interface ProjectedItem {
  description: string
  amount: number
  categoryName: string
  categoryColor: string
  categoryIcon: string
  categoryIsIncome: boolean
  type: TransactionType
  installmentNumber?: number
  installmentsTotal?: number
  isPaid: boolean
  paymentSourceId?: string
  paymentSourceName?: string
  paymentSourceType?: 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_SLIP' | 'CASH' | 'OTHER'
  paymentSourceColor?: string
  paymentSourceDueDay?: number
}

export interface MonthSummary {
  month: number
  year: number
  referenceMonth: string
  totalIncome: number
  totalExpenses: number
  balance: number
  projectedItems: ProjectedItem[]
}

// ── Request types ──────────────────────────────────────────────────────────

export interface CreatePaymentSourceRequest {
  userId: string
  name: string
  type: PaymentSourceType
  closingDay?: number
  dueDay?: number
  color: string
  icon: string
}

export interface UpdatePaymentSourceRequest {
  name: string
  type: PaymentSourceType
  closingDay?: number
  dueDay?: number
  color: string
  icon: string
}

export interface CreateTransactionRequest {
  userId: string
  categoryId: string
  paymentSourceId?: string
  description: string
  amount: number
  transactionDate: string
  type: 'FIXED' | 'INSTALLMENT' | 'VARIABLE' | 'ONE_TIME'
  installmentsTotal?: number
  installmentsPaid?: number
  recurrenceEndDate?: string
  isShared?: boolean
  notes?: string
}

export interface UpsertBudgetRequest {
  userId: string
  categoryId: string
  referenceMonth: string  // YYYY-MM-DD (first of month)
  limitAmount: number
}
