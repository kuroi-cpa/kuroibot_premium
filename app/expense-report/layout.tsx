'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import cn from 'classnames'
import { useExpenseStore } from '@/hooks/use-expense-store'
import type { User, UserRole } from '@/types/expense'
import { ROLE_LABELS } from '@/types/expense'

export default function ExpenseReportLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { currentUser, setCurrentUser, demoUsers } = useExpenseStore()

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const userId = e.target.value
    if (userId === '') {
      setCurrentUser(null)
    }
    else {
      const user = demoUsers.find(u => u.id === userId)
      if (user)
        setCurrentUser(user)
    }
  }

  const navItems = [
    { href: '/expense-report', label: '一覧', icon: 'ri-list-check' },
    { href: '/expense-report/new', label: '新規作成', icon: 'ri-add-circle-line' },
    { href: '/expense-report/approval', label: '承認', icon: 'ri-checkbox-circle-line' },
    { href: '/expense-report/export', label: 'CSV出力', icon: 'ri-download-line' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/expense-report" className="flex items-center">
                <i className="ri-receipt-line text-2xl text-blue-600 mr-2"></i>
                <span className="text-xl font-bold text-gray-900">経費精算システム</span>
              </Link>
            </div>

            {/* ナビゲーション */}
            <nav className="hidden md:flex space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    pathname === item.href
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100',
                  )}
                >
                  <i className={`${item.icon} mr-1`}></i>
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* ユーザー選択（デモ用） */}
            <div className="flex items-center space-x-4">
              <select
                value={currentUser?.id || ''}
                onChange={handleUserChange}
                className="block w-48 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">ユーザーを選択</option>
                {demoUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({ROLE_LABELS[user.role]})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* モバイルナビゲーション */}
        <div className="md:hidden border-t border-gray-200">
          <div className="flex overflow-x-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex-1 px-4 py-3 text-center text-sm font-medium whitespace-nowrap',
                  pathname === item.href
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                    : 'text-gray-600',
                )}
              >
                <i className={`${item.icon} mr-1`}></i>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {/* ユーザー情報バー */}
      {currentUser && (
        <div className="bg-blue-600 text-white py-2">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center text-sm">
              <i className="ri-user-line mr-2"></i>
              <span className="font-medium">{currentUser.name}</span>
              <span className="mx-2">|</span>
              <span>{currentUser.department}</span>
              <span className="mx-2">|</span>
              <span className="bg-blue-500 px-2 py-0.5 rounded">{ROLE_LABELS[currentUser.role]}</span>
            </div>
          </div>
        </div>
      )}

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!currentUser
          ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <i className="ri-user-settings-line text-4xl text-yellow-600 mb-4"></i>
              <h2 className="text-lg font-semibold text-yellow-800 mb-2">
                ユーザーを選択してください
              </h2>
              <p className="text-yellow-700">
                右上のドロップダウンからデモユーザーを選択して、経費精算システムを使用できます。
              </p>
            </div>
          )
          : (
            children
          )}
      </main>

      {/* フッター */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>経費精算システム v1.0</span>
            <Link href="/" className="hover:text-blue-600">
              <i className="ri-arrow-left-line mr-1"></i>
              チャットボットに戻る
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
