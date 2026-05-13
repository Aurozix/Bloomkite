import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error
    const { user } = auth

    const articleId = params.id
    const body = await request.json()
    const { file_base64, file_name } = body

    if (!file_base64 || !file_name) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    // Check ownership
    const existing = await prisma.article.findUnique({ where: { id: articleId } })

    if (!existing || existing.authorId !== user.id) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // Upload image to Supabase Storage
    const supabaseStorage = createClient(supabaseUrl, supabaseKey)
    const buffer = Buffer.from(file_base64, 'base64')
    const filename = `${articleId}/${Date.now()}-${file_name}`

    const { data: uploadData, error: uploadError } = await supabaseStorage.storage
      .from('articles')
      .upload(filename, buffer, {
        contentType: 'image/png',
        upsert: true,
      })

    if (uploadError) {
      return NextResponse.json({ error: 'File upload failed' }, { status: 500 })
    }

    const { data: publicUrl } = supabaseStorage.storage
      .from('articles')
      .getPublicUrl(uploadData.path)

    // Update article with image URL
    let data
    try {
      data = await prisma.article.update({
        where: { id: articleId },
        data: { featuredImageUrl: publicUrl.publicUrl },
      })
    } catch (error) {
      console.error('Error updating article image:', error)
      return NextResponse.json({ error: 'Failed to update article' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Image uploaded',
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
    console.error('Upload image error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
