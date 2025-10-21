import { useEffect, useState } from 'react'
import type {
  QuizAttempt,
  QuizQuestion,
  QuizResult,
  QuizSession,
  QuizSettings,
} from '@/types/quiz'

const STORAGE_KEY = 'quiz_session'

export function useQuiz() {
  const [session, setSession] = useState<QuizSession | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null)
  const [startTime, setStartTime] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)

  // Load session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem(STORAGE_KEY)
    if (savedSession) {
      try {
        const parsedSession = JSON.parse(savedSession) as QuizSession
        setSession(parsedSession)
        if (parsedSession.currentQuestionIndex < parsedSession.questions.length)
          setCurrentQuestion(parsedSession.questions[parsedSession.currentQuestionIndex])
      }
      catch (error) {
        console.error('Failed to load quiz session:', error)
      }
    }
  }, [])

  // Save session to localStorage whenever it changes
  useEffect(() => {
    if (session)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  }, [session])

  const startQuiz = async (settings: QuizSettings) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/quiz/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (!response.ok)
        throw new Error('Failed to fetch quiz questions')

      const questions = await response.json()

      const newSession: QuizSession = {
        sessionId: `quiz_${Date.now()}`,
        startedAt: new Date().toISOString(),
        currentQuestionIndex: 0,
        questions,
        attempts: [],
      }

      setSession(newSession)
      setCurrentQuestion(questions[0])
      setStartTime(Date.now())
    }
    catch (error) {
      console.error('Failed to start quiz:', error)
      throw error
    }
    finally {
      setIsLoading(false)
    }
  }

  const submitAnswer = (selectedOptionIndex: number) => {
    if (!session || !currentQuestion)
      return

    const timeSpent = Math.floor((Date.now() - startTime) / 1000)
    const isCorrect = selectedOptionIndex === currentQuestion.correctAnswer

    const attempt: QuizAttempt = {
      questionId: currentQuestion.id,
      selectedOptionIndex,
      isCorrect,
      timeSpent,
    }

    const updatedAttempts = [...session.attempts, attempt]
    const nextIndex = session.currentQuestionIndex + 1

    setSession({
      ...session,
      attempts: updatedAttempts,
      currentQuestionIndex: nextIndex,
      completedAt: nextIndex >= session.questions.length ? new Date().toISOString() : undefined,
    })

    return attempt
  }

  const nextQuestion = () => {
    if (!session)
      return

    const nextIndex = session.currentQuestionIndex
    if (nextIndex < session.questions.length) {
      setCurrentQuestion(session.questions[nextIndex])
      setStartTime(Date.now())
    }
    else {
      setCurrentQuestion(null)
    }
  }

  const getResult = (): QuizResult | null => {
    if (!session || !session.completedAt)
      return null

    const correctAnswers = session.attempts.filter(a => a.isCorrect).length
    const totalQuestions = session.questions.length
    const score = Math.round((correctAnswers / totalQuestions) * 100)
    const totalTimeSpent = session.attempts.reduce((sum, a) => sum + a.timeSpent, 0)

    return {
      sessionId: session.sessionId,
      totalQuestions,
      correctAnswers,
      score,
      attempts: session.attempts,
      completedAt: session.completedAt,
      timeSpent: totalTimeSpent,
    }
  }

  const resetQuiz = () => {
    setSession(null)
    setCurrentQuestion(null)
    setStartTime(0)
    localStorage.removeItem(STORAGE_KEY)
  }

  const isQuizComplete = session?.completedAt !== undefined

  return {
    session,
    currentQuestion,
    isLoading,
    isQuizComplete,
    startQuiz,
    submitAnswer,
    nextQuestion,
    getResult,
    resetQuiz,
  }
}
