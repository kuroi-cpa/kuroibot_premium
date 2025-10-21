'use client'

import type { FC } from 'react'
import { useQuiz } from '@/hooks/use-quiz'
import type { QuizSettings } from '@/types/quiz'
import { QuizQuestionComponent } from './quiz-question'
import { QuizResultComponent } from './quiz-result'
import { QuizSettingsComponent } from './quiz-settings'

export const Quiz: FC = () => {
  const {
    session,
    currentQuestion,
    isLoading,
    isQuizComplete,
    startQuiz,
    submitAnswer,
    nextQuestion,
    getResult,
    resetQuiz,
  } = useQuiz()

  const handleStartQuiz = async (settings: QuizSettings) => {
    try {
      await startQuiz(settings)
    }
    catch (error) {
      console.error('Failed to start quiz:', error)
      alert('クイズの開始に失敗しました。もう一度お試しください。')
    }
  }

  const handleRetake = () => {
    resetQuiz()
  }

  // Show settings if no session
  if (!session) {
    return (
      <QuizSettingsComponent
        onStart={handleStartQuiz}
        isLoading={isLoading}
      />
    )
  }

  // Show result if quiz is complete
  if (isQuizComplete) {
    const result = getResult()
    if (!result)
      return null

    return (
      <QuizResultComponent
        result={result}
        questions={session.questions}
        onRetake={handleRetake}
        onBackToSettings={resetQuiz}
      />
    )
  }

  // Show current question
  if (currentQuestion) {
    return (
      <QuizQuestionComponent
        question={currentQuestion}
        questionNumber={session.currentQuestionIndex + 1}
        totalQuestions={session.questions.length}
        onSubmit={submitAnswer}
        onNext={nextQuestion}
      />
    )
  }

  return null
}
