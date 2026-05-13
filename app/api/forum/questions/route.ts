import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

function serializeQuestion(q: any) {
  const { author, ...rest } = q
  return {
    id: rest.id,
    title: rest.title,
    content: rest.content,
    status: rest.status,
    answer_count: rest.answerCount,
    created_at: rest.createdAt,
    author: author
      ? { id: author.id, email: author.email, full_name: author.name }
      : null,
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('q') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    const where: any = { status: 'open' }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [data, count] = await Promise.all([
      prisma.forumQuestion.findMany({
        where,
        include: {
          author: { select: { id: true, email: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.forumQuestion.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: data.map(serializeQuestion),
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Get questions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error
    const { user } = auth

    const body = await request.json()
    const { title, content } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    const data = await prisma.forumQuestion.create({
      data: {
        authorId: user.id,
        title,
        content,
        status: 'open',
        answerCount: 0,
      },
      include: {
        author: { select: { id: true, email: true, name: true } },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Question created',
      data: serializeQuestion(data),
    })
  } catch (error) {
    console.error('Create question error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
