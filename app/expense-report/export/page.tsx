'use client'

import React, { useState, useMemo } from 'react'
import { useExpenseStore } from '@/hooks/use-expense-store'
import { STATUS_LABELS } from '@/types/expense'
import type { ExpenseReportStatus } from '@/types/expense'
import {
  downloadJournalCSV,
  downloadExpenseItemsCSV,
  downloadBulkJournalCSV,
  reportsToCSV,
  downloadCSV,
} from '@/utils/csv-export'
import cn from 'classnames'

const statusColors: Record<ExpenseReportStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-yellow-100 text-yellow-700',
  department_approved: 'bg-blue-100 text-blue-700',
  accountant_approved: 'bg-purple-100 text-purple-700',
  fully_approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

export default function ExportPage() {
  const { reports, currentUser } = useExpenseStore()

  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [statusFilter, setStatusFilter] = useState<ExpenseReportStatus | 'all'>('fully_approved')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // フィルタリングされた経費精算書
  const filteredReports = useMemo(() => {
    let result = reports

    // ステータスフィルター
    if (statusFilter !== 'all')
      result = result.filter((r) => r.status === statusFilter)

    // 日付フィルター
    if (dateFrom) {
      result = result.filter((r) => {
        const date = r.submittedAt || r.createdAt
        return date >= dateFrom
      })
    }
    if (dateTo) {
      result = result.filter((r) => {
        const date = r.submittedAt || r.createdAt
        return date <= dateTo
      })
    }

    return result.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }, [reports, statusFilter, dateFrom, dateTo])

  // 選択された経費精算書
  const selectedReports = useMemo(() => {
    return filteredReports.filter((r) => selectedIds.has(r.id))
  }, [filteredReports, selectedIds])

  // 全選択/解除
  const handleSelectAll = () => {
    if (selectedIds.size === filteredReports.length) {
      setSelectedIds(new Set())
    }
    else {
      setSelectedIds(new Set(filteredReports.map((r) => r.id)))
    }
  }

  // 個別選択
  const handleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id))
      newSelected.delete(id)
    else
      newSelected.add(id)
    setSelectedIds(newSelected)
  }

  // 一括仕訳CSV出力
  const handleExportBulkJournal = () => {
    if (selectedReports.length === 0) {
      alert('出力する経費精算書を選択してください')
      return
    }
    downloadBulkJournalCSV(selectedReports)
  }

  // 一覧CSV出力
  const handleExportList = () => {
    const csv = reportsToCSV(filteredReports)
    const filename = `経費精算一覧_${new Date().toISOString().slice(0, 10)}.csv`
    downloadCSV(csv, filename)
  }

  // 管理者権限チェック
  const isManager = currentUser?.role === 'accountant' || currentUser?.role === 'accounting_manager'

  if (!isManager) {
    return (
      <div className="text-center py-12">
        <i className="ri-lock-line text-5xl text-gray-300 mb-4"></i>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          CSV出力権限がありません
        </h2>
        <p className="text-gray-500">
          CSV出力機能を使用するには、経理担当者または経理部門長としてログインしてください。
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* ページヘッダー */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">CSV出力</h1>
        <p className="mt-1 text-sm text-gray-500">
          承認済みの経費精算書を会計システム用のCSV形式でエクスポートします
        </p>
      </div>

      {/* フィルター */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">出力条件</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">開始日</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">終了日</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ExpenseReportStatus | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">すべて</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setDateFrom('')
                setDateTo('')
                setStatusFilter('fully_approved')
                setSelectedIds(new Set())
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              条件をクリア
            </button>
          </div>
        </div>
      </div>

      {/* 出力ボタン */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-medium text-blue-900">
              選択中: {selectedReports.length}件
              {selectedReports.length > 0 && (
                <span className="ml-2 text-blue-700">
                  合計: ¥{selectedReports.reduce((sum, r) => sum + r.totalAmount, 0).toLocaleString()}
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportList}
              className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <i className="ri-file-list-line mr-1"></i>
              一覧CSV出力
            </button>
            <button
              onClick={handleExportBulkJournal}
              disabled={selectedReports.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="ri-download-line mr-1"></i>
              仕訳CSV出力
            </button>
          </div>
        </div>
      </div>

      {/* 経費精算書一覧 */}
      {filteredReports.length === 0
        ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <i className="ri-file-search-line text-5xl text-gray-300 mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              該当する経費精算書がありません
            </h3>
            <p className="text-gray-500">
              条件を変更して再度検索してください
            </p>
          </div>
        )
        : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filteredReports.length && filteredReports.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">精算番号</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">タイトル</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">申請者</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">金額</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ステータス</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">個別出力</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredReports.map((report) => (
                  <tr
                    key={report.id}
                    className={cn(
                      'hover:bg-gray-50',
                      selectedIds.has(report.id) && 'bg-blue-50',
                    )}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(report.id)}
                        onChange={() => handleSelect(report.id)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-mono">{report.reportNumber}</td>
                    <td className="px-4 py-3 text-sm">{report.title}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{report.submitterName}</div>
                      <div className="text-xs text-gray-500">{report.department}</div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      ¥{report.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'px-2 py-1 text-xs font-medium rounded-full',
                        statusColors[report.status],
                      )}>
                        {STATUS_LABELS[report.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => downloadJournalCSV(report)}
                          className="text-green-600 hover:text-green-800"
                          title="仕訳CSV"
                        >
                          <i className="ri-file-excel-line"></i>
                        </button>
                        <button
                          onClick={() => downloadExpenseItemsCSV(report)}
                          className="text-blue-600 hover:text-blue-800"
                          title="明細CSV"
                        >
                          <i className="ri-file-list-3-line"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      {/* CSV形式の説明 */}
      <div className="mt-8 bg-gray-50 rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">CSV出力形式について</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">
              <i className="ri-file-excel-line text-green-600 mr-2"></i>
              仕訳CSV
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              会計システムにインポート可能な仕訳形式のCSVファイルです。
            </p>
            <ul className="text-sm text-gray-500 list-disc list-inside">
              <li>日付</li>
              <li>借方勘定科目・金額</li>
              <li>貸方勘定科目・金額</li>
              <li>摘要、部門、精算番号</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">
              <i className="ri-file-list-3-line text-blue-600 mr-2"></i>
              明細CSV
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              経費明細の詳細データをCSV形式で出力します。
            </p>
            <ul className="text-sm text-gray-500 list-disc list-inside">
              <li>精算番号・明細番号</li>
              <li>日付・取引先・摘要</li>
              <li>勘定科目コード・名称</li>
              <li>金額・消費税額</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
