import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('sb-access-token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parts = accessToken.split('.')
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'))
    const userId = payload.sub

    const articleId = params.id
    const body = await request.json()
    const { file_base64, file_name } = body

    if (!file_base64 || !file_name) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    // Check ownership
    const { data: existing } = await supabase
      .from('articles')
      .select('*')
      .eq('id', articleId)
      .single()

    if (!existing || existing.author_id !== userId) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // Upload image
    const buffer = Buffer.from(file_base64, 'base64')
    const filename = `${articleId}/${Date.now()}-${file_name}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('articles')
      .upload(filename, buffer, {
        contentType: 'image/png',
        upsert: true,
      })

    if (uploadError) {
      return NextResponse.json({ error: 'File upload failed' }, { status: 500 })
    }

    const { data: publicUrl } = supabase.storage
      .from('articles')
      .getPublicUrl(uploadData.path)

    // Update article with image URL
    const { data, error } = await supabase
      .from('articles')
      .update({ featured_image_url: publicUrl.publicUrl })
      .eq('id', articleId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update article' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Image uploaded',
      data,
    })
  } catch (error) {
    console.error('Upload image error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
