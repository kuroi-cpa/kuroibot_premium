import { NextRequest, NextResponse } from 'next/server'
import { quizQuestions } from '@/data/quiz-questions'
import type { QuizQuestion, QuizSettings } from '@/types/quiz'

export async function POST(request: NextRequest) {
  try {
    const settings: QuizSettings = await request.json()

    let filteredQuestions = [...quizQuestions]

    // Filter by categories if specified
    if (settings.categories && settings.categories.length > 0) {
      filteredQuestions = filteredQuestions.filter(q =>
        settings.categories.includes(q.category),
      )
    }

    // Filter by difficulty if not mixed
    if (settings.difficulty && settings.difficulty !== 'mixed') {
      filteredQuestions = filteredQuestions.filter(q =>
        q.difficulty === settings.difficulty,
      )
    }

    // Shuffle questions
    const shuffled = filteredQuestions.sort(() => Math.random() - 0.5)

    // Select the requested number of questions
    const selectedQuestions = shuffled.slice(0, settings.numberOfQuestions)

    // Shuffle options for each question
    const questionsWithShuffledOptions: QuizQuestion[] = selectedQuestions.map((q) => {
      const options = [...q.options]
      const correctOption = options[q.correctAnswer]

      // Shuffle options
      const shuffledOptions = options.sort(() => Math.random() - 0.5)

      // Find new index of correct answer
      const newCorrectAnswer = shuffledOptions.indexOf(correctOption)

      return {
        ...q,
        options: shuffledOptions,
        correctAnswer: newCorrectAnswer,
      }
    })

    return NextResponse.json(questionsWithShuffledOptions)
  }
  catch (error) {
    console.error('Error fetching quiz questions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quiz questions' },
      { status: 500 },
    )
  }
}
