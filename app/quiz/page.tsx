'use client'

import type { FC } from 'react'
import React from 'react'
import Link from 'next/link'
import { Quiz } from '@/app/components/quiz'

const QuizPage: FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              簿記3級クイズアプリ
            </h1>
            <Link
              href="/"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              チャットに戻る
            </Link>
          </div>
        </div>
      </header>

      {/* Quiz Component */}
      <main>
        <Quiz />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            公認会計士くろいbot Premium - 簿記3級クイズ
          </p>
        </div>
      </footer>
    </div>
  )
}

export default React.memo(QuizPage)
