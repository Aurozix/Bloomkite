import type { Metadata } from 'next'

import { prisma } from '@/lib/db'
import { canonicalUrl, truncateForMeta } from '@/lib/seo'

// Per-question SEO metadata (BRD §13). Closed (admin-locked) questions are
// noindex'd so the public forum search results don't surface moderated
// content.

interface Params {
  params: { id: string }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const question = await prisma.forumQuestion
    .findUnique({
      where: { id: params.id },
      select: {
        title: true,
        content: true,
        status: true,
        updatedAt: true,
      },
    })
    .catch(() => null)

  if (!question) {
    return { title: 'Question', robots: { index: false, follow: false } }
  }
  if (question.status !== 'open') {
    return {
      title: question.title,
      robots: { index: false, follow: false },
    }
  }

  const description = truncateForMeta(question.content, 160)
  const url = canonicalUrl(`/forum/questions/${params.id}`)

  return {
    title: question.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title: question.title,
      description,
      url,
      modifiedTime: question.updatedAt?.toISOString(),
    },
    twitter: {
      card: 'summary',
      title: question.title,
      description,
    },
  }
}

export default function QuestionDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
