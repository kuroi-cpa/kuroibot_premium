'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { useExpenseStore } from '@/hooks/use-expense-store'
import { STATUS_LABELS, ROLE_LABELS } from '@/types/expense'
import type { ExpenseReport, ExpenseReportStatus } from '@/types/expense'
import cn from 'classnames'

const statusColors: Record<ExpenseReportStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-yellow-100 text-yellow-700',
  department_approved: 'bg-blue-100 text-blue-700',
  accountant_approved: 'bg-purple-100 text-purple-700',
  fully_approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

export default function ApprovalPage() {
  const { reports, currentUser, getReportsForApproval, approveReport, rejectReport } = useExpenseStore()

  const [selectedReport, setSelectedReport] = useState<ExpenseReport | null>(null)
  const [approveComment, setApproveComment] = useState('')
  const [rejectComment, setRejectComment] = useState('')
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)

  // 承認待ち一覧
  const pendingReports = useMemo(() => {
    if (!currentUser)
      return []
    return getReportsForApproval(currentUser.role)
  }, [currentUser, getReportsForApproval, reports])

  // 自分が承認した履歴
  const approvedByMe = useMemo(() => {
    if (!currentUser)
      return []
    return reports.filter((r) =>
      r.approvalHistory.some((h) => h.approverId === currentUser.id),
    )
  }, [currentUser, reports])

  const handleApprove = (report: ExpenseReport) => {
    setSelectedReport(report)
    setShowApproveModal(true)
  }

  const handleReject = (report: ExpenseReport) => {
    setSelectedReport(report)
    setShowRejectModal(true)
  }

  const confirmApprove = () => {
    if (!selectedReport || !currentUser)
      return
    approveReport(selectedReport.id, currentUser.id, currentUser.name, currentUser.role, approveComment)
    setShowApproveModal(false)
    setSelectedReport(null)
    setApproveComment('')
  }

  const confirmReject = () => {
    if (!selectedReport || !currentUser || !rejectComment)
      return
    rejectReport(selectedReport.id, currentUser.id, currentUser.name, currentUser.role, rejectComment)
    setShowRejectModal(false)
    setSelectedReport(null)
    setRejectComment('')
  }

  if (!currentUser || currentUser.role === 'employee') {
    return (
      <div className="text-center py-12">
        <i className="ri-lock-line text-5xl text-gray-300 mb-4"></i>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          承認権限がありません
        </h2>
        <p className="text-gray-500">
          承認機能を使用するには、部門長、経理担当者、または経理部門長としてログインしてください。
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* ページヘッダー */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">承認待ち一覧</h1>
        <p className="mt-1 text-sm text-gray-500">
          {ROLE_LABELS[currentUser.role]}として承認が必要な経費精算書
        </p>
      </div>

      {/* 承認待ち一覧 */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          承認待ち（{pendingReports.length}件）
        </h2>

        {pendingReports.length === 0
          ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <i className="ri-checkbox-circle-line text-5xl text-green-300 mb-4"></i>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                承認待ちの経費精算書はありません
              </h3>
              <p className="text-gray-500">
                現在、あなたの承認を待っている経費精算書はありません。
              </p>
            </div>
          )
          : (
            <div className="space-y-4">
              {pendingReports.map((report) => (
                <div
                  key={report.id}
                  className="bg-white rounded-lg border border-gray-200 p-6"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Link
                          href={`/expense-report/${report.id}`}
                          className="text-lg font-semibold text-blue-600 hover:text-blue-800"
                        >
                          {report.title}
                        </Link>
                        <span className={cn(
                          'px-2 py-1 text-xs font-medium rounded-full',
                          statusColors[report.status],
                        )}>
                          {STATUS_LABELS[report.status]}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">精算番号:</span>
                          <span className="ml-1 font-mono">{report.reportNumber}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">申請者:</span>
                          <span className="ml-1">{report.submitterName}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">部門:</span>
                          <span className="ml-1">{report.department}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">申請日:</span>
                          <span className="ml-1">
                            {report.submittedAt
                              ? new Date(report.submittedAt).toLocaleDateString('ja-JP')
                              : '-'}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <span className="text-2xl font-bold text-gray-900">
                          ¥{report.totalAmount.toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">
                          （{report.items.length}件の明細）
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/expense-report/${report.id}`}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <i className="ri-eye-line mr-1"></i>
                        詳細
                      </Link>
                      <button
                        onClick={() => handleApprove(report)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <i className="ri-checkbox-circle-line mr-1"></i>
                        承認
                      </button>
                      <button
                        onClick={() => handleReject(report)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <i className="ri-close-circle-line mr-1"></i>
                        却下
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      {/* 承認履歴 */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          自分の承認履歴（{approvedByMe.length}件）
        </h2>

        {approvedByMe.length === 0
          ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-500">まだ承認履歴はありません</p>
            </div>
          )
          : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">精算番号</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">タイトル</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">申請者</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">金額</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">承認結果</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">承認日</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {approvedByMe.map((report) => {
                    const myApproval = report.approvalHistory.find((h) => h.approverId === currentUser?.id)
                    return (
                      <tr key={report.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-mono">{report.reportNumber}</td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/expense-report/${report.id}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {report.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm">{report.submitterName}</td>
                        <td className="px-4 py-3 text-sm font-medium">¥{report.totalAmount.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            'px-2 py-1 text-xs font-medium rounded-full',
                            myApproval?.status === 'approved'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700',
                          )}>
                            {myApproval?.status === 'approved' ? '承認' : '却下'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {myApproval ? new Date(myApproval.timestamp).toLocaleDateString('ja-JP') : '-'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {/* 承認モーダル */}
      {showApproveModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">経費精算書を承認</h3>
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="font-medium">{selectedReport.title}</p>
              <p className="text-sm text-gray-600">{selectedReport.reportNumber}</p>
              <p className="text-lg font-bold mt-2">¥{selectedReport.totalAmount.toLocaleString()}</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">コメント（任意）</label>
              <textarea
                value={approveComment}
                onChange={(e) => setApproveComment(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="承認コメントを入力..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowApproveModal(false)
                  setSelectedReport(null)
                  setApproveComment('')
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                キャンセル
              </button>
              <button
                onClick={confirmApprove}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                承認する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 却下モーダル */}
      {showRejectModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">経費精算書を却下</h3>
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="font-medium">{selectedReport.title}</p>
              <p className="text-sm text-gray-600">{selectedReport.reportNumber}</p>
              <p className="text-lg font-bold mt-2">¥{selectedReport.totalAmount.toLocaleString()}</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                却下理由 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="却下理由を入力してください..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setSelectedReport(null)
                  setRejectComment('')
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                キャンセル
              </button>
              <button
                onClick={confirmReject}
                disabled={!rejectComment}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                却下する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
