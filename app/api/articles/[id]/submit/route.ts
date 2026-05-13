import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error
    const { user } = auth

    const articleId = params.id

    // Check ownership and draft status
    const existing = await prisma.article.findUnique({ where: { id: articleId } })

    if (!existing || existing.authorId !== user.id || existing.status !== 'draft') {
      return NextResponse.json({ error: 'Article not found or not in draft status' }, { status: 404 })
    }

    let data
    try {
      data = await prisma.article.update({
        where: { id: articleId },
        data: { status: 'pending', updatedAt: new Date() },
      })
    } catch (error) {
      console.error('Error submitting article:', error)
      return NextResponse.json({ error: 'Failed to submit article' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Article submitted for review',
      data: {
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
      },
    })
  } catch (error) {
    console.error('Submit article error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
