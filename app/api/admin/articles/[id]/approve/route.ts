import { NextRequest, NextResponse } from 'next/server'

import { requireRole } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireRole('admin')
    if ('error' in auth) return auth.error

    const articleId = params.id
    const now = new Date()

    const result = await prisma.article.updateMany({
      where: { id: articleId, status: 'pending' },
      data: {
        status: 'published',
        publishedAt: now,
        updatedAt: now,
      },
    })

    if (result.count === 0) {
      return NextResponse.json({ error: 'Article not found or already processed' }, { status: 404 })
    }

    const data = await prisma.article.findUnique({ where: { id: articleId } })

    return NextResponse.json({
      success: true,
      message: 'Article approved and published',
      data: data
        ? {
            id: data.id,
            author_id: data.authorId,
            title: data.title,
            content: data.content,
            category: data.category,
            tags: data.tags,
            featured_image_url: data.featuredImageUrl,
            status: data.status,
            rejection_reason: data.rejectionReason,
            published_at: data.publishedAt,
            created_at: data.createdAt,
            updated_at: data.updatedAt,
          }
        : null,
    })
  } catch (error) {
    console.error('Approve article error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
