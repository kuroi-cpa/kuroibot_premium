'use client'

import type { FC } from 'react'
import { useEffect, useState } from 'react'
import type { QuizAttempt, QuizQuestion } from '@/types/quiz'

type QuizQuestionProps = {
  question: QuizQuestion
  questionNumber: number
  totalQuestions: number
  onSubmit: (selectedIndex: number) => QuizAttempt | undefined
  onNext: () => void
}

export const QuizQuestionComponent: FC<QuizQuestionProps> = ({
  question,
  questionNumber,
  totalQuestions,
  onSubmit,
  onNext,
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)

  // Reset state when question changes
  useEffect(() => {
    setSelectedOption(null)
    setSubmitted(false)
    setAttempt(null)
    setShowExplanation(false)
  }, [question.id])

  const handleSubmit = () => {
    if (selectedOption === null)
      return

    const result = onSubmit(selectedOption)
    if (result) {
      setAttempt(result)
      setSubmitted(true)
      setShowExplanation(true)
    }
  }

  const handleNext = () => {
    onNext()
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'hard':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '易しい'
      case 'medium':
        return '普通'
      case 'hard':
        return '難しい'
      default:
        return ''
    }
  }

  return (
    <div className="flex flex-col min-h-[600px] p-8">
      <div className="w-full max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-medium text-gray-600">
              問題 {questionNumber} / {totalQuestions}
            </span>
            <div className="flex gap-2 items-center">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                {getDifficultyLabel(question.difficulty)}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {question.category}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {question.question}
          </h2>
        </div>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {question.options.map((option, index) => {
            const isSelected = selectedOption === index
            const isCorrect = index === question.correctAnswer
            const isWrong = submitted && isSelected && !isCorrect

            let buttonClass = 'w-full p-4 text-left rounded-lg border-2 transition-all '

            if (submitted) {
              if (isCorrect)
                buttonClass += 'border-green-500 bg-green-50 text-green-900'
              else if (isWrong)
                buttonClass += 'border-red-500 bg-red-50 text-red-900'
              else
                buttonClass += 'border-gray-300 bg-gray-50 text-gray-500'
            }
            else if (isSelected) {
              buttonClass += 'border-blue-500 bg-blue-50 text-blue-900'
            }
            else {
              buttonClass += 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
            }

            return (
              <button
                key={index}
                onClick={() => !submitted && setSelectedOption(index)}
                disabled={submitted}
                className={buttonClass}
              >
                <div className="flex items-start">
                  <span className="font-bold mr-3 min-w-[24px]">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <span className="flex-1">{option}</span>
                  {submitted && isCorrect && (
                    <span className="ml-2 text-green-600">✓</span>
                  )}
                  {submitted && isWrong && (
                    <span className="ml-2 text-red-600">✗</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Result Message */}
        {submitted && attempt && (
          <div className={`p-4 rounded-lg mb-4 ${attempt.isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
            <p className={`font-bold text-lg ${attempt.isCorrect ? 'text-green-800' : 'text-red-800'}`}>
              {attempt.isCorrect ? '正解！' : '不正解'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              解答時間: {attempt.timeSpent}秒
            </p>
          </div>
        )}

        {/* Explanation */}
        {submitted && showExplanation && (
          <div className="bg-blue-50 p-4 rounded-lg mb-6 border-l-4 border-blue-500">
            <h3 className="font-bold text-blue-900 mb-2">解説</h3>
            <p className="text-gray-700">{question.explanation}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          {!submitted
            ? (
                <button
                  onClick={handleSubmit}
                  disabled={selectedOption === null}
                  className={`flex-1 py-3 rounded-lg font-bold text-white transition-colors ${
                    selectedOption === null
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  解答する
                </button>
              )
            : (
                <button
                  onClick={handleNext}
                  className="flex-1 py-3 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  {questionNumber < totalQuestions ? '次へ' : '結果を見る'}
                </button>
              )}
        </div>
      </div>
    </div>
  )
}
