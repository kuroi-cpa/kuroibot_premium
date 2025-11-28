// 経費精算アプリの型定義

// ユーザーロール
export type UserRole = 'employee' | 'department_manager' | 'accountant' | 'accounting_manager'

// ユーザー情報
export interface User {
  id: string
  name: string
  email: string
  department: string
  role: UserRole
}

// 承認ステータス
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

// 経費精算全体のステータス
export type ExpenseReportStatus =
  | 'draft'                    // 下書き
  | 'submitted'                // 提出済み（部門長承認待ち）
  | 'department_approved'      // 部門長承認済み（経理担当者承認待ち）
  | 'accountant_approved'      // 経理担当者承認済み（経理部門長承認待ち）
  | 'fully_approved'           // 最終承認済み
  | 'rejected'                 // 却下

// 承認履歴
export interface ApprovalRecord {
  id: string
  approverRole: UserRole
  approverId: string
  approverName: string
  status: ApprovalStatus
  comment?: string
  timestamp: string
}

// 勘定科目
export interface AccountCode {
  code: string
  name: string
  category: 'expense' | 'asset' | 'liability'
}

// 経費明細
export interface ExpenseItem {
  id: string
  date: string                 // 発生日
  description: string          // 摘要
  vendor: string               // 取引先
  amount: number               // 金額
  taxAmount: number            // 消費税額
  accountCode: string          // 勘定科目コード
  accountName: string          // 勘定科目名
  receiptFile?: UploadedFile   // アップロードされたレシート
  ocrData?: OCRResult          // OCR結果
}

// アップロードファイル
export interface UploadedFile {
  id: string
  name: string
  type: string                 // image/jpeg, image/png, application/pdf
  size: number
  url: string                  // Base64 or Object URL
  uploadedAt: string
}

// OCR解析結果
export interface OCRResult {
  vendor?: string              // 取引先名
  date?: string                // 日付
  totalAmount?: number         // 合計金額
  taxAmount?: number           // 消費税額
  items?: OCRLineItem[]        // 明細
  rawText?: string             // 生テキスト
  confidence?: number          // 信頼度 (0-1)
}

// OCR明細行
export interface OCRLineItem {
  description: string
  quantity?: number
  unitPrice?: number
  amount: number
}

// 経費精算書
export interface ExpenseReport {
  id: string
  reportNumber: string         // 精算番号
  title: string                // タイトル
  submitterId: string          // 申請者ID
  submitterName: string        // 申請者名
  department: string           // 部門
  status: ExpenseReportStatus  // ステータス
  items: ExpenseItem[]         // 経費明細
  totalAmount: number          // 合計金額
  totalTaxAmount: number       // 消費税合計
  purpose: string              // 目的・理由
  approvalHistory: ApprovalRecord[]  // 承認履歴
  createdAt: string
  updatedAt: string
  submittedAt?: string
}

// CSV出力用の仕訳データ
export interface JournalEntry {
  date: string                 // 日付
  debitAccount: string         // 借方勘定科目
  debitAmount: number          // 借方金額
  creditAccount: string        // 貸方勘定科目
  creditAmount: number         // 貸方金額
  description: string          // 摘要
  department: string           // 部門
  reportNumber: string         // 精算番号
}

// デフォルトの勘定科目リスト
export const DEFAULT_ACCOUNT_CODES: AccountCode[] = [
  { code: '711', name: '旅費交通費', category: 'expense' },
  { code: '712', name: '通信費', category: 'expense' },
  { code: '713', name: '消耗品費', category: 'expense' },
  { code: '714', name: '接待交際費', category: 'expense' },
  { code: '715', name: '会議費', category: 'expense' },
  { code: '716', name: '新聞図書費', category: 'expense' },
  { code: '717', name: '諸会費', category: 'expense' },
  { code: '718', name: '支払手数料', category: 'expense' },
  { code: '719', name: '雑費', category: 'expense' },
  { code: '720', name: '租税公課', category: 'expense' },
  { code: '721', name: '保険料', category: 'expense' },
  { code: '722', name: '修繕費', category: 'expense' },
  { code: '723', name: '水道光熱費', category: 'expense' },
  { code: '724', name: '地代家賃', category: 'expense' },
  { code: '725', name: '広告宣伝費', category: 'expense' },
]

// ステータスの表示名
export const STATUS_LABELS: Record<ExpenseReportStatus, string> = {
  draft: '下書き',
  submitted: '部門長承認待ち',
  department_approved: '経理担当者承認待ち',
  accountant_approved: '経理部門長承認待ち',
  fully_approved: '承認完了',
  rejected: '却下',
}

// ロールの表示名
export const ROLE_LABELS: Record<UserRole, string> = {
  employee: '担当者',
  department_manager: '部門長',
  accountant: '経理担当者',
  accounting_manager: '経理部門長',
}

// 次の承認者のロールを取得
export function getNextApproverRole(status: ExpenseReportStatus): UserRole | null {
  switch (status) {
    case 'submitted':
      return 'department_manager'
    case 'department_approved':
      return 'accountant'
    case 'accountant_approved':
      return 'accounting_manager'
    default:
      return null
  }
}

// 承認後の次のステータスを取得
export function getNextStatus(currentStatus: ExpenseReportStatus, approverRole: UserRole): ExpenseReportStatus {
  if (approverRole === 'department_manager' && currentStatus === 'submitted')
    return 'department_approved'
  if (approverRole === 'accountant' && currentStatus === 'department_approved')
    return 'accountant_approved'
  if (approverRole === 'accounting_manager' && currentStatus === 'accountant_approved')
    return 'fully_approved'
  return currentStatus
}
