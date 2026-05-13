import { NextRequest, NextResponse } from 'next/server'

import { requireRole } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole('admin')
    if ('error' in auth) return auth.error

    // Get pending articles
    let data
    try {
      data = await prisma.article.findMany({
        where: { status: 'pending' },
        include: {
          author: { select: { id: true, email: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
    } catch (error) {
      console.error('Fetch pending articles error:', error)
      return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 })
    }

    const formatted = data.map((a) => ({
      id: a.id,
      author_id: a.authorId,
      title: a.title,
      content: a.content,
      category: a.category,
      tags: a.tags,
      featured_image_url: a.featuredImageUrl,
      status: a.status,
      rejection_reason: a.rejectionReason,
      published_at: a.publishedAt,
      created_at: a.createdAt,
      updated_at: a.updatedAt,
      author: a.author
        ? { id: a.author.id, email: a.author.email, full_name: a.author.name }
        : null,
    }))

    return NextResponse.json({
      success: true,
      data: formatted,
    })
  } catch (error) {
    console.error('Get pending articles error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
