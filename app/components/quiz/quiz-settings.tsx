'use client'

import type { FC } from 'react'
import { useState } from 'react'
import type { QuizCategory, QuizDifficulty, QuizSettings } from '@/types/quiz'

type QuizSettingsProps = {
  onStart: (settings: QuizSettings) => void
  isLoading?: boolean
}

export const QuizSettingsComponent: FC<QuizSettingsProps> = ({
  onStart,
  isLoading = false,
}) => {
  const [numberOfQuestions, setNumberOfQuestions] = useState(10)
  const [selectedCategories, setSelectedCategories] = useState<QuizCategory[]>([])
  const [difficulty, setDifficulty] = useState<QuizDifficulty | 'mixed'>('mixed')

  const categories: QuizCategory[] = ['仕訳', '勘定科目', '帳簿', '決算', '伝票']

  const handleCategoryToggle = (category: QuizCategory) => {
    if (selectedCategories.includes(category))
      setSelectedCategories(selectedCategories.filter(c => c !== category))
    else
      setSelectedCategories([...selectedCategories, category])
  }

  const handleStart = () => {
    const settings: QuizSettings = {
      numberOfQuestions,
      categories: selectedCategories.length > 0 ? selectedCategories : categories,
      difficulty,
    }
    onStart(settings)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] p-8">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          簿記3級クイズ
        </h1>

        <div className="space-y-6">
          {/* Number of Questions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              問題数: {numberOfQuestions}問
            </label>
            <input
              type="range"
              min="5"
              max="20"
              value={numberOfQuestions}
              onChange={e => setNumberOfQuestions(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>5問</span>
              <span>20問</span>
            </div>
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              カテゴリー (選択しない場合はすべて)
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => handleCategoryToggle(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategories.includes(category)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              難易度
            </label>
            <div className="flex gap-2">
              {(['easy', 'medium', 'hard', 'mixed'] as const).map((diff) => {
                const labels = {
                  easy: '易しい',
                  medium: '普通',
                  hard: '難しい',
                  mixed: 'ミックス',
                }
                return (
                  <button
                    key={diff}
                    onClick={() => setDifficulty(diff)}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      difficulty === diff
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {labels[diff]}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={handleStart}
            disabled={isLoading}
            className={`w-full py-4 rounded-lg text-white font-bold text-lg transition-colors ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? '読み込み中...' : 'クイズを開始'}
          </button>
        </div>
      </div>
    </div>
  )
}
