'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useExpenseStore } from '@/hooks/use-expense-store'
import type { ExpenseItem, UploadedFile } from '@/types/expense'
import { DEFAULT_ACCOUNT_CODES } from '@/types/expense'
import { analyzeReceipt, fileToBase64, suggestAccountCode } from '@/utils/ocr-service'
import { v4 as uuid } from 'uuid'
import cn from 'classnames'

export default function EditExpenseReportPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { getReportById, updateReport, currentUser, submitReport } = useExpenseStore()
  const report = getReportById(id)

  const [title, setTitle] = useState('')
  const [purpose, setPurpose] = useState('')
  const [items, setItems] = useState<ExpenseItem[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  // 初期化
  useEffect(() => {
    if (report) {
      setTitle(report.title)
      setPurpose(report.purpose)
      setItems([...report.items])
    }
  }, [report])

  // 権限チェック
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

  if (report.status !== 'draft' || report.submitterId !== currentUser?.id) {
    return (
      <div className="text-center py-12">
        <i className="ri-lock-line text-5xl text-gray-300 mb-4"></i>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">編集できません</h2>
        <p className="text-gray-500 mb-4">この経費精算書は編集できません。下書き状態の自分の申請のみ編集可能です。</p>
        <Link href={`/expense-report/${id}`} className="text-blue-600 hover:text-blue-800">
          詳細に戻る
        </Link>
      </div>
    )
  }

  // ファイルドロップ処理
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover')
      setDragActive(true)
    else if (e.type === 'dragleave')
      setDragActive(false)
  }

  // ファイルアップロード処理
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0)
      return

    setIsAnalyzing(true)
    setDragActive(false)

    try {
      for (const file of Array.from(files)) {
        const base64 = await fileToBase64(file)
        const uploadedFile: UploadedFile = {
          id: uuid(),
          name: file.name,
          type: file.type,
          size: file.size,
          url: base64,
          uploadedAt: new Date().toISOString(),
        }

        const ocrResult = await analyzeReceipt(uploadedFile)
        const account = suggestAccountCode(ocrResult.vendor || '', '')

        const newItem: ExpenseItem = {
          id: uuid(),
          date: ocrResult.date || new Date().toISOString().slice(0, 10),
          description: ocrResult.items?.[0]?.description || '',
          vendor: ocrResult.vendor || '',
          amount: ocrResult.totalAmount || 0,
          taxAmount: ocrResult.taxAmount || 0,
          accountCode: account.code,
          accountName: account.name,
          receiptFile: uploadedFile,
          ocrData: ocrResult,
        }

        setItems((prev) => [...prev, newItem])
      }
    }
    catch (error) {
      console.error('File upload error:', error)
      alert('ファイルのアップロードに失敗しました')
    }
    finally {
      setIsAnalyzing(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    handleFileUpload(e.dataTransfer.files)
  }

  // 明細更新
  const updateItem = (itemId: string, updates: Partial<ExpenseItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, ...updates } : item)),
    )
  }

  // 明細削除
  const removeItem = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId))
  }

  // 手動で明細追加
  const addManualItem = () => {
    const newItem: ExpenseItem = {
      id: uuid(),
      date: new Date().toISOString().slice(0, 10),
      description: '',
      vendor: '',
      amount: 0,
      taxAmount: 0,
      accountCode: '719',
      accountName: '雑費',
    }
    setItems((prev) => [...prev, newItem])
  }

  // 合計計算
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)
  const totalTaxAmount = items.reduce((sum, item) => sum + item.taxAmount, 0)

  // 保存
  const handleSave = () => {
    if (!title) {
      alert('タイトルを入力してください')
      return
    }

    updateReport(id, {
      title,
      purpose,
      items,
      totalAmount,
      totalTaxAmount,
    })

    router.push(`/expense-report/${id}`)
  }

  // 提出
  const handleSubmit = () => {
    if (!title) {
      alert('タイトルを入力してください')
      return
    }

    if (items.length === 0) {
      alert('明細を追加してください')
      return
    }

    updateReport(id, {
      title,
      purpose,
      items,
      totalAmount,
      totalTaxAmount,
    })

    submitReport(id)
    router.push(`/expense-report/${id}`)
  }

  return (
    <div>
      {/* ページヘッダー */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Link href={`/expense-report/${id}`} className="text-gray-500 hover:text-gray-700">
            <i className="ri-arrow-left-line"></i>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">経費精算書を編集</h1>
        </div>
        <p className="text-sm text-gray-500">
          精算番号: {report.reportNumber}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左側：入力フォーム */}
        <div className="lg:col-span-2 space-y-6">
          {/* 基本情報 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">基本情報</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  タイトル <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例：2024年11月出張経費"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  目的・理由
                </label>
                <textarea
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="経費の目的や理由を入力してください"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* ファイルアップロード */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              レシート・請求書を追加
            </h2>
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400',
                isAnalyzing && 'opacity-50 pointer-events-none',
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {isAnalyzing
                ? (
                  <div>
                    <i className="ri-loader-4-line text-4xl text-blue-500 animate-spin mb-4"></i>
                    <p className="text-gray-600">レシートを解析中...</p>
                  </div>
                )
                : (
                  <>
                    <i className="ri-upload-cloud-2-line text-4xl text-gray-400 mb-4"></i>
                    <p className="text-gray-600 mb-2">
                      レシートや請求書をドラッグ＆ドロップ
                    </p>
                    <label className="cursor-pointer">
                      <span className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        ファイルを選択
                      </span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        multiple
                        onChange={(e) => handleFileUpload(e.target.files)}
                        className="hidden"
                      />
                    </label>
                  </>
                )}
            </div>
          </div>

          {/* 経費明細 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">経費明細</h2>
              <button
                onClick={addManualItem}
                className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <i className="ri-add-line mr-1"></i>
                手動で追加
              </button>
            </div>

            {items.length === 0
              ? (
                <div className="text-center py-8 text-gray-500">
                  <i className="ri-file-list-3-line text-4xl text-gray-300 mb-2"></i>
                  <p>明細がありません</p>
                </div>
              )
              : (
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <ExpenseItemEditCard
                      key={item.id}
                      item={item}
                      index={index}
                      onUpdate={updateItem}
                      onRemove={removeItem}
                    />
                  ))}
                </div>
              )}
          </div>
        </div>

        {/* 右側：サマリーとアクション */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">サマリー</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">明細件数</span>
                <span className="font-medium">{items.length}件</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">小計</span>
                <span className="font-medium">¥{(totalAmount - totalTaxAmount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">消費税</span>
                <span className="font-medium">¥{totalTaxAmount.toLocaleString()}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold">合計金額</span>
                  <span className="text-xl font-bold text-blue-600">
                    ¥{totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* アクションボタン */}
            <div className="mt-6 space-y-3">
              <button
                onClick={handleSubmit}
                disabled={!title || items.length === 0}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="ri-send-plane-line mr-2"></i>
                申請する
              </button>
              <button
                onClick={handleSave}
                disabled={!title}
                className="w-full px-4 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="ri-save-line mr-2"></i>
                保存
              </button>
              <Link
                href={`/expense-report/${id}`}
                className="block w-full px-4 py-3 text-center text-gray-600 hover:text-gray-800 transition-colors"
              >
                キャンセル
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 経費明細編集カード
function ExpenseItemEditCard({
  item,
  index,
  onUpdate,
  onRemove,
}: {
  item: ExpenseItem
  index: number
  onUpdate: (id: string, updates: Partial<ExpenseItem>) => void
  onRemove: (id: string) => void
}) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center">
          <span className="w-6 h-6 bg-blue-600 text-white text-sm rounded-full flex items-center justify-center mr-3">
            {index + 1}
          </span>
          <div>
            <span className="font-medium text-gray-900">{item.vendor || '未入力'}</span>
            <span className="text-gray-500 mx-2">-</span>
            <span className="text-gray-600">{item.description || '摘要なし'}</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span className="font-semibold text-gray-900">
            ¥{item.amount.toLocaleString()}
          </span>
          <i className={`ri-arrow-${isExpanded ? 'up' : 'down'}-s-line text-gray-500`}></i>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">日付</label>
              <input
                type="date"
                value={item.date}
                onChange={(e) => onUpdate(item.id, { date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">取引先</label>
              <input
                type="text"
                value={item.vendor}
                onChange={(e) => onUpdate(item.id, { vendor: e.target.value })}
                placeholder="取引先名"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">摘要</label>
            <input
              type="text"
              value={item.description}
              onChange={(e) => onUpdate(item.id, { description: e.target.value })}
              placeholder="内容を入力"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">勘定科目</label>
              <select
                value={item.accountCode}
                onChange={(e) => {
                  const account = DEFAULT_ACCOUNT_CODES.find((a) => a.code === e.target.value)
                  if (account)
                    onUpdate(item.id, { accountCode: account.code, accountName: account.name })
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {DEFAULT_ACCOUNT_CODES.map((account) => (
                  <option key={account.code} value={account.code}>
                    {account.code} {account.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">金額</label>
              <input
                type="number"
                value={item.amount}
                onChange={(e) => onUpdate(item.id, { amount: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">消費税額</label>
              <input
                type="number"
                value={item.taxAmount}
                onChange={(e) => onUpdate(item.id, { taxAmount: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {item.receiptFile && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">レシート</label>
              <div className="flex items-start space-x-4">
                {item.receiptFile.type.startsWith('image/')
                  ? (
                    <img
                      src={item.receiptFile.url}
                      alt="レシート"
                      className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                    />
                  )
                  : (
                    <div className="w-32 h-32 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200">
                      <i className="ri-file-pdf-line text-3xl text-red-500"></i>
                    </div>
                  )}
                <div className="text-sm text-gray-500">
                  <p>{item.receiptFile.name}</p>
                  <p>{(item.receiptFile.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={() => onRemove(item.id)}
              className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
            >
              <i className="ri-delete-bin-line mr-1"></i>
              削除
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
