import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('sb-access-token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('advisor_credentials')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching credentials:', error)
      return NextResponse.json({ error: 'Failed to fetch credentials' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    })
  } catch (error) {
    console.error('Get credentials error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('sb-access-token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Decode JWT to get user ID
    const parts = accessToken.split('.')
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'))
    const userId = payload.sub

    const body = await request.json()
    const { credential_type, issuer, license_number, expiry_date, file_base64, file_name } = body

    if (!credential_type || !issuer || !license_number || !expiry_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Upload file to Supabase Storage if provided
    let file_url = null
    if (file_base64 && file_name) {
      const supabaseStorage = createClient(supabaseUrl, supabaseKey)

      // Convert base64 to buffer
      const buffer = Buffer.from(file_base64, 'base64')
      const filename = `${userId}/${Date.now()}-${file_name}`

      const { data: uploadData, error: uploadError } = await supabaseStorage.storage
        .from('credentials')
        .upload(filename, buffer, {
          contentType: 'application/pdf',
          upsert: false,
        })

      if (uploadError) {
        console.error('File upload error:', uploadError)
        return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
      }

      // Get public URL
      const { data: publicUrl } = supabaseStorage.storage
        .from('credentials')
        .getPublicUrl(uploadData.path)

      file_url = publicUrl.publicUrl
    }

    // Insert credential record
    const supabaseServiceRole = createClient(supabaseUrl, supabaseKey)

    const { data, error } = await supabaseServiceRole
      .from('advisor_credentials')
      .insert({
        user_id: userId,
        credential_type,
        issuer,
        license_number,
        expiry_date,
        file_url,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting credential:', error)
      return NextResponse.json({ error: 'Failed to create credential' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Credential uploaded successfully, pending admin approval',
      data,
    })
  } catch (error) {
    console.error('Create credential error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
