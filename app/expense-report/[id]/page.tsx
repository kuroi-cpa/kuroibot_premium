'use client'

import React, { useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useExpenseStore } from '@/hooks/use-expense-store'
import { STATUS_LABELS, ROLE_LABELS, getNextApproverRole } from '@/types/expense'
import type { ExpenseReportStatus } from '@/types/expense'
import { downloadJournalCSV, downloadExpenseItemsCSV } from '@/utils/csv-export'
import cn from 'classnames'

const statusColors: Record<ExpenseReportStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-yellow-100 text-yellow-700',
  department_approved: 'bg-blue-100 text-blue-700',
  accountant_approved: 'bg-purple-100 text-purple-700',
  fully_approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

export default function ExpenseReportDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { getReportById, currentUser, submitReport, approveReport, rejectReport, deleteReport } = useExpenseStore()
  const report = getReportById(id)

  const [rejectComment, setRejectComment] = React.useState('')
  const [approveComment, setApproveComment] = React.useState('')
  const [showApproveModal, setShowApproveModal] = React.useState(false)
  const [showRejectModal, setShowRejectModal] = React.useState(false)

  // 承認可能かどうか
  const canApprove = useMemo(() => {
    if (!report || !currentUser)
      return false

    const nextApprover = getNextApproverRole(report.status)
    return nextApprover === currentUser.role
  }, [report, currentUser])

  // 編集可能かどうか
  const canEdit = useMemo(() => {
    if (!report || !currentUser)
      return false
    return report.status === 'draft' && report.submitterId === currentUser.id
  }, [report, currentUser])

  if (!report) {
    return (
      <div className="text-center py-12">
        <i className="ri-file-unknow-line text-5xl text-gray-300 mb-4"></i>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">経費精算書が見つかりません</h2>
        <Link href="/expense-report" className="text-blue-600 hover:text-blue-800">
          一覧に戻る
        </Link>
      </div>
    )
  }

  const handleSubmit = () => {
    if (confirm('経費精算書を提出しますか？提出後は編集できなくなります。')) {
      submitReport(report.id)
      router.refresh()
    }
  }

  const handleApprove = () => {
    if (!currentUser)
      return
    approveReport(report.id, currentUser.id, currentUser.name, currentUser.role, approveComment)
    setShowApproveModal(false)
    setApproveComment('')
  }

  const handleReject = () => {
    if (!currentUser || !rejectComment)
      return
    rejectReport(report.id, currentUser.id, currentUser.name, currentUser.role, rejectComment)
    setShowRejectModal(false)
    setRejectComment('')
  }

  const handleDelete = () => {
    if (confirm(`経費精算書 ${report.reportNumber} を削除しますか？`)) {
      deleteReport(report.id)
      router.push('/expense-report')
    }
  }

  return (
    <div>
      {/* ページヘッダー */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/expense-report" className="text-gray-500 hover:text-gray-700">
              <i className="ri-arrow-left-line"></i>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
            <span className={cn(
              'px-3 py-1 text-sm font-medium rounded-full',
              statusColors[report.status],
            )}>
              {STATUS_LABELS[report.status]}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            精算番号: {report.reportNumber} | 作成日: {new Date(report.createdAt).toLocaleDateString('ja-JP')}
          </p>
        </div>

        {/* アクションボタン */}
        <div className="flex flex-wrap gap-2">
          {report.status === 'fully_approved' && (
            <>
              <button
                onClick={() => downloadJournalCSV(report)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <i className="ri-download-line mr-1"></i>
                仕訳CSV
              </button>
              <button
                onClick={() => downloadExpenseItemsCSV(report)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <i className="ri-download-line mr-1"></i>
                明細CSV
              </button>
            </>
          )}
          {canEdit && (
            <>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <i className="ri-send-plane-line mr-1"></i>
                提出
              </button>
              <Link
                href={`/expense-report/${report.id}/edit`}
                className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <i className="ri-edit-line mr-1"></i>
                編集
              </Link>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
              >
                <i className="ri-delete-bin-line mr-1"></i>
                削除
              </button>
            </>
          )}
          {canApprove && (
            <>
              <button
                onClick={() => setShowApproveModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <i className="ri-checkbox-circle-line mr-1"></i>
                承認
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <i className="ri-close-circle-line mr-1"></i>
                却下
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左側：詳細情報 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 基本情報 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">基本情報</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-gray-500">申請者</dt>
                <dd className="mt-1 font-medium">{report.submitterName}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">部門</dt>
                <dd className="mt-1 font-medium">{report.department}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm text-gray-500">目的・理由</dt>
                <dd className="mt-1">{report.purpose || '-'}</dd>
              </div>
            </dl>
          </div>

          {/* 経費明細 */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">経費明細</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">日付</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">取引先</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">摘要</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">勘定科目</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">金額</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">レシート</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {report.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {new Date(item.date).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="px-4 py-3 text-sm">{item.vendor}</td>
                      <td className="px-4 py-3 text-sm">{item.description}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="text-gray-500">{item.accountCode}</span>
                        <span className="mx-1">{item.accountName}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        ¥{item.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.receiptFile
                          ? (
                            <button
                              onClick={() => {
                                if (item.receiptFile)
                                  window.open(item.receiptFile.url, '_blank')
                              }}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <i className="ri-file-line"></i>
                            </button>
                          )
                          : (
                            <span className="text-gray-400">-</span>
                          )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-right font-semibold">合計</td>
                    <td className="px-4 py-3 text-right font-bold text-lg">
                      ¥{report.totalAmount.toLocaleString()}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* 承認履歴 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">承認履歴</h2>
            {report.approvalHistory.length === 0
              ? (
                <p className="text-gray-500 text-center py-4">承認履歴はありません</p>
              )
              : (
                <div className="space-y-4">
                  {report.approvalHistory.map((record) => (
                    <div
                      key={record.id}
                      className={cn(
                        'flex items-start p-4 rounded-lg',
                        record.status === 'approved' ? 'bg-green-50' : 'bg-red-50',
                      )}
                    >
                      <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center mr-4',
                        record.status === 'approved' ? 'bg-green-100' : 'bg-red-100',
                      )}>
                        <i className={cn(
                          'text-xl',
                          record.status === 'approved'
                            ? 'ri-checkbox-circle-line text-green-600'
                            : 'ri-close-circle-line text-red-600',
                        )}></i>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">{record.approverName}</span>
                            <span className="mx-2 text-gray-500">|</span>
                            <span className="text-sm text-gray-600">{ROLE_LABELS[record.approverRole]}</span>
                          </div>
                          <span className={cn(
                            'px-2 py-1 text-xs font-medium rounded-full',
                            record.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
                          )}>
                            {record.status === 'approved' ? '承認' : '却下'}
                          </span>
                        </div>
                        {record.comment && (
                          <p className="mt-2 text-sm text-gray-600">{record.comment}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                          {new Date(record.timestamp).toLocaleString('ja-JP')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>

        {/* 右側：サマリーとワークフロー */}
        <div className="space-y-6">
          {/* サマリー */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">サマリー</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">明細件数</span>
                <span className="font-medium">{report.items.length}件</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">小計</span>
                <span className="font-medium">¥{(report.totalAmount - report.totalTaxAmount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">消費税</span>
                <span className="font-medium">¥{report.totalTaxAmount.toLocaleString()}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold">合計金額</span>
                  <span className="text-xl font-bold text-blue-600">
                    ¥{report.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ワークフロー */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">承認フロー</h2>
            <div className="space-y-4">
              {/* 提出 */}
              <WorkflowStep
                icon="ri-user-line"
                title="申請者提出"
                status={report.status !== 'draft' ? 'completed' : 'current'}
                user={report.submitterName}
                date={report.submittedAt}
              />

              {/* 部門長承認 */}
              <WorkflowStep
                icon="ri-user-star-line"
                title="部門長承認"
                status={getWorkflowStatus(report.status, 'submitted', report.approvalHistory.find(h => h.approverRole === 'department_manager'))}
                user={report.approvalHistory.find(h => h.approverRole === 'department_manager')?.approverName}
                date={report.approvalHistory.find(h => h.approverRole === 'department_manager')?.timestamp}
              />

              {/* 経理担当者承認 */}
              <WorkflowStep
                icon="ri-calculator-line"
                title="経理担当者承認"
                status={getWorkflowStatus(report.status, 'department_approved', report.approvalHistory.find(h => h.approverRole === 'accountant'))}
                user={report.approvalHistory.find(h => h.approverRole === 'accountant')?.approverName}
                date={report.approvalHistory.find(h => h.approverRole === 'accountant')?.timestamp}
              />

              {/* 経理部門長承認 */}
              <WorkflowStep
                icon="ri-shield-user-line"
                title="経理部門長承認"
                status={getWorkflowStatus(report.status, 'accountant_approved', report.approvalHistory.find(h => h.approverRole === 'accounting_manager'))}
                user={report.approvalHistory.find(h => h.approverRole === 'accounting_manager')?.approverName}
                date={report.approvalHistory.find(h => h.approverRole === 'accounting_manager')?.timestamp}
                isLast
              />
            </div>
          </div>
        </div>
      </div>

      {/* 承認モーダル */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">経費精算書を承認</h3>
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
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                キャンセル
              </button>
              <button
                onClick={handleApprove}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                承認する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 却下モーダル */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">経費精算書を却下</h3>
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
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                キャンセル
              </button>
              <button
                onClick={handleReject}
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

// ワークフローステップコンポーネント
function WorkflowStep({
  icon,
  title,
  status,
  user,
  date,
  isLast = false,
}: {
  icon: string
  title: string
  status: 'pending' | 'current' | 'completed' | 'rejected'
  user?: string
  date?: string
  isLast?: boolean
}) {
  const statusStyles = {
    pending: 'bg-gray-100 text-gray-400',
    current: 'bg-blue-100 text-blue-600 ring-2 ring-blue-600',
    completed: 'bg-green-100 text-green-600',
    rejected: 'bg-red-100 text-red-600',
  }

  return (
    <div className="flex">
      <div className="flex flex-col items-center mr-4">
        <div className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center',
          statusStyles[status],
        )}>
          <i className={icon}></i>
        </div>
        {!isLast && (
          <div className={cn(
            'w-0.5 flex-1 mt-2',
            status === 'completed' ? 'bg-green-300' : 'bg-gray-200',
          )}></div>
        )}
      </div>
      <div className="pb-4">
        <p className={cn(
          'font-medium',
          status === 'pending' ? 'text-gray-400' : 'text-gray-900',
        )}>
          {title}
        </p>
        {user && (
          <p className="text-sm text-gray-600">{user}</p>
        )}
        {date && (
          <p className="text-xs text-gray-500">
            {new Date(date).toLocaleString('ja-JP')}
          </p>
        )}
      </div>
    </div>
  )
}

// ワークフローステータスを判定
function getWorkflowStatus(
  reportStatus: ExpenseReportStatus,
  waitingStatus: ExpenseReportStatus,
  approvalRecord?: { status: string },
): 'pending' | 'current' | 'completed' | 'rejected' {
  if (reportStatus === 'rejected' && approvalRecord?.status === 'rejected')
    return 'rejected'

  if (approvalRecord?.status === 'approved')
    return 'completed'

  if (reportStatus === waitingStatus)
    return 'current'

  if (reportStatus === 'draft')
    return 'pending'

  // ステータスの順序を確認
  const statusOrder: ExpenseReportStatus[] = ['draft', 'submitted', 'department_approved', 'accountant_approved', 'fully_approved']
  const currentIndex = statusOrder.indexOf(reportStatus)
  const waitingIndex = statusOrder.indexOf(waitingStatus)

  if (currentIndex > waitingIndex)
    return 'completed'

  return 'pending'
}
