import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuid } from 'uuid'
import type {
  ApprovalRecord,
  ExpenseItem,
  ExpenseReport,
  ExpenseReportStatus,
  User,
  UserRole,
} from '@/types/expense'
import { getNextStatus } from '@/types/expense'

interface ExpenseState {
  // 現在のユーザー
  currentUser: User | null
  setCurrentUser: (user: User | null) => void

  // デモ用ユーザーリスト
  demoUsers: User[]

  // 経費精算書一覧
  reports: ExpenseReport[]

  // 新規作成
  createReport: (report: Omit<ExpenseReport, 'id' | 'reportNumber' | 'createdAt' | 'updatedAt' | 'approvalHistory'>) => ExpenseReport

  // 更新
  updateReport: (id: string, updates: Partial<ExpenseReport>) => void

  // 削除
  deleteReport: (id: string) => void

  // 明細追加
  addExpenseItem: (reportId: string, item: Omit<ExpenseItem, 'id'>) => void

  // 明細更新
  updateExpenseItem: (reportId: string, itemId: string, updates: Partial<ExpenseItem>) => void

  // 明細削除
  removeExpenseItem: (reportId: string, itemId: string) => void

  // 提出
  submitReport: (reportId: string) => void

  // 承認
  approveReport: (reportId: string, approverId: string, approverName: string, approverRole: UserRole, comment?: string) => void

  // 却下
  rejectReport: (reportId: string, approverId: string, approverName: string, approverRole: UserRole, comment: string) => void

  // フィルタリング
  getReportsByStatus: (status: ExpenseReportStatus) => ExpenseReport[]
  getReportsBySubmitter: (submitterId: string) => ExpenseReport[]
  getReportsForApproval: (approverRole: UserRole) => ExpenseReport[]
  getReportById: (id: string) => ExpenseReport | undefined

  // 精算番号生成
  generateReportNumber: () => string
}

