'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { useExpenseStore } from '@/hooks/use-expense-store'
import type { ExpenseReportStatus } from '@/types/expense'
import { STATUS_LABELS } from '@/types/expense'
import cn from 'classnames'

const statusColors: Record<ExpenseReportStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-yellow-100 text-yellow-700',
  department_approved: 'bg-blue-100 text-blue-700',
  accountant_approved: 'bg-purple-100 text-purple-700',
  fully_approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

export default function ExpenseReportListPage() {
  const { reports, currentUser, deleteReport } = useExpenseStore()
  const [statusFilter, setStatusFilter] = useState<ExpenseReportStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // 自分の経費精算書のみ表示（管理者は全件表示）
  const filteredReports = useMemo(() => {
    let result = reports

    // 一般社員は自分の申請のみ表示
    if (currentUser?.role === 'employee')
      result = result.filter(r => r.submitterId === currentUser.id)

    // ステータスフィルター
    if (statusFilter !== 'all')
      result = result.filter(r => r.status === statusFilter)

    // 検索フィルター
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(r =>
        r.title.toLowerCase().includes(query)
        || r.reportNumber.toLowerCase().includes(query)
        || r.submitterName.toLowerCase().includes(query),
      )
    }

    // 日付順（新しい順）
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [reports, currentUser, statusFilter, searchQuery])

  const handleDelete = (id: string, reportNumber: string) => {
    if (confirm(`経費精算書 ${reportNumber} を削除しますか？`))
      deleteReport(id)
  }

  return (
    <div>
      {/* ページヘッダー */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">経費精算一覧</h1>
        <p className="mt-1 text-sm text-gray-500">
          申請した経費精算書の一覧を確認できます
        </p>
      </div>

      {/* フィルターとアクション */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              placeholder="タイトル、精算番号、申請者で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ExpenseReportStatus | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">すべてのステータス</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <Link
            href="/expense-report/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <i className="ri-add-line mr-1"></i>
            新規作成
          </Link>
        </div>
      </div>

      {/* 経費精算書リスト */}
      {filteredReports.length === 0
        ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <i className="ri-file-list-3-line text-5xl text-gray-300 mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              経費精算書がありません
            </h3>
            <p className="text-gray-500 mb-4">
              新しい経費精算書を作成してください
            </p>
            <Link
              href="/expense-report/new"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <i className="ri-add-line mr-1"></i>
              新規作成
            </Link>
          </div>
        )
        : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      精算番号
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      タイトル
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      申請者
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      金額
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ステータス
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      作成日
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-gray-900">{report.reportNumber}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/expense-report/${report.id}`} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                          {report.title}
                        </Link>
                        <p className="text-xs text-gray-500 mt-1">{report.items.length}件の明細</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{report.submitterName}</div>
                        <div className="text-xs text-gray-500">{report.department}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          ¥{report.totalAmount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          'px-2 py-1 text-xs font-medium rounded-full',
                          statusColors[report.status],
                        )}>
                          {STATUS_LABELS[report.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(report.createdAt).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link
                            href={`/expense-report/${report.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <i className="ri-eye-line"></i>
                          </Link>
                          {report.status === 'draft' && report.submitterId === currentUser?.id && (
                            <>
                              <Link
                                href={`/expense-report/${report.id}/edit`}
                                className="text-gray-600 hover:text-gray-900"
                              >
                                <i className="ri-edit-line"></i>
                              </Link>
                              <button
                                onClick={() => handleDelete(report.id, report.reportNumber)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <i className="ri-delete-bin-line"></i>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {/* サマリー */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">全件数</div>
          <div className="text-2xl font-bold text-gray-900">{filteredReports.length}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">合計金額</div>
          <div className="text-2xl font-bold text-gray-900">
            ¥{filteredReports.reduce((sum, r) => sum + r.totalAmount, 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">承認待ち</div>
          <div className="text-2xl font-bold text-yellow-600">
            {filteredReports.filter(r => ['submitted', 'department_approved', 'accountant_approved'].includes(r.status)).length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">承認完了</div>
          <div className="text-2xl font-bold text-green-600">
            {filteredReports.filter(r => r.status === 'fully_approved').length}
          </div>
        </div>
      </div>
    </div>
  )
}
