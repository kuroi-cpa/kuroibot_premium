import type { ExpenseReport, JournalEntry } from '@/types/expense'

// 経費精算書から仕訳データを生成
export function generateJournalEntries(report: ExpenseReport): JournalEntry[] {
  const entries: JournalEntry[] = []

  for (const item of report.items) {
    // 借方: 経費勘定、貸方: 未払金（または現金）
    entries.push({
      date: item.date,
      debitAccount: `${item.accountCode} ${item.accountName}`,
      debitAmount: item.amount,
      creditAccount: '211 未払金',
      creditAmount: item.amount,
      description: `${item.vendor} - ${item.description}`,
      department: report.department,
      reportNumber: report.reportNumber,
    })
  }

  return entries
}

// 仕訳データをCSV形式に変換
export function journalEntriesToCSV(entries: JournalEntry[]): string {
  const headers = [
    '日付',
    '借方勘定科目',
    '借方金額',
    '貸方勘定科目',
    '貸方金額',
    '摘要',
    '部門',
    '精算番号',
  ]

  const rows = entries.map((entry) => [
    entry.date,
    entry.debitAccount,
    String(entry.debitAmount),
    entry.creditAccount,
    String(entry.creditAmount),
    entry.description,
    entry.department,
    entry.reportNumber,
  ])

  // CSVエスケープ処理
  const escapeCSV = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n'))
      return `"${value.replace(/"/g, '""')}"`
    return value
  }

  const csvLines = [
    headers.map(escapeCSV).join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ]

  return csvLines.join('\n')
}

// 経費精算書一覧をCSV形式に変換
export function reportsToCSV(reports: ExpenseReport[]): string {
  const headers = [
    '精算番号',
    'タイトル',
    '申請者',
    '部門',
    'ステータス',
    '合計金額',
    '消費税合計',
    '申請日',
    '作成日',
  ]

  const statusLabels: Record<string, string> = {
    draft: '下書き',
    submitted: '部門長承認待ち',
    department_approved: '経理担当者承認待ち',
    accountant_approved: '経理部門長承認待ち',
    fully_approved: '承認完了',
    rejected: '却下',
  }

  const rows = reports.map((report) => [
    report.reportNumber,
    report.title,
    report.submitterName,
    report.department,
    statusLabels[report.status] || report.status,
    String(report.totalAmount),
    String(report.totalTaxAmount),
    report.submittedAt || '',
    report.createdAt,
  ])

  const escapeCSV = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n'))
      return `"${value.replace(/"/g, '""')}"`
    return value
  }

  const csvLines = [
    headers.map(escapeCSV).join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ]

  return csvLines.join('\n')
}

// 経費明細をCSV形式に変換
export function expenseItemsToCSV(report: ExpenseReport): string {
  const headers = [
    '精算番号',
    '明細番号',
    '日付',
    '取引先',
    '摘要',
    '勘定科目コード',
    '勘定科目名',
    '金額',
    '消費税額',
  ]

  const rows = report.items.map((item, index) => [
    report.reportNumber,
    String(index + 1),
    item.date,
    item.vendor,
    item.description,
    item.accountCode,
    item.accountName,
    String(item.amount),
    String(item.taxAmount),
  ])

  const escapeCSV = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n'))
      return `"${value.replace(/"/g, '""')}"`
    return value
  }

  const csvLines = [
    headers.map(escapeCSV).join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ]

  return csvLines.join('\n')
}

// CSVダウンロード
export function downloadCSV(content: string, filename: string): void {
  // BOM付きUTF-8でExcelでの文字化けを防ぐ
  const bom = new Uint8Array([0xEF, 0xBB, 0xBF])
  const blob = new Blob([bom, content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// 仕訳CSVをダウンロード
export function downloadJournalCSV(report: ExpenseReport): void {
  const entries = generateJournalEntries(report)
  const csv = journalEntriesToCSV(entries)
  const filename = `仕訳_${report.reportNumber}_${new Date().toISOString().slice(0, 10)}.csv`
  downloadCSV(csv, filename)
}

// 経費明細CSVをダウンロード
export function downloadExpenseItemsCSV(report: ExpenseReport): void {
  const csv = expenseItemsToCSV(report)
  const filename = `経費明細_${report.reportNumber}_${new Date().toISOString().slice(0, 10)}.csv`
  downloadCSV(csv, filename)
}

// 一括仕訳CSVをダウンロード
export function downloadBulkJournalCSV(reports: ExpenseReport[]): void {
  const allEntries: JournalEntry[] = []
  for (const report of reports)
    allEntries.push(...generateJournalEntries(report))

  const csv = journalEntriesToCSV(allEntries)
  const filename = `仕訳一括_${new Date().toISOString().slice(0, 10)}.csv`
  downloadCSV(csv, filename)
}
