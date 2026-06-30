import axios from 'axios'
import type {
  User, Category, PaymentSource, Transaction, Budget, MonthSummary,
  CreateTransactionRequest, UpsertBudgetRequest, CreatePaymentSourceRequest, UpdatePaymentSourceRequest
} from '@/types'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' }
})

// ── Users ──────────────────────────────────────────────────────────────────

export const userApi = {
  list: () => api.get<User[]>('/api/users').then(r => r.data),
  login: (data: { email: string, pin: string }) => 
    api.post<User>('/api/users/login', data).then(r => r.data),
  register: (data: { name: string, email: string, pin: string, avatarColor: string }) =>
    api.post<User>('/api/users/register', data).then(r => r.data),
  delete: (id: string) => api.delete(`/api/users/${id}`),
  updateRules: (id: string, data: any) =>
    api.put<User>(`/api/users/${id}/rules`, data).then(r => r.data)
}

// ── Categories ─────────────────────────────────────────────────────────────

export const categoryApi = {
  list: (isIncome?: boolean) =>
    api.get<Category[]>('/api/categories', { params: { isIncome } }).then(r => r.data),
  create: (data: Omit<Category, 'id'>) =>
    api.post<Category>('/api/categories', data).then(r => r.data),
  update: (id: string, data: Omit<Category, 'id'>) =>
    api.put<Category>(`/api/categories/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/api/categories/${id}`)
}

// ── Payment Sources ────────────────────────────────────────────────────────

export const paymentSourceApi = {
  listByUser: (userId: string) =>
    api.get<PaymentSource[]>('/api/payment-sources', { params: { userId } }).then(r => r.data),
  create: (data: CreatePaymentSourceRequest) =>
    api.post<PaymentSource>('/api/payment-sources', data).then(r => r.data),
  update: (id: string, data: UpdatePaymentSourceRequest) =>
    api.put<PaymentSource>(`/api/payment-sources/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/api/payment-sources/${id}`)
}

// ── Transactions ───────────────────────────────────────────────────────────

export const transactionApi = {
  getMonthly: (userId: string, year: number, month: number) =>
    api.get<Transaction[]>('/api/transactions', { params: { userId, year, month } }).then(r => r.data),
  create: (data: CreateTransactionRequest) =>
    api.post<Transaction[]>('/api/transactions', data).then(r => r.data),
  update: (id: string, data: Partial<CreateTransactionRequest & { isPaid: boolean }>) =>
    api.put<Transaction>(`/api/transactions/${id}`, data).then(r => r.data),
  delete: (id: string, deleteGroup = false) =>
    api.delete(`/api/transactions/${id}`, { params: { deleteGroup } })
}

// ── Budgets ────────────────────────────────────────────────────────────────

export const budgetApi = {
  getMonthly: (userId: string, year: number, month: number) =>
    api.get<Budget[]>('/api/budgets', { params: { userId, year, month } }).then(r => r.data),
  upsert: (data: UpsertBudgetRequest) =>
    api.put<Budget>('/api/budgets', data).then(r => r.data),
  delete: (id: string) => api.delete(`/api/budgets/${id}`)
}

// ── Timeline ───────────────────────────────────────────────────────────────

export const timelineApi = {
  get: (userId: string, months = 12) =>
    api.get<MonthSummary[]>('/api/timeline', { params: { userId, months } }).then(r => r.data)
}

export default api