// デモ用ユーザーデータ
const demoUsers: User[] = [
  { id: 'user-1', name: '山田 太郎', email: 'yamada@example.com', department: '営業部', role: 'employee' },
  { id: 'user-2', name: '佐藤 花子', email: 'sato@example.com', department: '営業部', role: 'department_manager' },
  { id: 'user-3', name: '鈴木 一郎', email: 'suzuki@example.com', department: '経理部', role: 'accountant' },
  { id: 'user-4', name: '田中 美咲', email: 'tanaka@example.com', department: '経理部', role: 'accounting_manager' },
  { id: 'user-5', name: '伊藤 健太', email: 'ito@example.com', department: '開発部', role: 'employee' },
  { id: 'user-6', name: '渡辺 真理', email: 'watanabe@example.com', department: '開発部', role: 'department_manager' },
]

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      demoUsers,
      reports: [],

      setCurrentUser: (user) => {
        set({ currentUser: user })
      },

      generateReportNumber: () => {
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const reports = get().reports
        const count = reports.filter((r) => {
          const d = new Date(r.createdAt)
          return d.getFullYear() === year && d.getMonth() === now.getMonth()
        }).length + 1
        return `EXP-${year}${month}-${String(count).padStart(4, '0')}`
      },

      createReport: (report) => {
        const id = uuid()
        const now = new Date().toISOString()
        const reportNumber = get().generateReportNumber()
        const newReport: ExpenseReport = {
          ...report,
          id,
          reportNumber,
          createdAt: now,
          updatedAt: now,
          approvalHistory: [],
        }
        set((state) => ({
          reports: [...state.reports, newReport],
        }))
        return newReport
      },

      updateReport: (id, updates) => {
        set((state) => ({
          reports: state.reports.map((r) =>
            r.id === id
              ? { ...r, ...updates, updatedAt: new Date().toISOString() }
              : r,
          ),
        }))
      },

      deleteReport: (id) => {
        set((state) => ({
          reports: state.reports.filter((r) => r.id !== id),
        }))
      },

      addExpenseItem: (reportId, item) => {
        const newItem: ExpenseItem = {
          ...item,
          id: uuid(),
        }
        set((state) => ({
          reports: state.reports.map((r) => {
            if (r.id !== reportId)
              return r
            const items = [...r.items, newItem]
            const totalAmount = items.reduce((sum, i) => sum + i.amount, 0)
            const totalTaxAmount = items.reduce((sum, i) => sum + i.taxAmount, 0)
            return {
              ...r,
              items,
              totalAmount,
              totalTaxAmount,
              updatedAt: new Date().toISOString(),
            }
          }),
        }))
      },

      updateExpenseItem: (reportId, itemId, updates) => {
        set((state) => ({
          reports: state.reports.map((r) => {
            if (r.id !== reportId)
              return r
            const items = r.items.map((i) =>
              i.id === itemId ? { ...i, ...updates } : i,
            )
            const totalAmount = items.reduce((sum, i) => sum + i.amount, 0)
            const totalTaxAmount = items.reduce((sum, i) => sum + i.taxAmount, 0)
            return {
              ...r,
              items,
              totalAmount,
              totalTaxAmount,
              updatedAt: new Date().toISOString(),
            }
          }),
        }))
      },

      removeExpenseItem: (reportId, itemId) => {
        set((state) => ({
          reports: state.reports.map((r) => {
            if (r.id !== reportId)
              return r
            const items = r.items.filter((i) => i.id !== itemId)
            const totalAmount = items.reduce((sum, i) => sum + i.amount, 0)
            const totalTaxAmount = items.reduce((sum, i) => sum + i.taxAmount, 0)
            return {
              ...r,
              items,
              totalAmount,
              totalTaxAmount,
              updatedAt: new Date().toISOString(),
            }
          }),
        }))
      },

      submitReport: (reportId) => {
        set((state) => ({
          reports: state.reports.map((r) =>
            r.id === reportId
              ? {
                  ...r,
                  status: 'submitted' as ExpenseReportStatus,
                  submittedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : r,
          ),
        }))
      },

      approveReport: (reportId, approverId, approverName, approverRole, comment) => {
        set((state) => ({
          reports: state.reports.map((r) => {
            if (r.id !== reportId)
              return r

            const approvalRecord: ApprovalRecord = {
              id: uuid(),
              approverRole,
              approverId,
              approverName,
              status: 'approved',
              comment,
              timestamp: new Date().toISOString(),
            }

            const nextStatus = getNextStatus(r.status, approverRole)

            return {
              ...r,
              status: nextStatus,
              approvalHistory: [...r.approvalHistory, approvalRecord],
              updatedAt: new Date().toISOString(),
            }
          }),
        }))
      },

      rejectReport: (reportId, approverId, approverName, approverRole, comment) => {
        set((state) => ({
          reports: state.reports.map((r) => {
            if (r.id !== reportId)
              return r

            const approvalRecord: ApprovalRecord = {
              id: uuid(),
              approverRole,
              approverId,
              approverName,
              status: 'rejected',
              comment,
              timestamp: new Date().toISOString(),
            }

            return {
              ...r,
              status: 'rejected' as ExpenseReportStatus,
              approvalHistory: [...r.approvalHistory, approvalRecord],
              updatedAt: new Date().toISOString(),
            }
          }),
        }))
      },

      getReportsByStatus: (status) => {
        return get().reports.filter((r) => r.status === status)
      },

      getReportsBySubmitter: (submitterId) => {
        return get().reports.filter((r) => r.submitterId === submitterId)
      },

      getReportsForApproval: (approverRole) => {
        const reports = get().reports
        switch (approverRole) {
          case 'department_manager':
            return reports.filter((r) => r.status === 'submitted')
          case 'accountant':
            return reports.filter((r) => r.status === 'department_approved')
          case 'accounting_manager':
            return reports.filter((r) => r.status === 'accountant_approved')
          default:
            return []
        }
      },

      getReportById: (id) => {
        return get().reports.find((r) => r.id === id)
      },
    }),
    {
      name: 'expense-store',
    },
  ),
)
