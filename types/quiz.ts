export type QuizCategory =
  | '仕訳' // Journal entries
  | '勘定科目' // Account titles
  | '帳簿' // Books
  | '決算' // Settlement
  | '伝票' // Vouchers

export type QuizDifficulty = 'easy' | 'medium' | 'hard'

export type QuizQuestion = {
  id: string
  category: QuizCategory
  question: string
  options: string[]
  correctAnswer: number // Index of the correct option (0-based)
  explanation: string
  difficulty: QuizDifficulty
}

export type QuizAttempt = {
  questionId: string
  selectedOptionIndex: number
  isCorrect: boolean
  timeSpent: number // in seconds
}

export type QuizSession = {
  sessionId: string
  startedAt: string
  completedAt?: string
  currentQuestionIndex: number
  questions: QuizQuestion[]
  attempts: QuizAttempt[]
}

export type QuizResult = {
  sessionId: string
  totalQuestions: number
  correctAnswers: number
  score: number // percentage
  attempts: QuizAttempt[]
  completedAt: string
  timeSpent: number // total time in seconds
}

export type QuizSettings = {
  numberOfQuestions: number
  categories: QuizCategory[]
  difficulty: QuizDifficulty | 'mixed'
  timeLimit?: number // in seconds per question, undefined = no limit
}
