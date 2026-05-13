import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser, requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

function serializeArticle(article: any) {
  const { author, ...rest } = article
  return {
    id: rest.id,
    author_id: rest.authorId,
    title: rest.title,
    content: rest.content,
    category: rest.category,
    tags: rest.tags,
    featured_image_url: rest.featuredImageUrl,
    status: rest.status,
    rejection_reason: rest.rejectionReason,
    published_at: rest.publishedAt,
    created_at: rest.createdAt,
    updated_at: rest.updatedAt,
    ...(author !== undefined
      ? {
          author: author
            ? { id: author.id, email: author.email, full_name: author.name }
            : null,
        }
      : {}),
  }
}

// GET - Get single article
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const articleId = params.id

    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        author: { select: { id: true, email: true, name: true } },
      },
    })

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // Allow viewing published articles or own drafts
    if (article.status !== 'published') {
      const currentUser = await getCurrentUser()
      if (!currentUser || article.authorId !== currentUser.id) {
        return NextResponse.json({ error: 'Article not found' }, { status: 404 })
      }
    }

    return NextResponse.json({
      success: true,
      data: serializeArticle(article),
    })
  } catch (error) {
    console.error('Get article error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update article (author only, drafts only)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error
    const { user } = auth

    const articleId = params.id
    const body = await request.json()
    const { title, content, category, tags } = body

    // Check ownership and status
    const existing = await prisma.article.findUnique({ where: { id: articleId } })

    if (!existing || existing.authorId !== user.id) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 })
    }

    if (existing.status !== 'draft') {
      return NextResponse.json(
        { error: 'Can only update draft articles' },
        { status: 400 }
      )
    }

    const data = await prisma.article.update({
      where: { id: articleId },
      data: {
        title: title || existing.title,
        content: content || existing.content,
        category: category !== undefined ? category : existing.category,
        tags: tags || existing.tags,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Article updated',
      data: serializeArticle(data),
    })
  } catch (error) {
    console.error('Update article error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
