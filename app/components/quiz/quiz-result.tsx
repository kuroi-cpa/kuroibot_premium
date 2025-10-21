'use client'

import type { FC } from 'react'
import { useState } from 'react'
import type { QuizQuestion, QuizResult } from '@/types/quiz'

type QuizResultProps = {
  result: QuizResult
  questions: QuizQuestion[]
  onRetake: () => void
  onBackToSettings: () => void
}

export const QuizResultComponent: FC<QuizResultProps> = ({
  result,
  questions,
  onRetake,
  onBackToSettings,
}) => {
  const [showReview, setShowReview] = useState(false)

  const getScoreMessage = (score: number) => {
    if (score >= 80)
      return { message: '素晴らしい！', color: 'text-green-600' }
    if (score >= 60)
      return { message: 'よくできました！', color: 'text-blue-600' }
    return { message: 'もう少し頑張りましょう', color: 'text-orange-600' }
  }

  const scoreMessage = getScoreMessage(result.score)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}分${secs}秒` : `${secs}秒`
  }

  if (showReview) {
    return (
      <div className="flex flex-col min-h-[600px] p-8">
        <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">解答レビュー</h2>

          <div className="space-y-6">
            {questions.map((question, index) => {
              const attempt = result.attempts[index]
              const isCorrect = attempt?.isCorrect

              return (
                <div
                  key={question.id}
                  className={`p-6 rounded-lg border-2 ${
                    isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-lg text-gray-800">
                      問題 {index + 1}
                    </h3>
                    <div className="flex gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {question.category}
                      </span>
                      {isCorrect
                        ? (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              正解 ✓
                            </span>
                          )
                        : (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              不正解 ✗
                            </span>
                          )}
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4">{question.question}</p>

                  <div className="space-y-2 mb-4">
                    {question.options.map((option, optIndex) => {
                      const isUserAnswer = attempt?.selectedOptionIndex === optIndex
                      const isCorrectAnswer = question.correctAnswer === optIndex

                      let optionClass = 'p-3 rounded border '
                      if (isCorrectAnswer)
                        optionClass += 'border-green-500 bg-green-100'
                      else if (isUserAnswer && !isCorrect)
                        optionClass += 'border-red-500 bg-red-100'
                      else
                        optionClass += 'border-gray-200 bg-gray-50'

                      return (
                        <div key={optIndex} className={optionClass}>
                          <div className="flex items-center justify-between">
                            <span>
                              <span className="font-bold mr-2">
                                {String.fromCharCode(65 + optIndex)}.
                              </span>
                              {option}
                            </span>
                            {isCorrectAnswer && <span className="text-green-600">✓ 正解</span>}
                            {isUserAnswer && !isCorrect && <span className="text-red-600">あなたの解答</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-500">
                    <p className="text-sm font-medium text-blue-900 mb-1">解説</p>
                    <p className="text-sm text-gray-700">{question.explanation}</p>
                  </div>

                  <p className="text-xs text-gray-500 mt-2">
                    解答時間: {attempt?.timeSpent}秒
                  </p>
                </div>
              )
            })}
          </div>

          <div className="mt-8 flex gap-4">
            <button
              onClick={() => setShowReview(false)}
              className="flex-1 py-3 rounded-lg font-bold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              結果に戻る
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] p-8">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          クイズ結果
        </h1>

        {/* Score Circle */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-48 h-48 mb-4">
            <svg className="transform -rotate-90 w-48 h-48">
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-gray-200"
              />
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 88}`}
                strokeDashoffset={`${2 * Math.PI * 88 * (1 - result.score / 100)}`}
                className={result.score >= 80 ? 'text-green-500' : result.score >= 60 ? 'text-blue-500' : 'text-orange-500'}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold text-gray-800">
                {result.score}%
              </span>
            </div>
          </div>
          <p className={`text-2xl font-bold ${scoreMessage.color}`}>
            {scoreMessage.message}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600 mb-1">正解数</p>
            <p className="text-3xl font-bold text-blue-600">
              {result.correctAnswers} / {result.totalQuestions}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600 mb-1">正答率</p>
            <p className="text-3xl font-bold text-purple-600">
              {Math.round((result.correctAnswers / result.totalQuestions) * 100)}%
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center col-span-2">
            <p className="text-sm text-gray-600 mb-1">合計時間</p>
            <p className="text-3xl font-bold text-green-600">
              {formatTime(result.timeSpent)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => setShowReview(true)}
            className="w-full py-3 rounded-lg font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            解答を確認
          </button>
          <button
            onClick={onRetake}
            className="w-full py-3 rounded-lg font-bold border-2 border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors"
          >
            もう一度挑戦
          </button>
          <button
            onClick={onBackToSettings}
            className="w-full py-3 rounded-lg font-bold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            設定に戻る
          </button>
        </div>
      </div>
    </div>
  )
}
