'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { CheckCircleIcon, HandThumbUpIcon, HandThumbDownIcon } from '@heroicons/react/24/outline'
import { useToast } from '@/app/components/toast-context'

interface User {
  id: string
  email: string
  full_name?: string
}

interface Question {
  id: string
  title: string
  content: string
  status: string
  answer_count: number
  created_at: string
  updated_at: string
  author: User
}

interface Answer {
  id: string
  content: string
  votes_count: number
  is_best_answer: boolean
  created_at: string
  updated_at: string
  author: User
}

interface AnswerWithVote extends Answer {
  userVote?: 'helpful' | 'unhelpful'
}

export default function QuestionPage() {
  const router = useRouter()
  const params = useParams()
  const { addToast } = useToast()

  const [user, setUser] = useState<any>(null)
  const [question, setQuestion] = useState<Question | null>(null)
  const [answers, setAnswers] = useState<AnswerWithVote[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [answerContent, setAnswerContent] = useState('')
  const [votingAnswerId, setVotingAnswerId] = useState<string | null>(null)

  const questionId = params.id as string

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sessionResponse = await fetch('/api/auth/session')
        const sessionData = await sessionResponse.json()
        setUser(sessionData.user || null)

        const qResponse = await fetch(`/api/forum/questions/${questionId}`)
        if (!qResponse.ok) {
          addToast('Question not found', 'error')
          router.push('/forum')
          return
        }

        const qData = await qResponse.json()
        setQuestion(qData.data.question)
        setAnswers(qData.data.answers || [])
      } catch (error) {
        console.error('Error fetching question:', error)
        addToast('Error loading question', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [questionId, router, addToast])

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      addToast('Please sign in to answer questions', 'info')
      router.push('/auth/signin')
      return
    }

    if (!answerContent.trim()) {
      addToast('Please enter an answer', 'error')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/forum/questions/${questionId}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: answerContent.trim(),
        }),
      })

      if (!response.ok) {
        addToast('Failed to post answer', 'error')
        return
      }

      const data = await response.json()
      setAnswers([...answers, { ...data.data, userVote: undefined }])
      setAnswerContent('')
      addToast('Answer posted', 'success')
    } catch (error) {
      console.error('Submit error:', error)
      addToast('Error posting answer', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleVote = async (answerId: string, voteType: 'helpful' | 'unhelpful') => {
    if (!user) {
      addToast('Please sign in to vote', 'info')
      router.push('/auth/signin')
      return
    }

    setVotingAnswerId(answerId)
    try {
      const response = await fetch(`/api/forum/answers/${answerId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote_type: voteType }),
      })

      if (!response.ok) {
        addToast('Failed to vote', 'error')
        return
      }

      const data = await response.json()
      setAnswers(
        answers.map((a) =>
          a.id === answerId
            ? { ...a, votes_count: data.votes_count, userVote: voteType }
            : a
        )
      )
    } catch (error) {
      console.error('Vote error:', error)
      addToast('Error voting', 'error')
    } finally {
      setVotingAnswerId(null)
    }
  }

  const handleRemoveVote = async (answerId: string) => {
    setVotingAnswerId(answerId)
    try {
      const response = await fetch(`/api/forum/answers/${answerId}/vote`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        addToast('Failed to remove vote', 'error')
        return
      }

      const data = await response.json()
      setAnswers(
        answers.map((a) =>
          a.id === answerId
            ? { ...a, votes_count: data.votes_count, userVote: undefined }
            : a
        )
      )
    } catch (error) {
      console.error('Remove vote error:', error)
      addToast('Error removing vote', 'error')
    } finally {
      setVotingAnswerId(null)
    }
  }

  const handleMarkBest = async (answerId: string) => {
    try {
      const response = await fetch(`/api/forum/answers/${answerId}/best`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        addToast('Failed to mark answer', 'error')
        return
      }

      setAnswers(
        answers.map((a) => ({
          ...a,
          is_best_answer: a.id === answerId,
        }))
      )
      addToast('Answer marked as best', 'success')
    } catch (error) {
      console.error('Mark best error:', error)
      addToast('Error marking answer', 'error')
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-gray-300 border-t-blue-500 rounded-full"></div>
      </div>
    )
  }

  if (!question) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Back Link */}
        <a href="/forum" className="text-blue-600 hover:text-blue-700 font-semibold mb-6 inline-block">
          ← Back to Forum
        </a>

        {/* Question */}
        <div className="card p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{question.title}</h1>

          <div className="flex items-center gap-4 mb-6 text-sm text-gray-600">
            <span>
              Asked by <span className="font-semibold text-gray-900">{question.author.full_name || question.author.email}</span>
            </span>
            <span>{formatDate(question.created_at)}</span>
            <span className="font-semibold text-blue-600">{question.answer_count} answers</span>
          </div>

          <div className="prose prose-sm max-w-none text-gray-700">
            {question.content}
          </div>
        </div>

        {/* Answers */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Answers ({answers.length})</h2>

          {answers.length > 0 ? (
            <div className="space-y-4">
              {answers.map((answer) => (
                <div key={answer.id} className={`card p-6 border-l-4 ${answer.is_best_answer ? 'border-l-green-500 bg-green-50' : 'border-l-gray-200'}`}>
                  {answer.is_best_answer && (
                    <div className="flex items-center gap-2 mb-3 text-green-700 text-sm font-semibold">
                      <CheckCircleIcon className="h-5 w-5" />
                      Best Answer
                    </div>
                  )}

                  <p className="text-gray-700 mb-4">{answer.content}</p>

                  <div className="flex items-center justify-between flex-wrap gap-4 text-sm text-gray-600">
                    <span>
                      Answered by <span className="font-semibold text-gray-900">{answer.author.full_name || answer.author.email}</span> on{' '}
                      {formatDate(answer.created_at)}
                    </span>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          answer.userVote === 'helpful'
                            ? handleRemoveVote(answer.id)
                            : handleVote(answer.id, 'helpful')
                        }
                        disabled={votingAnswerId === answer.id}
                        className={`flex items-center gap-1 px-3 py-1 rounded transition ${
                          answer.userVote === 'helpful'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <HandThumbUpIcon className="h-4 w-4" />
                        {answer.votes_count}
                      </button>

                      <button
                        onClick={() =>
                          answer.userVote === 'unhelpful'
                            ? handleRemoveVote(answer.id)
                            : handleVote(answer.id, 'unhelpful')
                        }
                        disabled={votingAnswerId === answer.id}
                        className={`flex items-center gap-1 px-3 py-1 rounded transition ${
                          answer.userVote === 'unhelpful'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <HandThumbDownIcon className="h-4 w-4" />
                      </button>

                      {user && user.id === question.author.id && !answer.is_best_answer && (
                        <button
                          onClick={() => handleMarkBest(answer.id)}
                          className="text-blue-600 hover:text-blue-700 font-semibold text-xs px-3 py-1"
                        >
                          Mark as Best
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">
              <p>No answers yet. Be the first to answer!</p>
            </div>
          )}
        </div>

        {/* Answer Form */}
        <div className="card p-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Your Answer</h3>

          {user ? (
            <form onSubmit={handleSubmitAnswer} className="space-y-4">
              <textarea
                value={answerContent}
                onChange={(e) => setAnswerContent(e.target.value)}
                placeholder="Share your answer..."
                className="input-modern w-full h-32 resize-none"
                disabled={submitting}
              />
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary px-6 py-2 font-semibold disabled:opacity-50"
              >
                {submitting ? 'Posting...' : 'Post Answer'}
              </button>
            </form>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Sign in to answer this question</p>
              <button
                onClick={() => router.push('/auth/signin')}
                className="btn-primary px-6 py-2 font-semibold"
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
