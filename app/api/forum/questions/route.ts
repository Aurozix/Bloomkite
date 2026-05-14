import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { MAX_TAGGED_ADVISORS_PER_QUESTION } from '@/lib/advisor-engagement'

function serializeQuestion(q: any) {
  const { author, taggedAdvisors, ...rest } = q
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
    // Optional — present only when the relation was included in the query.
    tagged_advisors: Array.isArray(taggedAdvisors)
      ? taggedAdvisors.map((t: any) => ({
          id: t.advisorId,
          name:
            t.advisor?.advisorProfile?.displayName ||
            t.advisor?.name ||
            t.advisor?.email,
          company: t.advisor?.advisorProfile?.companyName ?? null,
        }))
      : undefined,
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

const createSchema = z.object({
  title: z.string().trim().min(1).max(500),
  content: z.string().trim().min(1),
  taggedAdvisorIds: z
    .array(z.string().uuid())
    .max(MAX_TAGGED_ADVISORS_PER_QUESTION)
    .optional()
    .default([]),
})

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error
    const { user } = auth

    const parsed = createSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', issues: parsed.error.issues },
        { status: 400 },
      )
    }

    // Dedupe + drop self-tag (advisor authoring shouldn't tag themselves).
    const taggedAdvisorIds = Array.from(
      new Set(parsed.data.taggedAdvisorIds.filter((id) => id !== user.id)),
    )

    // Validate every tagged id belongs to an approved advisor — otherwise the
    // question would render with phantom tags. Cheap one-shot lookup.
    if (taggedAdvisorIds.length > 0) {
      const validAdvisors = await prisma.advisorProfile.findMany({
        where: {
          userId: { in: taggedAdvisorIds },
          workflowStatus: 'approved',
        },
        select: { userId: true },
      })
      const validIds = new Set(validAdvisors.map((a) => a.userId))
      const invalid = taggedAdvisorIds.filter((id) => !validIds.has(id))
      if (invalid.length > 0) {
        return NextResponse.json(
          { error: 'One or more tagged advisors are not approved', invalid },
          { status: 400 },
        )
      }
    }

    const data = await prisma.$transaction(async (tx) => {
      const created = await tx.forumQuestion.create({
        data: {
          authorId: user.id,
          title: parsed.data.title,
          content: parsed.data.content,
          status: 'open',
          answerCount: 0,
        },
      })
      if (taggedAdvisorIds.length > 0) {
        await tx.forumQuestionAdvisorTag.createMany({
          data: taggedAdvisorIds.map((advisorId) => ({
            questionId: created.id,
            advisorId,
          })),
        })
      }
      return tx.forumQuestion.findUnique({
        where: { id: created.id },
        include: {
          author: { select: { id: true, email: true, name: true } },
          taggedAdvisors: {
            include: {
              advisor: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  advisorProfile: {
                    select: { displayName: true, companyName: true },
                  },
                },
              },
            },
          },
        },
      })
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
