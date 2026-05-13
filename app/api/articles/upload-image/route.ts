import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/auth-helpers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error
    const userId = auth.user.id

    const body = await request.json()
    const { image, filename } = body

    if (!image || !filename) {
      return NextResponse.json({ error: 'Image and filename are required' }, { status: 400 })
    }

    // Remove data URL prefix if present
    const base64Data = image.replace(/^data:image\/[^;]+;base64,/, '')

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64')

    // Generate unique filename
    const timestamp = Date.now()
    const ext = filename.split('.').pop() || 'jpg'
    const storagePath = `articles/temp/${userId}/${timestamp}-${Date.now()}.${ext}`

    // Upload to Supabase Storage
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { error } = await supabase.storage
      .from('articles')
      .upload(storagePath, buffer, {
        contentType: 'image/*',
        upsert: false,
      })

    if (error) {
      console.error('Storage upload error:', error)
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
    }

    // Get public URL
    const { data: publicData } = supabase.storage
      .from('articles')
      .getPublicUrl(storagePath)

    return NextResponse.json({
      success: true,
      url: publicData.publicUrl,
      path: storagePath,
    })
  } catch (error) {
    console.error('Image upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
