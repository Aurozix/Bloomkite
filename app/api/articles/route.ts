import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

// Map a Prisma article (with author relation) to the snake_case shape the
// frontend has historically received.
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
    author: author
      ? { id: author.id, email: author.email, full_name: author.name }
      : null,
  }
}

// GET - List published articles (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    const where: any = { status: 'published' }
    if (category) where.category = category

    const [articles, count] = await Promise.all([
      prisma.article.findMany({
        where,
        include: {
          author: { select: { id: true, email: true, name: true } },
        },
        orderBy: { publishedAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.article.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: articles.map(serializeArticle),
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Get articles error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create draft article (advisor only)
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error
    const { user } = auth

    const body = await request.json()
    const { title, content, category, tags } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    const data = await prisma.article.create({
      data: {
        authorId: user.id,
        title,
        content,
        category: category || null,
        tags: tags || [],
        status: 'draft',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Article created as draft',
      data: serializeArticle(data),
    })
  } catch (error) {
    console.error('Create article error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
